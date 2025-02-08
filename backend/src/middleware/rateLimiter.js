const rateLimit = require('express-rate-limit');
const { RATE_LIMIT } = require('../config/config');
const logger = require('../utils/logger');

const limiter = rateLimit({
    windowMs: RATE_LIMIT.windowMs,
    max: RATE_LIMIT.max,
    message: {
        success: false,
        message: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.'
    },
    handler: (req, res, next, options) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json(options.message);
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Daha sıkı limit gerektiren rotalar için (örn: auth)
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100, // IP başına 20 istek
    message: {
        success: false,
        message: 'Çok fazla deneme yaptınız. Lütfen 15 dakika sonra tekrar deneyin.'
    },
    handler: (req, res, next, options) => {
        logger.warn(`Strict rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json(options.message);
    }
});

module.exports = {
    limiter,
    strictLimiter
}; 