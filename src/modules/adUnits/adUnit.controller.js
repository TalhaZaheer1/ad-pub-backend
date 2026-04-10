const adUnitService = require('./adUnit.service');
const { sendSuccess } = require('../../utils/response');
const prisma = require('../../config/database');

const getAll = async (req, res, next) => {
  try {
    const query = { ...req.query };
    if (query.assignedDesignerId === 'me') {
      query.assignedDesignerId = req.user.id;
    }
    const result = await adUnitService.getAll(req.companyId, query);
    sendSuccess(res, { ...result }, 'Ad units retrieved successfully.');
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const ad = await adUnitService.getOne(req.companyId, req.params.id);
    sendSuccess(res, { adUnit: ad }, 'Ad unit retrieved successfully.');
  } catch (err) { next(err); }
};

const getMetrics = async (req, res, next) => {
  try {
    const metrics = await adUnitService.getMetrics(req.companyId, req.query.publicationIssueId);
    sendSuccess(res, { metrics }, 'Metrics retrieved successfully.');
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (payload.adTypeId === '') payload.adTypeId = null;
    if (payload.templateId === '') payload.templateId = null;

    const ad = await adUnitService.create(req.companyId, req.user.id, payload);
    sendSuccess(res, { adUnit: ad }, 'Ad unit created successfully.', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (payload.adTypeId === '') payload.adTypeId = null;
    if (payload.templateId === '') payload.templateId = null;

    const ad = await adUnitService.update(req.companyId, req.params.id, req.user.id, req.user.role, payload);
    sendSuccess(res, { adUnit: ad }, 'Ad unit updated successfully.');
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const result = await adUnitService.updateStatus(req.companyId, req.params.id, req.user.id, status);
    sendSuccess(res, result, 'Status updated successfully.');
  } catch (err) { next(err); }
};

const updateDesignStatus = async (req, res, next) => {
  try {
    const { designStatus } = req.body;
    const ad = await adUnitService.updateDesignStatus(req.companyId, req.params.id, req.user.id, req.user.role, designStatus);
    sendSuccess(res, { adUnit: ad }, 'Design status updated successfully.');
  } catch (err) { next(err); }
};

const assignDesigner = async (req, res, next) => {
  try {
    const { designedById } = req.body;
    const ad = await adUnitService.assignDesigner(req.companyId, req.params.id, req.user.id, designedById);
    sendSuccess(res, { adUnit: ad }, 'Designer assigned successfully.');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await adUnitService.remove(req.companyId, req.params.id);
    sendSuccess(res, null, 'Ad unit deleted successfully.');
  } catch (err) { next(err); }
};

const bulkAssignDesigner = async (req, res, next) => {
  try {
    const { adUnitIds, designedById } = req.body;
    const result = await adUnitService.bulkAssignDesigner(req.companyId, req.user.id, adUnitIds, designedById);
    sendSuccess(res, { count: result.count }, 'Designers bulk assigned successfully.');
  } catch (err) { next(err); }
};

const bulkUpdateDesignStatus = async (req, res, next) => {
  try {
    const { adUnitIds, designStatus } = req.body;
    const result = await adUnitService.bulkUpdateDesignStatus(req.companyId, req.user.id, adUnitIds, designStatus);
    sendSuccess(res, { count: result.count }, 'Design statuses bulk updated successfully.');
  } catch (err) { next(err); }
};

const exportInDesignSnippet = async (req, res, next) => {
  try {
    const xml = await adUnitService.exportInDesignSnippet(req.companyId, req.query);
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename="indesign-snippets.xml"');
    return res.send(xml);
  } catch (err) { next(err); }
};

const uploadAssets = async (req, res, next) => {
  try {
    const assets = await adUnitService.uploadAssets(req.companyId, req.params.id, req.user.id, req.files, req.body.assetRole);
    sendSuccess(res, { assets }, 'Assets uploaded successfully.', 201);
  } catch (err) { next(err); }
};

const removeAsset = async (req, res, next) => {
  try {
    await adUnitService.removeAsset(req.companyId, req.params.id, req.user.id, req.params.assetId);
    sendSuccess(res, null, 'Asset deleted successfully.');
  } catch (err) { next(err); }
};

const exportGroupedPdf = async (req, res, next) => {
  try {
    const query = { companyId: req.companyId, ...req.query };
    
    // Handle specific IDs if provided
    if (query.adUnitIds) {
      const ids = Array.isArray(query.adUnitIds) ? query.adUnitIds : [query.adUnitIds];
      query.id = { in: ids };
      delete query.adUnitIds;
    }

    // V1 dummy implementation: return a JSON list of ad reference codes and their first source asset URL
    const ads = await prisma.adUnit.findMany({
      where: query,
      include: { assets: true }
    });
    const pdfs = ads.map(ad => ({
      id: ad.id,
      reference: ad.referenceCode,
      url: ad.assets.find(a => a.assetRole === 'SOURCE' || a.assetRole === 'FINAL_PDF')?.url || null
    }));
    sendSuccess(res, { pdfs }, 'Grouped PDFs mapped.');
  } catch (err) { next(err); }
};

module.exports = { 
  getAll, getOne, getMetrics, create, update, updateStatus, updateDesignStatus, assignDesigner, remove,
  bulkAssignDesigner, bulkUpdateDesignStatus, exportInDesignSnippet, exportGroupedPdf, uploadAssets, removeAsset
};
