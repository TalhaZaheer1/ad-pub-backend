const companyService = require('./company.service');
const { sendSuccess } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');
const { createAuditLog } = require('../../middlewares/auditLog');

/**
 * GET /api/companies
 */
const getAll = asyncHandler(async (req, res) => {
    const companies = await companyService.getAllCompanies(req.query);
    sendSuccess(res, companies, 'Companies retrieved successfully.');
});

/**
 * GET /api/companies/:id
 */
const getOne = asyncHandler(async (req, res) => {
    const company = await companyService.getCompanyById(req.params.id);
    sendSuccess(res, company, 'Company retrieved successfully.');
});

/**
 * POST /api/companies
 */
const create = asyncHandler(async (req, res) => {
    const company = await companyService.createCompany(req.body);

    await createAuditLog({
        userId: req.user.id,
        companyId: company.id,
        action: 'COMPANY_CREATED',
        entityType: 'Company',
        entityId: company.id,
        metadata: { name: company.name, slug: company.slug },
    });

    sendSuccess(res, company, 'Company created successfully.', 201);
});

/**
 * PATCH /api/companies/:id
 */
const update = asyncHandler(async (req, res) => {
    const company = await companyService.updateCompany(req.params.id, req.body);

    await createAuditLog({
        userId: req.user.id,
        companyId: company.id,
        action: 'COMPANY_UPDATED',
        entityType: 'Company',
        entityId: company.id,
        metadata: req.body,
    });

    sendSuccess(res, company, 'Company updated successfully.');
});

/**
 * DELETE /api/companies/:id
 */
const remove = asyncHandler(async (req, res) => {
    const company = await companyService.deleteCompany(req.params.id);

    await createAuditLog({
        userId: req.user.id,
        companyId: company.id,
        action: 'COMPANY_DELETED',
        entityType: 'Company',
        entityId: company.id,
    });

    sendSuccess(res, company, 'Company deactivated successfully.');
});

module.exports = { getAll, getOne, create, update, remove };
