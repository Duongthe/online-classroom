const express = require('express');
const router = express.Router();
const {
  createAssignment,
  submitAssignment,
  gradeSubmission,
  getMyGrades,
} = require('../controllers/assignmentController');
const authMod = require('../middleware/authMiddleware');

const protect =
  typeof authMod === 'function'
    ? authMod
    : authMod.protect || Object.values(authMod).find((fn) => typeof fn === 'function');

// Route lấy bảng điểm tổng hợp của sinh viên
router.get('/my-grades', protect, getMyGrades);

// Routes giao bài, nộp bài, chấm điểm
router.post('/create', protect, createAssignment);
router.post('/:id/submit', protect, submitAssignment);
router.put('/:id/grade', protect, gradeSubmission);

module.exports = router;