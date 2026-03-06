const userService = require('../users/user.service');
const { sendSuccess } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');
const { createAuditLog } = require('../../middlewares/auditLog');
const AppError = require('../../utils/AppError');
const prisma = require('../../config/database');

/**
 * Resolve and validate that the target company exists and requester has access.
 * Injects companyId into req for downstream use.
 */
const resolveCompany = async (companyId, requestingUser) => {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new AppError('Company not found.', 404);

    // ADMIN can only manage their own company's users
    if (requestingUser.role === 'ADMIN' && requestingUser.companyId !== companyId) {
        throw new AppError('Access denied. You can only manage users in your own company.', 403);
    }
    return company;
};

/**
 * GET /api/companies/:id/users
 */
const getUsersInCompany = asyncHandler(async (req, res) => {
    const { id: companyId } = req.params;
    await resolveCompany(companyId, req.user);

    // Reuse user service but force company filter
    const users = await userService.getAllUsers(req.user, { ...req.query, companyId });
    sendSuccess(res, users, 'Company users retrieved successfully.');
});

/**
 * POST /api/companies/:id/users
 */
const createUserInCompany = asyncHandler(async (req, res) => {
    const { id: companyId } = req.params;
    const company = await resolveCompany(companyId, req.user);

    if (!company.isActive) {
        throw new AppError('Cannot add users to an inactive company.', 400);
    }

    // Force companyId from URL (ignore any body companyId)
    const user = await userService.createUser({ ...req.body, companyId }, req.user);

    await createAuditLog({
        userId: req.user.id,
        companyId,
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: user.id,
        metadata: { email: user.email, role: user.role },
    });

    sendSuccess(res, user, 'User created in company successfully.', 201);
});

/**
 * PATCH /api/companies/:id/users/:userId
 */
const updateUserInCompany = asyncHandler(async (req, res) => {
    const { id: companyId, userId } = req.params;
    await resolveCompany(companyId, req.user);

    const user = await userService.updateUser(userId, req.body, req.user);

    await createAuditLog({
        userId: req.user.id,
        companyId,
        action: 'USER_UPDATED',
        entityType: 'User',
        entityId: user.id,
        metadata: { updatedFields: Object.keys(req.body) },
    });

    sendSuccess(res, user, 'User updated successfully.');
});

/**
 * DELETE /api/companies/:id/users/:userId
 */
const deleteUserInCompany = asyncHandler(async (req, res) => {
    const { id: companyId, userId } = req.params;
    await resolveCompany(companyId, req.user);

    const user = await userService.deleteUser(userId, req.user);

    await createAuditLog({
        userId: req.user.id,
        companyId,
        action: 'USER_DEACTIVATED',
        entityType: 'User',
        entityId: user.id,
    });

    sendSuccess(res, user, 'User deactivated successfully.');
});

module.exports = { getUsersInCompany, createUserInCompany, updateUserInCompany, deleteUserInCompany };
