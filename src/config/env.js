require('dotenv').config();
const Joi = require('joi');

const envSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(5000),
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().min(32).required(),
    JWT_REFRESH_SECRET: Joi.string().min(32).required(),
    JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
    BCRYPT_ROUNDS: Joi.number().integer().min(10).max(16).default(12),
    CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
    SEED_ADMIN_EMAIL: Joi.string().email().default('superadmin@adpub.com'),
    SEED_ADMIN_PASSWORD: Joi.string().min(8).default('SuperAdmin@123'),
    SEED_ADMIN_FIRST_NAME: Joi.string().default('Super'),
    SEED_ADMIN_LAST_NAME: Joi.string().default('Admin'),
}).unknown(true);

const { error, value: env } = envSchema.validate(process.env);

if (error) {
    throw new Error(`Environment config validation error: ${error.message}`);
}

module.exports = {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    jwt: {
        secret: env.JWT_SECRET,
        refreshSecret: env.JWT_REFRESH_SECRET,
        accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
        refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
    bcryptRounds: env.BCRYPT_ROUNDS,
    corsOrigin: env.CORS_ORIGIN,
    seed: {
        adminEmail: env.SEED_ADMIN_EMAIL,
        adminPassword: env.SEED_ADMIN_PASSWORD,
        adminFirstName: env.SEED_ADMIN_FIRST_NAME,
        adminLastName: env.SEED_ADMIN_LAST_NAME,
    },
};
