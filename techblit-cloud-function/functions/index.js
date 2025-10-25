const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");

// Import middleware
const { corsMiddleware, authMiddleware, adminMiddleware, loggingMiddleware } = require('./src/middleware');

// Import handlers
const postHandlers = require('./src/handlers/posts');
const userHandlers = require('./src/handlers/users');
const invitationHandlers = require('./src/handlers/invitations');
const scheduledPostHandlers = require('./src/handlers/scheduledPosts');
const notificationHandlers = require('./src/handlers/notifications');
const previewTokenHandlers = require('./src/handlers/previewTokens');
const postMigrationHandlers = require('./src/handlers/postMigration');
const auditLogHandlers = require('./src/handlers/auditLogs');

// Import utilities
const { createAuditLog } = require('./src/utils/helpers');
const { CollectionNames } = require('./src/types/constants');

// =============================================================================
// HTTP FUNCTIONS (API Endpoints)
// =============================================================================

/**
 * Public API - Get published posts
 */
exports.getPosts = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      postHandlers.getPublishedPosts(req, res);
    });
  });
});

/**
 * Public API - Get single post by slug
 */
exports.getPost = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      postHandlers.getPostBySlug(req, res);
    });
  });
});

/**
 * Public API - Increment view count
 */
exports.incrementViewCount = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      postHandlers.incrementViewCount(req, res);
    });
  });
});

/**
 * Admin API - Create post
 */
exports.createPost = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, () => {
        adminMiddleware(req, res, () => {
          postHandlers.createPost(req, res);
        });
      });
    });
  });
});

/**
 * Admin API - Update post
 */
exports.updatePost = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, () => {
        adminMiddleware(req, res, () => {
          postHandlers.updatePost(req, res);
        });
      });
    });
  });
});

/**
 * Admin API - Get all users
 */
exports.getUsers = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, () => {
        adminMiddleware(req, res, () => {
          userHandlers.getAllUsers(req, res);
        });
      });
    });
  });
});

/**
 * Admin API - Update user role
 */
exports.updateUserRole = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, () => {
        adminMiddleware(req, res, () => {
          userHandlers.updateUserRole(req, res);
        });
      });
    });
  });
});

/**
 * User API - Get user profile
 */
exports.getUserProfile = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, () => {
        userHandlers.getUserProfile(req, res);
      });
    });
  });
});

/**
 * User API - Update user profile
 */
exports.updateUserProfile = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, () => {
        userHandlers.updateUserProfile(req, res);
      });
    });
  });
});

/**
 * Admin API - Invite new user
 */
exports.inviteUser = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, () => {
        adminMiddleware(req, res, () => {
          invitationHandlers.inviteUser(req, res);
        });
      });
    });
  });
});

/**
 * Admin API - Resend invitation
 */
exports.resendInvitation = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, () => {
        adminMiddleware(req, res, () => {
          invitationHandlers.resendInvitation(req, res);
        });
      });
    });
  });
});

/**
 * Admin API - Get invitation statistics
 */
exports.getInvitationStats = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, () => {
        adminMiddleware(req, res, () => {
          invitationHandlers.getInvitationStats(req, res);
        });
      });
    });
  });
});

/**
 * Admin API - Generate preview token for a post
 */
exports.generatePreviewToken = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, () => {
        adminMiddleware(req, res, () => {
          previewTokenHandlers.generatePreviewTokenHandler(req, res);
        });
      });
    });
  });
});

/**
 * Public API - Validate preview token
 */
exports.validatePreviewToken = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      previewTokenHandlers.validatePreviewTokenHandler(req, res);
    });
  });
});

/**
 * Admin API - Get preview token statistics
 */
exports.getPreviewTokenStats = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, () => {
        adminMiddleware(req, res, () => {
          previewTokenHandlers.getPreviewTokenStatsHandler(req, res);
        });
      });
    });
  });
});

/**
 * Admin API - Migrate all published posts to publicPosts collection
 */
exports.migrateAllPublishedPosts = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, () => {
        adminMiddleware(req, res, () => {
          postMigrationHandlers.migrateAllPublishedPostsHandler(req, res);
        });
      });
    });
  });
});

/**
 * Admin API - Get audit logs
 */
exports.getAuditLogs = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, () => {
        adminMiddleware(req, res, () => {
          auditLogHandlers.getAuditLogsHandler(req, res);
        });
      });
    });
  });
});

/**
 * Admin API - Get audit log statistics
 */
exports.getAuditLogStats = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, () => {
        adminMiddleware(req, res, () => {
          auditLogHandlers.getAuditLogStatsHandler(req, res);
        });
      });
    });
  });
});

/**
 * Admin API - Get audit log filters
 */
exports.getAuditLogFilters = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, () => {
        adminMiddleware(req, res, () => {
          auditLogHandlers.getAuditLogFiltersHandler(req, res);
        });
      });
    });
  });
});

/**
 * Admin API - Get audit log by ID
 */
exports.getAuditLogById = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, () => {
        adminMiddleware(req, res, () => {
          auditLogHandlers.getAuditLogByIdHandler(req, res);
        });
      });
    });
  });
});

/**
 * Admin API - Get publicPosts collection statistics
 */
exports.getPublicPostsStats = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, () => {
        adminMiddleware(req, res, () => {
          postMigrationHandlers.getPublicPostsStatsHandler(req, res);
        });
      });
    });
  });
});

// =============================================================================
// FIRESTORE TRIGGERS (Background Functions)
// =============================================================================

/**
 * Trigger when a new post is created
 */
exports.onPostCreated = onDocumentCreated({
  document: `${CollectionNames.POSTS}/{postId}`,
  region: 'us-central1'
}, async (event) => {
  const { db } = require('./src/config/firebase');
  
  try {
    const postData = event.data.data();
    const postId = event.params.postId;
    
    logger.info(`New post created: ${postId}`, {
      title: postData.title,
      author: postData.author?.name,
      status: postData.status
    });
    
    // Create audit log
    const auditLog = createAuditLog('post_created_trigger', 'system', postId, {
      title: postData.title,
      status: postData.status
    });
    
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    
    // TODO: Send notifications, update search index, etc.
    
  } catch (error) {
    logger.error('Error in onPostCreated trigger:', error);
  }
});

/**
 * Trigger when a post is updated
 */
exports.onPostUpdated = onDocumentUpdated({
  document: `${CollectionNames.POSTS}/{postId}`,
  region: 'us-central1'
}, async (event) => {
  const { db } = require('./src/config/firebase');
  
  try {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();
    const postId = event.params.postId;
    
    logger.info(`Post updated: ${postId}`, {
      title: afterData.title,
      statusChanged: beforeData.status !== afterData.status
    });
    
    // Create audit log
    const auditLog = createAuditLog('post_updated_trigger', 'system', postId, {
      title: afterData.title,
      statusChanged: beforeData.status !== afterData.status,
      oldStatus: beforeData.status,
      newStatus: afterData.status
    });
    
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    
    // Handle status changes
    if (beforeData.status !== afterData.status) {
      logger.info(`Post status changed from ${beforeData.status} to ${afterData.status}`, {
        postId,
        title: afterData.title
      });

      // If post was just published, trigger post-publish actions
      if (afterData.status === 'published' && beforeData.status !== 'published') {
        logger.info(`Post published, triggering post-publish actions: ${postId}`);
        await scheduledPostHandlers.triggerPostPublishActions(postId, afterData);
      }

      // Sync post with publicPosts collection for read optimization
      try {
        await postMigrationHandlers.syncPostWithPublic(postId, afterData, beforeData.status, afterData.status);
      } catch (migrationError) {
        logger.error(`Error syncing post with publicPosts: ${postId}`, migrationError);
        // Don't fail the entire operation if migration fails
      }

      // If post was submitted for review, send notifications
      if (afterData.status === 'in_review' && beforeData.status !== 'in_review') {
        logger.info(`Post submitted for review: ${postId}`);
        await notificationHandlers.notifyReviewers(postId, afterData, afterData.author);
      }

      // If post was approved from review, send notification to author
      if (afterData.status === 'published' && beforeData.status === 'in_review') {
        logger.info(`Post approved from review: ${postId}`);
        // Note: We need to get the reviewer info from the history or context
        // For now, we'll use a generic reviewer name
        await notificationHandlers.notifyAuthor(postId, afterData, { name: 'Reviewer', uid: 'system' }, 'approved');
      }
    }
    
  } catch (error) {
    logger.error('Error in onPostUpdated trigger:', error);
  }
});

/**
 * Trigger when a user is created
 */
exports.onUserCreated = onDocumentCreated({
  document: `${CollectionNames.USERS}/{userId}`,
  region: 'us-central1'
}, async (event) => {
  const { db } = require('./src/config/firebase');
  
  try {
    const userData = event.data.data();
    const userId = event.params.userId;
    
    logger.info(`New user created: ${userId}`, {
      name: userData.name,
      email: userData.email,
      role: userData.role
    });
    
    // Create audit log
    const auditLog = createAuditLog('user_created_trigger', 'system', userId, {
      name: userData.name,
      role: userData.role
    });
    
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    
    // TODO: Send welcome email, setup user preferences, etc.
    
  } catch (error) {
    logger.error('Error in onUserCreated trigger:', error);
  }
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Health check endpoint
 */
exports.healthCheck = onRequest({
  region: 'us-central1',
  memory: '128MB',
  cpu: 0.5,
  maxInstances: 2,
  minInstances: 0
}, async (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  });
});

/**
 * Generate sitemap
 */
exports.generateSitemap = onRequest({
  region: 'us-central1'
}, async (req, res) => {
  const { db } = require('./src/config/firebase');
  
  try {
    const snapshot = await db.collection(CollectionNames.POSTS)
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .get();
    
    const posts = snapshot.docs.map(doc => ({
      slug: doc.data().slug,
      updatedAt: doc.data().updatedAt
    }));
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://techblit.com</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${posts.map(post => `
  <url>
    <loc>https://techblit.com/${post.slug}</loc>
    <lastmod>${post.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;
    
    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
    
  } catch (error) {
    logger.error('Error generating sitemap:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
});

// =============================================================================
// SCHEDULED FUNCTIONS
// =============================================================================

/**
 * Process scheduled posts every minute
 * This function runs automatically to publish posts that are ready
 */
exports.processScheduledPosts = onSchedule({
  schedule: 'every 1 hours',
  region: 'us-central1',
  timeZone: 'UTC'
}, async (event) => {
  try {
    logger.info('Starting scheduled post processing');
    const result = await scheduledPostHandlers.processScheduledPosts();
    logger.info('Scheduled post processing completed', result);
  } catch (error) {
    logger.error('Error in scheduled post processing:', error);
  }
});

/**
 * Clean up expired preview tokens every hour
 */
exports.cleanupExpiredPreviewTokens = onSchedule({
  schedule: 'every 24 hours',
  region: 'us-central1',
  timeZone: 'UTC'
}, async (event) => {
  try {
    logger.info('Starting expired preview token cleanup');
    const result = await previewTokenHandlers.cleanupExpiredTokens();
    logger.info('Expired preview token cleanup completed', result);
  } catch (error) {
    logger.error('Error in expired preview token cleanup:', error);
  }
});

/**
 * Manual trigger for processing scheduled posts
 * Useful for testing or manual intervention
 */
exports.triggerScheduledPosts = onRequest({
  region: 'us-central1'
}, async (req, res) => {
  try {
    const result = await scheduledPostHandlers.processScheduledPosts();
    res.json({
      success: true,
      message: `Processed ${result.processed} scheduled posts`,
      processed: result.processed
    });
  } catch (error) {
    logger.error('Error triggering scheduled posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process scheduled posts',
      details: error.message
    });
  }
});

// =============================================================================
// NOTIFICATION API ENDPOINTS
// =============================================================================

/**
 * Get user notifications
 */
exports.getNotifications = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, async () => {
        try {
          const { limit = 50 } = req.query;
          const notifications = await notificationHandlers.getUserNotifications(req.user.uid, parseInt(limit));
          
          res.json({
            success: true,
            notifications
          });
        } catch (error) {
          logger.error('Error getting notifications:', error);
          res.status(500).json({
            success: false,
            error: 'Failed to get notifications'
          });
        }
      });
    });
  });
});

/**
 * Mark notification as read
 */
exports.markNotificationRead = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, async () => {
        try {
          const { notificationId } = req.body;
          
          if (!notificationId) {
            res.status(400).json({
              success: false,
              error: 'Notification ID is required'
            });
            return;
          }

          await notificationHandlers.markNotificationAsRead(notificationId, req.user.uid);
          
          res.json({
            success: true,
            message: 'Notification marked as read'
          });
        } catch (error) {
          logger.error('Error marking notification as read:', error);
          res.status(500).json({
            success: false,
            error: error.message || 'Failed to mark notification as read'
          });
        }
      });
    });
  });
});

// =============================================================================
// END OF CLOUD FUNCTIONS
// =============================================================================