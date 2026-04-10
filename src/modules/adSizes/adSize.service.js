const prisma = require('../../config/database');

const getAll = async (companyId) => {
  return prisma.adSize.findMany({
    where: { companyId },
    orderBy: [
      { name: 'asc' }
    ]
  });
};

const getById = async (id, companyId) => {
  return prisma.adSize.findFirst({
    where: { id, companyId }
  });
};

const create = async (companyId, data) => {
  return prisma.adSize.create({
    data: {
      ...data,
      companyId
    }
  });
};

const update = async (id, companyId, data) => {
  const adSize = await getById(id, companyId);
  if (!adSize) throw { status: 404, message: 'Ad Size not found' };

  return prisma.adSize.update({
    where: { id },
    data
  });
};

const deleteSize = async (id, companyId) => {
  const adSize = await getById(id, companyId);
  if (!adSize) throw { status: 404, message: 'Ad Size not found' };

  return prisma.adSize.delete({
    where: { id }
  });
};

/**
 * Seeds default sizes for a company
 */
const seedDefaultSizes = async (companyId) => {
  const defaults = [
    { name: 'FULL_PAGE', widthBig: 210, heightBig: 297, widthSmall: 180, heightSmall: 250 },
    { name: 'HALF_PAGE', widthBig: 210, heightBig: 148, widthSmall: 180, heightSmall: 120 },
    { name: 'QUARTER_PAGE', widthBig: 105, heightBig: 148, widthSmall: 85, heightSmall: 120 },
    { name: 'ONE_EIGTH_PAGE', widthBig: 105, heightBig: 74, widthSmall: 85, heightSmall: 60 },
  ];

  const operations = defaults.map(d => 
    prisma.adSize.upsert({
      where: {
        companyId_name: {
          companyId,
          name: d.name
        }
      },
      update: {
        widthBig: d.widthBig,
        heightBig: d.heightBig,
        widthSmall: d.widthSmall,
        heightSmall: d.heightSmall
      },
      create: {
        ...d,
        companyId
      }
    })
  );

  return Promise.all(operations);
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteSize,
  seedDefaultSizes
};
