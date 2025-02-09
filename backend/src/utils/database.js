const mongoose = require('mongoose');
const logger = require('./logger');
const { MONGODB_URI } = require('../config/config');

// MongoDB'ye bağlan
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        
        // Bağlantı hatalarını dinle
        mongoose.connection.on('error', err => {
            logger.error('MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });
        
        // Uygulama kapandığında bağlantıyı kapat
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                logger.info('MongoDB connection closed through app termination');
                process.exit(0);
            } catch (err) {
                logger.error('Error closing MongoDB connection:', err);
                process.exit(1);
            }
        });
        
    } catch (error) {
        logger.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

module.exports = {
    connectDB
}; 