const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { PublicationFrequency } = require('@prisma/client');
const { scheduleIssues } = require('./publicationScheduler.service');

/**
 * List all publication types for a company.
 * Optionally filter by isActive.
 */
const getAll = async (companyId, { isActive } = {}) => {
  const where = { companyId };

  if (isActive !== undefined) {
    where.isActive = isActive === 'true' || isActive === true;
  }

  const publicationTypes = await prisma.publicationType.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      companyId: true,
      name: true,
      frequency: true,
      defaultPublishDay: true,
      defaultPublishDate: true,
      specialPublicationDate: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: { publicationIssues: true },
      },
    },
  });

  // Flatten _count for cleaner response
  return publicationTypes.map(({ _count, ...pt }) => ({
    ...pt,
    issueCount: _count.publicationIssues,
  }));
};

/**
 * Get a single publication type by ID — scoped to company.
 */
const getOne = async (companyId, id) => {
  const pt = await prisma.publicationType.findFirst({
    where: { id, companyId },
    select: {
      id: true,
      companyId: true,
      name: true,
      frequency: true,
      defaultPublishDay: true,
      defaultPublishDate: true,
      specialPublicationDate: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: { publicationIssues: true },
      },
    },
  });

  if (!pt) throw new AppError('Publication type not found.', 404);

  const { _count, ...rest } = pt;
  return { ...rest, issueCount: _count.publicationIssues };
};

/**
 * Create a new publication type for a company.
 */
const create = async (companyId, data) => {
  const { name, frequency, defaultPublishDay, isActive } = data;

  // Ensure uniqueness of name within the company
  const existing = await prisma.publicationType.findFirst({
    where: { companyId, name: { equals: name, mode: 'insensitive' } },
  });
  if (existing) {
    throw new AppError(`A publication type named "${name}" already exists.`, 409);
  }

  const pt = await prisma.publicationType.create({
    data: {
      companyId,
      name,
      frequency: frequency ?? PublicationFrequency.WEEKLY,
      defaultPublishDay: defaultPublishDay || null,
      defaultPublishDate: data.defaultPublishDate || null,
      specialPublicationDate: data.specialPublicationDate ? new Date(data.specialPublicationDate) : null,
      isActive: isActive ?? false,
    },
    select: {
      id: true,
      companyId: true,
      name: true,
      frequency: true,
      defaultPublishDay: true,
      defaultPublishDate: true,
      specialPublicationDate: true,
      isActive: true,
      createdAt: true,
    },
  });

  // Schedule future issues in background without awaiting or blocking the response
  scheduleIssues(companyId, pt.id).catch(err => console.error('Error scheduling issues:', err));

  return pt;
};

/**
 * Update a publication type — scoped to company.
 */
const update = async (companyId, id, data) => {
  // Confirm it exists and belongs to this company
  const existing = await prisma.publicationType.findFirst({ where: { id, companyId } });
  if (!existing) throw new AppError('Publication type not found.', 404);

  // If renaming, ensure the new name doesn't clash
  if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) {
    const clash = await prisma.publicationType.findFirst({
      where: { companyId, name: { equals: data.name, mode: 'insensitive' }, NOT: { id } },
    });
    if (clash) throw new AppError(`A publication type named "${data.name}" already exists.`, 409);
  }

  const updated = await prisma.publicationType.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.frequency !== undefined && { frequency: data.frequency }),
      ...(data.defaultPublishDay !== undefined && {
        defaultPublishDay: data.defaultPublishDay || null,
      }),
      ...(data.defaultPublishDate !== undefined && {
        defaultPublishDate: data.defaultPublishDate || null,
      }),
      ...(data.specialPublicationDate !== undefined && {
        specialPublicationDate: data.specialPublicationDate ? new Date(data.specialPublicationDate) : null,
      }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    select: {
      id: true,
      companyId: true,
      name: true,
      frequency: true,
      defaultPublishDay: true,
      defaultPublishDate: true,
      specialPublicationDate: true,
      isActive: true,
      createdAt: true,
    },
  });

  // Reschedule or schedule new issues in background
  scheduleIssues(companyId, updated.id).catch(err => console.error('Error scheduling issues:', err));

  return updated;
};

/**
 * Delete (hard-delete) a publication type — scoped to company.
 * Will cascade-delete linked publication issues per schema.
 */
const remove = async (companyId, id) => {
  const existing = await prisma.publicationType.findFirst({ where: { id, companyId } });
  if (!existing) throw new AppError('Publication type not found.', 404);

  // Guard: prevent deletion if there are linked issues
  // const issueCount = await prisma.publicationIssue.count({ where: { publicationTypeId: id } });
  // if (issueCount > 0) {
  //     throw new AppError(
  //         `Cannot delete: this publication type has ${issueCount} linked issue(s). Remove them first or deactivate instead.`,
  //         409
  //     );
  // }

  await prisma.publicationType.delete({ where: { id } });
};

/**
 * Toggle isActive status of a publication type.
 */
const toggleActive = async (companyId, id) => {
  const existing = await prisma.publicationType.findFirst({ where: { id, companyId } });
  if (!existing) throw new AppError('Publication type not found.', 404);

  const updated = await prisma.publicationType.update({
    where: { id },
    data: { isActive: !existing.isActive },
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  });

  return updated;
};

/**
 * Get all publication issues for a specific publication type.
 * Supports filtering by status.
 */
const getIssues = async (companyId, id, { status } = {}) => {
  // Confirm publication type exists and belongs to company
  const pt = await prisma.publicationType.findFirst({ where: { id, companyId } });
  if (!pt) throw new AppError('Publication type not found.', 404);

  const where = { publicationTypeId: id };
  if (status) {
    where.status = status;
  }

  const issues = await prisma.publicationIssue.findMany({
    where,
    orderBy: { issueDate: 'asc' },
  });

  return issues;
};

module.exports = { getAll, getOne, create, update, remove, toggleActive, getIssues };
