const logger = require('../utils/logger');
const { validateRegisterUser, validateLoginUser } = require('../utils/validation');
const { generateTokens } = require('../utils/generateToken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

const registerUser = async (req, res) => {
    logger.info('Registering user with email: ', req.body.email);
    try {
        const { error } = validateRegisterUser(req.body);
        if(error){
            logger.warn('Validation error: ', error.details[0].message);
            return res.status(400).json({
                status: false,
                message: error.details[0].message
            });
        }
        const { email, username, password } = req.body;
        const user = await User.findOne({ $or: [{ email }, { username }] });
        if(user){
            logger.warn('User already exists with email: ', email);
            return res.status(400).json({
                status: false,
                message: 'User already exists'
            });
        }
        const newUser = new User({ email, username, password });
        await newUser.save();
        logger.info('User registered successfully with email: ', email);
        const { accessToken, refreshToken } = await generateTokens(newUser);
        return res.status(201).json({
            status: true,
            message: 'User registered successfully',
            accessToken,
            refreshToken,
        });
    } catch (error) {
        logger.error("Error registering user: ", error);
        return res.status(500).json({
            status: false,
            message: 'Internal Server Error'
        });
    }
};

const loginUser = async (req, res) => {
    logger.info('Logging in user with email: ', req.body.email);
    try {
        const { error } = validateLoginUser(req.body);
        if(error){
            logger.warn('Validation error: ', error.details[0].message);
            return res.status(400).json({
                status: false,
                message: error.details[0].message
            });
        }
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if(!user){
            logger.warn('User not found with email: ', email);
            return res.status(400).json({
                status: false,
                message: 'User not found'
            });
        }
        const isPasswordValid = await user.comparePassword(password);
        if(!isPasswordValid){
            logger.warn('Invalid password for user: ', email);
            return res.status(400).json({
                status: false,
                message: 'Invalid password'
            });
        }
        const { accessToken, refreshToken } = await generateTokens(user);
        return res.status(200).json({
            status: true,
            message: 'User logged in successfully',
            accessToken,
            refreshToken,
            user: {
                userId: user._id,
                email: user.email,
                username: user.username,
            },
        });
    } catch (error) {
        logger.error('Error logging in user: ', error);
        return res.status(500).json({
            status: false,
            message: 'Internal Server Error'
        });
    }
};

const generateNewRefreshToken = async (req, res) => {
    logger.info('Refreshing token for user with email: ', req.body.email);
    try {
        const { refreshToken } = req.body;
        if(!refreshToken){
            logger.warn('Refresh token is required');
            return res.status(400).json({
                status: false,
                message: 'Refresh token is required'
            });
        }
        const token = await RefreshToken.findOne({ token: refreshToken });
        if(!token || token.expiresAt < new Date()){
            logger.warn('Invalid refresh token');
            return res.status(400).json({
                status: false,
                message: 'Invalid refresh token'
            });
        }
        const user = await User.findById(token.userId);
        if(!user){
            logger.warn('User not found');
            return res.status(400).json({
                status: false,
                message: 'User not found'
            });
        }
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateTokens(user);

        await RefreshToken.deleteOne({ token: refreshToken });

        return res.status(200).json({
            status: true,
            message: 'Refresh token generated successfully',
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (error) {
        logger.error('Error generating new refresh token: ', error);
        return res.status(500).json({
            status: false,
            message: 'Internal Server Error'
        });
    }
};

const logoutUser = async (req, res) => {
    logger.info('Logging out user with email: ', req.body.email);
    try {
        const { refreshToken } = req.body;
        if(!refreshToken){
            logger.warn('Refresh token is required');
            return res.status(400).json({
                status: false,
                message: 'Refresh token is required'
            });
        }
        await RefreshToken.deleteOne({ token: refreshToken });
        logger.info('Refresh token deleted successfully for user with email: ', req.body.email);
        return res.status(200).json({
            status: true,
            message: 'User logged out successfully',
        });
    } catch (error) {
        logger.error('Error logging out user: ', error);
        return res.status(500).json({
            status: false,
            message: 'Internal Server Error'
        });
    }
};

module.exports = { registerUser, loginUser, generateNewRefreshToken, logoutUser };