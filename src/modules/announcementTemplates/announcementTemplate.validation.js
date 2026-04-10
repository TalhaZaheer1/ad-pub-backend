const Joi = require('joi');
const AppError = require('../../utils/AppError');

const placeholderSchema = Joi.object({
  key: Joi.string().trim().required(),
  label: Joi.string().trim().required(),
  example: Joi.string().trim().allow('', null).optional(),
});

const createTemplateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required().messages({
    'string.min': 'Name must be at least 2 characters.',
    'string.max': 'Name must be at most 150 characters.',
    'any.required': 'Name is required.',
  }),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  adTypeId: Joi.string().uuid().allow('', null).optional(),
  language: Joi.string().valid('ENGLISH', 'HEBREW', 'YIDDISH').default('en').messages({
    'any.only': 'Language must be one of: en, he, yi.',
  }),
  subjectLine: Joi.string().trim().max(200).allow('', null).optional(),
  templateContent: Joi.string().trim().min(1).required().messages({
    'any.required': 'Template content is required.',
  }),
  placeholders: Joi.array().items(placeholderSchema).default([]),
  isActive: Joi.boolean().default(true),
  isDefault: Joi.boolean().default(false),
  sortOrder: Joi.number().integer().min(0).default(0),
});

const updateTemplateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).optional(),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  adTypeId: Joi.string().uuid().allow('', null).optional(),
  language: Joi.string().valid('en', 'he', 'yi').optional(),
  subjectLine: Joi.string().trim().max(200).allow('', null).optional(),
  templateContent: Joi.string().trim().min(1).optional(),
  placeholders: Joi.array().items(placeholderSchema).optional(),
  isActive: Joi.boolean().optional(),
  isDefault: Joi.boolean().optional(),
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

module.exports = { createTemplateSchema, updateTemplateSchema, validate };
