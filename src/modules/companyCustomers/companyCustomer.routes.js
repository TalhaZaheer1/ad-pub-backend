const { Router } = require('express');
const companyCustomerController = require('./companyCustomer.controller');
const {
  createCompanyCustomerSchema,
  updateCompanyCustomerSchema,
  addActivitySchema,
  validate
} = require('./companyCustomer.validation');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const companyScope = require('../../middlewares/companyScope');

const router = Router();

// Secure all routes
router.use(authenticate);
router.use(companyScope);

/**
 * @swagger
 * tags:
 *   name: CompanyCustomers
 */

router.get(
  '/',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES'),
  companyCustomerController.getAll
);

router.get(
  '/:id',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES', 'DESIGNER', 'PRODUCTION'),
  companyCustomerController.getOne
);

router.post(
  '/',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES'),
  validate(createCompanyCustomerSchema),
  companyCustomerController.create
);

router.patch(
  '/:id',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES'),
  validate(updateCompanyCustomerSchema),
  companyCustomerController.update
);

router.delete(
  '/:id',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN'),
  companyCustomerController.remove
);

router.post(
  '/:id/activities',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES'),
  validate(addActivitySchema),
  companyCustomerController.addActivity
);

router.get(
  '/:id/activities',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES'),
  companyCustomerController.getActivities
);

module.exports = router;
