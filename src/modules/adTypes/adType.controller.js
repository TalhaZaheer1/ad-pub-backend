const adTypeService = require('./adType.service');
const { sendSuccess } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * GET /api/ad-types
 */
const getAll = asyncHandler(async (req, res) => {
  const { isActive } = req.query;
  const adTypes = await adTypeService.getAll(req.companyId, { isActive });
  sendSuccess(res, { adTypes }, 'Ad types retrieved successfully.');
});

/**
 * GET /api/ad-types/:id
 */
const getOne = asyncHandler(async (req, res) => {
  const adType = await adTypeService.getOne(req.companyId, req.params.id);
  sendSuccess(res, { adType }, 'Ad type retrieved successfully.');
});

/**
 * POST /api/ad-types
 */
const create = asyncHandler(async (req, res) => {
  const adType = await adTypeService.create(req.companyId, req.body);
  sendSuccess(res, { adType }, 'Ad type created successfully.', 201);
});

/**
 * PATCH /api/ad-types/:id
 */
const update = asyncHandler(async (req, res) => {
  const adType = await adTypeService.update(req.companyId, req.params.id, req.body);
  sendSuccess(res, { adType }, 'Ad type updated successfully.');
});

/**
 * DELETE /api/ad-types/:id
 */
const remove = asyncHandler(async (req, res) => {
  const result = await adTypeService.remove(req.companyId, req.params.id);
  const message = result.softDeleted
    ? `Ad type deactivated (it has ${result.adCount} linked ads — history preserved).`
    : 'Ad type deleted successfully.';
  sendSuccess(res, null, message);
});

/**
 * PATCH /api/ad-types/:id/toggle-active
 */
const toggleActive = asyncHandler(async (req, res) => {
  const adType = await adTypeService.toggleActive(req.companyId, req.params.id);
  const status = adType.isActive ? 'activated' : 'deactivated';
  sendSuccess(res, { adType }, `Ad type ${status} successfully.`);
});

module.exports = { getAll, getOne, create, update, remove, toggleActive };
