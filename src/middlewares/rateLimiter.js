const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/response');

/**
 * Strict limiter for auth routes — 10 requests per 15 minutes.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        sendError(res, 'Too many authentication attempts. Please try again in 15 minutes.', 429);
    },
});

/**
 * General API limiter — 200 requests per 15 minutes.
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        sendError(res, 'Too many requests. Please slow down.', 429);
    },
});

module.exports = { authLimiter, apiLimiter };
