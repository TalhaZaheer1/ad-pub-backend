const Joi = require('joi');

const loginSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
        'string.email': 'Please provide a valid email address.',
        'any.required': 'Email is required.',
    }),
    password: Joi.string().required().messages({
        'any.required': 'Password is required.',
    }),
});

const refreshSchema = Joi.object({
    refreshToken: Joi.string().required().messages({
        'any.required': 'Refresh token is required.',
    }),
});

const logoutSchema = Joi.object({
    refreshToken: Joi.string().required().messages({
        'any.required': 'Refresh token is required.',
    }),
});

const registerCompanySchema = Joi.object({
    companyName: Joi.string().trim().min(2).max(255).required().messages({
        'string.min': 'Company name must be at least 2 characters.',
        'any.required': 'Company name is required.',
    }),
    companySlug: Joi.string()
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
    firstName: Joi.string().trim().min(1).max(100).required().messages({
        'any.required': 'First name is required.',
    }),
    lastName: Joi.string().trim().min(1).max(100).required().messages({
        'any.required': 'Last name is required.',
    }),
    email: Joi.string().email().lowercase().trim().required().messages({
        'string.email': 'Please provide a valid email address.',
        'any.required': 'Email is required.',
    }),
    password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters.',
            'string.pattern.base':
                'Password must contain uppercase, lowercase, number, and special character.',
            'any.required': 'Password is required.',
        }),
});

/**
 * Validate request body against a Joi schema.
 * Throws AppError with cleaned up messages on failure.
 */
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

module.exports = { loginSchema, refreshSchema, logoutSchema, registerCompanySchema, validate };
