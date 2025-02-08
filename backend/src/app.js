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

// CORS ayarları
const allowedOrigins = [
  'https://esterimbenim.netlify.app',
  'http://localhost:5173',
  'http://localhost:5174'
];

app.use(cors({
  origin: function(origin, callback) {
    // origin null olabilir (örn: Postman istekleri)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// CORS Pre-flight istekleri için
app.options('*', cors());

// Debug middleware ekle
app.use((req, res, next) => {
  logger.info(`Incoming Request - Method: ${req.method}, Path: ${req.path}, Origin: ${req.headers.origin}`);
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

// Hata yakalama middleware'i
app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    type: err.type,
    path: req.path,
    method: req.method,
    body: req.body,
    headers: req.headers
  });

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      status: 'error',
      message: 'Geçersiz JSON formatı',
      details: err.message
    });
  }

  if (err.name === 'CORSError') {
    return res.status(403).json({
      status: 'error',
      message: 'CORS hatası',
      details: err.message
    });
  }
  
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Sunucu hatası',
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