const logger = require('../config/logger');
const AppError = require('../utils/AppError');

/**
 * Global error handling middleware.
 * Must be registered LAST in app.js: app.use(errorHandler)
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Handle Prisma known errors
    if (err.code === 'P2002') {
        statusCode = 409;
        const field = err.meta?.target?.[0] || 'field';
        message = `A record with this ${field} already exists.`;
    } else if (err.code === 'P2025') {
        statusCode = 404;
        message = err.meta?.cause || 'Record not found.';
    } else if (err.code === 'P2003') {
        statusCode = 400;
        message = 'Related record not found. Check the provided IDs.';
    }

    // Handle JWT errors (in case they slip past the middleware)
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token.';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired.';
    }

    // Log server errors
    if (statusCode >= 500) {
        logger.error(`[${req.method}] ${req.path} - ${statusCode}: ${message}`, {
            stack: err.stack,
            body: req.body,
        });
    }

    return res.status(statusCode).json({
        success: false,
        message,
        data: null,
        ...(err.errors && { errors: err.errors }), // include validation details if present
        ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack }),
    });
};

module.exports = errorHandler;
