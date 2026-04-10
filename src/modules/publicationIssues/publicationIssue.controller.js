const publicationIssueService = require('./publicationIssue.service');
const { sendSuccess } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
  const issues = await publicationIssueService.getAll(req.companyId, req.query);
  sendSuccess(res, { issues }, 'Publication issues retrieved successfully.');
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const issue = await publicationIssueService.updateStatus(req.companyId, req.params.id, status, req.user.id);
  sendSuccess(res, { publicationIssue: issue }, `Publication issue status updated to ${status}.`);
});

const toggleLock = asyncHandler(async (req, res) => {
  const issue = await publicationIssueService.toggleLock(req.companyId, req.params.id);
  const lockState = issue.isLocked ? 'locked' : 'unlocked';
  sendSuccess(res, { publicationIssue: issue }, `Publication issue has been ${lockState}.`);
});

module.exports = { getAll, updateStatus, toggleLock };
