/**
 * Settings API Routes
 * 
 * All settings-related endpoints:
 * - GET /api/v1/settings - Get site settings (public)
 * - PUT /api/v1/settings - Update site settings (admin)
 */

const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware');
const settingsHandlers = require('../handlers/settings');

// Public route
router.get('/', settingsHandlers.getSettings);

// Admin route
router.put('/', authMiddleware, adminMiddleware, settingsHandlers.updateSettings);

module.exports = router;

