const templateService = require('./announcementTemplate.service');
const { sendSuccess } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * GET /api/announcement-templates
 */
const getAll = asyncHandler(async (req, res) => {
  const { adTypeId, isActive, isDefault, search } = req.query;
  const templates = await templateService.getAll(req.companyId, { adTypeId, isActive, isDefault, search });
  sendSuccess(res, { templates }, 'Templates retrieved successfully.');
});

/**
 * GET /api/announcement-templates/:id
 */
const getOne = asyncHandler(async (req, res) => {
  const template = await templateService.getOne(req.companyId, req.params.id);
  sendSuccess(res, { template }, 'Template retrieved successfully.');
});

/**
 * POST /api/announcement-templates
 */
const create = asyncHandler(async (req, res) => {
  const template = await templateService.create(req.companyId, req.body);
  sendSuccess(res, { template }, 'Template created successfully.', 201);
});

/**
 * PATCH /api/announcement-templates/:id
 */
const update = asyncHandler(async (req, res) => {
  const template = await templateService.update(req.companyId, req.params.id, req.body);
  sendSuccess(res, { template }, 'Template updated successfully.');
});

/**
 * DELETE /api/announcement-templates/:id
 */
const remove = asyncHandler(async (req, res) => {
  await templateService.remove(req.companyId, req.params.id);
  sendSuccess(res, null, 'Template deactivated successfully.');
});

/**
 * PATCH /api/announcement-templates/:id/toggle-active
 */
const toggleActive = asyncHandler(async (req, res) => {
  const template = await templateService.toggleActive(req.companyId, req.params.id);
  const status = template.isActive ? 'activated' : 'deactivated';
  sendSuccess(res, { template }, `Template ${status} successfully.`);
});

/**
 * POST /api/announcement-templates/:id/duplicate
 */
const duplicate = asyncHandler(async (req, res) => {
  const template = await templateService.duplicate(req.companyId, req.params.id);
  sendSuccess(res, { template }, 'Template duplicated successfully.', 201);
});

module.exports = { getAll, getOne, create, update, remove, toggleActive, duplicate };
