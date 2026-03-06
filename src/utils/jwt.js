const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');

/**
 * Sign an access token (short-lived)
 */
const signAccessToken = (payload) => {
    return jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.accessExpiresIn });
};

/**
 * Sign a refresh token (long-lived)
 */
const signRefreshToken = (payload) => {
    return jwt.sign(payload, jwtConfig.refreshSecret, { expiresIn: jwtConfig.refreshExpiresIn });
};

/**
 * Verify an access token
 */
const verifyAccessToken = (token) => {
    return jwt.verify(token, jwtConfig.secret);
};

/**
 * Verify a refresh token
 */
const verifyRefreshToken = (token) => {
    return jwt.verify(token, jwtConfig.refreshSecret);
};

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
