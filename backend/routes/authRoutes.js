const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfileStats,
  updateProfile,
  changePassword,
  getAllUsers,
  toggleUserStatus,
  adminCreateUser,
  adminUpdateUser,
  adminResetPassword,
  adminDeleteUser
} = require('../controllers/authController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Public Routes
router.post('/register', register);
router.post('/login', login);

// Protected Routes
router.get('/profile', verifyToken, getProfileStats);
router.put('/profile', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);

// Admin Routes (Toàn quyền quản lý người dùng)
router.get('/users', verifyToken, authorizeRoles('Admin'), getAllUsers);
router.post('/users', verifyToken, authorizeRoles('Admin'), adminCreateUser);
router.put('/users/:id', verifyToken, authorizeRoles('Admin'), adminUpdateUser);
router.put('/users/:id/reset-password', verifyToken, authorizeRoles('Admin'), adminResetPassword);
router.put('/users/:id/toggle-status', verifyToken, authorizeRoles('Admin'), toggleUserStatus);
router.delete('/users/:id', verifyToken, authorizeRoles('Admin'), adminDeleteUser);

module.exports = router;