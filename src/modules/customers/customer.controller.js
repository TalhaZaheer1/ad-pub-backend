const customerService = require('./customer.service');
const { sendSuccess } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * POST /api/customers/signup
 */
const signup = asyncHandler(async (req, res) => {
    const result = await customerService.signup(req.body);
    sendSuccess(res, result, 'Account created successfully. You can now log in.', 201);
});

/**
 * POST /api/customers/login
 */
const login = asyncHandler(async (req, res) => {
    const { email, password, companySlug } = req.body;
    const result = await customerService.login(email, password, companySlug);
    sendSuccess(res, result, 'Login successful.');
});

/**
 * POST /api/customers/refresh
 */
const refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const tokens = await customerService.refresh(refreshToken);
    sendSuccess(res, tokens, 'Tokens refreshed successfully.');
});

/**
 * POST /api/customers/logout
 */
const logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    await customerService.logout(refreshToken);
    sendSuccess(res, null, 'Logged out successfully.');
});

/**
 * GET /api/customers/me
 * Requires authenticateCustomer middleware — req.customer is populated
 */
const getMe = asyncHandler(async (req, res) => {
    const profile = await customerService.getProfile(req.customer.id);
    sendSuccess(res, { customer: profile }, 'Profile retrieved successfully.');
});

module.exports = { signup, login, refresh, logout, getMe };
