const invoiceService = require('./invoice.service');
const { sendSuccess } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const getMetrics = asyncHandler(async (req, res) => {
  const metrics = await invoiceService.getMetrics(req.companyId);
  sendSuccess(res, { metrics }, 'Invoice metrics retrieved successfully.');
});

const getAll = asyncHandler(async (req, res) => {
  const invoices = await invoiceService.getAll(req.companyId, req.query);
  sendSuccess(res, { invoices }, 'Invoices retrieved successfully.');
});

const getOne = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.getOne(req.companyId, req.params.id);
  sendSuccess(res, { invoice }, 'Invoice retrieved successfully.');
});

const create = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.create(req.companyId, req.user.id, req.body);
  sendSuccess(res, { invoice }, 'Invoice created successfully.', 201);
});

const updateStatus = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.updateStatus(req.companyId, req.params.id, req.user.id, req.body.status);
  sendSuccess(res, { invoice }, 'Invoice status updated successfully.');
});

const recordPayment = asyncHandler(async (req, res) => {
  const result = await invoiceService.recordPayment(req.companyId, req.params.id, req.user.id, req.body);
  sendSuccess(res, result, 'Payment recorded successfully.', 201);
});

module.exports = {
  getMetrics,
  getAll,
  getOne,
  create,
  updateStatus,
  recordPayment
};
