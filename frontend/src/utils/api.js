import axios from 'axios';
import DOMPurify from 'dompurify';

// API URL'ini ortam değişkeninden al
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Axios instance oluştur
const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000 // 30 saniye timeout
});

// Auth işlemleri için özel instance
const authApi = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000,
  validateStatus: status => status >= 200 && status < 500
});

// Request interceptor
api.interceptors.request.use((config) => {
  // API URL'i kontrol et ve gerekirse güncelle
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    config.baseURL = apiUrl;
  }
  
  // Request URL'ini logla (development ortamında)
  if (import.meta.env.DEV) {
    console.log('Request URL:', config.baseURL + config.url);
  }

  // Token varsa ekle
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Auth API için interceptor'lar
authApi.interceptors.request.use((config) => {
  // Token varsa ekle
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // Content-Type ve Accept header'larını ekle
  config.headers['Content-Type'] = 'application/json';
  config.headers['Accept'] = 'application/json';

  return config;
}, (error) => {
  console.error('Auth request error:', error);
  return Promise.reject(error);
});

// Auth API için response interceptor
authApi.interceptors.response.use(
  (response) => {
    // Debug için response'u logla
    console.log('Auth API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });

    if (response.data?.success && response.data?.data?.token) {
      localStorage.setItem('token', response.data.data.token);
      authApi.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;
    }
    return response;
  },
  (error) => {
    console.error('Auth API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete authApi.defaults.headers.common['Authorization'];
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    // API hatalarını logla
    console.error('API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Veriyi sanitize eden yardımcı fonksiyon
const sanitizeData = (data) => {
  if (typeof data === 'string') {
    return DOMPurify.sanitize(data, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'target', 'rel']
    });
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  if (typeof data === 'object' && data !== null) {
    const sanitizedData = {};
    for (const [key, value] of Object.entries(data)) {
      sanitizedData[key] = sanitizeData(value);
    }
    return sanitizedData;
  }
  return data;
};

// Rate limiting için request sayacı ve zaman damgası
let requestCount = 0;
let lastResetTime = Date.now();
const MAX_REQUESTS_PER_WINDOW = 100;
const WINDOW_MS = 10000; // 10 saniye

const checkRateLimit = (url) => {
  // Auth ve diğer önemli endpoint'ler için rate limit kontrolünü atla
  const skipPaths = [
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/me',
    '/api/categories',
    '/api/header-menu',
    '/api/hero-section'
  ];
  if (skipPaths.some(path => url.startsWith(path))) {
    return;
  }

  const now = Date.now();
  if (now - lastResetTime >= WINDOW_MS) {
    requestCount = 0;
    lastResetTime = now;
  }

  if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
    throw new Error('Rate limit aşıldı. Lütfen biraz bekleyin.');
  }

  requestCount++;
};

// API istekleri için wrapper fonksiyonlar
const apiWrapper = {
  get: async (url, config = {}) => {
    if (url.startsWith('/api/auth/')) {
      return authApi.get(url, config);
    }
    checkRateLimit(url);
    return api.get(url, config);
  },
  post: async (url, data = {}, config = {}) => {
    if (url.startsWith('/api/auth/')) {
      try {
        const response = await authApi.post(url, data, {
          ...config,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...config.headers
          }
        });

        return response;
      } catch (error) {
        console.error('Auth API error:', {
          url,
          error: error.message,
          status: error.response?.status
        });
        throw error;
      }
    }
    checkRateLimit(url);
    return api.post(url, data, config);
  },
  put: async (url, data = {}, config = {}) => {
    checkRateLimit(url);
    return api.put(url, data, config);
  },
  delete: async (url, config = {}) => {
    checkRateLimit(url);
    return api.delete(url, config);
  }
};

export default apiWrapper; 