const { db } = require('../config/firebase');
const { CollectionNames } = require('../types/constants');
const logger = require('firebase-functions/logger');

/**
 * Migrate published post to publicPosts collection for read optimization
 * @param {string} postId - The ID of the post to migrate
 * @param {Object} postData - The post data to migrate
 * @returns {Promise<boolean>} - Success status
 */
async function migratePostToPublic(postId, postData) {
  try {
    // Only migrate published posts
    if (postData.status !== 'published') {
      logger.info(`Skipping migration for non-published post: ${postId} (status: ${postData.status})`);
      return false;
    }

    // Create optimized data structure for public consumption
    const publicPostData = {
      // Core content
      id: postId,
      title: postData.title,
      slug: postData.slug,
      excerpt: postData.excerpt,
      contentHtml: postData.contentHtml,
      
      // Author info (simplified)
      author: {
        name: postData.author?.name || 'Unknown Author',
        uid: postData.author?.uid || ''
      },
      
      // Dates
      publishedAt: postData.publishedAt,
      updatedAt: postData.updatedAt,
      createdAt: postData.createdAt,
      
      // SEO & Meta
      metaTitle: postData.metaTitle,
      metaDescription: postData.metaDescription,
      canonical: postData.canonical,
      
      // Content organization
      tags: postData.tags || [],
      categories: postData.categories || [],
      
      // Media
      featuredImage: postData.featuredImage ? {
        url: postData.featuredImage.url,
        alt: postData.featuredImage.alt || postData.title,
        width: postData.featuredImage.width || 0,
        height: postData.featuredImage.height || 0
      } : null,
      
      // Social media
      social: postData.social || {},
      
      // SEO settings
      seo: {
        noindex: postData.seo?.noindex || false,
        nofollow: postData.seo?.nofollow || false
      },
      
      // Visibility
      visibility: postData.visibility || 'public',
      
      // Structured data (if available)
      structuredData: postData.structuredData || null,
      
      // Migration metadata
      migratedAt: new Date(),
      sourceCollection: 'posts',
      sourceId: postId
    };

    // Write to publicPosts collection
    await db.collection(CollectionNames.PUBLIC_POSTS).doc(postId).set(publicPostData);
    
    logger.info(`Successfully migrated post to publicPosts: ${postId}`, {
      title: postData.title,
      slug: postData.slug
    });

    return true;

  } catch (error) {
    logger.error(`Error migrating post to publicPosts: ${postId}`, {
      error: error.message,
      title: postData.title
    });
    throw error;
  }
}

/**
 * Remove post from publicPosts collection (when unpublished)
 * @param {string} postId - The ID of the post to remove
 * @returns {Promise<boolean>} - Success status
 */
async function removePostFromPublic(postId) {
  try {
    const publicPostRef = db.collection(CollectionNames.PUBLIC_POSTS).doc(postId);
    const publicPostDoc = await publicPostRef.get();
    
    if (publicPostDoc.exists) {
      await publicPostRef.delete();
      logger.info(`Removed post from publicPosts: ${postId}`);
      return true;
    } else {
      logger.info(`Post not found in publicPosts: ${postId}`);
      return false;
    }

  } catch (error) {
    logger.error(`Error removing post from publicPosts: ${postId}`, {
      error: error.message
    });
    throw error;
  }
}

/**
 * Sync post status with publicPosts collection
 * @param {string} postId - The ID of the post
 * @param {Object} postData - The current post data
 * @param {string} oldStatus - The previous status
 * @param {string} newStatus - The new status
 * @returns {Promise<boolean>} - Success status
 */
async function syncPostWithPublic(postId, postData, oldStatus, newStatus) {
  try {
    // If post was just published, migrate to publicPosts
    if (newStatus === 'published' && oldStatus !== 'published') {
      return await migratePostToPublic(postId, postData);
    }
    
    // If post was unpublished, remove from publicPosts
    if (oldStatus === 'published' && newStatus !== 'published') {
      return await removePostFromPublic(postId);
    }
    
    // If post is published and being updated, update publicPosts
    if (newStatus === 'published' && oldStatus === 'published') {
      return await migratePostToPublic(postId, postData);
    }
    
    // No action needed for other status changes
    logger.info(`No publicPosts sync needed for status change: ${oldStatus} -> ${newStatus}`, {
      postId
    });
    
    return true;

  } catch (error) {
    logger.error(`Error syncing post with publicPosts: ${postId}`, {
      error: error.message,
      oldStatus,
      newStatus
    });
    throw error;
  }
}

/**
 * Migrate all published posts to publicPosts collection
 * Useful for initial setup or bulk migration
 * @returns {Promise<{migrated: number, errors: number}>} - Migration results
 */
async function migrateAllPublishedPosts() {
  try {
    logger.info('Starting bulk migration of published posts to publicPosts');
    
    const publishedPostsQuery = db.collection(CollectionNames.POSTS)
      .where('status', '==', 'published');
    
    const publishedPostsSnapshot = await publishedPostsQuery.get();
    
    let migrated = 0;
    let errors = 0;
    
    for (const doc of publishedPostsSnapshot.docs) {
      try {
        await migratePostToPublic(doc.id, doc.data());
        migrated++;
      } catch (error) {
        logger.error(`Error migrating post ${doc.id}:`, error);
        errors++;
      }
    }
    
    logger.info('Bulk migration completed', {
      total: publishedPostsSnapshot.size,
      migrated,
      errors
    });
    
    return { migrated, errors };

  } catch (error) {
    logger.error('Error in bulk migration:', error);
    throw error;
  }
}

/**
 * Get statistics about publicPosts collection
 * @returns {Promise<Object>} - Collection statistics
 */
async function getPublicPostsStats() {
  try {
    const publicPostsSnapshot = await db.collection(CollectionNames.PUBLIC_POSTS).get();
    const publishedPostsSnapshot = await db.collection(CollectionNames.POSTS)
      .where('status', '==', 'published').get();
    
    return {
      publicPostsCount: publicPostsSnapshot.size,
      publishedPostsCount: publishedPostsSnapshot.size,
      syncStatus: publicPostsSnapshot.size === publishedPostsSnapshot.size ? 'synced' : 'out_of_sync',
      lastChecked: new Date()
    };

  } catch (error) {
    logger.error('Error getting publicPosts stats:', error);
    throw error;
  }
}

module.exports = {
  migratePostToPublic,
  removePostFromPublic,
  syncPostWithPublic,
  migrateAllPublishedPosts,
  getPublicPostsStats,
  
  // HTTP handlers
  migrateAllPublishedPostsHandler: async (req, res) => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      
      const result = await migrateAllPublishedPosts();
      
      res.status(200).json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('Error in migrateAllPublishedPosts handler', {
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  getPublicPostsStatsHandler: async (req, res) => {
    try {
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      
      const stats = await getPublicPostsStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      logger.error('Error in getPublicPostsStats handler', {
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};
