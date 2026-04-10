const { Router } = require('express');
const adUnitController = require('./adUnit.controller');
const { createAdUnitSchema, updateAdUnitSchema, updateStatusSchema, updateDesignStatusSchema, assignDesignerSchema, bulkAssignDesignerSchema, bulkUpdateDesignStatusSchema, validate } = require('./adUnit.validation');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const companyScope = require('../../middlewares/companyScope');
const { upload } = require('../../middlewares/upload.middleware');

const router = Router();

router.use(authenticate);
router.use(companyScope);

// Metrics summary
router.get('/metrics', authorize('COMPANY_ADMIN', 'SALES', 'DESIGNER', 'PRODUCTION'), adUnitController.getMetrics);

// Export (must precede /:id)
router.get('/export/indesign', authorize('COMPANY_ADMIN', 'DESIGNER', 'PRODUCTION'), adUnitController.exportInDesignSnippet);
router.get('/export/pdf', authorize('COMPANY_ADMIN', 'DESIGNER', 'PRODUCTION'), adUnitController.exportGroupedPdf);

// Bulk Operations
router.patch('/bulk/assign', authorize('COMPANY_ADMIN', 'DESIGNER'), validate(bulkAssignDesignerSchema), adUnitController.bulkAssignDesigner);
router.patch('/bulk/design-status', authorize('COMPANY_ADMIN', 'DESIGNER'), validate(bulkUpdateDesignStatusSchema), adUnitController.bulkUpdateDesignStatus);

// List all
router.get('/', authorize('COMPANY_ADMIN', 'SALES', 'DESIGNER', 'PRODUCTION'), adUnitController.getAll);

// Get single
router.get('/:id', authorize('COMPANY_ADMIN', 'SALES', 'DESIGNER', 'PRODUCTION'), adUnitController.getOne);

// Create — COMPANY_ADMIN and SALES only
router.post('/', authorize('COMPANY_ADMIN', 'SALES'), validate(createAdUnitSchema), adUnitController.create);

// Update — COMPANY_ADMIN and SALES only
router.patch('/:id', authorize('COMPANY_ADMIN', 'SALES'), validate(updateAdUnitSchema), adUnitController.update);

// Update status — COMPANY_ADMIN and PRODUCTION only (APPROVED, REJECTED, READY, PRINTED, PUBLISHED)
router.patch('/:id/status', authorize('COMPANY_ADMIN', 'PRODUCTION'), validate(updateStatusSchema), adUnitController.updateStatus);

// Design workflow — DESIGNER, COMPANY_ADMIN, PRODUCTION (role-specific states enforced in service)
router.patch('/:id/design-status', authorize('COMPANY_ADMIN', 'DESIGNER', 'PRODUCTION'), validate(updateDesignStatusSchema), adUnitController.updateDesignStatus);
router.patch('/:id/assign', authorize('COMPANY_ADMIN', 'PRODUCTION'), validate(assignDesignerSchema), adUnitController.assignDesigner);

// Assets Management — SALES, DESIGNER, ADMIN, PRODUCTION
router.post('/:id/assets', authorize('COMPANY_ADMIN', 'SALES', 'DESIGNER', 'PRODUCTION'), upload.array('assets', 10), adUnitController.uploadAssets);
router.delete('/:id/assets/:assetId', authorize('COMPANY_ADMIN', 'SALES', 'DESIGNER', 'PRODUCTION'), adUnitController.removeAsset);

// Delete — COMPANY_ADMIN only
router.delete('/:id', authorize('COMPANY_ADMIN'), adUnitController.remove);

module.exports = router;
