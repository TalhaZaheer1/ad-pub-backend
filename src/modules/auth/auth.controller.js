const authService = require('./auth.service');
const { sendSuccess } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');
const { createAuditLog } = require('../../middlewares/auditLog');

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    await createAuditLog({
        userId: result.user.id,
        companyId: result.user.companyId,
        action: 'AUTH_LOGIN',
        entityType: 'User',
        entityId: result.user.id,
    });

    sendSuccess(res, result, 'Login successful.');
});

/**
 * POST /api/auth/refresh
 */
const refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const tokens = await authService.refresh(refreshToken);
    sendSuccess(res, tokens, 'Tokens refreshed successfully.');
});

/**
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);

    if (req.user) {
        await createAuditLog({
            userId: req.user.id,
            companyId: req.user.companyId,
            action: 'AUTH_LOGOUT',
            entityType: 'User',
            entityId: req.user.id,
        });
    }

    sendSuccess(res, null, 'Logged out successfully.');
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user
 */
const getMe = asyncHandler(async (req, res) => {
    // req.user is already populated by the authenticate middleware
    sendSuccess(res, { user: req.user }, 'Current user retrieved successfully.');
});

/**
 * POST /api/auth/register-company
 * Register a new company and its initial ADMIN user
 */
const registerCompany = asyncHandler(async (req, res) => {
    const result = await authService.registerCompany(req.body);
    sendSuccess(res, result, 'Company registered successfully.', 201);
});

module.exports = { login, refresh, logout, getMe, registerCompany };
