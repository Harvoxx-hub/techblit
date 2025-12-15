/**
 * Notifications API Routes
 * 
 * All notification-related endpoints:
 * - GET /api/v1/notifications - Get user notifications (authenticated)
 * - PATCH /api/v1/notifications/:id/read - Mark notification as read (authenticated)
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware');
const notificationHandlers = require('../handlers/notifications');

// All notification routes require authentication
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const notifications = await notificationHandlers.getUserNotifications(
      req.user.uid, 
      parseInt(limit)
    );
    
    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    const logger = require('firebase-functions/logger');
    logger.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications'
    });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    await notificationHandlers.markNotificationAsRead(id, req.user.uid);
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    const logger = require('firebase-functions/logger');
    logger.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mark notification as read'
    });
  }
});

module.exports = router;

