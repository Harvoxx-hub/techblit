/**
 * Analytics API Routes
 * 
 * Analytics endpoints:
 * - GET /api/v1/analytics - Get analytics dashboard data (admin)
 * - GET /api/v1/analytics/cloudinary - Get Cloudinary-specific analytics (admin)
 */

const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware');
const analyticsHandlers = require('../handlers/analytics');

// All analytics routes require admin access
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', analyticsHandlers.getAnalytics);
router.get('/cloudinary', analyticsHandlers.getCloudinaryAnalytics);

module.exports = router;

