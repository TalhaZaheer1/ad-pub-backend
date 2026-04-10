const calendarService = require('./calendar.service');
const { sendSuccess } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * GET /api/calendar/issues
 * Returns aggregated calendar grouping of issues and ads for the authenticated company
 */
const getCalendarIssues = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const issues = await calendarService.getCalendarIssues(req.companyId, startDate, endDate);
  sendSuccess(res, { calendar: issues }, 'Calendar data retrieved successfully.');
});

module.exports = { getCalendarIssues };
