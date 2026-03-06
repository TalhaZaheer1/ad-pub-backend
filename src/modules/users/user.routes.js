const { Router } = require('express');
const userController = require('./user.controller');
const { createUserSchema, updateUserSchema, validate } = require('./user.validation');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (SUPER_ADMIN sees all; ADMIN sees own company)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by company (SUPER_ADMIN only)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', authorize('SUPER_ADMIN', 'ADMIN'), userController.getAll);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authorize('SUPER_ADMIN', 'ADMIN'), userController.getOne);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *                 format: email
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN, SALES, DESIGNER, PRODUCTION]
 *               companyId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: User created
 *       409:
 *         description: Email already exists
 */
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), validate(createUserSchema), userController.create);

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', authorize('SUPER_ADMIN', 'ADMIN'), validate(updateUserSchema), userController.update);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Deactivate (soft delete) a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), userController.remove);

module.exports = router;
