/**
 * Express App Configuration
 * 
 * This is the main Express application that will be used with Firebase Cloud Functions.
 * All API routes are organized by resource and versioned.
 */

const express = require('express');
const { corsMiddleware, loggingMiddleware } = require('./middleware');

const app = express();

// Global middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(loggingMiddleware);
app.use(corsMiddleware);

// Health check endpoint (before versioned routes)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  });
});

// API versioning - all routes under /api/v1
const apiRouter = express.Router();

// Import route modules
const postsRoutes = require('./routes/posts');
const usersRoutes = require('./routes/users');
const invitationsRoutes = require('./routes/invitations');
const auditLogsRoutes = require('./routes/auditLogs');
const grokTrendsRoutes = require('./routes/grokTrends');
const notificationsRoutes = require('./routes/notifications');
const previewTokensRoutes = require('./routes/previewTokens');
const sitemapRoutes = require('./routes/sitemap');
const mediaRoutes = require('./routes/media');
const settingsRoutes = require('./routes/settings');
const redirectsRoutes = require('./routes/redirects');
const categoriesRoutes = require('./routes/categories');
const newsletterRoutes = require('./routes/newsletter');
const analyticsRoutes = require('./routes/analytics');

// Mount route modules
apiRouter.use('/posts', postsRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/invitations', invitationsRoutes);
apiRouter.use('/audit-logs', auditLogsRoutes);
apiRouter.use('/grok-trends', grokTrendsRoutes);
apiRouter.use('/notifications', notificationsRoutes);
apiRouter.use('/preview-tokens', previewTokensRoutes);
apiRouter.use('/sitemap', sitemapRoutes);
apiRouter.use('/media', mediaRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/redirects', redirectsRoutes);
apiRouter.use('/categories', categoriesRoutes);
apiRouter.use('/newsletter', newsletterRoutes);
apiRouter.use('/analytics', analyticsRoutes);

// Mount API router
// Firebase Functions v2 passes the path after the function name to Express
// Since the function is named 'api', requests to /api/v1/posts become /v1/posts
app.use('/v1', apiRouter);
// Also support /api/v1 for direct Cloud Run access or other routing scenarios
app.use('/api/v1', apiRouter);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const logger = require('firebase-functions/logger');
  logger.error('Express error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;

