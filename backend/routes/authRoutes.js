const express = require('express');
const router = express.Router();
const { register, login, oauthCallback, getMe } = require('../controllers/authController');
const passport = require('passport');
const { auth } = require('../middlewares/auth');

const frontendBaseUrl = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5173')
	.split(',')
	.map((origin) => origin.trim())
	.find(Boolean);

router.post('/register', register);
router.post('/login', login);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: `${frontendBaseUrl}/login?error=true` }), oauthCallback);

router.get('/google/simulate', require('../controllers/authController').simulateOAuth);
router.get('/facebook/simulate', require('../controllers/authController').simulateOAuth);

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: `${frontendBaseUrl}/login?error=true` }), oauthCallback);

router.get('/me', auth, getMe);

module.exports = router;
