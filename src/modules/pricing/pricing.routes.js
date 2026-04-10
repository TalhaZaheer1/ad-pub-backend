const express = require('express');
const { getPricingRules, createPricingRule, updatePricingRule, deletePricingRule, previewPrice } = require('./pricing.controller');
const { pricingRulesValidation, previewPriceValidation, validate } = require('./pricing.validation');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const companyScope = require('../../middlewares/companyScope');

const router = express.Router();

router.use(authenticate);
router.use(companyScope);

router.post('/preview', validate(previewPriceValidation), previewPrice);

// Restrict CRUD to Admin
router.use(authorize('SUPER_ADMIN', 'COMPANY_ADMIN'));

router.get('/', getPricingRules);
router.post('/', validate(pricingRulesValidation), createPricingRule);
router.patch('/:id', validate(pricingRulesValidation), updatePricingRule);
router.delete('/:id', deletePricingRule);

module.exports = router;
