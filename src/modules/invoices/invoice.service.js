const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');

const getMetrics = async (companyId) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [billedThisMonth, totalCollected, outstanding, refunded] = await Promise.all([
    // Total billed this month (exclude DRAFT/WAIVED)
    prisma.invoice.aggregate({
      where: { companyId, createdAt: { gte: startOfMonth }, status: { notIn: ['DRAFT', 'WAIVED'] } },
      _sum: { totalAmount: true }
    }),
    // Total collected
    prisma.invoice.aggregate({
      where: { companyId, status: { not: 'DRAFT' } },
      _sum: { paidAmount: true }
    }),
    // Outstanding amount (exclude DRAFT)
    prisma.invoice.aggregate({
      where: { companyId, status: { in: ['OPEN', 'PARTIAL', 'OVERDUE'] } },
      _sum: { remainingBalance: true }
    }),
    // Refunded amount
    prisma.invoice.aggregate({
      where: { companyId, OR: [{ status: 'REFUNDED' }, { status: "WAIVED" }] },
      _sum: { totalAmount: true }
    })
  ]);

  return {
    billedThisMonth: Number(billedThisMonth._sum.totalAmount || 0),
    totalCollected: Number(totalCollected._sum.paidAmount || 0),
    outstandingLimit: Number(outstanding._sum.remainingBalance || 0),
    refundedAmount: Number(refunded._sum.totalAmount || 0)
  };
};

const getAll = async (companyId, query = {}) => {
  const { status, customerId, search } = query;
  const where = { companyId };

  if (status) where.status = status;
  if (customerId) where.companyCustomerId = customerId;

  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: 'insensitive' } },
      { customer: { firstName: { contains: search, mode: 'insensitive' } } },
      { customer: { lastName: { contains: search, mode: 'insensitive' } } },
      { customer: { businessName: { contains: search, mode: 'insensitive' } } }
    ];
  }

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, businessName: true, customerType: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      adUnit: { select: { id: true, status: true, adSizeName: true, colorProfile: true } }
    }
  });

  return invoices;
};

const getOne = async (companyId, id) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id, companyId },
    include: {
      customer: true,
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      adUnit: {
        include: {
          adType: true,
          template: true,
          publicationIssue: { include: { publicationType: true } }
        }
      },
      payments: {
        orderBy: { paymentDate: 'desc' },
        include: { recordedBy: { select: { id: true, firstName: true, lastName: true } } }
      }
    }
  });

  if (!invoice) throw new AppError('Invoice not found', 404);
  return invoice;
};

const create = async (companyId, userId, data) => {
  const { companyCustomerId, adUnitId, publicationIssueId, dueDate, baseAmount, taxAmount, asDraft } = data;

  const totalAmount = parseFloat(baseAmount) + parseFloat(taxAmount || 0);

  // Generate unique invoice number by locking/updating company sequence
  const company = await prisma.company.update({
    where: { id: companyId },
    data: { invoiceSeq: { increment: 1 } },
    select: { invoiceSeq: true }
  });

  const invoiceNumber = `INV-${String(company.invoiceSeq).padStart(4, '0')}`;
  const status = asDraft ? 'DRAFT' : 'OPEN';

  const invoice = await prisma.invoice.create({
    data: {
      companyId,
      companyCustomerId,
      adUnitId,
      publicationIssueId,
      createdById: userId,
      invoiceNumber,
      dueDate: dueDate ? new Date(dueDate) : null,
      baseAmount,
      taxAmount: taxAmount || 0,
      totalAmount,
      remainingBalance: totalAmount,
      paidAmount: 0,
      status
    },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, businessName: true } }
    }
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      companyId,
      userId,
      action: asDraft ? 'INVOICE_DRAFT_CREATED' : 'INVOICE_CREATED',
      entityType: 'Invoice',
      entityId: invoice.id,
      metadata: { invoiceNumber, totalAmount, status }
    }
  });

  return invoice;
};

/**
 * Internal helper: auto-create a DRAFT invoice when an AdUnit is created.
 * Called from adUnit.service — not exposed via REST directly.
 */
const createDraftForAdUnit = async (companyId, userId, { companyCustomerId, adUnitId, publicationIssueId, baseAmount, taxAmount }) => {
  return create(companyId, userId, {
    companyCustomerId,
    adUnitId,
    publicationIssueId,
    baseAmount,
    taxAmount: taxAmount || 0,
    asDraft: true
  });
};

const updateStatus = async (companyId, id, userId, status) => {
  const existing = await prisma.invoice.findFirst({ where: { id, companyId } });
  if (!existing) throw new AppError('Invoice not found', 404);

  let updateData = { status };
  if (status === 'REFUNDED') updateData.refundedAt = new Date();
  if (status === 'PAID') updateData.paidAt = new Date();

  // Transaction for updating invoice and potentially AdUnit
  const [updatedInvoice] = await prisma.$transaction([
    prisma.invoice.update({
      where: { id },
      data: updateData
    }),
    prisma.auditLog.create({
      data: {
        companyId,
        userId,
        action: 'INVOICE_STATUS_CHANGED',
        entityType: 'Invoice',
        entityId: id,
        metadata: { oldStatus: existing.status, newStatus: status }
      }
    }),
    ...(existing.adUnitId && (status === 'REFUNDED' || status === 'PAID') ? [
      prisma.adUnit.update({
        where: { id: existing.adUnitId },
        data: { paymentStatus: status }
      })
    ] : [])
  ]);

  return updatedInvoice;
};

const recordPayment = async (companyId, id, userId, data) => {
  const invoice = await prisma.invoice.findFirst({ where: { id, companyId } });
  if (!invoice) throw new AppError('Invoice not found', 404);

  const paymentAmount = parseFloat(data.amount);
  if (paymentAmount <= 0) throw new AppError('Payment amount must be greater than zero.', 400);

  const newPaidAmount = parseFloat(invoice.paidAmount) + paymentAmount;
  const newRemainingBalance = Math.max(0, parseFloat(invoice.totalAmount) - newPaidAmount);

  let newStatus = invoice.status;
  let paidAt = invoice.paidAt;

  if (newRemainingBalance === 0) {
    newStatus = 'PAID';
    paidAt = new Date();
  } else if (newPaidAmount > 0 && invoice.status !== 'PAID') {
    newStatus = 'PARTIAL';
  }

  const [payment, updatedInvoice] = await prisma.$transaction([
    prisma.invoicePayment.create({
      data: {
        invoiceId: id,
        amount: paymentAmount,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
        referenceNumber: data.referenceNumber,
        proofAssetUrl: data.proofAssetUrl,
        recordedById: userId,
        paymentRecordCreationMethod: data.paymentRecordCreationMethod || 'STAFF'
      }
    }),
    prisma.invoice.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        remainingBalance: newRemainingBalance,
        status: newStatus,
        paidAt
      }
    }),
    // Sync to associated AdUnit if present
    ...(invoice.adUnitId ? [
      prisma.adUnit.update({
        where: { id: invoice.adUnitId },
        data: { paymentStatus: newStatus } // e.g. PAID or PARTIAL
      })
    ] : []),
    prisma.auditLog.create({
      data: {
        companyId,
        userId,
        action: 'INVOICE_PAYMENT_RECORDED',
        entityType: 'Invoice',
        entityId: id,
        metadata: { amount: paymentAmount, method: data.paymentMethod }
      }
    })
  ]);

  return { payment, invoice: updatedInvoice };
};

module.exports = {
  getMetrics,
  getAll,
  getOne,
  create,
  createDraftForAdUnit,
  updateStatus,
  recordPayment
};
