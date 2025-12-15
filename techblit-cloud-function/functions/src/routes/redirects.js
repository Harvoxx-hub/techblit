/**
 * Redirects API Routes
 * 
 * All redirect-related endpoints:
 * - GET /api/v1/redirects - Get all redirects (admin)
 * - GET /api/v1/redirects/lookup?path=/some/path - Public lookup for middleware
 * - POST /api/v1/redirects - Create redirect (admin)
 * - PUT /api/v1/redirects/:id - Update redirect (admin)
 * - DELETE /api/v1/redirects/:id - Delete redirect (admin)
 */

const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware');
const redirectHandlers = require('../handlers/redirects');

// Public routes for middleware (must be before auth middleware)
router.get('/lookup', redirectHandlers.lookupRedirect);
router.get('/active', redirectHandlers.getAllActiveRedirects);

// All other redirect routes require admin access
router.get('/', authMiddleware, adminMiddleware, redirectHandlers.getAllRedirects);
router.post('/', authMiddleware, adminMiddleware, redirectHandlers.createRedirect);
router.put('/:id', authMiddleware, adminMiddleware, redirectHandlers.updateRedirect);
router.delete('/:id', authMiddleware, adminMiddleware, redirectHandlers.deleteRedirect);

module.exports = router;

