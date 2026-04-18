const express = require('express');
const router = express.Router();
const { getAllStudents, deleteStudent, updateStudentProfile } = require('../controllers/adminController');
const { auth, adminAuth } = require('../middlewares/auth');

router.get('/students', auth, adminAuth, getAllStudents);
router.delete('/students/:id', auth, adminAuth, deleteStudent);
router.put('/students/:id/profile', auth, adminAuth, updateStudentProfile);

module.exports = router;
