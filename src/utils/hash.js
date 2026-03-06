const bcrypt = require('bcryptjs');
const { bcryptRounds } = require('../config/env');

/**
 * Hash a plain-text password
 */
const hashPassword = async (plain) => {
    return bcrypt.hash(plain, bcryptRounds);
};

/**
 * Compare plain-text password against a stored hash
 */
const comparePassword = async (plain, hash) => {
    return bcrypt.compare(plain, hash);
};

module.exports = { hashPassword, comparePassword };
