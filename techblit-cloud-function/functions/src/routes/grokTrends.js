/**
 * Grok Trends API Routes
 * 
 * All Grok trends-related endpoints:
 * - GET /api/v1/grok-trends/stories - Get Grok stories (admin)
 * - PATCH /api/v1/grok-trends/stories/:id/status - Update story status (admin)
 * - GET /api/v1/grok-trends/stats - Get Grok statistics (admin)
 * - POST /api/v1/grok-trends/fetch - Manually fetch stories from Grok (admin)
 * - POST /api/v1/grok-trends/stories/:id/generate-draft - Generate blog draft from story (admin)
 * - POST /api/v1/grok-trends/stories/:id/publish - Publish story as blog post (admin)
 * - GET /api/v1/grok-trends/config/auto-draft - Get auto-draft configuration (admin)
 * - PUT /api/v1/grok-trends/config/auto-draft - Update auto-draft configuration (admin)
 */

const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware');
const grokTrendsHandlers = require('../handlers/grokTrends');

// All Grok trends routes require admin access
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/stories', grokTrendsHandlers.getGrokStories);
router.patch('/stories/:id/status', grokTrendsHandlers.updateStoryStatus);
router.get('/stats', grokTrendsHandlers.getGrokStats);
router.post('/fetch', grokTrendsHandlers.fetchGrokStories);
router.post('/stories/:id/generate-draft', grokTrendsHandlers.generateDraft);
router.post('/stories/:id/publish', grokTrendsHandlers.publishStory);
router.get('/config/auto-draft', grokTrendsHandlers.getAutoDraftConfig);
router.put('/config/auto-draft', grokTrendsHandlers.updateAutoDraftConfig);

module.exports = router;

