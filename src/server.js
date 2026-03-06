const app = require('./app');
const { port, nodeEnv } = require('./config/env');
const prisma = require('./config/database');
const logger = require('./config/logger');

const server = app.listen(port, () => {
    logger.info(`🚀 Server running in ${nodeEnv} mode on port ${port}`);
    logger.info(`📚 API Docs: http://localhost:${port}/api/docs`);
    logger.info(`❤️  Health:   http://localhost:${port}/api/health`);
});

// ─── Graceful shutdown ────────────────────────────────────
const shutdown = async (signal) => {
    logger.info(`\n${signal} received. Starting graceful shutdown...`);
    server.close(async () => {
        logger.info('HTTP server closed.');
        await prisma.$disconnect();
        logger.info('Database connection closed.');
        process.exit(0);
    });

    // Force shutdown after 10s
    setTimeout(() => {
        logger.error('Graceful shutdown timed out. Forcing exit.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection:', reason);
    shutdown('unhandledRejection');
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    shutdown('uncaughtException');
});

module.exports = server;
