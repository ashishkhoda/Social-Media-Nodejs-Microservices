const logger = require('../utils.js/logger');

const errorHandler = (err, req, res, next) => {
    logger.error(err.stack);
    res.status(err.statusCode || 500).json({ message: err.message || 'Internal Server Error' });
};

module.exports = { errorHandler } ;