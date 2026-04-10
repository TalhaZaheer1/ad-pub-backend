const { Router } = require('express');
const publicationTypeController = require('./publicationType.controller');
const {
  createPublicationTypeSchema,
  updatePublicationTypeSchema,
  validate,
} = require('./publicationType.validation');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const companyScope = require('../../middlewares/companyScope');

const router = Router();

// All routes require authentication + company scoping
router.use(authenticate);
router.use(companyScope);

/**
 * @swagger
 * tags:
 *   name: PublicationTypes
 *   description: Manage publication types per company
 */

/**
 * @swagger
 * /api/publication-types:
 *   get:
 *     summary: List all publication types for the authenticated company
 *     tags: [PublicationTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of publication types
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Publication types retrieved successfully.
 *               data:
 *                 publicationTypes:
 *                   - id: uuid
 *                     name: Weekly Magazine
 *                     frequency: WEEKLY
 *                     defaultPublishDay: Friday
 *                     isActive: true
 *                     issueCount: 12
 *                     createdAt: "2024-01-01T00:00:00Z"
 *       401:
 *         description: Unauthorized
 */
router.get('/', authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'SALES', 'DESIGNER', 'PRODUCTION'), publicationTypeController.getAll);

/**
 * @swagger
 * /api/publication-types/{id}:
 *   get:
 *     summary: Get a single publication type by ID
 *     tags: [PublicationTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Publication type detail
 *       404:
 *         description: Not found
 */
router.get('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'SALES', 'DESIGNER', 'PRODUCTION'), publicationTypeController.getOne);

/**
 * @swagger
 * /api/publication-types:
 *   post:
 *     summary: Create a new publication type (COMPANY_ADMIN only)
 *     tags: [PublicationTypes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Weekly Magazine
 *               frequency:
 *                 type: string
 *                 enum: [DAILY, WEEKLY, MONTHLY, QUARTERLY]
 *                 default: WEEKLY
 *               defaultPublishDay:
 *                 type: string
 *                 enum: [Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday]
 *                 example: Friday
 *               isActive:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Publication type created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Name already exists for this company
 */
router.post(
  '/',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN'),
  validate(createPublicationTypeSchema),
  publicationTypeController.create
);

/**
 * @swagger
 * /api/publication-types/{id}:
 *   patch:
 *     summary: Update a publication type (COMPANY_ADMIN only)
 *     tags: [PublicationTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               frequency:
 *                 type: string
 *                 enum: [DAILY, WEEKLY, MONTHLY, QUARTERLY]
 *               defaultPublishDay:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated publication type
 *       404:
 *         description: Not found
 */
router.patch(
  '/:id',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN'),
  validate(updatePublicationTypeSchema),
  publicationTypeController.update
);

/**
 * @swagger
 * /api/publication-types/{id}/toggle-active:
 *   patch:
 *     summary: Toggle the isActive status of a publication type
 *     tags: [PublicationTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Status toggled
 *       404:
 *         description: Not found
 */
router.patch(
  '/:id/toggle-active',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN'),
  publicationTypeController.toggleActive
);

/**
 * @swagger
 * /api/publication-types/{id}:
 *   delete:
 *     summary: Delete a publication type — blocked if linked issues exist (COMPANY_ADMIN only)
 *     tags: [PublicationTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Deleted successfully
 *       404:
 *         description: Not found
 *       409:
 *         description: Cannot delete — linked issues exist
 */
router.delete('/:id', authorize('SUPER_ADMIN', 'COMPANY_ADMIN'), publicationTypeController.remove);

/**
 * @swagger
 * /api/publication-types/{id}/issues:
 *   get:
 *     summary: Get all issues for a publication type
 *     tags: [PublicationTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter issues by status
 *     responses:
 *       200:
 *         description: List of issues
 *       404:
 *         description: Publication type not found
 */
router.get('/:id/issues', authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'SALES', 'DESIGNER', 'PRODUCTION'), publicationTypeController.getIssues);

module.exports = router;
