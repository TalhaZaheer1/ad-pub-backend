const dashboardService = require('./company.dashboard.service');
const { sendSuccess } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * GET /api/companies/:id/overview
 */
const getOverview = asyncHandler(async (req, res) => {
    const result = await dashboardService.getCompanyOverview(req.params.id, req.user);
    sendSuccess(res, result, 'Company overview retrieved successfully.');
});

/**
 * GET /api/companies/:id/activity
 */
const getActivity = asyncHandler(async (req, res) => {
    const result = await dashboardService.getCompanyActivity(req.params.id, req.user, req.query);
    sendSuccess(res, result, 'Company activity retrieved successfully.');
});

module.exports = { getOverview, getActivity };
