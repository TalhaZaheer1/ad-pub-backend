const Joi = require('joi');
const AppError = require('../../utils/AppError');

// Valid frequencies from Prisma enum
const FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SPECIAL'];

// Days of week for defaultPublishDay
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── Create PublicationType ─────────────────────────────────
const createPublicationTypeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters.',
    'string.max': 'Name must be at most 100 characters.',
    'any.required': 'Name is required.',
  }),
  frequency: Joi.string()
    .valid(...FREQUENCIES)
    .default('WEEKLY')
    .messages({
      'any.only': `Frequency must be one of: ${FREQUENCIES.join(', ')}.`,
    }),
  defaultPublishDay: Joi.string()
    .valid(...DAYS_OF_WEEK)
    .optional()
    .allow(null, '')
    .messages({
      'any.only': `Default publish day must be one of: ${DAYS_OF_WEEK.join(', ')}.`,
    }),
  defaultPublishDate: Joi.number().integer().min(1).max(31).optional().allow(null),
  specialPublicationDate: Joi.when('frequency', {
    is: 'SPECIAL',
    then: Joi.date().iso().required().messages({
      'any.required': 'Special publication date is required for SPECIAL frequency.',
      'date.format': 'Special publication date must be a valid ISO date.',
    }),
    otherwise: Joi.date().iso().optional().allow(null, ''),
  }),
  isActive: Joi.boolean().default(false),
});

// ── Update PublicationType ─────────────────────────────────
const updatePublicationTypeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional().messages({
    'string.min': 'Name must be at least 2 characters.',
    'string.max': 'Name must be at most 100 characters.',
  }),
  frequency: Joi.string()
    .valid(...FREQUENCIES)
    .optional()
    .messages({
      'any.only': `Frequency must be one of: ${FREQUENCIES.join(', ')}.`,
    }),
  defaultPublishDay: Joi.string()
    .valid(...DAYS_OF_WEEK)
    .optional()
    .allow(null, '')
    .messages({
      'any.only': `Default publish day must be one of: ${DAYS_OF_WEEK.join(', ')}.`,
    }),
  defaultPublishDate: Joi.number().integer().min(1).max(31).optional().allow(null),
  specialPublicationDate: Joi.when('frequency', {
    is: 'SPECIAL',
    then: Joi.date().iso().required().messages({
      'any.required': 'Special publication date is required for SPECIAL frequency.',
      'date.format': 'Special publication date must be a valid ISO date.',
    }),
    otherwise: Joi.date().iso().optional().allow(null, ''),
  }),
  isActive: Joi.boolean().optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

/**
 * Validate request body against a Joi schema.
 */
const validate = (schema) => (req, res, next) => {
  console.log({ body: req.body })
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

  if (error) {
    const message = error.details.map((d) => d.message).join('; ');
    return next(new AppError(message, 400));
  }

  req.body = value;
  next();
};

module.exports = {
  createPublicationTypeSchema,
  updatePublicationTypeSchema,
  validate,
};
