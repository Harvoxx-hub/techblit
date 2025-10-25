const { db } = require('../config/firebase');
const { CollectionNames } = require('../types/constants');
const { createAuditLog } = require('../utils/helpers');
const logger = require('firebase-functions/logger');

/**
 * Process scheduled posts that are ready to be published
 * This function should be called by a cron job every minute
 */
async function processScheduledPosts() {
  try {
    const now = new Date();
    
    // Find posts that are scheduled and ready to be published
    const scheduledPostsSnapshot = await db.collection(CollectionNames.POSTS)
      .where('status', '==', 'scheduled')
      .where('scheduledAt', '<=', now)
      .get();

    if (scheduledPostsSnapshot.empty) {
      logger.info('No scheduled posts ready for publishing');
      return { processed: 0 };
    }

    const publishPromises = [];
    let processedCount = 0;

    for (const doc of scheduledPostsSnapshot.docs) {
      const postData = doc.data();
      const postId = doc.id;

      logger.info(`Publishing scheduled post: ${postId}`, {
        title: postData.title,
        scheduledAt: postData.scheduledAt,
        author: postData.author?.name
      });

      // Update post status to published
      const updateData = {
        status: 'published',
        publishedAt: now,
        updatedAt: now,
        history: [
          ...(postData.history || []),
          {
            action: 'published',
            by: 'system',
            at: now.toISOString(),
            note: `Post automatically published from scheduled time: ${postData.scheduledAt.toISOString()}`
          }
        ]
      };

      // Update the post
      const updatePromise = doc.ref.update(updateData).then(async () => {
        // Create audit log
        const auditLog = createAuditLog('post_auto_published', 'system', postId, {
          title: postData.title,
          scheduledAt: postData.scheduledAt,
          publishedAt: now
        });
        
        await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
        processedCount++;
        
        // Trigger post-publish actions
        await triggerPostPublishActions(postId, postData);
      });

      publishPromises.push(updatePromise);
    }

    // Wait for all posts to be processed
    await Promise.all(publishPromises);

    logger.info(`Successfully processed ${processedCount} scheduled posts`);
    return { processed: processedCount };

  } catch (error) {
    logger.error('Error processing scheduled posts:', error);
    throw error;
  }
}

/**
 * Trigger post-publish actions for a newly published post
 */
async function triggerPostPublishActions(postId, postData) {
  try {
    logger.info(`Triggering post-publish actions for: ${postId}`);

    // 1. Generate structured data (JSON-LD)
    await generateStructuredData(postId, postData);

    // 2. Trigger ISR revalidation (if using Vercel)
    await triggerISRRevalidation(postId);

    // 3. Update sitemap
    await updateSitemap();

    // 4. Send social share webhook (if configured)
    await sendSocialShareWebhook(postId, postData);

    // 5. Index with Google (if configured)
    await indexWithGoogle(postId, postData);

    // 6. Update RSS feed
    await updateRSSFeed();

    logger.info(`Post-publish actions completed for: ${postId}`);

  } catch (error) {
    logger.error(`Error in post-publish actions for ${postId}:`, error);
    // Don't throw - we don't want to fail the main publishing process
  }
}

/**
 * Generate structured data (JSON-LD) for the post
 */
async function generateStructuredData(postId, postData) {
  try {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": postData.title,
      "description": postData.excerpt,
      "author": {
        "@type": "Person",
        "name": postData.author?.name || "Unknown Author"
      },
      "datePublished": postData.publishedAt?.toISOString(),
      "dateModified": postData.updatedAt?.toISOString(),
      "url": `https://techblit.com/${postData.slug}`,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://techblit.com/${postData.slug}`
      }
    };

    if (postData.featuredImage?.url) {
      structuredData.image = {
        "@type": "ImageObject",
        "url": postData.featuredImage.url,
        "width": postData.featuredImage.width || 1200,
        "height": postData.featuredImage.height || 630
      };
    }

    // Store structured data in Firestore for retrieval by the frontend
    await db.collection(CollectionNames.POSTS).doc(postId).update({
      structuredData: structuredData
    });

    logger.info(`Generated structured data for post: ${postId}`);

  } catch (error) {
    logger.error(`Error generating structured data for ${postId}:`, error);
  }
}

/**
 * Trigger ISR revalidation (for Vercel)
 */
async function triggerISRRevalidation(postId) {
  try {
    const revalidateUrl = process.env.VERCEL_REVALIDATE_URL;
    const revalidateSecret = process.env.VERCEL_REVALIDATE_SECRET;

    if (!revalidateUrl || !revalidateSecret) {
      logger.info('ISR revalidation not configured, skipping');
      return;
    }

    const response = await fetch(revalidateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${revalidateSecret}`
      },
      body: JSON.stringify({
        paths: [`/${postId}`, '/'] // Revalidate the post page and homepage
      })
    });

    if (response.ok) {
      logger.info(`ISR revalidation triggered for post: ${postId}`);
    } else {
      logger.warn(`ISR revalidation failed for post ${postId}: ${response.statusText}`);
    }

  } catch (error) {
    logger.error(`Error triggering ISR revalidation for ${postId}:`, error);
  }
}

/**
 * Update sitemap
 */
async function updateSitemap() {
  try {
    // This could trigger a sitemap regeneration or update
    // For now, we'll just log that it should be updated
    logger.info('Sitemap update triggered');
    
    // In a real implementation, you might:
    // 1. Call a Cloud Function to regenerate the sitemap
    // 2. Update a cached sitemap in Cloud Storage
    // 3. Trigger a build process that includes sitemap generation

  } catch (error) {
    logger.error('Error updating sitemap:', error);
  }
}

/**
 * Send social share webhook
 */
async function sendSocialShareWebhook(postId, postData) {
  try {
    const webhookUrl = process.env.SOCIAL_SHARE_WEBHOOK_URL;

    if (!webhookUrl) {
      logger.info('Social share webhook not configured, skipping');
      return;
    }

    const webhookData = {
      postId,
      title: postData.title,
      excerpt: postData.excerpt,
      url: `https://techblit.com/${postData.slug}`,
      image: postData.featuredImage?.url,
      publishedAt: postData.publishedAt?.toISOString()
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookData)
    });

    if (response.ok) {
      logger.info(`Social share webhook sent for post: ${postId}`);
    } else {
      logger.warn(`Social share webhook failed for post ${postId}: ${response.statusText}`);
    }

  } catch (error) {
    logger.error(`Error sending social share webhook for ${postId}:`, error);
  }
}

/**
 * Index with Google Indexing API
 */
async function indexWithGoogle(postId, postData) {
  try {
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const googleClientEmail = process.env.GOOGLE_CLIENT_EMAIL;

    if (!googleApiKey || !googleClientEmail) {
      logger.info('Google Indexing API not configured, skipping');
      return;
    }

    // This is a simplified implementation
    // In a real implementation, you would use the Google Indexing API
    // to request indexing of the new post URL
    
    const postUrl = `https://techblit.com/${postData.slug}`;
    logger.info(`Google indexing requested for: ${postUrl}`);

    // TODO: Implement actual Google Indexing API call
    // const indexingResponse = await googleIndexingApi.indexUrl(postUrl);

  } catch (error) {
    logger.error(`Error indexing with Google for ${postId}:`, error);
  }
}

/**
 * Update RSS feed
 */
async function updateRSSFeed() {
  try {
    logger.info('RSS feed update triggered');
    
    // In a real implementation, you would:
    // 1. Generate/update the RSS feed XML
    // 2. Store it in Cloud Storage
    // 3. Update the feed with the new post

  } catch (error) {
    logger.error('Error updating RSS feed:', error);
  }
}

module.exports = {
  processScheduledPosts,
  triggerPostPublishActions
};
