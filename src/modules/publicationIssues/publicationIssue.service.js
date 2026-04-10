const { PrismaClient, PublicationIssueStatus } = require('@prisma/client');
const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');

const getAll = async (companyId, { status, publicationTypeId, limit = 100 } = {}) => {
    const where = { companyId };
    if (status) where.status = status;
    if (publicationTypeId) where.publicationTypeId = publicationTypeId;

    return prisma.publicationIssue.findMany({
        where,
        orderBy: { issueDate: 'asc' },
        take: parseInt(limit),
        include: {
            publicationType: { select: { id: true, name: true } },
            _count: { select: { adUnits: true } }
        }
    });
};
const updateStatus = async (companyId, id, status, userId = null) => {
    const existing = await prisma.publicationIssue.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Publication issue not found.', 404);

    const updated = await prisma.publicationIssue.update({
        where: { id },
        data: { status: PublicationIssueStatus[status] || status },
    });

    // When an issue is marked PRINTED, cascade to all its READY ad units
    if (status === 'PRINTED') {
        // 1. Ready ads become PRINTED
        await prisma.adUnit.updateMany({
            where: { publicationIssueId: id, companyId, status: 'READY' },
            data: { status: 'PRINTED' },
        });

        // 2. All other ads (that missed the cut-off) become ARCHIVED
        await prisma.adUnit.updateMany({
            where: { 
                publicationIssueId: id, 
                companyId, 
                status: { notIn: ['PRINTED', 'PUBLISHED'] } 
            },
            data: { status: 'ARCHIVED' },
        });

        if (userId) {
            await prisma.auditLog.create({
                data: {
                    companyId,
                    userId,
                    action: 'PUBLICATION_ISSUE_PRINTED',
                    entityType: 'PublicationIssue',
                    entityId: id,
                    metadata: { cascadedAdsToPrinted: true },
                },
            });
        }
    }

    // When an issue is marked PUBLISHED, cascade to all its PRINTED ad units
    if (status === 'PUBLISHED') {
        await prisma.adUnit.updateMany({
            where: { publicationIssueId: id, companyId, status: 'PRINTED' },
            data: { status: 'PUBLISHED' },
        });

        if (userId) {
            await prisma.auditLog.create({
                data: {
                    companyId,
                    userId,
                    action: 'PUBLICATION_ISSUE_PUBLISHED',
                    entityType: 'PublicationIssue',
                    entityId: id,
                    metadata: { cascadedAdsToPublished: true },
                },
            });
        }
    }

    return updated;
};

const toggleLock = async (companyId, id) => {
    const existing = await prisma.publicationIssue.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Publication issue not found.', 404);

    const updated = await prisma.publicationIssue.update({
        where: { id },
        data: { isLocked: !existing.isLocked },
    });

    return updated;
};

module.exports = { getAll, updateStatus, toggleLock };
