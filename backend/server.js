const { app } = require('./src/app');
const logger = require('./src/utils/logger');
const { connectDB } = require('./src/utils/database');

// Port numarasını al
const PORT = process.env.PORT || 10000;

// Sunucuyu başlat
const startServer = async () => {
    try {
        // MongoDB'ye bağlan
        await connectDB();
        logger.info('MongoDB bağlantısı başarılı');

        // Sunucuyu başlat
        app.listen(PORT, () => {
            logger.info(`Sunucu ${PORT} portunda çalışıyor`);
            logger.info(`Environment: ${process.env.NODE_ENV}`);
        });

    } catch (error) {
        logger.error('Sunucu başlatılamadı:', error);
        process.exit(1);
    }
};

// Sunucuyu başlat
startServer();

// Graceful shutdown
const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    try {
        // Redis bağlantısını kapat
        const { redisClient } = require('./src/utils/database');
        await redisClient.quit();
        logger.info('Redis connection closed.');

        // MongoDB bağlantısını kapat
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        logger.info('MongoDB connection closed.');

        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
};

// Shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown); 