const prisma = require('../../config/database');

/**
 * Find all companies (with optional filters)
 */
const findAll = ({ isActive } = {}) => {
    const where = {};
    if (isActive !== undefined) where.isActive = isActive;
    return prisma.company.findMany({
        where,
        orderBy: { createdAt: 'desc' },
    });
};

/**
 * Find one company by ID
 */
const findById = (id) => {
    return prisma.company.findUnique({ where: { id } });
};

/**
 * Find one company by slug
 */
const findBySlug = (slug) => {
    return prisma.company.findUnique({ where: { slug } });
};

/**
 * Create a new company
 */
const create = (data) => {
    return prisma.company.create({ data });
};

/**
 * Update a company by ID
 */
const update = (id, data) => {
    return prisma.company.update({ where: { id }, data });
};

/**
 * Soft delete (deactivate) a company
 */
const softDelete = (id) => {
    return prisma.company.update({ where: { id }, data: { isActive: false } });
};

module.exports = { findAll, findById, findBySlug, create, update, softDelete };
