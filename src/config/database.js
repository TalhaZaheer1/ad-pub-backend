const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient({
    log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
    ],
});

if (process.env.NODE_ENV === 'development') {
    prisma.$on('query', (e) => {
        logger.debug(`Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
    });
}

prisma.$on('error', (e) => {
    logger.error('Prisma error:', e);
});

prisma.$on('warn', (e) => {
    logger.warn('Prisma warning:', e.message);
});

module.exports = prisma;
