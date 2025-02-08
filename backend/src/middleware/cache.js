const { redisClient } = require('../utils/database');
const logger = require('../utils/logger');

const cache = (duration) => {
    return async (req, res, next) => {
        try {
            // Cache key oluştur
            const key = `cache:${req.originalUrl || req.url}`;

            // Cache'den veriyi kontrol et
            const cachedResponse = await redisClient.get(key);

            if (cachedResponse) {
                logger.debug(`Cache hit for key: ${key}`);
                return res.json(JSON.parse(cachedResponse));
            }

            // Orijinal json metodunu sakla
            const originalJson = res.json;

            // json metodunu override et
            res.json = function(body) {
                // Orijinal json metodunu çağır
                originalJson.call(this, body);

                // Veriyi cache'e kaydet
                if (res.statusCode === 200) {
                    redisClient.setEx(key, duration, JSON.stringify(body))
                        .catch(err => logger.error('Redis cache error:', err));
                }
            };

            next();
        } catch (error) {
            logger.error('Cache middleware error:', error);
            next();
        }
    };
};

const clearCache = (pattern) => {
    return async (req, res, next) => {
        try {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(keys);
                logger.debug(`Cleared cache for pattern: ${pattern}`);
            }
            next();
        } catch (error) {
            logger.error('Clear cache error:', error);
            next();
        }
    };
};

module.exports = {
    cache,
    clearCache
}; 