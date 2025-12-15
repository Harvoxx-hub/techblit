/**
 * Preview Tokens API Routes
 * 
 * All preview token-related endpoints:
 * - POST /api/v1/preview-tokens - Generate preview token (admin)
 * - GET /api/v1/preview-tokens/validate - Validate preview token (public)
 * - GET /api/v1/preview-tokens/stats - Get preview token statistics (admin)
 */

const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware');
const previewTokenHandlers = require('../handlers/previewTokens');

// Public route
router.get('/validate', previewTokenHandlers.validatePreviewTokenHandler);

// Admin routes
router.post('/', authMiddleware, adminMiddleware, previewTokenHandlers.generatePreviewTokenHandler);
router.get('/stats', authMiddleware, adminMiddleware, previewTokenHandlers.getPreviewTokenStatsHandler);

module.exports = router;

