const companyCustomerService = require('./companyCustomer.service');
const { sendSuccess } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
  const { customers, metrics } = await companyCustomerService.getAll(req.companyId, req.query);
  sendSuccess(res, { customers, metrics }, 'Customers retrieved successfully.');
});

const getOne = asyncHandler(async (req, res) => {
  const customer = await companyCustomerService.getOne(req.companyId, req.params.id);
  sendSuccess(res, { customer }, 'Customer retrieved successfully.');
});

const create = asyncHandler(async (req, res) => {
  const customer = await companyCustomerService.create(req.companyId, req.body);
  sendSuccess(res, { customer }, 'Customer created successfully.', 201);
});

const update = asyncHandler(async (req, res) => {
  const customer = await companyCustomerService.update(req.companyId, req.params.id, req.body);
  sendSuccess(res, { customer }, 'Customer updated successfully.');
});

const remove = asyncHandler(async (req, res) => {
  const result = await companyCustomerService.remove(req.companyId, req.params.id);
  const msg = result.deleted ? 'Customer deleted successfully.' : 'Customer deactivated (has existing ad orders).';
  sendSuccess(res, result, msg);
});

const addActivity = asyncHandler(async (req, res) => {
  const activity = await companyCustomerService.addActivity(req.companyId, req.params.id, req.user.id, req.body);
  sendSuccess(res, { activity }, 'Activity logged successfully.', 201);
});

const getActivities = asyncHandler(async (req, res) => {
  const activities = await companyCustomerService.getActivities(req.companyId, req.params.id);
  sendSuccess(res, { activities }, 'Activities retrieved successfully.');
});

module.exports = {
  getAll,
  getOne,
  create,
  update,
  remove,
  addActivity,
  getActivities
};
