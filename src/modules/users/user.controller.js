const userService = require('./user.service');
const { sendSuccess } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');
const { createAuditLog } = require('../../middlewares/auditLog');

/**
 * GET /api/users
 */
const getAll = asyncHandler(async (req, res) => {
    const users = await userService.getAllUsers(req.user, req.query);
    sendSuccess(res, users, 'Users retrieved successfully.');
});

/**
 * GET /api/users/:id
 */
const getOne = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id, req.user);
    sendSuccess(res, user, 'User retrieved successfully.');
});

/**
 * POST /api/users
 */
const create = asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body, req.user);

    await createAuditLog({
        userId: req.user.id,
        companyId: user.companyId,
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: user.id,
        metadata: { email: user.email, role: user.role },
    });

    sendSuccess(res, user, 'User created successfully.', 201);
});

/**
 * PATCH /api/users/:id
 */
const update = asyncHandler(async (req, res) => {
    const user = await userService.updateUser(req.params.id, req.body, req.user);

    await createAuditLog({
        userId: req.user.id,
        companyId: user.companyId,
        action: 'USER_UPDATED',
        entityType: 'User',
        entityId: user.id,
        metadata: { updatedFields: Object.keys(req.body) },
    });

    sendSuccess(res, user, 'User updated successfully.');
});

/**
 * DELETE /api/users/:id
 */
const remove = asyncHandler(async (req, res) => {
    const user = await userService.deleteUser(req.params.id, req.user);

    await createAuditLog({
        userId: req.user.id,
        companyId: user.companyId,
        action: 'USER_DELETED',
        entityType: 'User',
        entityId: user.id,
    });

    sendSuccess(res, user, 'User deleted successfully.');
});

module.exports = { getAll, getOne, create, update, remove };
