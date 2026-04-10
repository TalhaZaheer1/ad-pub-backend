const Joi = require('joi');
const AppError = require('../../utils/AppError');

const CUSTOMER_TYPES = ['INDIVISUAL', 'BUSINESS', 'AGENCY', 'NON_PROFIT'];
const LEAD_STATUSES = ['COLD_LEAD', 'PROSPECT', 'ACTIVE', 'INACTIVE_CHURNED'];
const ACTIVITY_TYPES = ['NOTE', 'CALL', 'EMAIL', 'MEETING', 'SYSTEM_STATUS_CHANGE', 'ORDER_PLACED'];

const createCompanyCustomerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(100).required(),
  lastName: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().optional().allow(null, ''),
  phone: Joi.string().optional().allow(null, ''),
  businessName: Joi.string().optional().allow(null, ''),
  address: Joi.string().optional().allow(null, ''),
  customerType: Joi.string().valid(...CUSTOMER_TYPES).default('BUSINESS'),
  tags: Joi.array().items(Joi.string()).optional().default([]),
  leadStatus: Joi.string().valid(...LEAD_STATUSES).default('PROSPECT'),
  isActive: Joi.boolean().default(true),
  assignedRepId: Joi.string().uuid().optional().allow(null)
});

const updateCompanyCustomerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(100).optional(),
  lastName: Joi.string().trim().min(2).max(100).optional(),
  email: Joi.string().email().optional().allow(null, ''),
  phone: Joi.string().optional().allow(null, ''),
  businessName: Joi.string().optional().allow(null, ''),
  address: Joi.string().optional().allow(null, ''),
  customerType: Joi.string().valid(...CUSTOMER_TYPES).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  leadStatus: Joi.string().valid(...LEAD_STATUSES).optional(),
  isActive: Joi.boolean().optional(),
  assignedRepId: Joi.string().uuid().optional().allow(null)
}).min(1);

const addActivitySchema = Joi.object({
  type: Joi.string().valid(...ACTIVITY_TYPES).required(),
  content: Joi.string().trim().min(1).required()
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
  createCompanyCustomerSchema,
  updateCompanyCustomerSchema,
  addActivitySchema,
  validate
};
