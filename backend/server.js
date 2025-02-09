require('dotenv').config();
const { app } = require('./src/app');
const logger = require('./src/utils/logger');
const { connectDB } = require('./src/utils/database');

// Port numarasını al
const PORT = process.env.PORT || 3000;

// Sunucuyu başlat
const startServer = async () => {
    try {
        // MongoDB'ye bağlan
        await connectDB();
        logger.info('MongoDB bağlantısı başarılı');

        // Sunucuyu başlat
        const server = app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV}`);
            logger.info(`MongoDB Status: Connected`);
        });

        // Error handling
        server.on('error', (error) => {
            logger.error('Server error:', error);
            process.exit(1);
        });

        // Graceful shutdown
        const shutdown = () => {
            logger.info('Shutting down server...');
            server.close(() => {
                logger.info('Server closed');
                process.exit(0);
            });
        };

        // Handle shutdown signals
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled Rejection:', error);
    process.exit(1);
});

startServer(); 