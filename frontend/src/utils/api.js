import axios from 'axios';
import DOMPurify from 'dompurify';

// API URL'ini ortam değişkeninden al
const apiUrl = import.meta.env.PROD 
  ? 'https://esteri-backend.onrender.com'
  : import.meta.env.VITE_API_URL || 'http://localhost:5001';

console.log('Current API URL:', apiUrl); // Debug için

// Axios instance oluştur
const api = axios.create({
  baseURL: apiUrl,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Origin': window.location.origin
  },
  timeout: 30000
});

// Auth işlemleri için özel instance
const authApi = axios.create({
  baseURL: apiUrl,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Origin': window.location.origin
  },
  timeout: 30000,
  validateStatus: status => status >= 200 && status < 500
});

// Request interceptor
api.interceptors.request.use((config) => {
  // API URL'i kontrol et ve gerekirse güncelle
  const baseURL = import.meta.env.PROD 
    ? 'https://esteri-backend.onrender.com'
    : import.meta.env.VITE_API_URL || 'http://localhost:5001';
  
  // URL'i güncelle
  config.baseURL = baseURL;
  
  // Request URL'ini logla
  console.log('Making request to:', baseURL + config.url);

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
      url: error.config?.url,
      baseURL: error.config?.baseURL
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
    try {
      console.log('GET Request to:', apiUrl + url);
      const response = await api.get(url, config);
      return response;
    } catch (error) {
      console.error('GET Request Error:', {
        url: apiUrl + url,
        error: error.message
      });
      throw error;
    }
  },
  post: async (url, data = {}, config = {}) => {
    try {
      console.log('POST Request to:', apiUrl + url);
      const response = await api.post(url, data, config);
      return response;
    } catch (error) {
      console.error('POST Request Error:', {
        url: apiUrl + url,
        error: error.message
      });
      throw error;
    }
  },
  put: async (url, data = {}, config = {}) => {
    try {
      console.log('PUT Request to:', apiUrl + url);
      const response = await api.put(url, data, config);
      return response;
    } catch (error) {
      console.error('PUT Request Error:', {
        url: apiUrl + url,
        error: error.message
      });
      throw error;
    }
  },
  delete: async (url, config = {}) => {
    try {
      console.log('DELETE Request to:', apiUrl + url);
      const response = await api.delete(url, config);
      return response;
    } catch (error) {
      console.error('DELETE Request Error:', {
        url: apiUrl + url,
        error: error.message
      });
      throw error;
    }
  }
};

export default apiWrapper; 