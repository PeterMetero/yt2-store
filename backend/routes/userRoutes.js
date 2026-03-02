const express = require('express');
const router = express.Router();
const { register, login, verifyEmail, getProfile } = require('../controllers/userController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.get('/profile', auth, getProfile); // Added profile endpoint

module.exports = router;