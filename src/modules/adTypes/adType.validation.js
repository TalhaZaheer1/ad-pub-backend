const Joi = require('joi');
const AppError = require('../../utils/AppError');

const createAdTypeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters.',
    'string.max': 'Name must be at most 100 characters.',
    'any.required': 'Name is required.',
  }),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  isActive: Joi.boolean().default(true),
  sortOrder: Joi.number().integer().min(0).default(0),
});

const updateAdTypeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  isActive: Joi.boolean().optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const message = error.details.map((d) => d.message).join('; ');
    return next(new AppError(message, 400));
  }
  req.body = value;
  next();
};

module.exports = { createAdTypeSchema, updateAdTypeSchema, validate };
