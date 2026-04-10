const Joi = require('joi');

const createCompanySchema = Joi.object({
    name: Joi.string().trim().min(2).max(255).required().messages({
        'string.min': 'Company name must be at least 2 characters.',
        'any.required': 'Company name is required.',
    }),
    slug: Joi.string()
        .trim()
        .lowercase()
        .min(2)
        .max(100)
        .pattern(/^[a-z0-9-]+$/)
        .required()
        .messages({
            'string.pattern.base': 'Slug must contain only lowercase letters, numbers, and hyphens.',
            'any.required': 'Slug is required.',
        }),
});

const updateCompanySchema = Joi.object({
    name: Joi.string().trim().min(2).max(255),
    slug: Joi.string()
        .trim()
        .lowercase()
        .min(2)
        .max(100)
        .pattern(/^[a-z0-9-]+$/),
    timezone: Joi.string().trim().max(100),
    isActive: Joi.boolean(),
}).min(1).messages({ 'object.min': 'At least one field must be provided for update.' });

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

module.exports = { createCompanySchema, updateCompanySchema, validate };
