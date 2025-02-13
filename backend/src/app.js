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

// CORS için izin verilen originler
const allowedOrigins = [
  'https://esterimbenim.netlify.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5001',
  'https://esteri-backend.onrender.com'
];

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

// Proxy güvenini ayarla (Render için gerekli)
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

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
    },
    trustProxy: true, // Proxy güvenini etkinleştir
    keyGenerator: (req) => {
        // X-Forwarded-For header'ını kullan
        const xForwardedFor = req.headers['x-forwarded-for'];
        if (xForwardedFor) {
            const ips = xForwardedFor.split(',').map(ip => ip.trim());
            return ips[0]; // İlk IP adresini al
        }
        return req.ip; // Fallback olarak req.ip kullan
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // MongoDB bağlantısını kontrol et
    const { connection } = require('mongoose');
    const dbStatus = connection.readyState === 1 ? 'connected' : 'disconnected';

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
        mongodb: dbStatus
      },
      storage: {
        uploads: uploadsStatus
      },
      config: {
        port: process.env.PORT || 5001,
        cors: {
          enabled: true,
          allowedOrigins: allowedOrigins
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
const corsOptions = {
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.error(`CORS Error: Origin ${origin} not allowed`);
      callback(new Error('CORS policy violation: Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 saat
};

// CORS middleware
app.use(cors(corsOptions));

// CORS öncesi middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

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
    logger.error(`404 - Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: 'Sayfa bulunamadı',
        path: req.originalUrl
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

        // Uploads klasörünü oluştur
        const uploadsDir = path.join(__dirname, '../uploads/products');
        const fs = require('fs').promises;
        await fs.mkdir(uploadsDir, { recursive: true });
        logger.info('Uploads dizini oluşturuldu');

        // Sunucuyu başlat
        const server = app.listen(PORT, '0.0.0.0', () => {
            const address = server.address();
            logger.info(`Sunucu ${address.address}:${address.port} adresinde çalışıyor`);
            logger.info(`Environment: ${process.env.NODE_ENV}`);
            logger.info(`MongoDB URI: ${process.env.MONGODB_URI ? 'Configured' : 'Not Configured'}`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            logger.info('SIGTERM signal received.');
            logger.info('Closing HTTP server.');
            server.close(() => {
                logger.info('HTTP server closed.');
                process.exit(0);
            });
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