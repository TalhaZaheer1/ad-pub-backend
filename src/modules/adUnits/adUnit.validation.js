const Joi = require('joi');
const AppError = require('../../utils/AppError');

const createAdUnitSchema = Joi.object({
  customerId: Joi.string().uuid().optional().allow(null),
  publicationIssueId: Joi.string().uuid().required(),
  adTypeId: Joi.string().uuid().optional().allow(null, ''),
  templateId: Joi.string().uuid().optional().allow(null, ''),

  postingMethod: Joi.string().valid('CUSTOMER_UPLOAD', 'EMPLOYEE_UPLOAD').default('EMPLOYEE_UPLOAD'),
  status: Joi.string().valid('IN_REVIEW', 'APPROVED', 'REJECTED', 'READY', 'PRINTED', 'PUBLISHED', 'ARCHIVED').default('IN_REVIEW'),
  paymentStatus: Joi.string().valid('PENDING', 'PARTIAL', 'PAID', 'REFUNDED', 'WAIVED', 'NOT_REQUIRED').default('PENDING'),
  operationalTags: Joi.array().items(Joi.string().valid('PAID', 'FREE', 'FILLER', 'EXCHANGE')).default([]),

  adSizeName: Joi.string().required(),
  hasBigVariant: Joi.boolean().default(true),
  hasSmallVariant: Joi.boolean().default(false),
  area: Joi.string().valid('COVER_PAGE', 'INTERIOR_LEFT', 'INTERIOR_RIGHT', 'CLASSIFIED_SECTION', 'BACK_COVER').default('COVER_PAGE'),
  orientation: Joi.string().valid('PORTRAIT', 'LANDSCAPE').default('PORTRAIT'),
  colorProfile: Joi.string().valid('FULL_COLOR', 'GRAYSCALE', 'BLACK_WHITE').default('FULL_COLOR'),
  layoutVariant: Joi.string().valid('BIG', 'SMALL').optional().allow(null),
  priority: Joi.number().integer().default(0),
  deadline: Joi.date().iso().optional().allow(null),

  title: Joi.string().optional().allow(null, ''),
  bodyText: Joi.string().optional().allow(null, ''),
  specialInstructions: Joi.string().optional().allow(null, ''),

  discountAmount: Joi.number().min(0).default(0),
  finalPrice: Joi.number().min(0).required(),
  partialPaymentAmount: Joi.number().min(0).optional().allow(null),
});

const updateAdUnitSchema = Joi.object({
  customerId: Joi.string().uuid().optional().allow(null),
  publicationIssueId: Joi.string().uuid().optional(),
  adTypeId: Joi.string().uuid().optional().allow(null, ''),
  templateId: Joi.string().uuid().optional().allow(null, ''),

  postingMethod: Joi.string().valid('CUSTOMER_UPLOAD', 'EMPLOYEE_UPLOAD').optional(),
  status: Joi.string().valid('IN_REVIEW', 'APPROVED', 'REJECTED', 'READY', 'PRINTED', 'PUBLISHED', 'ARCHIVED').optional(),
  paymentStatus: Joi.string().valid('PENDING', 'PARTIAL', 'PAID', 'REFUNDED', 'WAIVED', 'NOT_REQUIRED').optional(),
  operationalTags: Joi.array().items(Joi.string().valid('PAID', 'FREE', 'FILLER', 'EXCHANGE')).optional(),

  adSizeName: Joi.string().optional(),
  hasBigVariant: Joi.boolean().optional(),
  hasSmallVariant: Joi.boolean().optional(),
  area: Joi.string().valid('COVER_PAGE', 'INTERIOR_LEFT', 'INTERIOR_RIGHT', 'CLASSIFIED_SECTION', 'BACK_COVER').optional(),
  orientation: Joi.string().valid('PORTRAIT', 'LANDSCAPE').optional(),
  colorProfile: Joi.string().valid('FULL_COLOR', 'GRAYSCALE', 'BLACK_WHITE').optional(),
  layoutVariant: Joi.string().valid('BIG', 'SMALL').optional().allow(null),
  priority: Joi.number().integer().optional(),
  deadline: Joi.date().iso().optional().allow(null),

  title: Joi.string().optional().allow(null, ''),
  bodyText: Joi.string().optional().allow(null, ''),
  specialInstructions: Joi.string().optional().allow(null, ''),

  discountAmount: Joi.number().min(0).optional(),
  finalPrice: Joi.number().min(0).optional(),
  partialPaymentAmount: Joi.number().min(0).optional().allow(null),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('IN_REVIEW', 'APPROVED', 'REJECTED', 'READY', 'PRINTED', 'PUBLISHED', 'ARCHIVED').required(),
});

const updateDesignStatusSchema = Joi.object({
  designStatus: Joi.string().valid('NOT_STARTED', 'QUEUED', 'IN_DESIGN', 'NEEDS_CONTENT', 'CONTENT_ADDED', 'NEEDS_REVIEW', 'APPROVED').required(),
});

const assignDesignerSchema = Joi.object({
  designedById: Joi.string().uuid().allow(null).required(),
});

const bulkAssignDesignerSchema = Joi.object({
  adUnitIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  designedById: Joi.string().uuid().allow(null).required(),
});

const bulkUpdateDesignStatusSchema = Joi.object({
  adUnitIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  designStatus: Joi.string().valid('NOT_STARTED', 'QUEUED', 'IN_DESIGN', 'NEEDS_CONTENT', 'CONTENT_ADDED', 'NEEDS_REVIEW', 'APPROVED').required(),
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

module.exports = {
  createAdUnitSchema,
  updateAdUnitSchema,
  updateStatusSchema,
  updateDesignStatusSchema,
  assignDesignerSchema,
  bulkAssignDesignerSchema,
  bulkUpdateDesignStatusSchema,
  validate,
};
