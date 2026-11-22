const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMod = require('../middleware/authMiddleware');

// Tự động lấy đúng hàm middleware dù authMiddleware.js export kiểu nào
const protect =
  typeof authMod === 'function'
    ? authMod
    : authMod.protect || Object.values(authMod).find((fn) => typeof fn === 'function');

const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  addCourseMaterial,
  getCourseMessages,
  assignTeacherToCourse,
  createCourseRequest,
  getMyCourseRequests,
  getAllCourseRequests,
  reviewCourseRequest,
} = courseController;

// Routes cho Phiếu yêu cầu mở lớp (Teacher gửi -> Admin duyệt)
router.post('/requests', protect, createCourseRequest);
router.get('/requests/my', protect, getMyCourseRequests);
router.get('/requests/all', protect, getAllCourseRequests);
router.put('/requests/:requestId/review', protect, reviewCourseRequest);

// Routes cho Khóa học
router.get('/', protect, getAllCourses);
router.post('/create', protect, createCourse);
router.get('/:id', protect, getCourseById);
router.put('/:id', protect, updateCourse);
router.delete('/:id', protect, deleteCourse);

// Admin vào từng lớp và Add / Gỡ Giảng viên
router.put('/:id/assign-teacher', protect, assignTeacherToCourse);

// Tài liệu & Chat lớp học
router.post('/:id/materials', protect, addCourseMaterial);
router.get('/:id/messages', protect, getCourseMessages);

module.exports = router;