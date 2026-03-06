const winston = require('winston');
const { nodeEnv } = require('./env');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const devFormat = combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ level, message, timestamp, stack }) => {
        return stack
            ? `[${timestamp}] ${level}: ${message}\n${stack}`
            : `[${timestamp}] ${level}: ${message}`;
    })
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const transports = [new winston.transports.Console()];

if (nodeEnv === 'production') {
    transports.push(
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    );
}

const logger = winston.createLogger({
    level: nodeEnv === 'production' ? 'info' : 'debug',
    format: nodeEnv === 'production' ? prodFormat : devFormat,
    transports,
});

module.exports = logger;
