const express = require('express');
const router = express.Router();
const { getProfile, updateProfileAndPredict, getPredictions, parseResume, getLeaderboard } = require('../controllers/profileController');
const { auth } = require('../middlewares/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/leaderboard', auth, getLeaderboard);
router.get('/', auth, getProfile);
router.post('/predict', auth, updateProfileAndPredict);
router.get('/predictions', auth, getPredictions);
router.post('/parse-resume', auth, upload.single('resume'), parseResume);

module.exports = router;
