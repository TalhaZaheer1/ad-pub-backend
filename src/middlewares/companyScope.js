const AppError = require('../utils/AppError');

/**
 * Company scope middleware.
 * For non-SUPER_ADMIN users, ensures the companyId in the URL matches
 * the user's own company_id. Also attaches req.companyId for use in
 * controllers when no URL param is present.
 *
 * Usage: apply AFTER authenticate middleware.
 */
const companyScope = (req, res, next) => {
    if (!req.user) {
        return next(new AppError('Authentication required.', 401));
    }

    // SUPER_ADMIN bypasses company isolation
    if (req.user.role === 'SUPER_ADMIN') {
        req.companyId = req.params.companyId || req.user.companyId || null;
        return next();
    }

    // For all other roles, enforce company isolation
    const requestedCompanyId = req.params.companyId;

    if (requestedCompanyId && requestedCompanyId !== req.user.companyId) {
        return next(new AppError('Access denied. You can only access your own company resources.', 403));
    }

    // Attach the user's company to the request context
    req.companyId = req.user.companyId;
    next();
};

module.exports = companyScope;
