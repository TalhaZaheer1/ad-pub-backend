const { Router } = require('express');
const adTypeController = require('./adType.controller');
const { createAdTypeSchema, updateAdTypeSchema, validate } = require('./adType.validation');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const companyScope = require('../../middlewares/companyScope');

const router = Router();

router.use(authenticate);
router.use(companyScope);

// ── Read — all authenticated roles ───────────────────────────────────────────
router.get(
  '/',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES', 'DESIGNER', 'PRODUCTION'),
  adTypeController.getAll
);

router.get(
  '/:id',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES', 'DESIGNER', 'PRODUCTION'),
  adTypeController.getOne
);

// ── Write — COMPANY_ADMIN / SUPER_ADMIN only ──────────────────────────────────
router.post(
  '/',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN'),
  validate(createAdTypeSchema),
  adTypeController.create
);

router.patch(
  '/:id',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN'),
  validate(updateAdTypeSchema),
  adTypeController.update
);

router.patch(
  '/:id/toggle-active',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN'),
  adTypeController.toggleActive
);

router.delete(
  '/:id',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN'),
  adTypeController.remove
);

module.exports = router;
