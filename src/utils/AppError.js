/**
 * Custom application error class.
 * Usage: throw new AppError('Not found', 404)
 */
class AppError extends Error {
    constructor(message, statusCode = 500, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors; // for validation error details
        this.isOperational = true; // distinguish operational vs programmer errors
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
