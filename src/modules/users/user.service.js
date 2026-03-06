const userRepo = require('./user.repository');
const { hashPassword } = require('../../utils/hash');
const AppError = require('../../utils/AppError');
const prisma = require('../../config/database');

// Roles that ADMIN can create (cannot create SUPER_ADMIN or another ADMIN)
const ADMIN_ALLOWED_ROLES = ['SALES', 'DESIGNER', 'PRODUCTION'];

/**
 * Get all users — SUPER_ADMIN sees all, ADMIN sees only their company
 */
const getAllUsers = async (requestingUser, query = {}) => {
    const filter = {};

    if (requestingUser.role !== 'SUPER_ADMIN') {
        filter.companyId = requestingUser.companyId;
    } else if (query.companyId) {
        filter.companyId = query.companyId;
    }

    if (query.isActive !== undefined) {
        filter.isActive = query.isActive === 'true';
    }

    return userRepo.findAll(filter);
};

/**
 * Get one user by ID — enforcing company scope for non-SUPER_ADMIN
 */
const getUserById = async (id, requestingUser) => {
    const user = await userRepo.findById(id);
    if (!user) throw new AppError('User not found.', 404);

    if (requestingUser.role !== 'SUPER_ADMIN' && user.companyId !== requestingUser.companyId) {
        throw new AppError('Access denied.', 403);
    }

    return user;
};

/**
 * Create a user
 * - SUPER_ADMIN: can create any role, for any company
 * - ADMIN: can only create SALES, DESIGNER, PRODUCTION in their own company
 */
const createUser = async (data, requestingUser) => {
    const { role, companyId, password, ...rest } = data;

    // Enforce ADMIN restrictions
    if (requestingUser.role === 'ADMIN') {
        if (!ADMIN_ALLOWED_ROLES.includes(role)) {
            throw new AppError(`Admin can only create users with roles: ${ADMIN_ALLOWED_ROLES.join(', ')}.`, 403);
        }
        // Force user into requesting admin's company
        data.companyId = requestingUser.companyId;
    }

    // Validate companyId exists (if provided)
    const resolvedCompanyId = requestingUser.role === 'ADMIN' ? requestingUser.companyId : companyId;
    if (resolvedCompanyId) {
        const company = await prisma.company.findUnique({ where: { id: resolvedCompanyId } });
        if (!company) throw new AppError('Company not found.', 404);
        if (!company.isActive) throw new AppError('Cannot add users to an inactive company.', 400);
    }

    // Check email uniqueness
    const existing = await userRepo.findByEmail(data.email);
    if (existing) throw new AppError('A user with this email already exists.', 409);

    const passwordHash = await hashPassword(password);

    return userRepo.create({
        ...rest,
        email: data.email,
        role,
        companyId: resolvedCompanyId || null,
        passwordHash,
    });
};

/**
 * Update a user
 */
const updateUser = async (id, data, requestingUser) => {
    const user = await getUserById(id, requestingUser);

    // ADMIN cannot escalate roles
    if (requestingUser.role === 'ADMIN' && data.role && !ADMIN_ALLOWED_ROLES.includes(data.role)) {
        throw new AppError(`Admin can only assign roles: ${ADMIN_ALLOWED_ROLES.join(', ')}.`, 403);
    }

    const updateData = { ...data };

    if (data.password) {
        updateData.passwordHash = await hashPassword(data.password);
        delete updateData.password;
    }

    // Check email uniqueness if changing email
    if (data.email && data.email !== user.email) {
        const existing = await userRepo.findByEmail(data.email);
        if (existing) throw new AppError('A user with this email already exists.', 409);
    }

    return userRepo.update(id, updateData);
};

/**
 * Soft delete (deactivate) a user
 */
const deleteUser = async (id, requestingUser) => {
    await getUserById(id, requestingUser);

    // Prevent self-deletion
    if (id === requestingUser.id) {
        throw new AppError('You cannot deactivate your own account.', 400);
    }

    return userRepo.softDelete(id);
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
