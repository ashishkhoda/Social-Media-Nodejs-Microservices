require('dotenv').config();
const { RateLimiterRedis } = require('rate-limiter-flexible');
const Redis = require('ioredis');
const logger = require('../utils/logger');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');

const redisClient = new Redis(process.env.REDIS_URL);

// Create once and reuse (avoids new instance per request)
const rateLimiterRedis = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 10,
    duration: 1,
});

const rateLimiter = (req, res, next) => {
    rateLimiterRedis
        .consume(req.ip)
        .then(() => next())
        .catch(() => {
            logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
            res.status(429).json({ success: false, message: 'Too many requests' });
        });
};

// Created once at app initialization (not per request)
const sensitiveEndpointLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({ success: false, message: 'Too many requests' });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
});


module.exports = { rateLimiter, sensitiveEndpointLimiter }