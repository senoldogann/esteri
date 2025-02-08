const mongoose = require('mongoose');
const Redis = require('redis');
const { MONGODB_URI, REDIS_URL } = require('../config/config');
const logger = require('./logger');

// Redis Client
const redisClient = Redis.createClient({
    url: REDIS_URL
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Redis Client Connected'));

// Redis'e bağlan
redisClient.connect().catch(err => logger.error('Redis Connection Error:', err));

// MongoDB Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_URI);
        
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        
        // Create indexes for better performance
        await Promise.all([
            mongoose.model('Category').createIndexes(),
            mongoose.model('Product').createIndexes(),
            mongoose.model('User').createIndexes(),
            mongoose.model('Reservation').createIndexes()
        ]);
        
    } catch (error) {
        logger.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = {
    connectDB,
    redisClient
}; 