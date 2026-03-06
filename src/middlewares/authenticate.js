const { verifyAccessToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const prisma = require('../config/database');

/**
 * Authenticate middleware — verifies the Bearer access token.
 * Attaches the full user object to req.user.
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(new AppError('Authentication required. Please provide a Bearer token.', 401));
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyAccessToken(token);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                companyId: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                isActive: true,
            },
        });

        if (!user) {
            return next(new AppError('User no longer exists.', 401));
        }

        if (!user.isActive) {
            return next(new AppError('Your account has been deactivated. Contact your administrator.', 401));
        }

        req.user = user;
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

module.exports = authenticate;
