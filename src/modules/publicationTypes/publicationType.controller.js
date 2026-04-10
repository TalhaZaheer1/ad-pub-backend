const publicationTypeService = require('./publicationType.service');
const { sendSuccess } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * GET /api/publication-types
 * Returns all publication types scoped to the authenticated company.
 */
const getAll = asyncHandler(async (req, res) => {
  const { isActive } = req.query;
  const types = await publicationTypeService.getAll(req.companyId, { isActive });
  sendSuccess(res, { publicationTypes: types }, 'Publication types retrieved successfully.');
});

/**
 * GET /api/publication-types/:id
 */
const getOne = asyncHandler(async (req, res) => {
  const type = await publicationTypeService.getOne(req.companyId, req.params.id);
  sendSuccess(res, { publicationType: type }, 'Publication type retrieved successfully.');
});

/**
 * POST /api/publication-types
 * Admin creates a new publication type for their company.
 */
const create = asyncHandler(async (req, res) => {
  console.log({ publication: req.body })
  const type = await publicationTypeService.create(req.companyId, req.body);
  sendSuccess(res, { publicationType: type }, 'Publication type created successfully.', 201);
});

/**
 * PATCH /api/publication-types/:id
 */
const update = asyncHandler(async (req, res) => {
  const type = await publicationTypeService.update(req.companyId, req.params.id, req.body);
  sendSuccess(res, { publicationType: type }, 'Publication type updated successfully.');
});

/**
 * DELETE /api/publication-types/:id
 */
const remove = asyncHandler(async (req, res) => {
  await publicationTypeService.remove(req.companyId, req.params.id);
  sendSuccess(res, null, 'Publication type deleted successfully.');
});

/**
 * PATCH /api/publication-types/:id/toggle-active
 * Convenience endpoint to flip isActive without a full update payload.
 */
const toggleActive = asyncHandler(async (req, res) => {
  const type = await publicationTypeService.toggleActive(req.companyId, req.params.id);
  const status = type.isActive ? 'activated' : 'deactivated';
  sendSuccess(res, { publicationType: type }, `Publication type ${status} successfully.`);
});

/**
 * GET /api/publication-types/:id/issues
 * Returns issues for a specific publication type.
 */
const getIssues = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const issues = await publicationTypeService.getIssues(req.companyId, req.params.id, { status });
  sendSuccess(res, { publicationIssues: issues }, 'Publication issues retrieved successfully.');
});

module.exports = { getAll, getOne, create, update, remove, toggleActive, getIssues };
