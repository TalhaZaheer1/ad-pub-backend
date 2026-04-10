const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');

/**
 * Auto-generate a URL-safe slug from a name string.
 */
const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * If a template is being set as default, unset all other defaults
 * for the same adTypeId within this company (or global defaults if no adTypeId).
 */
const unsetOtherDefaults = async (companyId, adTypeId, excludeId = null) => {
  const where = { companyId, isDefault: true };
  if (adTypeId) {
    where.adTypeId = adTypeId;
  } else {
    where.adTypeId = null;
  }
  if (excludeId) {
    where.id = { not: excludeId };
  }
  await prisma.announcementTemplate.updateMany({ where, data: { isDefault: false } });
};

/**
 * GET /announcement-templates
 * Supports: adTypeId, isActive, isDefault, search (name/content)
 */
const getAll = async (companyId, filters = {}) => {
  const { adTypeId, isActive, isDefault, search } = filters;

  const where = { companyId };

  if (adTypeId) where.adTypeId = adTypeId;
  if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;
  if (isDefault !== undefined) where.isDefault = isDefault === 'true' || isDefault === true;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { templateContent: { contains: search, mode: 'insensitive' } },
    ];
  }

  const templates = await prisma.announcementTemplate.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: {
      adType: { select: { id: true, name: true } },
      _count: { select: { ads: true } },
    },
  });

  return templates.map(({ _count, ...t }) => ({ ...t, usageCount: _count.ads }));
};

/**
 * GET /announcement-templates/:id
 */
const getOne = async (companyId, id) => {
  const template = await prisma.announcementTemplate.findFirst({
    where: { id, companyId },
    include: {
      adType: { select: { id: true, name: true } },
      _count: { select: { ads: true } },
    },
  });

  if (!template) throw new AppError('Template not found.', 404);

  const { _count, ...t } = template;
  return { ...t, usageCount: _count.ads };
};

/**
 * POST /announcement-templates
 */
const create = async (companyId, data) => {
  const { 
    name, 
    isDefault, 
    adTypeId, 
    description, 
    language, 
    subjectLine, 
    templateContent, 
    isActive, 
    sortOrder 
  } = data;

  // Ensure slug is unique within company
  let slug = slugify(name);
  const existing = await prisma.announcementTemplate.findFirst({ where: { companyId, slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  // Handle default unset
  if (isDefault) {
    await unsetOtherDefaults(companyId, adTypeId || null);
  }

  return prisma.announcementTemplate.create({
    data: { 
      companyId, 
      name, 
      slug, 
      isDefault: !!isDefault, 
      adTypeId: adTypeId || null,
      description,
      language,
      subjectLine,
      templateContent,
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
    },
    include: { adType: { select: { id: true, name: true } } },
  });
};

/**
 * PATCH /announcement-templates/:id
 */
const update = async (companyId, id, data) => {
  const template = await prisma.announcementTemplate.findFirst({ where: { id, companyId } });
  if (!template) throw new AppError('Template not found.', 404);

  const { 
    name, 
    isDefault, 
    adTypeId, 
    description, 
    language, 
    subjectLine, 
    templateContent, 
    isActive, 
    sortOrder 
  } = data;

  // Re-generate slug if name changed
  let slug;
  if (name && name !== template.name) {
    slug = slugify(name);
    const clash = await prisma.announcementTemplate.findFirst({
      where: { companyId, slug, id: { not: id } },
    });
    if (clash) slug = `${slug}-${Date.now()}`;
  }

  // Handle default unset
  const effectiveAdTypeId = adTypeId !== undefined ? (adTypeId || null) : template.adTypeId;
  if (isDefault === true) {
    await unsetOtherDefaults(companyId, effectiveAdTypeId, id);
  }

  return prisma.announcementTemplate.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(slug && { slug }),
      ...(isDefault !== undefined && { isDefault }),
      ...(adTypeId !== undefined && { adTypeId: adTypeId || null }),
      ...(description !== undefined && { description }),
      ...(language !== undefined && { language }),
      ...(subjectLine !== undefined && { subjectLine }),
      ...(templateContent !== undefined && { templateContent }),
      ...(isActive !== undefined && { isActive }),
      ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
    },
    include: { adType: { select: { id: true, name: true } } },
  });
};

/**
 * DELETE /announcement-templates/:id
 * Always soft-deletes (sets isActive: false).
 */
const remove = async (companyId, id) => {
  const template = await prisma.announcementTemplate.findFirst({ where: { id, companyId } });
  if (!template) throw new AppError('Template not found.', 404);

  return prisma.announcementTemplate.update({
    where: { id },
    data: { isActive: false },
  });
};

/**
 * PATCH /announcement-templates/:id/toggle-active
 */
const toggleActive = async (companyId, id) => {
  const template = await prisma.announcementTemplate.findFirst({ where: { id, companyId } });
  if (!template) throw new AppError('Template not found.', 404);

  return prisma.announcementTemplate.update({
    where: { id },
    data: { isActive: !template.isActive },
  });
};

/**
 * POST /announcement-templates/:id/duplicate
 */
const duplicate = async (companyId, id) => {
  const source = await prisma.announcementTemplate.findFirst({ where: { id, companyId } });
  if (!source) throw new AppError('Template not found.', 404);

  const newName = `Copy of ${source.name}`;
  let slug = slugify(newName);
  const existing = await prisma.announcementTemplate.findFirst({ where: { companyId, slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  return prisma.announcementTemplate.create({
    data: {
      companyId,
      adTypeId: source.adTypeId,
      name: newName,
      slug,
      description: source.description,
      language: source.language,
      subjectLine: source.subjectLine,
      templateContent: source.templateContent,
      isActive: true,
      isDefault: false, // copies are never default
      sortOrder: source.sortOrder,
    },
    include: { adType: { select: { id: true, name: true } } },
  });
};

module.exports = { getAll, getOne, create, update, remove, toggleActive, duplicate };
