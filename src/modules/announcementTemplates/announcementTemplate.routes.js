const { Router } = require('express');
const controller = require('./announcementTemplate.controller');
const { createTemplateSchema, updateTemplateSchema, validate } = require('./announcementTemplate.validation');
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
  controller.getAll
);

router.get(
  '/:id',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'SALES', 'DESIGNER', 'PRODUCTION'),
  controller.getOne
);

// ── Write — COMPANY_ADMIN / SUPER_ADMIN only ──────────────────────────────────
router.post(
  '/',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN'),
  validate(createTemplateSchema),
  controller.create
);

router.patch(
  '/:id',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN'),
  validate(updateTemplateSchema),
  controller.update
);

router.patch(
  '/:id/toggle-active',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN'),
  controller.toggleActive
);

router.post(
  '/:id/duplicate',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN'),
  controller.duplicate
);

router.delete(
  '/:id',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN'),
  controller.remove
);

module.exports = router;
