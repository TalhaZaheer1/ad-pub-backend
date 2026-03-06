const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');

/**
 * Get company overview — stats aggregated in a single efficient query set.
 * Access: SUPER_ADMIN or ADMIN of that company.
 */
const getCompanyOverview = async (companyId, requestingUser) => {
    // Authorization: ADMIN can only view their own company
    if (requestingUser.role === 'ADMIN' && requestingUser.companyId !== companyId) {
        throw new AppError('Access denied.', 403);
    }

    // Fetch company + user aggregates in parallel
    const [company, totalUsers, usersByRoleRaw, lastActivity] = await Promise.all([
        prisma.company.findUnique({ where: { id: companyId } }),

        prisma.user.count({
            where: { companyId, isActive: true },
        }),

        // Group users by role using Prisma's groupBy
        prisma.user.groupBy({
            by: ['role'],
            where: { companyId },
            _count: { role: true },
        }),

        // Latest audit log entry for this company
        prisma.auditLog.findFirst({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true, action: true },
        }),
    ]);

    if (!company) throw new AppError('Company not found.', 404);

    // Normalize role counts into a clean object
    const roleOrder = ['ADMIN', 'SALES', 'DESIGNER', 'PRODUCTION'];
    const usersByRole = roleOrder.reduce((acc, role) => {
        const found = usersByRoleRaw.find((r) => r.role === role);
        acc[role] = found ? found._count.role : 0;
        return acc;
    }, {});

    return {
        company: {
            id: company.id,
            name: company.name,
            slug: company.slug,
            isActive: company.isActive,
            createdAt: company.createdAt,
            updatedAt: company.updatedAt,
        },
        stats: {
            totalUsers,
            usersByRole,
            lastActivity: lastActivity ? lastActivity.createdAt : null,
            lastActivityAction: lastActivity ? lastActivity.action : null,
            // Placeholder for future system health metrics
            systemHealth: {
                status: 'operational',
                note: 'Detailed metrics available in future milestones.',
            },
        },
    };
};

/**
 * Get company activity — last 20 audit logs for a company.
 * Access: SUPER_ADMIN or ADMIN of that company.
 */
const getCompanyActivity = async (companyId, requestingUser, query = {}) => {
    if (requestingUser.role === 'ADMIN' && requestingUser.companyId !== companyId) {
        throw new AppError('Access denied.', 403);
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new AppError('Company not found.', 404);

    const limit = Math.min(parseInt(query.limit, 10) || 20, 50);

    const logs = await prisma.auditLog.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            metadata: true,
            createdAt: true,
            user: {
                select: { id: true, firstName: true, lastName: true, email: true, role: true },
            },
        },
    });

    return { activity: logs, total: logs.length };
};

module.exports = { getCompanyOverview, getCompanyActivity };
