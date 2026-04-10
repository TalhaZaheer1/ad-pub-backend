const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');

const getAll = async (companyId, query = {}) => {
  const { isActive, leadStatus, tags, search } = query;
  const where = { companyId };

  if (isActive !== undefined) {
    where.isActive = isActive === 'true' || isActive === true;
  }
  if (leadStatus) {
    where.leadStatus = leadStatus;
  }
  if (tags) {
    const tagsArray = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    if (tagsArray.length > 0) {
      where.tags = { hasSome: tagsArray };
    }
  }
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { businessName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const customers = await prisma.companyCustomer.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      assignedRep: { select: { id: true, firstName: true, lastName: true } },
    }
  });

  const [totalActive, ltvAgg, topSpenders] = await Promise.all([
    prisma.companyCustomer.count({ where: { companyId, isActive: true } }),
    prisma.companyCustomer.aggregate({
      where: { companyId },
      _sum: { lifetimeValue: true }
    }),
    prisma.companyCustomer.count({
      where: { companyId, lifetimeValue: { gt: 1000 } }
    })
  ]);

  const totalLTV = ltvAgg._sum.lifetimeValue || 0;

  return {
    customers,
    metrics: {
      totalActive,
      totalLTV: Number(totalLTV),
      topSpenders
    }
  };
};

const getOne = async (companyId, id) => {
  const customer = await prisma.companyCustomer.findFirst({
    where: { id, companyId },
    include: {
      assignedRep: { select: { id: true, firstName: true, lastName: true } },
      adUnits: {
        orderBy: { createdAt: 'desc' },
        take: 10, // getting recent 10 ads for overview
      }
    }
  });

  if (!customer) throw new AppError('Customer not found', 404);
  return customer;
};

const create = async (companyId, data) => {
  if (data.email) {
    const existing = await prisma.companyCustomer.findFirst({
      where: { companyId, email: data.email }
    });
    if (existing) {
      throw new AppError(`A customer with email ${data.email} already exists.`, 409);
    }
  }

  return await prisma.companyCustomer.create({
    data: {
      ...data,
      companyId
    },
    include: { assignedRep: { select: { id: true, firstName: true, lastName: true } } }
  });
};

const update = async (companyId, id, data) => {
  const existing = await prisma.companyCustomer.findFirst({ where: { id, companyId } });
  if (!existing) throw new AppError('Customer not found', 404);

  if (data.email && data.email !== existing.email) {
    const emailConflict = await prisma.companyCustomer.findFirst({
      where: { companyId, email: data.email, NOT: { id } }
    });
    if (emailConflict) {
      throw new AppError(`A customer with email ${data.email} already exists.`, 409);
    }
  }

  return await prisma.companyCustomer.update({
    where: { id },
    data,
    include: { assignedRep: { select: { id: true, firstName: true, lastName: true } } }
  });
};

const remove = async (companyId, id) => {
  const existing = await prisma.companyCustomer.findFirst({ where: { id, companyId } });
  if (!existing) throw new AppError('Customer not found', 404);

  // Check if they have placed ads
  const adCount = await prisma.adUnit.count({ where: { companyId, customerId: id } });
  if (adCount > 0) {
    // Soft delete/deactivate instead
    return await prisma.companyCustomer.update({
      where: { id },
      data: { isActive: false, leadStatus: 'INACTIVE_CHURNED' }
    });
  }

  await prisma.companyCustomer.delete({ where: { id } });
  return { deleted: true };
};

const addActivity = async (companyId, customerId, userId, data) => {
  const existing = await prisma.companyCustomer.findFirst({ where: { id: customerId, companyId } });
  if (!existing) throw new AppError('Customer not found', 404);

  return await prisma.companyCustomerActivity.create({
    data: {
      companyCustomerId: customerId,
      userId,
      type: data.type,
      content: data.content
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } }
    }
  });
};

const getActivities = async (companyId, customerId) => {
  const existing = await prisma.companyCustomer.findFirst({ where: { id: customerId, companyId } });
  if (!existing) throw new AppError('Customer not found', 404);

  return await prisma.companyCustomerActivity.findMany({
    where: { companyCustomerId: customerId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } }
    }
  });
};

module.exports = {
  getAll,
  getOne,
  create,
  update,
  remove,
  addActivity,
  getActivities
};
