const { app, startServer } = require('./src/app');
const logger = require('./src/utils/logger');

// Başlat
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