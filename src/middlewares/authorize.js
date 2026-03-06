const AppError = require('../utils/AppError');

/**
 * Authorization middleware factory.
 * Usage: authorize('SUPER_ADMIN', 'ADMIN')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('Authentication required.', 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`,
                    403
                )
            );
        }

        next();
    };
};

module.exports = authorize;
