const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const xss = require('xss-clean');
const hpp = require('hpp');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { apiLimiter } = require('./middlewares/rateLimiter');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const { corsOrigin, nodeEnv } = require('./config/env');
const logger = require('./config/logger');

const app = express();

// Trust proxy for Render/Cloudflare/Heroku rate limiting
app.set('trust proxy', 1);

// ─── Security middleware ──────────────────────────────────
app.use(helmet());
app.use(
    cors({
        origin: corsOrigin,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
);
app.use(xss());
app.use(hpp());

// ─── Request parsing ──────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Logging ─────────────────────────────────────────────
if (nodeEnv === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(
        morgan('combined', {
            stream: { write: (message) => logger.info(message.trim()) },
        })
    );
}

// ─── API rate limiter ─────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Swagger UI ───────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
});

// ─── API routes ───────────────────────────────────────────
app.use('/api', routes);

// ─── 404 handler ─────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.`, data: null });
});

// ─── Global error handler (must be last) ─────────────────
app.use(errorHandler);

module.exports = app;
