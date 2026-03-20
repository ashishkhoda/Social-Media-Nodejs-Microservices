const express = require('express');
const router = express.Router();
const { registerUser, loginUser, generateNewRefreshToken, logoutUser } = require('../controllers/identity-contoller');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', generateNewRefreshToken);
router.post('/logout', logoutUser);

module.exports = router;