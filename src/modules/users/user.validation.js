const Joi = require('joi');

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'SALES', 'DESIGNER', 'PRODUCTION'];

const createUserSchema = Joi.object({
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
    role: Joi.string()
        .valid(...ROLES)
        .required()
        .messages({
            'any.only': `Role must be one of: ${ROLES.join(', ')}.`,
            'any.required': 'Role is required.',
        }),
    companyId: Joi.string().uuid().allow(null).optional(),
});

const updateUserSchema = Joi.object({
    firstName: Joi.string().trim().min(1).max(100),
    lastName: Joi.string().trim().min(1).max(100),
    email: Joi.string().email().lowercase().trim(),
    password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
    role: Joi.string().valid(...ROLES),
    isActive: Joi.boolean(),
}).min(1);

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

module.exports = { createUserSchema, updateUserSchema, validate };
