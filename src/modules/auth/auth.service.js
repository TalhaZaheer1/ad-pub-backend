const crypto = require('crypto');
const prisma = require('../../config/database');
const { comparePassword, hashPassword } = require('../../utils/hash');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const AppError = require('../../utils/AppError');
const { jwt: jwtConfig } = require('../../config/env');

/**
 * Hash a token string for secure storage
 */
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Calculate refresh token expiry date from config
 */
const getRefreshExpiry = () => {
    const days = parseInt(jwtConfig.refreshExpiresIn.replace('d', ''), 10);
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    return expiry;
};

/**
 * Login: validate credentials, sign tokens, store refresh token hash
 */
const login = async (email, password) => {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
        throw new AppError('Invalid email or password.', 401);
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
        throw new AppError('Invalid email or password.', 401);
    }

    const payload = { userId: user.id, role: user.role, companyId: user.companyId };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Store hashed refresh token in DB
    await prisma.refreshToken.create({
        data: {
            userId: user.id,
            tokenHash: hashToken(refreshToken),
            expiresAt: getRefreshExpiry(),
        },
    });

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
        },
    };
};

/**
 * Refresh: verify refresh token, rotate (delete old, issue new pair)
 */
const refresh = async (token) => {
    let decoded;
    try {
        decoded = verifyRefreshToken(token);
    } catch {
        throw new AppError('Invalid or expired refresh token.', 401);
    }

    const tokenHash = hashToken(token);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.expiresAt < new Date()) {
        throw new AppError('Refresh token is invalid or has expired. Please log in again.', 401);
    }

    // Rotate: delete old token
    await prisma.refreshToken.delete({ where: { tokenHash } });

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive) {
        throw new AppError('User account not found or deactivated.', 401);
    }

    const payload = { userId: user.id, role: user.role, companyId: user.companyId };
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
        data: {
            userId: user.id,
            tokenHash: hashToken(newRefreshToken),
            expiresAt: getRefreshExpiry(),
        },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

/**
 * Logout: invalidate refresh token
 */
const logout = async (token) => {
    const tokenHash = hashToken(token);
    await prisma.refreshToken.deleteMany({ where: { tokenHash } });
};

/**
 * Register a new company and its initial ADMIN user.
 * This is an open endpoint (no authentication required) used by the signup page.
 */
const registerCompany = async (data) => {
    const { companyName, companySlug, firstName, lastName, email, password } = data;

    // Check if company slug exists
    const existingCompany = await prisma.company.findUnique({ where: { slug: companySlug } });
    if (existingCompany) {
        throw new AppError('A workspace with this URL slug already exists.', 409);
    }

    // Check if user email exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new AppError('A user with this email already exists.', 409);
    }

    const passwordHash = await hashPassword(password);

    // Run in a transaction so either both succeed or both fail
    const result = await prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
            data: {
                name: companyName,
                slug: companySlug,
                isActive: true,
            },
        });

        const user = await tx.user.create({
            data: {
                companyId: company.id,
                firstName,
                lastName,
                email,
                passwordHash,
                role: 'ADMIN', // The first user of a registered company is an ADMIN
                isActive: true,
            },
        });

        // We can also create an audit log within the transaction
        await tx.auditLog.create({
            data: {
                userId: user.id,
                companyId: company.id,
                action: 'COMPANY_REGISTERED',
                entityType: 'Company',
                entityId: company.id,
                metadata: { source: 'signup_page' }
            }
        });

        return { company, user };
    });

    return {
        success: true,
        companyId: result.company.id,
        userId: result.user.id
    };
};

module.exports = { login, refresh, logout, registerCompany };
