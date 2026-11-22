const express = require('express');
const router = express.Router();
const { enrollCourse } = require('../controllers/enrollmentController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Route này bắt buộc phải đăng nhập (verifyToken) và CHỈ DÀNH CHO HỌC VIÊN (authorizeRoles('Student'))
router.post('/enroll', verifyToken, authorizeRoles('Student'), enrollCourse);

module.exports = router;