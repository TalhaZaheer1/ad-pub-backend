const { sendSuccess } = require('../../utils/response');
const pricingService = require('./pricing.service');

const getPricingRules = async (req, res, next) => {
  try {
    const rules = await pricingService.getAll(req.companyId);
    return sendSuccess(res, rules, "Pricing rules retrieved successfully");
  } catch (error) {
    next(error);
  }
};

const createPricingRule = async (req, res, next) => {
  try {
    const rule = await pricingService.create(req.companyId, req.body);
    return sendSuccess(res, rule, "Pricing rule created successfully");
  } catch (error) {
    next(error);
  }
};

const updatePricingRule = async (req, res, next) => {
  try {
    const rule = await pricingService.update(req.params.id, req.companyId, req.body);
    return sendSuccess(res, rule, "Pricing rule updated successfully");
  } catch (error) {
    next(error);
  }
};

const deletePricingRule = async (req, res, next) => {
  try {
    await pricingService.deleteRule(req.params.id, req.companyId);
    return sendSuccess(res, null, "Pricing rule deleted successfully");
  } catch (error) {
    next(error);
  }
};

const previewPrice = async (req, res, next) => {
  try {
    const payload = await pricingService.preview(req.companyId, req.body);
    return sendSuccess(res, payload, "Pricing preview calculated successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = { getPricingRules, createPricingRule, updatePricingRule, deletePricingRule, previewPrice };
