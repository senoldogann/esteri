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
        const server = app.listen(PORT, '0.0.0.0', () => {
            const addr = server.address();
            logger.info(`Server running at http://${addr.address}:${addr.port}`);
            logger.info(`Environment: ${process.env.NODE_ENV}`);
            logger.info(`Port: ${PORT}`);
            logger.info(`Process ID: ${process.pid}`);
        });

        // Graceful shutdown
        const shutdown = () => {
            logger.info('Received kill signal, shutting down gracefully');
            server.close(() => {
                logger.info('Closed out remaining connections');
                process.exit(0);
            });

            setTimeout(() => {
                logger.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

    } catch (error) {
        logger.error('Sunucu başlatılamadı:', error);
        process.exit(1);
    }
};

startServer(); 