/**
 * Newsletter API Routes
 * 
 * All newsletter-related endpoints:
 * - POST /api/v1/newsletter/subscribe - Subscribe to newsletter (public)
 * - POST /api/v1/newsletter/unsubscribe - Unsubscribe from newsletter (public)
 * - GET /api/v1/newsletter/stats - Get newsletter statistics (admin)
 */

const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware');
const newsletterHandlers = require('../handlers/newsletter');

// Public routes
router.post('/subscribe', newsletterHandlers.subscribe);
router.post('/unsubscribe', newsletterHandlers.unsubscribe);

// Admin route
router.get('/stats', authMiddleware, adminMiddleware, newsletterHandlers.getNewsletterStats);

module.exports = router;

