const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');

const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * GET /ad-types
 * Supports filtering by isActive; includes templateCount and adCount.
 */
const getAll = async (companyId, { isActive } = {}) => {
  const where = { companyId };
  if (isActive !== undefined) {
    where.isActive = isActive === 'true' || isActive === true;
  }

  const adTypes = await prisma.adType.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      _count: {
        select: {
          ads: true,
          announcementTemplates: true,
        },
      },
    },
  });

  return adTypes.map(({ _count, ...at }) => ({
    ...at,
    adCount: _count.ads,
    templateCount: _count.announcementTemplates,
  }));
};

/**
 * GET /ad-types/:id
 */
const getOne = async (companyId, id) => {
  const adType = await prisma.adType.findFirst({
    where: { id, companyId },
    include: {
      _count: { select: { ads: true, announcementTemplates: true } },
      announcementTemplates: {
        where: { isActive: true },
        select: { id: true, name: true, isDefault: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!adType) throw new AppError('Ad type not found.', 404);

  const { _count, ...at } = adType;
  return { ...at, adCount: _count.ads, templateCount: _count.announcementTemplates };
};

/**
 * POST /ad-types
 */
const create = async (companyId, data) => {
  const { name, ...rest } = data;

  let slug = slugify(name);
  const existing = await prisma.adType.findFirst({ where: { companyId, slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  // Check for duplicate name within company
  const nameDupe = await prisma.adType.findFirst({ where: { companyId, name } });
  if (nameDupe) throw new AppError(`An ad type named "${name}" already exists.`, 409);

  return prisma.adType.create({
    data: { companyId, name, slug, ...rest },
  });
};

/**
 * PATCH /ad-types/:id
 */
const update = async (companyId, id, data) => {
  const adType = await prisma.adType.findFirst({ where: { id, companyId } });
  if (!adType) throw new AppError('Ad type not found.', 404);

  const { name, ...rest } = data;

  let slug;
  if (name && name !== adType.name) {
    // Check for duplicate name
    const nameDupe = await prisma.adType.findFirst({
      where: { companyId, name, id: { not: id } },
    });
    if (nameDupe) throw new AppError(`An ad type named "${name}" already exists.`, 409);

    slug = slugify(name);
    const slugDupe = await prisma.adType.findFirst({
      where: { companyId, slug, id: { not: id } },
    });
    if (slugDupe) slug = `${slug}-${Date.now()}`;
  }

  return prisma.adType.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(slug && { slug }),
      ...rest,
    },
  });
};

/**
 * DELETE /ad-types/:id
 * Soft-delete (deactivate) if ads are linked; hard-delete otherwise.
 */
const remove = async (companyId, id) => {
  const adType = await prisma.adType.findFirst({
    where: { id, companyId },
    include: { _count: { select: { ads: true } } },
  });
  if (!adType) throw new AppError('Ad type not found.', 404);

  if (adType._count.ads > 0) {
    // Soft delete: deactivate to preserve history
    await prisma.adType.update({ where: { id }, data: { isActive: false } });
    return { softDeleted: true, adCount: adType._count.ads };
  }

  await prisma.adType.delete({ where: { id } });
  return { softDeleted: false };
};

/**
 * PATCH /ad-types/:id/toggle-active
 */
const toggleActive = async (companyId, id) => {
  const adType = await prisma.adType.findFirst({ where: { id, companyId } });
  if (!adType) throw new AppError('Ad type not found.', 404);

  return prisma.adType.update({
    where: { id },
    data: { isActive: !adType.isActive },
  });
};

module.exports = { getAll, getOne, create, update, remove, toggleActive };
