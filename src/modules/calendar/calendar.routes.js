const { Router } = require('express');
const calendarController = require('./calendar.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const companyScope = require('../../middlewares/companyScope');

const router = Router();

router.use(authenticate);
router.use(companyScope);

/**
 * @swagger
 * /api/calendar/issues:
 *   get:
 *     summary: Request calendar payload grouped by date
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Array of dates with embedded issues and stats
 */
router.get('/issues', authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'SALES', 'DESIGNER', 'PRODUCTION'), calendarController.getCalendarIssues);

module.exports = router;
