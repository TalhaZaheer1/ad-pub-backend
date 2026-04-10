const { Router } = require('express');
const customerController = require('./customer.controller');
const {
    customerSignupSchema,
    customerLoginSchema,
    customerRefreshSchema,
    customerLogoutSchema,
    validate,
} = require('./customer.validation');
const authenticateCustomer = require('../../middlewares/authenticateCustomer');
const { authLimiter } = require('../../middlewares/rateLimiter');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer self-service auth and profile endpoints
 */

/**
 * @swagger
 * /api/customers/signup:
 *   post:
 *     summary: Customer self-registration
 *     description: |
 *       Signs up a customer under a specific publication company (identified by `companySlug`).
 *       Creates the account with status `PENDING`. Status becomes `ACTIVE` on first login.
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companySlug, firstName, lastName, email, password]
 *             properties:
 *               companySlug:
 *                 type: string
 *                 example: acme-media
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               businessName:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Account created
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Account created successfully. You can now log in.
 *               data:
 *                 customer:
 *                   id: uuid
 *                   email: jane@example.com
 *                   status: PENDING
 *                 companyName: Acme Media
 *       404:
 *         description: Company not found
 *       409:
 *         description: Email already registered
 */
router.post('/signup', authLimiter, validate(customerSignupSchema), customerController.signup);

/**
 * @swagger
 * /api/customers/login:
 *   post:
 *     summary: Customer login
 *     description: |
 *       Returns a JWT accessToken and refreshToken for the customer.
 *       Optionally accepts `companySlug` to scope the login to a specific company portal.
 *       PENDING customers are automatically set to ACTIVE on first successful login.
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               companySlug:
 *                 type: string
 *                 description: Optional. Scopes login to a specific company portal.
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authLimiter, validate(customerLoginSchema), customerController.login);

/**
 * @swagger
 * /api/customers/refresh:
 *   post:
 *     summary: Refresh customer JWT tokens
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New token pair issued
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', validate(customerRefreshSchema), customerController.refresh);

/**
 * @swagger
 * /api/customers/logout:
 *   post:
 *     summary: Customer logout
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post('/logout', authenticateCustomer, validate(customerLogoutSchema), customerController.logout);

/**
 * @swagger
 * /api/customers/me:
 *   get:
 *     summary: Get current customer profile
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer profile with associated company info
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticateCustomer, customerController.getMe);

module.exports = router;
