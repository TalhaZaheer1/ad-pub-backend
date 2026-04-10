const adSizeService = require('./adSize.service');
const { sendSuccess } = require('../../utils/response');

const getAll = async (req, res, next) => {
  try {
    const adSizes = await adSizeService.getAll(req.companyId);
    sendSuccess(res, { adSizes });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const adSize = await adSizeService.create(req.companyId, req.body);
    sendSuccess(res, { adSize }, 'Ad Size created successfully');
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const adSize = await adSizeService.update(req.params.id, req.companyId, req.body);
    sendSuccess(res, { adSize }, 'Ad Size updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteSize = async (req, res, next) => {
  try {
    await adSizeService.deleteSize(req.params.id, req.companyId);
    sendSuccess(res, {}, 'Ad Size deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  create,
  update,
  deleteSize,
};
