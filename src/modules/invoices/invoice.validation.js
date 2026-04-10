const Joi = require('joi');
const AppError = require('../../utils/AppError');

const createInvoiceSchema = Joi.object({
  companyCustomerId: Joi.string().uuid().required(),
  adUnitId: Joi.string().uuid().optional().allow(null),
  publicationIssueId: Joi.string().uuid().optional().allow(null),
  dueDate: Joi.date().iso().optional(),
  baseAmount: Joi.number().min(0).required(),
  taxAmount: Joi.number().min(0).default(0),
  asDraft: Joi.boolean().default(false), // if true, creates invoice with DRAFT status
});

const updateInvoiceStatusSchema = Joi.object({
  status: Joi.string().valid('DRAFT', 'OPEN', 'PAID', 'PARTIAL', 'OVERDUE', 'REFUNDED', 'WAIVED').required()
});

const recordPaymentSchema = Joi.object({
  amount: Joi.number().min(0.01).required(),
  paymentMethod: Joi.string().valid('STRIPE', 'BANK_TRANSFER', 'CREDIT_CARD', 'CHECK', 'CASH', 'OTHER').required(),
  paymentDate: Joi.date().iso().optional(),
  referenceNumber: Joi.string().optional().allow(null, ''),
  proofAssetUrl: Joi.string().uri().optional().allow(null, '')
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
  createInvoiceSchema,
  updateInvoiceStatusSchema,
  recordPaymentSchema,
  validate
};
