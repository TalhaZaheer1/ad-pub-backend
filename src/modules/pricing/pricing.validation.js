const Joi = require('joi');

const pricingRulesValidation = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow('', null),
    ruleType: Joi.string().valid('BASE_RATE', 'SURCHARGE', 'DISCOUNT', 'OVERRIDE_LIMIT', 'TAX').required(),
    publicationTypeId: Joi.string().allow('', null),
    adTypeId: Joi.string().allow('', null),
    adSizeName: Joi.string().allow('', null),
    area: Joi.string().allow('', null),
    colorProfile: Joi.string().allow('', null),
    condition: Joi.any().optional(),
    discountType: Joi.string().valid('PERCENTAGE', 'FIXED_AMOUNT').allow('', null),
    value: Joi.number().required(),
    priority: Joi.number().default(0),
    effectiveFrom: Joi.date().iso().allow('', null),
    effectiveTo: Joi.date().iso().allow('', null),
    isActive: Joi.boolean().default(true),
});

const previewPriceValidation = Joi.object({
    publicationTypeId: Joi.string().allow('', null),
    adTypeId: Joi.string().allow('', null),
    adSizeName: Joi.string().allow('', null),
    area: Joi.string().allow('', null),
    colorProfile: Joi.string().allow('', null),
    customerData: Joi.any().optional()
});

const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
        const AppError = require('../../utils/AppError');
        const errors = error.details.map((d) => d.message);
        return next(new AppError('Validation failed.', 422, errors));
    }
    req.body = value;
    next();
};

module.exports = { pricingRulesValidation, previewPriceValidation, validate };
