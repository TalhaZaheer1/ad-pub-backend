const { Router } = require('express');
const invoiceController = require('./invoice.controller');
const {
  createInvoiceSchema,
  updateInvoiceStatusSchema,
  recordPaymentSchema,
  validate
} = require('./invoice.validation');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const companyScope = require('../../middlewares/companyScope');

const router = Router();

router.use(authenticate);
router.use(companyScope);

router.get('/metrics', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES'), invoiceController.getMetrics);

router.get('/', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES'), invoiceController.getAll);

router.get('/:id', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES'), invoiceController.getOne);

router.post(
  '/',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES'),
  validate(createInvoiceSchema),
  invoiceController.create
);

router.patch(
  '/:id/status',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES'),
  validate(updateInvoiceStatusSchema),
  invoiceController.updateStatus
);

router.post(
  '/:id/payments',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES'),
  validate(recordPaymentSchema),
  invoiceController.recordPayment
);

module.exports = router;
