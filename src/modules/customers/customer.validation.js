const Joi = require('joi');
const AppError = require('../../utils/AppError');

// ── Customer Signup ────────────────────────────────────────
const customerSignupSchema = Joi.object({
    // companySlug identifies which publication company this customer is signing up under
    companySlug: Joi.string()
        .trim()
        .lowercase()
        .min(2)
        .max(100)
        .pattern(/^[a-z0-9-]+$/)
        .required()
        .messages({
            'string.pattern.base': 'Company slug must contain only lowercase letters, numbers, and hyphens.',
            'any.required': 'Company slug is required.',
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
    phone: Joi.string().trim().max(30).optional(),
    businessName: Joi.string().trim().max(255).optional(),
    address: Joi.string().trim().max(500).optional(),
});

// ── Customer Login ─────────────────────────────────────────
const customerLoginSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
        'any.required': 'Email is required.',
    }),
    password: Joi.string().required().messages({
        'any.required': 'Password is required.',
    }),
    // Optional: lock login to a specific company's portal
    companySlug: Joi.string().trim().lowercase().optional(),
});

// ── Token Refresh ──────────────────────────────────────────
const customerRefreshSchema = Joi.object({
    refreshToken: Joi.string().required().messages({
        'any.required': 'Refresh token is required.',
    }),
});

// ── Logout ─────────────────────────────────────────────────
const customerLogoutSchema = Joi.object({
    refreshToken: Joi.string().required().messages({
        'any.required': 'Refresh token is required.',
    }),
});

/**
 * Validate request body against a Joi schema.
 */
const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

    if (error) {
        const message = error.details.map((d) => d.message).join('; ');
        return next(new AppError(message, 400));
    }

    req.body = value;
    next();
};

module.exports = {
    customerSignupSchema,
    customerLoginSchema,
    customerRefreshSchema,
    customerLogoutSchema,
    validate,
};
