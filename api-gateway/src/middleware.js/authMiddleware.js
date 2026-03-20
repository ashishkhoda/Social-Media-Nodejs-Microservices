const logger = require('../utils.js/logger');
const jwt = require('jsonwebtoken');

const validateToken = async (req, res, next) => {
    const authorizationHeader = req.headers['authorization'];
    const token = authorizationHeader ? authorizationHeader.split(' ')[1] : undefined;
    if(!token){
        logger.warn('Token is required in the request headers');
        return res.status(401).json({
            status: false,
            message: 'Token is required in the request headers'
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        logger.info('Token validated successfully');
        next();
    } catch (error) {
        logger.error('Error validating token: ', error);
        return res.status(401).json({
            status: false,
            message: 'Invalid token'
        });
    }
};

module.exports = { validateToken };