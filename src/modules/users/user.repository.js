const prisma = require('../../config/database');

// Fields to select when returning user data (never return passwordHash)
const USER_SELECT = {
    id: true,
    companyId: true,
    firstName: true,
    lastName: true,
    email: true,
    role: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    company: {
        select: { id: true, name: true, slug: true },
    },
};

/**
 * Find all users, optionally filtered by company
 */
const findAll = ({ companyId, isActive } = {}) => {
    const where = {};
    if (companyId !== undefined) where.companyId = companyId;
    if (isActive !== undefined) where.isActive = isActive;
    return prisma.user.findMany({ where, select: USER_SELECT, orderBy: { createdAt: 'desc' } });
};

/**
 * Find user by ID
 */
const findById = (id) => {
    return prisma.user.findUnique({ where: { id }, select: USER_SELECT });
};

/**
 * Find user by email (includes passwordHash for auth)
 */
const findByEmail = (email) => {
    return prisma.user.findUnique({ where: { email } });
};

/**
 * Create user
 */
const create = (data) => {
    return prisma.user.create({ data, select: USER_SELECT });
};

/**
 * Update user
 */
const update = (id, data) => {
    return prisma.user.update({ where: { id }, data, select: USER_SELECT });
};

/**
 * Hard delete user
 */
const remove = (id) => {
    return prisma.user.delete({ where: { id }, select: USER_SELECT });
};

module.exports = { findAll, findById, findByEmail, create, update, remove, USER_SELECT };
