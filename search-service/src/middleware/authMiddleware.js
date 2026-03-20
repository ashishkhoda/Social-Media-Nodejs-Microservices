const logger = require('../utils/logger');

const authenticateRequest = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if(!userId){
        logger.warn('User ID is required in the request headers');
        return res.status(401).json({
            status: false,
            message: 'User ID is required in the request headers'
        });
    }
    req.user = { userId };
    next();
};

module.exports = { authenticateRequest };