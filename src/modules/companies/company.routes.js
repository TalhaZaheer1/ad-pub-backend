const { Router } = require('express');
const companyController = require('./company.controller');
const dashboardController = require('./company.dashboard.controller');
const companyUsersController = require('./company.users.controller');
const { createCompanySchema, updateCompanySchema, validate } = require('./company.validation');
const { createUserSchema, updateUserSchema, validate: validateUser } = require('../users/user.validation');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const companyScope = require('../../middlewares/companyScope');

const router = Router();

// All company routes require authentication
router.use(authenticate);
router.use(companyScope);

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Company management
 */

// ─── Core Company CRUD ────────────────────────────────────

/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: Get all companies (SUPER_ADMIN only)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 */
router.get('/', authorize('SUPER_ADMIN'), companyController.getAll);

/**
 * @swagger
 * /api/companies:
 *   post:
 *     summary: Create a new company (SUPER_ADMIN only)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug]
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 */
router.post('/', authorize('SUPER_ADMIN'), validate(createCompanySchema), companyController.create);

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: Get company by ID
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 */
router.get('/:id', authorize('SUPER_ADMIN', 'ADMIN'), companyController.getOne);

/**
 * @swagger
 * /api/companies/{id}:
 *   patch:
 *     summary: Update company settings (SUPER_ADMIN only)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', authorize('SUPER_ADMIN'), validate(updateCompanySchema), companyController.update);

/**
 * @swagger
 * /api/companies/{id}:
 *   delete:
 *     summary: Deactivate a company (SUPER_ADMIN only)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authorize('SUPER_ADMIN'), companyController.remove);

// ─── Dashboard Routes ─────────────────────────────────────

/**
 * @swagger
 * /api/companies/{id}/overview:
 *   get:
 *     summary: Get company overview stats
 *     description: Returns company info, total active users, users grouped by role, and last activity timestamp.
 *     tags: [Companies]
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
 *         description: Company overview with stats
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Company overview retrieved successfully.
 *               data:
 *                 company:
 *                   id: uuid
 *                   name: Acme Corp
 *                   slug: acme-corp
 *                   isActive: true
 *                   createdAt: "2024-01-01T00:00:00Z"
 *                 stats:
 *                   totalUsers: 12
 *                   usersByRole:
 *                     ADMIN: 2
 *                     SALES: 5
 *                     DESIGNER: 3
 *                     PRODUCTION: 2
 *                   lastActivity: "2024-03-01T10:30:00Z"
 *                   lastActivityAction: USER_CREATED
 *                   systemHealth:
 *                     status: operational
 *       403:
 *         description: Access denied
 *       404:
 *         description: Company not found
 */
router.get('/:id/overview', authorize('SUPER_ADMIN', 'ADMIN'), dashboardController.getOverview);

/**
 * @swagger
 * /api/companies/{id}/activity:
 *   get:
 *     summary: Get company activity log
 *     description: Returns last N audit log entries for the company (default 20, max 50).
 *     tags: [Companies]
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
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 */
router.get('/:id/activity', authorize('SUPER_ADMIN', 'ADMIN'), dashboardController.getActivity);

// ─── Company-Scoped User Management ──────────────────────

/**
 * @swagger
 * /api/companies/{id}/users:
 *   get:
 *     summary: Get users within a company
 *     description: SUPER_ADMIN can access any company; ADMIN can only access their own.
 *     tags: [Companies]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 */
router.get('/:id/users', authorize('SUPER_ADMIN', 'ADMIN'), companyUsersController.getUsersInCompany);

/**
 * @swagger
 * /api/companies/{id}/users:
 *   post:
 *     summary: Create a user within a company
 *     description: |
 *       SUPER_ADMIN can assign any role.
 *       ADMIN can only create SALES, DESIGNER, PRODUCTION users in their own company.
 *       The companyId is taken from the URL path — any companyId in the body is ignored.
 *     tags: [Companies]
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
 *             required: [firstName, lastName, email, password, role]
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, SALES, DESIGNER, PRODUCTION]
 */
router.post(
    '/:id/users',
    authorize('SUPER_ADMIN', 'ADMIN'),
    validateUser(createUserSchema),
    companyUsersController.createUserInCompany
);

/**
 * @swagger
 * /api/companies/{id}/users/{userId}:
 *   patch:
 *     summary: Update a user within a company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
    '/:id/users/:userId',
    authorize('SUPER_ADMIN', 'ADMIN'),
    validateUser(updateUserSchema),
    companyUsersController.updateUserInCompany
);

/**
 * @swagger
 * /api/companies/{id}/users/{userId}:
 *   delete:
 *     summary: Deactivate a user within a company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
    '/:id/users/:userId',
    authorize('SUPER_ADMIN', 'ADMIN'),
    companyUsersController.deleteUserInCompany
);

module.exports = router;
