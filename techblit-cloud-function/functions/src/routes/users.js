/**
 * Users API Routes
 * 
 * All user-related endpoints:
 * - GET /api/v1/users - Get all users (admin)
 * - GET /api/v1/users/profile - Get current user profile (authenticated)
 * - PUT /api/v1/users/profile - Update current user profile (authenticated)
 * - PUT /api/v1/users/:id/role - Update user role (admin)
 */

const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware');
const userHandlers = require('../handlers/users');

// Admin routes
router.get('/', authMiddleware, adminMiddleware, userHandlers.getAllUsers);
router.put('/:id/role', authMiddleware, adminMiddleware, userHandlers.updateUserRole);
router.delete('/:id', authMiddleware, adminMiddleware, userHandlers.deleteUser);

// Authenticated user routes (use current user's UID)
router.get('/profile', authMiddleware, async (req, res) => {
  // Set uid from authenticated user
  req.params = { uid: req.user.uid };
  userHandlers.getUserProfile(req, res);
});

router.put('/profile', authMiddleware, async (req, res) => {
  // Set uid from authenticated user
  req.params = { uid: req.user.uid };
  userHandlers.updateUserProfile(req, res);
});

module.exports = router;

