const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');
const { CORS_OPTIONS } = require('./config/config');
const { connectDB } = require('./utils/database');
const errorHandler = require('./middleware/error');
const logger = require('./utils/logger');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const settingsRoutes = require('./routes/settings');
const menuRoutes = require('./routes/headerMenu');
const heroSectionRoutes = require('./routes/heroSection');
const importantNotesRoutes = require('./routes/importantNotes');
const footerRoutes = require('./routes/footer');
const siteSettingsRoutes = require('./routes/siteSettings');
const activityRoutes = require('./routes/activities');
const reservationRoutes = require('./routes/reservationRoutes');

// Express uygulamasını oluştur
const app = express();

// Body parsing middleware'leri
app.use(express.json({
  limit: '10kb',
  verify: (req, res, buf) => {
    if (buf.length) {
      try {
        if (typeof buf === 'string') {
          JSON.parse(buf);
        } else {
          JSON.parse(buf.toString());
        }
      } catch (e) {
        console.error('JSON Parse Error:', {
          error: e.message,
          body: buf.toString(),
          path: req.path,
          method: req.method,
          contentType: req.headers['content-type']
        });
        res.status(400).json({ 
          status: 'error',
          message: 'Geçersiz JSON formatı',
          details: e.message
        });
        throw new Error('Geçersiz JSON formatı');
      }
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Güvenlik middleware'leri
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(mongoSanitize());
app.use(xss());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 1000, // IP başına maksimum istek sayısı
    message: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Başarılı istekleri sayma
    skip: (req) => {
        // Auth ve diğer önemli endpoint'ler için rate limit'i atla
        const skipPaths = [
            '/api/auth/login',
            '/api/auth/logout',
            '/api/auth/me',
            '/api/categories',
            '/api/header-menu',
            '/api/hero-section',
            '/api/activities'
        ];
        return skipPaths.some(path => req.path.startsWith(path));
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // MongoDB bağlantısını kontrol et
    const { connection } = require('mongoose');
    const dbStatus = connection.readyState === 1 ? 'connected' : 'disconnected';

    // Redis bağlantısını kontrol et
    const { redisClient } = require('./utils/database');
    let redisStatus = 'disconnected';
    try {
      await redisClient.ping();
      redisStatus = 'connected';
    } catch (error) {
      redisStatus = 'error: ' + error.message;
    }

    // Uploads klasörünü kontrol et
    const fs = require('fs').promises;
    const uploadsDir = path.join(__dirname, '../uploads/products');
    let uploadsStatus = 'not found';
    try {
      await fs.access(uploadsDir);
      uploadsStatus = 'accessible';
    } catch (error) {
      uploadsStatus = 'error: ' + error.message;
    }

    res.status(200).json({
      status: 'success',
      message: 'Sunucu sağlıklı çalışıyor',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.version,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      connections: {
        mongodb: dbStatus,
        redis: redisStatus
      },
      storage: {
        uploads: uploadsStatus
      },
      config: {
        port: process.env.PORT || 5001,
        cors: {
          enabled: true,
          origins: allowedOrigins
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Sağlık kontrolü başarısız',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// CORS ayarları
const allowedOrigins = [
  'https://esterimbenim.netlify.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5001',
  'https://esteri-backend.onrender.com'
];

// CORS öncesi middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Origin kontrolü
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'false');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 saat
  }
  
  // OPTIONS istekleri için hemen yanıt ver
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  // Geçersiz origin için hata döndür
  if (!allowedOrigins.includes(origin) && origin) {
    return res.status(403).json({
      status: 'error',
      message: 'CORS policy violation: Origin not allowed',
      origin: origin
    });
  }
  
  next();
});

// CORS middleware
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.error(`CORS Error: Origin ${origin} not allowed`);
      callback(new Error('CORS policy violation: Origin not allowed'));
    }
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  maxAge: 86400 // 24 saat
}));

// Debug middleware
app.use((req, res, next) => {
  logger.info({
    message: 'Incoming Request',
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    headers: req.headers,
    query: req.query,
    body: req.body
  });
  next();
});

app.use(cookieParser());

// Rate limiting uygula
app.use('/api/', limiter);

// Sıkıştırma
app.use(compression());

// Statik dosyalar
const uploadsPath = path.join(__dirname, '../uploads');
logger.info(`Uploads path: ${uploadsPath}`);
app.use('/uploads', express.static(uploadsPath));

// Debug middleware for static file requests
app.use('/uploads', (req, res, next) => {
    logger.info(`Static file request path: ${req.path}`);
    logger.info(`Full URL: ${req.originalUrl}`);
    logger.info(`Base URL: ${req.baseUrl}`);
    next();
});

// Rotaları yükle
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/header-menu', menuRoutes);
app.use('/api/hero-section', heroSectionRoutes);
app.use('/api/important-notes', importantNotesRoutes);
app.use('/api/footer', footerRoutes);
app.use('/api/site-settings', siteSettingsRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/reservations', reservationRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Sayfa bulunamadı'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error({
    message: 'Error occurred',
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    origin: req.headers.origin
  });

  if (err.name === 'CORSError') {
    return res.status(403).json({
      status: 'error',
      message: 'CORS hatası',
      details: err.message,
      origin: req.headers.origin
    });
  }

  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Sunucu hatası',
    path: req.path,
    method: req.method,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
});

// Error handler
app.use(errorHandler);

// Port numarasını al
const PORT = process.env.PORT || 5001;

// Server başlatma fonksiyonu
const startServer = async () => {
    try {
        // MongoDB'ye bağlan
        await connectDB();
        logger.info('MongoDB bağlantısı başarılı');

        // Redis bağlantısını kontrol et
        const { redisClient } = require('./utils/database');
        await redisClient.ping();
        logger.info('Redis bağlantısı başarılı');

        // Uploads klasörünü oluştur
        const uploadsDir = path.join(__dirname, '../uploads/products');
        const fs = require('fs').promises;
        await fs.mkdir(uploadsDir, { recursive: true });
        logger.info('Uploads dizini oluşturuldu');

        // Sunucuyu başlat
        app.listen(PORT, () => {
            logger.info(`Sunucu ${PORT} portunda çalışıyor`);
        });

    } catch (error) {
        logger.error('Sunucu başlatılamadı:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! Shutting down...');
    logger.error(err.name, err.message);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...');
    logger.error(err.name, err.message);
    process.exit(1);
});

module.exports = { app, startServer }; 