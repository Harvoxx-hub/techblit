/**
 * Categories API Routes
 * 
 * All category-related endpoints:
 * - GET /api/v1/categories - Get all categories (public)
 * - GET /api/v1/categories/:slug/posts - Get posts by category (public)
 */

const express = require('express');
const router = express.Router();
const categoryHandlers = require('../handlers/categories');

// Public routes
router.get('/', categoryHandlers.getAllCategories);
router.get('/:slug/posts', categoryHandlers.getPostsByCategory);

module.exports = router;

