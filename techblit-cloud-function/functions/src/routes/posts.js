/**
 * Posts API Routes
 * 
 * All post-related endpoints:
 * - GET /api/v1/posts - Get published posts (public)
 * - GET /api/v1/posts/:slug - Get single post by slug (public)
 * - POST /api/v1/posts - Create new post (admin)
 * - PUT /api/v1/posts/:id - Update post (admin)
 * - PATCH /api/v1/posts/:id/view - Increment view count (public)
 */

const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware');
const postHandlers = require('../handlers/posts');

// Public routes
router.get('/', postHandlers.getPublishedPosts);
router.get('/:slug', postHandlers.getPostBySlug);
router.patch('/:slug/view', postHandlers.incrementViewCount);

// Admin routes (require authentication and admin role)
router.post('/', authMiddleware, adminMiddleware, postHandlers.createPost);
router.put('/:id', authMiddleware, adminMiddleware, postHandlers.updatePost);
router.delete('/:id', authMiddleware, adminMiddleware, postHandlers.deletePost);

module.exports = router;

