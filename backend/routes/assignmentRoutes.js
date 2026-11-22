const express = require('express');
const router = express.Router();
const { createAssignment, submitAssignment, gradeSubmission } = require('../controllers/assignmentController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/create', verifyToken, authorizeRoles('Admin', 'Teacher'), createAssignment);
router.post('/:id/submit', verifyToken, authorizeRoles('Student'), submitAssignment);
router.put('/:id/grade', verifyToken, authorizeRoles('Admin', 'Teacher'), gradeSubmission);

module.exports = router;