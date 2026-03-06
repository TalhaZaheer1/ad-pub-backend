const prisma = require('../config/database');
const logger = require('../config/logger');

/**
 * Audit log middleware factory.
 * Usage: auditLog('USER_CREATED', 'User')
 *
 * This is a post-action middleware — call next() first, then log.
 * For use as a wrapper in controllers rather than a route middleware.
 */
const createAuditLog = async ({ userId, companyId, action, entityType, entityId, metadata }) => {
    try {
        await prisma.auditLog.create({
            data: {
                userId: userId || null,
                companyId: companyId || null,
                action,
                entityType: entityType || null,
                entityId: entityId || null,
                metadata: metadata || null,
            },
        });
    } catch (err) {
        // Audit log failures should not break the request
        logger.error('Failed to create audit log:', err);
    }
};

module.exports = { createAuditLog };
