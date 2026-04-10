const crypto = require('crypto');
const prisma = require('../../config/database');
const { comparePassword, hashPassword } = require('../../utils/hash');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const AppError = require('../../utils/AppError');
const { jwt: jwtConfig } = require('../../config/env');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const getRefreshExpiry = () => {
    const days = parseInt(jwtConfig.refreshExpiresIn.replace('d', ''), 10);
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    return expiry;
};

/**
 * Sign up a customer.
 * - Looks up the publication company by slug
 * - Ensures email is unique in customers table
 * - Creates the customer (status = PENDING until approved if needed)
 */
const signup = async (data) => {
    const { companySlug, firstName, lastName, email, password, phone, businessName, address } = data;

    // Resolve the publication company
    const company = await prisma.company.findUnique({ where: { slug: companySlug } });
    if (!company) {
        throw new AppError('No publication company found with that slug.', 404);
    }
    if (!company.isActive) {
        throw new AppError('This company is not currently accepting new customers.', 403);
    }

    // Email must be unique across all customers (platform-wide)
    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) {
        throw new AppError('An account with this email already exists.', 409);
    }

    const passwordHash = await hashPassword(password);

    const customer = await prisma.customer.create({
        data: {
            companyId: company.id,
            firstName,
            lastName,
            email,
            passwordHash,
            phone: phone || null,
            businessName: businessName || null,
            address: address || null,
            status: 'PENDING',
            isActive: true,
        },
        select: {
            id: true,
            companyId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            businessName: true,
            status: true,
            createdAt: true,
        },
    });

    return { customer, companyName: company.name };
};

/**
 * Login a customer and issue JWT pair.
 * - Optionally scoped to a specific company by slug
 * - Sets status to ACTIVE on first successful login if still PENDING
 */
const login = async (email, password, companySlug) => {
    const where = { email };

    const customer = await prisma.customer.findUnique({ where });
    if (!customer || !customer.isActive) {
        throw new AppError('Invalid email or password.', 401);
    }

    // If a companySlug is provided, make sure this customer belongs to that company
    if (companySlug) {
        const company = await prisma.company.findUnique({ where: { slug: companySlug } });
        if (!company || customer.companyId !== company.id) {
            throw new AppError('Invalid email or password.', 401);
        }
    }

    const isPasswordValid = await comparePassword(password, customer.passwordHash);
    if (!isPasswordValid) {
        throw new AppError('Invalid email or password.', 401);
    }

    // Activate PENDING customers on first login
    let updatedCustomer = customer;
    if (customer.status === 'PENDING') {
        updatedCustomer = await prisma.customer.update({
            where: { id: customer.id },
            data: { status: 'ACTIVE' },
        });
    }

    const payload = { customerId: customer.id, companyId: customer.companyId };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.customerRefreshToken.create({
        data: {
            customerId: customer.id,
            tokenHash: hashToken(refreshToken),
            expiresAt: getRefreshExpiry(),
        },
    });

    return {
        accessToken,
        refreshToken,
        customer: {
            id: updatedCustomer.id,
            companyId: updatedCustomer.companyId,
            firstName: updatedCustomer.firstName,
            lastName: updatedCustomer.lastName,
            email: updatedCustomer.email,
            businessName: updatedCustomer.businessName,
            status: updatedCustomer.status,
        },
    };
};

/**
 * Refresh customer token pair (rotation strategy).
 */
const refresh = async (token) => {
    let decoded;
    try {
        decoded = verifyRefreshToken(token);
    } catch {
        throw new AppError('Invalid or expired refresh token.', 401);
    }

    if (!decoded.customerId) {
        throw new AppError('Invalid token: not a customer token.', 401);
    }

    const tokenHash = hashToken(token);
    const stored = await prisma.customerRefreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.expiresAt < new Date()) {
        throw new AppError('Refresh token is invalid or has expired. Please log in again.', 401);
    }

    await prisma.customerRefreshToken.delete({ where: { tokenHash } });

    const customer = await prisma.customer.findUnique({ where: { id: decoded.customerId } });
    if (!customer || !customer.isActive) {
        throw new AppError('Customer account not found or deactivated.', 401);
    }

    const payload = { customerId: customer.id, companyId: customer.companyId };
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    await prisma.customerRefreshToken.create({
        data: {
            customerId: customer.id,
            tokenHash: hashToken(newRefreshToken),
            expiresAt: getRefreshExpiry(),
        },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

/**
 * Logout: invalidate customer refresh token.
 */
const logout = async (token) => {
    const tokenHash = hashToken(token);
    await prisma.customerRefreshToken.deleteMany({ where: { tokenHash } });
};

/**
 * Get customer profile by ID.
 */
const getProfile = async (customerId) => {
    const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: {
            id: true,
            companyId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            businessName: true,
            address: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            company: { select: { id: true, name: true, slug: true } },
        },
    });

    if (!customer) throw new AppError('Customer not found.', 404);
    return customer;
};

module.exports = { signup, login, refresh, logout, getProfile };
