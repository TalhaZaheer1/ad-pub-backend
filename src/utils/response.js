/**
 * Send a successful JSON response
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

/**
 * Send an error JSON response
 */
const sendError = (res, message = 'Internal Server Error', statusCode = 500) => {
    return res.status(statusCode).json({
        success: false,
        message,
        data: null,
    });
};

module.exports = { sendSuccess, sendError };
