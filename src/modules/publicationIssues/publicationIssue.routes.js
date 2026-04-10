const { Router } = require('express');
const publicationIssueController = require('./publicationIssue.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const companyScope = require('../../middlewares/companyScope');

const router = Router();

router.use(authenticate);
router.use(companyScope);

/**
 * @swagger
 * /api/publication-issues/{id}/status:
 *   patch:
 *     summary: Update an issue status
 *     tags: [PublicationIssues]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'SALES', 'DESIGNER', 'PRODUCTION'), publicationIssueController.getAll);

router.patch('/:id/status', authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'PRODUCTION'), publicationIssueController.updateStatus);

/**
 * @swagger
 * /api/publication-issues/{id}/lock:
 *   patch:
 *     summary: Toggle lock status of an issue
 *     tags: [PublicationIssues]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/lock', authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'PRODUCTION'), publicationIssueController.toggleLock);

module.exports = router;
