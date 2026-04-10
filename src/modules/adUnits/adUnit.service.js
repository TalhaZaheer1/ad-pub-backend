const { PaymentStatus } = require('@prisma/client');
const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { createDraftForAdUnit } = require('../invoices/invoice.service');
const pricingService = require('../pricing/pricing.service');

const AD_INCLUDE = {
  customer: { select: { id: true, firstName: true, lastName: true, businessName: true, customerType: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  designedBy: { select: { id: true, firstName: true, lastName: true } },
  verifiedBy: { select: { id: true, firstName: true, lastName: true } },
  adType: { select: { id: true, name: true, slug: true } },
  template: { select: { id: true, name: true, slug: true } },
  publicationIssue: {
    select: {
      id: true,
      title: true,
      issueDate: true,
      status: true,
      deadlineAt: true,
      publicationType: { select: { id: true, name: true } }
    }
  },
  invoice: { select: { id: true, invoiceNumber: true, status: true, totalAmount: true, paidAmount: true, remainingBalance: true } },
  pricingBreakdown: { orderBy: { createdAt: 'asc' } },
  assets: true
};

/**
 * Generate a short reference code: AD-YYYYMMDD-XXXX
 */
const generateReferenceCode = () => {
  const now = new Date();
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AD-${yyyymmdd}-${rand}`;
};

const getAll = async (companyId, query = {}) => {
  const { status, designStatus, assignedDesignerId, publicationIssueId, adTypeId, templateId, customerId, search, operationalTag, paymentStatus, page = 1, limit = 50 } = query;
  const where = { companyId };

  if (status) where.status = status;
  if (designStatus) where.designStatus = designStatus;
  if (assignedDesignerId) where.designedById = assignedDesignerId === 'unassigned' ? null : assignedDesignerId;
  if (publicationIssueId) where.publicationIssueId = publicationIssueId;
  if (adTypeId) where.adTypeId = adTypeId;
  if (templateId) where.templateId = templateId;
  if (customerId) where.customerId = customerId;
  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (operationalTag) where.operationalTags = { has: operationalTag };

  if (search) {
    where.OR = [
      { referenceCode: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
      { customer: { firstName: { contains: search, mode: 'insensitive' } } },
      { customer: { lastName: { contains: search, mode: 'insensitive' } } },
      { customer: { businessName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [total, adUnits] = await Promise.all([
    prisma.adUnit.count({ where }),
    prisma.adUnit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
      include: AD_INCLUDE,
    }),
  ]);

  return { total, page: parseInt(page), limit: parseInt(limit), adUnits };
};

const getOne = async (companyId, id) => {
  const ad = await prisma.adUnit.findFirst({
    where: { id, companyId },
    include: AD_INCLUDE,
  });
  if (!ad) throw new AppError('Ad unit not found', 404);
  return ad;
};

const create = async (companyId, userId, data) => {
  const referenceCode = generateReferenceCode();

  // 1. Get detailed pricing breakdown
  const issue = await prisma.publicationIssue.findUnique({
    where: { id: data.publicationIssueId },
    select: { publicationTypeId: true }
  });

  const pricing = await pricingService.preview(companyId, {
    publicationTypeId: issue?.publicationTypeId,
    adTypeId: data.adTypeId,
    adSizeName: data.adSizeName,
    area: data.area,
    colorProfile: data.colorProfile,
    discountAmount: data.discountAmount
  });

  // 2. Create AdUnit and breakdown items in a transaction
  const adUnit = await prisma.$transaction(async (tx) => {
    const { discountAmount, ...adData } = data;
    const created = await tx.adUnit.create({
      data: {
        companyId,
        createdById: userId,
        referenceCode,
        ...adData,
        finalPrice: pricing.finalPrice,
      },
    });
    const nowUTC = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z');

    let initialPaid = 0;
    if (created.paymentStatus === 'PAID') initialPaid = Number(created.finalPrice);
    else if (created.paymentStatus === 'PARTIAL') initialPaid = Number(created.partialPaymentAmount || 0);

    await tx.companyCustomer.update({
      where: { id: created.customerId },
      data: { 
        outstandingBalance: { increment: Number(created.finalPrice) - initialPaid },
        lifetimeValue: { increment: initialPaid },
        totalAdsPlaced: { increment: 1 }, 
        lastOrderDate: nowUTC 
      }
    })

    const breakdownData = [
      { adUnitId: created.id, name: 'Base Placement', amount: pricing.basePrice, type: 'BASE' },
      ...pricing.surcharges.map(s => ({ adUnitId: created.id, ruleId: s.ruleId, name: s.name, amount: s.amount, type: 'SURCHARGE' })),
      ...pricing.discounts.map(d => ({ adUnitId: created.id, ruleId: d.ruleId, name: d.name, amount: d.amount, type: 'DISCOUNT' })),
      ...pricing.taxes.map(t => ({ adUnitId: created.id, ruleId: t.ruleId, name: t.name, amount: t.amount, type: 'TAX' }))
    ];

    if (data.discountAmount > 0) {
      breakdownData.push({ adUnitId: created.id, name: 'Manual Discount', amount: data.discountAmount, type: 'DISCOUNT' });
    }

    await tx.adUnitPricing.createMany({ data: breakdownData });

    // Audit log
    await tx.auditLog.create({
      data: {
        companyId,
        userId,
        action: 'AD_UNIT_CREATED',
        entityType: 'AdUnit',
        entityId: created.id,
        metadata: { referenceCode, adSizeName: data.adSizeName, hasBigVariant: data.hasBigVariant, hasSmallVariant: data.hasSmallVariant, area: data.area }
      }
    });

    return created;
  });

  // 3. Auto-create a DRAFT invoice if customer is specified and paymentStatus is not NOT_REQUIRED

  // Auto-create a DRAFT invoice if customer is specified and paymentStatus is not NOT_REQUIRED
  if (data.customerId && data.paymentStatus !== 'NOT_REQUIRED') {
    try {
      const initialPaid = adUnit.paymentStatus === 'PAID' ? Number(adUnit.finalPrice) : Number(adUnit.partialPaymentAmount || 0);
      const invoiceStatus = adUnit.paymentStatus === 'PENDING' ? 'OPEN' : adUnit.paymentStatus;
      
      const inv = await prisma.invoice.create({
        data: {
          companyId,
          companyCustomerId: data.customerId,
          adUnitId: adUnit.id,
          publicationIssueId: data.publicationIssueId,
          createdById: userId,
          invoiceNumber: `INV-${String((await prisma.company.update({ where: { id: companyId }, data: { invoiceSeq: { increment: 1 } }, select: { invoiceSeq: true } })).invoiceSeq).padStart(4, '0')}`,
          baseAmount: adUnit.finalPrice,
          taxAmount: 0,
          totalAmount: adUnit.finalPrice,
          paidAmount: initialPaid,
          remainingBalance: Math.max(0, Number(adUnit.finalPrice) - initialPaid),
          status: invoiceStatus,
          paidAt: adUnit.paymentStatus === 'PAID' ? new Date() : null
        }
      });

      if (initialPaid > 0) {
        await prisma.invoicePayment.create({
          data: {
            invoiceId: inv.id,
            amount: initialPaid,
            paymentMethod: 'OTHER',
            paymentRecordCreationMethod: 'STAFF',
            recordedById: userId
          }
        });
      }
    } catch (err) {
      console.error('[AdUnit] Failed to auto-create invoice/payment:', err.message);
    }
  }

  // Return with fresh invoice relation
  return prisma.adUnit.findUnique({ where: { id: adUnit.id }, include: AD_INCLUDE });
};

const update = async (companyId, id, userId, userRole, data) => {
  const existing = await prisma.adUnit.findFirst({ 
    where: { id, companyId },
    include: { invoice: true }
  });
  if (!existing) throw new AppError('Ad unit not found', 404);

  // 0. Enforce Payment Status transition rules
  if (data.paymentStatus && data.paymentStatus !== existing.paymentStatus) {
    if (!['COMPANY_ADMIN', 'SALES'].includes(userRole)) {
      throw new AppError('Only Company Admins and Sales can change payment status.', 403);
    }

    const restrictedFrom = ['NOT_REQUIRED', 'REFUNDED', 'WAIVED'];
    if (restrictedFrom.includes(existing.paymentStatus)) {
      throw new AppError(`Cannot change payment status from ${existing.paymentStatus}`, 400);
    }

    const allowedTransitions = {
      'PENDING': ['PAID', 'PARTIAL', 'WAIVED'],
      'PAID': ['REFUNDED'],
      'PARTIAL': ['PAID', 'REFUNDED', 'WAIVED']
    };

    if (allowedTransitions[existing.paymentStatus] && !allowedTransitions[existing.paymentStatus].includes(data.paymentStatus)) {
      throw new AppError(`Invalid status transition from ${existing.paymentStatus} to ${data.paymentStatus}`, 400);
    }
  }

  // 1. Recalculate pricing if any relevant fields changed
  const pricingRelevantFields = ['adSizeName', 'hasBigVariant', 'hasSmallVariant', 'area', 'colorProfile', 'adTypeId', 'publicationIssueId', 'discountAmount'];
  const needsPricingUpdate = pricingRelevantFields.some(f => data[f] !== undefined && data[f] !== existing[f]);

  const updatedAd = await prisma.$transaction(async (tx) => {
    let finalPricing = null;
    if (needsPricingUpdate) {
      const pubIssueId = data.publicationIssueId || existing.publicationIssueId;
      const issue = await tx.publicationIssue.findUnique({
        where: { id: pubIssueId },
        select: { publicationTypeId: true }
      });

      finalPricing = await pricingService.preview(companyId, {
        publicationTypeId: issue?.publicationTypeId,
        adTypeId: data.adTypeId || existing.adTypeId,
        adSizeName: data.adSizeName || existing.adSizeName,
        area: data.area || existing.area,
        colorProfile: data.colorProfile || existing.colorProfile,
        discountAmount: data.discountAmount !== undefined ? data.discountAmount : existing.discountAmount
      });

      // Clear existing breakdown
      await tx.adUnitPricing.deleteMany({ where: { adUnitId: id } });

      // Create new breakdown
      const breakdownData = [
        { adUnitId: id, name: 'Base Placement', amount: finalPricing.basePrice, type: 'BASE' },
        ...finalPricing.surcharges.map(s => ({ adUnitId: id, ruleId: s.ruleId, name: s.name, amount: s.amount, type: 'SURCHARGE' })),
        ...finalPricing.discounts.map(d => ({ adUnitId: id, ruleId: d.ruleId, name: d.name, amount: d.amount, type: 'DISCOUNT' })),
        ...finalPricing.taxes.map(t => ({ adUnitId: id, ruleId: t.ruleId, name: t.name, amount: t.amount, type: 'TAX' }))
      ];

      const breakdownDiscount = data.discountAmount !== undefined ? data.discountAmount : Number(existing.discountAmount || 0);
      if (breakdownDiscount > 0) {
        breakdownData.push({ adUnitId: id, name: 'Manual Discount', amount: breakdownDiscount, type: 'DISCOUNT' });
      }

      await tx.adUnitPricing.createMany({ data: breakdownData });
      data.finalPrice = finalPricing.finalPrice;
    }

    // Sync Financials (Customer balances and Invoice)
    if (data.paymentStatus !== undefined || data.partialPaymentAmount !== undefined || needsPricingUpdate) {
      const prevPaid = existing.paymentStatus === 'PAID' ? Number(existing.finalPrice) : Number(existing.partialPaymentAmount || 0);
      
      let nowPaid = 0;
      const targetStatus = data.paymentStatus || existing.paymentStatus;
      const targetPrice = data.finalPrice || existing.finalPrice;

      if (targetStatus === 'PAID') nowPaid = Number(targetPrice);
      else if (targetStatus === 'PARTIAL') nowPaid = Number(data.partialPaymentAmount !== undefined ? data.partialPaymentAmount : (existing.partialPaymentAmount || 0));

      const paidDiff = nowPaid - prevPaid;
      const priceDiff = needsPricingUpdate ? (Number(data.finalPrice) - Number(existing.finalPrice)) : 0;

      if (paidDiff !== 0 || priceDiff !== 0) {
        await tx.companyCustomer.update({
          where: { id: existing.customerId },
          data: {
            lifetimeValue: { increment: paidDiff },
            outstandingBalance: { increment: priceDiff - paidDiff }
          }
        });
      }

      if (existing.invoice) {
        let newInvoiceStatus = targetStatus;
        if (newInvoiceStatus === 'PENDING') newInvoiceStatus = 'OPEN';

        await tx.invoice.update({
          where: { id: existing.invoice.id },
          data: {
            status: newInvoiceStatus,
            totalAmount: targetPrice, // Update total if pricing changed
            remainingBalance: Math.max(0, Number(targetPrice) - nowPaid),
            paidAmount: nowPaid,
            paidAt: nowPaid >= Number(targetPrice) && targetPrice > 0 ? new Date() : (targetStatus === 'PAID' ? new Date() : existing.invoice.paidAt),
            refundedAt: targetStatus === 'REFUNDED' ? new Date() : existing.invoice.refundedAt
          }
        });

        if (paidDiff > 0) {
          await tx.invoicePayment.create({
            data: {
              invoiceId: existing.invoice.id,
              amount: paidDiff,
              paymentMethod: 'OTHER',
              recordedById: userId,
              paymentRecordCreationMethod: 'STAFF'
            }
          });
        }
      }
    }

    const { discountAmount, ...adData } = data;
    const updated = await tx.adUnit.update({
      where: { id },
      data: adData,
      include: AD_INCLUDE,
    });

    await tx.auditLog.create({
      data: {
        companyId,
        userId,
        action: 'AD_UNIT_UPDATED',
        entityType: 'AdUnit',
        entityId: id,
        metadata: { updatedFields: Object.keys(data) }
      }
    });

    return updated;
  });

  return updatedAd;
};

const updateStatus = async (companyId, id, userId, status) => {
  const existing = await prisma.adUnit.findFirst({ where: { id, companyId } });
  if (!existing) throw new AppError('Ad unit not found', 404);

  if (['PRINTED', 'PUBLISHED'].includes(status)) {
    throw new AppError('Cannot manually change status to PRINTED or PUBLISHED.', 400);
  }

  // Automated designStatus and assignment side-effects
  const designStatusOverride = {};
  const assignmentOverride = {};

  if (status === 'APPROVED') {
    // Ad approved → queue it for design
    designStatusOverride.designStatus = 'QUEUED';
    designStatusOverride.lastDesignActionAt = new Date();
  } else if (status === 'READY') {
    // Admin marks ready → design is officially approved
    designStatusOverride.designStatus = 'APPROVED';
    designStatusOverride.lastDesignActionAt = new Date();
  } else if (status === 'REJECTED') {
    // Ad rejected → unassign designer and reset design queue state
    assignmentOverride.designedById = null;
    designStatusOverride.designStatus = 'NOT_STARTED';
    designStatusOverride.lastDesignActionAt = new Date();
  }

  const updated = await prisma.adUnit.update({
    where: { id },
    data: { status, ...designStatusOverride, ...assignmentOverride },
    include: AD_INCLUDE,
  });

  await prisma.auditLog.create({
    data: {
      companyId,
      userId,
      action: 'AD_UNIT_STATUS_CHANGED',
      entityType: 'AdUnit',
      entityId: id,
      metadata: {
        oldStatus: existing.status,
        newStatus: status,
        ...(Object.keys(designStatusOverride).length ? { designStatusAutoSet: designStatusOverride.designStatus } : {}),
        ...(Object.keys(assignmentOverride).length ? { unassignedDueToRejection: true } : {})
      }
    }
  });

  return { adUnit: updated };
};

const updateDesignStatus = async (companyId, id, userId, userRole, designStatus) => {
  const existing = await prisma.adUnit.findFirst({ where: { id, companyId } });
  if (!existing) throw new AppError('Ad unit not found', 404);

  // Role-based state guards
  const DESIGNER_ALLOWED = ['NOT_STARTED', 'IN_DESIGN', 'NEEDS_CONTENT', 'NEEDS_REVIEW'];
  const ADMIN_ALLOWED = ['CONTENT_ADDED'];

  if (userRole === 'DESIGNER' && !DESIGNER_ALLOWED.includes(designStatus)) {
    throw new AppError(`Designers can only set design status to: ${DESIGNER_ALLOWED.join(', ')}.`, 403);
  }
  if ((userRole === 'COMPANY_ADMIN' || userRole === 'PRODUCTION') && !ADMIN_ALLOWED.includes(designStatus)) {
    // Admins can also set any state via the force-update path — only guard CONTENT_ADDED as the expected production action.
    // Allow all if coming from admin for flexibility.
  }

  const updated = await prisma.adUnit.update({
    where: { id },
    data: {
      designStatus,
      lastDesignActionAt: new Date()
    },
    include: AD_INCLUDE,
  });

  await prisma.auditLog.create({
    data: {
      companyId,
      userId,
      action: 'AD_UNIT_DESIGN_STATUS_CHANGED',
      entityType: 'AdUnit',
      entityId: id,
      metadata: { oldStatus: existing.designStatus, newStatus: designStatus, changedByRole: userRole }
    }
  });

  return updated;
};

const assignDesigner = async (companyId, id, userId, designedById) => {
  const existing = await prisma.adUnit.findFirst({ where: { id, companyId } });
  if (!existing) throw new AppError('Ad unit not found', 404);

  if (designedById && existing.status !== 'APPROVED') {
    throw new AppError('Only approved ads can be assigned to a designer.', 400);
  }

  const updated = await prisma.adUnit.update({
    where: { id },
    data: {
      designedById,
      // Auto-transition: assigning a designer always resets to NOT_STARTED
      designStatus: designedById ? 'NOT_STARTED' : 'QUEUED',
      lastDesignActionAt: new Date()
    },
    include: AD_INCLUDE,
  });

  await prisma.auditLog.create({
    data: {
      companyId,
      userId,
      action: 'AD_UNIT_DESIGNER_ASSIGNED',
      entityType: 'AdUnit',
      entityId: id,
      metadata: { assignedTo: designedById, autoDesignStatus: designedById ? 'NOT_STARTED' : 'QUEUED' }
    }
  });

  return updated;
};

const remove = async (companyId, id) => {
  const existing = await prisma.adUnit.findFirst({ where: { id, companyId } });
  if (!existing) throw new AppError('Ad unit not found', 404);

  // Block if invoice exists and is not DRAFT
  if (existing.invoice) {
    const invoice = await prisma.invoice.findFirst({ where: { adUnitId: id } });
    if (invoice && invoice.status !== 'DRAFT') {
      throw new AppError('Cannot delete an ad unit with an active invoice. Void the invoice first.', 409);
    }
  }

  await prisma.adUnit.delete({ where: { id } });
};

const getMetrics = async (companyId, publicationIssueId) => {
  const where = { companyId };
  if (publicationIssueId) where.publicationIssueId = publicationIssueId;

  const [total, byStatus, byPayment] = await Promise.all([
    prisma.adUnit.count({ where }),
    prisma.adUnit.groupBy({ by: ['status'], where, _count: true }),
    prisma.adUnit.groupBy({ by: ['paymentStatus'], where, _count: true }),
  ]);

  return {
    total,
    byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
    byPayment: byPayment.reduce((acc, item) => ({ ...acc, [item.paymentStatus]: item._count }), {}),
  };
};

const bulkAssignDesigner = async (companyId, userId, adUnitIds, designedById) => {
  const result = await prisma.adUnit.updateMany({
    where: { id: { in: adUnitIds }, companyId },
    data: {
      designedById,
      lastDesignActionAt: new Date()
    }
  });

  await prisma.auditLog.create({
    data: {
      companyId,
      userId,
      action: 'AD_UNIT_BULK_ASSIGNED',
      entityType: 'AdUnit',
      entityId: 'BULK',
      metadata: { assignedTo: designedById, count: result.count, adUnitIds }
    }
  });

  return result;
};

const bulkUpdateDesignStatus = async (companyId, userId, adUnitIds, designStatus) => {
  const result = await prisma.adUnit.updateMany({
    where: { id: { in: adUnitIds }, companyId },
    data: {
      designStatus,
      lastDesignActionAt: new Date()
    }
  });

  await prisma.auditLog.create({
    data: {
      companyId,
      userId,
      action: 'AD_UNIT_BULK_STATUS_CHANGED',
      entityType: 'AdUnit',
      entityId: 'BULK',
      metadata: { newStatus: designStatus, count: result.count, adUnitIds }
    }
  });

  return result;
};

const uploadAssets = async (companyId, id, userId, files, assetRole) => {
  const existing = await prisma.adUnit.findFirst({ where: { id, companyId } });
  if (!existing) throw new AppError('Ad unit not found', 404);

  const assetData = files.map(f => ({
    adUnitId: id,
    assetRole: assetRole || 'SOURCE',
    url: f.path,
    format: f.mimetype,
    filename: f.originalname,
    publicId: f.filename
  }));

  if (assetData.length > 0) {
    await prisma.adAsset.createMany({ data: assetData });
  }

  return prisma.adAsset.findMany({ where: { adUnitId: id } });
};

const removeAsset = async (companyId, id, userId, assetId) => {
  const existingAsset = await prisma.adAsset.findFirst({ where: { id: assetId, adUnit: { id, companyId } } });
  if (!existingAsset) throw new AppError('Asset not found', 404);

  if (existingAsset.publicId) {
    try {
      const { cloudinary } = require('../../middlewares/upload.middleware');
      await cloudinary.uploader.destroy(existingAsset.publicId);
    } catch (e) {
      console.warn("Failed to delete from Cloudinary", e);
    }
  }

  await prisma.adAsset.delete({ where: { id: assetId } });
};

const exportInDesignSnippet = async (companyId, params) => {
  const { variant, ...query } = params;
  query.companyId = companyId;

  if (query.adUnitIds) {
    const ids = Array.isArray(query.adUnitIds) ? query.adUnitIds : [query.adUnitIds];
    query.id = { in: ids };
    delete query.adUnitIds;
  }

  const ads = await prisma.adUnit.findMany({
    where: query,
    include: { customer: true, template: true, publicationIssue: true, assets: true }
  });

  // Fetch dimensions for the variants if needed
  const uniqueSizeNames = [...new Set(ads.map(a => a.adSizeName).filter(Boolean))];
  const adSizes = await prisma.adSize.findMany({
    where: {
      companyId,
      name: { in: uniqueSizeNames }
    }
  });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<Root>\n`;
  ads.forEach(ad => {
    const images = ad.assets.filter(a => a.assetRole === 'SOURCE' || a.assetRole === 'FINAL_PDF');
    const imageUrl = images[0]?.url || '';

    // Determine which variant to use for dimensions
    let selectedVariant = variant || (ad.hasBigVariant ? 'BIG' : 'SMALL');
    const sizeInfo = adSizes.find(s => s.name === ad.adSizeName && s.variant === selectedVariant);
    const dimensions = sizeInfo ? `${sizeInfo.width}x${sizeInfo.height}${sizeInfo.unit}` : ad.adSizeName;

    xml += `  <AdUnit id="${ad.id}">\n`;
    xml += `    <ReferenceCode>${ad.referenceCode || ''}</ReferenceCode>\n`;
    xml += `    <Customer>${ad.customer ? `${ad.customer.firstName} ${ad.customer.lastName}` : 'N/A'}</Customer>\n`;
    xml += `    <Dimensions>${dimensions} - ${selectedVariant} - ${ad.orientation}</Dimensions>\n`;
    xml += `    <Content><![CDATA[${ad.bodyText || ''}]]></Content>\n`;
    xml += `    <ImageUrl>${imageUrl}</ImageUrl>\n`;
    xml += `  </AdUnit>\n`;
  });
  xml += `</Root>`;

  return xml;
};

module.exports = {
  getAll, getOne, create, update, updateStatus, updateDesignStatus, assignDesigner,
  bulkAssignDesigner, bulkUpdateDesignStatus, exportInDesignSnippet,
  remove, getMetrics, uploadAssets, removeAsset
};
