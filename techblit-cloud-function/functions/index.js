// Load environment variables from .env file (for local development only)
// In production, Firebase automatically injects environment variables
if (process.env.NODE_ENV !== 'production' || process.env.FUNCTIONS_EMULATOR) {
  try {
    // Use dynamic require to avoid parse-time errors if dotenv is not installed
    const dotenv = require('dotenv');
    dotenv.config();
  } catch (error) {
    // dotenv is optional - only needed for local development
    // In production, Firebase handles environment variables
    // Silently continue if dotenv is not available
  }
}

const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");

// Import Express app
const app = require('./src/app');

// Import handlers for background functions
const scheduledPostHandlers = require('./src/handlers/scheduledPosts');
const previewTokenHandlers = require('./src/handlers/previewTokens');
const grokTrendsHandlers = require('./src/handlers/grokTrends');
const notificationHandlers = require('./src/handlers/notifications');

// Import utilities
const { createAuditLog } = require('./src/utils/helpers');
const { CollectionNames } = require('./src/types/constants');

// =============================================================================
// EXPRESS API (Main API Endpoint)
// =============================================================================

/**
 * Main API endpoint using Express
 * All routes are available under /api/v1/*
 * 
 * Examples:
 * - GET /api/v1/posts
 * - POST /api/v1/posts
 * - GET /api/v1/users
 * - POST /api/v1/invitations
 * - POST /api/v1/grok-trends/fetch (requires XAI_API_KEY)
 * - POST /api/v1/grok-trends/stories/:id/generate-draft (requires XAI_API_KEY)
 */
exports.api = onRequest({
  cors: false, // Disable Firebase's built-in CORS - we handle it in middleware
  region: 'us-central1',
  memory: '256MiB',
  cpu: 0.5,
  maxInstances: 10,
  secrets: [
    'XAI_API_KEY', // Required for Grok Trends endpoints
    'CLOUDINARY_URL' // Required for image uploads (or use individual: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)
  ]
}, app);

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
        
        // Update Grok story status if this post was created from a Grok story
        if (afterData.source && afterData.source.type === 'grok_story' && afterData.source.storyId) {
          try {
            const { GrokStoryStatus } = require('./src/types/constants');
            const storyRef = db.collection(CollectionNames.GROK_STORIES).doc(afterData.source.storyId);
            const storyDoc = await storyRef.get();
            
            if (storyDoc.exists) {
              await storyRef.update({
                status: GrokStoryStatus.PUBLISHED,
                published_post_id: postId,
                publishedAt: new Date()
              });
              logger.info(`Updated Grok story status to published: ${afterData.source.storyId}`);
            }
          } catch (grokError) {
            logger.error('Error updating Grok story status:', grokError);
          }
        }
      }

      // If post was submitted for review, send notifications
      if (afterData.status === 'in_review' && beforeData.status !== 'in_review') {
        logger.info(`Post submitted for review: ${postId}`);
        await notificationHandlers.notifyReviewers(postId, afterData, afterData.author);
      }

      // If post was approved from review, send notification to author
      if (afterData.status === 'published' && beforeData.status === 'in_review') {
        logger.info(`Post approved from review: ${postId}`);
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
// SCHEDULED FUNCTIONS
// =============================================================================

/**
 * Process scheduled posts every hour
 */
exports.processScheduledPosts = onSchedule({
  schedule: 'every 1 hours',
  region: 'us-central1',
  timeZone: 'Africa/Lagos'
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
 * Clean up expired preview tokens every 24 hours
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
 * Scheduled Grok fetch - Trending Stories (hourly)
 */
exports.scheduledGrokFetchTrending = onSchedule({
  schedule: 'every 1 hours',
  region: 'us-central1',
  timeZone: 'Africa/Lagos',
  secrets: ['XAI_API_KEY']
}, async (event) => {
  try {
    logger.info('Starting scheduled Grok fetch - Trending Stories');
    const { GrokCategory } = require('./src/types/constants');
    const result = await grokTrendsHandlers.scheduledFetch(GrokCategory.TRENDING);
    logger.info('Scheduled Grok fetch completed', result);
  } catch (error) {
    logger.error('Error in scheduled Grok fetch:', error);
  }
});

/**
 * Scheduled Grok fetch - Breaking News (every 30 minutes during business hours)
 */
exports.scheduledGrokFetchBreaking = onSchedule({
  schedule: 'every 30 minutes',
  region: 'us-central1',
  timeZone: 'Africa/Lagos',
  secrets: ['XAI_API_KEY'],
  memory: '256MiB',
  cpu: 0.5,
  maxInstances: 1
}, async (event) => {
  try {
    const hour = new Date().getHours();
    // Only fetch during business hours (8 AM - 8 PM WAT)
    if (hour >= 8 && hour < 20) {
      logger.info('Starting scheduled Grok fetch - Breaking News');
      const { GrokCategory } = require('./src/types/constants');
      const result = await grokTrendsHandlers.scheduledFetch(GrokCategory.BREAKING_NEWS);
      logger.info('Scheduled Grok fetch (Breaking News) completed', result);
    } else {
      logger.info('Skipping Breaking News fetch outside business hours');
    }
  } catch (error) {
    logger.error('Error in scheduled Grok fetch (Breaking News):', error);
  }
});

/**
 * Scheduled Grok fetch - Company News (every 2 hours)
 */
exports.scheduledGrokFetchCompany = onSchedule({
  schedule: 'every 2 hours',
  region: 'us-central1',
  timeZone: 'Africa/Lagos',
  secrets: ['XAI_API_KEY']
}, async (event) => {
  try {
    logger.info('Starting scheduled Grok fetch - Company News');
    const { GrokCategory } = require('./src/types/constants');
    const result = await grokTrendsHandlers.scheduledFetch(GrokCategory.COMPANY_NEWS);
    logger.info('Scheduled Grok fetch (Company News) completed', result);
  } catch (error) {
    logger.error('Error in scheduled Grok fetch (Company News):', error);
  }
});

/**
 * Scheduled Grok fetch - Funding (every 4 hours)
 */
exports.scheduledGrokFetchFunding = onSchedule({
  schedule: 'every 4 hours',
  region: 'us-central1',
  timeZone: 'Africa/Lagos',
  secrets: ['XAI_API_KEY']
}, async (event) => {
  try {
    logger.info('Starting scheduled Grok fetch - Funding');
    const { GrokCategory } = require('./src/types/constants');
    const result = await grokTrendsHandlers.scheduledFetch(GrokCategory.FUNDING);
    logger.info('Scheduled Grok fetch (Funding) completed', result);
  } catch (error) {
    logger.error('Error in scheduled Grok fetch (Funding):', error);
  }
});
