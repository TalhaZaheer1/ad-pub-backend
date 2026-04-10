const { verifyAccessToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const prisma = require('../config/database');

/**
 * authenticateCustomer middleware — same token flow as `authenticate`,
 * but resolves the token's customerId against the customers table.
 * Attaches the customer object to req.customer.
 */
const authenticateCustomer = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(new AppError('Authentication required. Please provide a Bearer token.', 401));
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyAccessToken(token);

        // JWT must carry customerId — issued by the customer login endpoint
        if (!decoded.customerId) {
            return next(new AppError('Invalid token: not a customer token.', 401));
        }

        const customer = await prisma.customer.findUnique({
            where: { id: decoded.customerId },
            select: {
                id: true,
                companyId: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                businessName: true,
                status: true,
                isActive: true,
            },
        });

        if (!customer) {
            return next(new AppError('Customer account no longer exists.', 401));
        }

        if (!customer.isActive) {
            return next(new AppError('Your account has been deactivated. Please contact support.', 401));
        }

        req.customer = customer;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new AppError('Access token expired. Please refresh your token.', 401));
        }
        if (err.name === 'JsonWebTokenError') {
            return next(new AppError('Invalid access token.', 401));
        }
        next(err);
    }
};

module.exports = authenticateCustomer;
