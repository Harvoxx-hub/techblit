const { db } = require('../config/firebase');
const admin = require('firebase-admin');
const { CollectionNames } = require('../types/constants');
const { createAuditLog } = require('../utils/helpers');
const { generateSitemapXML } = require('../utils/sitemapGenerator');
const logger = require('firebase-functions/logger');

/**
 * Safely convert Firestore Timestamp or Date to ISO string
 * @param {any} dateValue - Firestore Timestamp, Date, or string
 * @returns {string|null} - ISO string or null
 */
function toISOString(dateValue) {
  if (!dateValue) return null;
  if (dateValue.toDate && typeof dateValue.toDate === 'function') {
    // Firestore Timestamp
    return dateValue.toDate().toISOString();
  }
  if (dateValue.toISOString && typeof dateValue.toISOString === 'function') {
    // Date object
    return dateValue.toISOString();
  }
  // Already a string or other type
  return dateValue;
}

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

      // Convert Firestore Timestamp to Date if needed
      const scheduledAtDate = postData.scheduledAt?.toDate ? postData.scheduledAt.toDate() : postData.scheduledAt;

      logger.info(`Publishing scheduled post: ${postId}`, {
        title: postData.title,
        scheduledAt: scheduledAtDate,
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
            note: `Post automatically published from scheduled time: ${toISOString(scheduledAtDate) || scheduledAtDate}`
          }
        ]
      };

      // Update the post
      const updatePromise = doc.ref.update(updateData).then(async () => {
        // Create audit log
        const auditLog = createAuditLog('post_auto_published', 'system', postId, {
          title: postData.title,
          scheduledAt: scheduledAtDate,
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
      "datePublished": toISOString(postData.publishedAt),
      "dateModified": toISOString(postData.updatedAt),
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
 * Update sitemap - Regenerates and optionally caches the sitemap
 * This function handles errors gracefully so it doesn't break the publishing process
 */
async function updateSitemap() {
  try {
    let siteUrl = process.env.SITE_URL || 'https://www.techblit.com';
    // Ensure www version for consistency
    siteUrl = siteUrl.replace(/^https?:\/\/(?!www\.)/, 'https://www.');
    logger.info('Regenerating sitemap...');
    
    // Generate the sitemap XML
    const sitemapData = await generateSitemapXML(siteUrl);
    
    logger.info(`Sitemap regenerated successfully with ${sitemapData.postCount} posts`);
    
    // Determine sitemap URL (could be Cloud Storage URL or endpoint URL)
    let sitemapUrl = `${siteUrl}/sitemap.xml`; // Default to site URL
    
    // Optionally cache the sitemap in Cloud Storage for faster access
    // This is useful if you have a CDN or want to reduce Firestore reads
    const cacheToStorage = process.env.CACHE_SITEMAP_TO_STORAGE === 'true';
    
    if (cacheToStorage) {
      try {
        // Initialize storage only if needed (legacy feature - Storage API not enabled)
        const storage = admin.storage();
        const bucket = storage.bucket();
        const file = bucket.file('sitemap.xml');
        
        await file.save(sitemapData.xml, {
          metadata: {
            contentType: 'application/xml',
            cacheControl: 'public, max-age=3600', // Cache for 1 hour
          },
        });
        
        // Make the file publicly accessible
        await file.makePublic();
        
        // Get public URL
        sitemapUrl = `https://storage.googleapis.com/${bucket.name}/sitemap.xml`;
        
        logger.info(`Sitemap cached to Cloud Storage: ${sitemapUrl}`);
      } catch (storageError) {
        // Don't fail the whole process if storage caching fails (expected since Storage API is not enabled)
        logger.warn('Failed to cache sitemap to Cloud Storage (Storage API not enabled):', storageError);
        // Fallback to endpoint URL
        sitemapUrl = process.env.SITEMAP_ENDPOINT_URL || `${siteUrl}/sitemap.xml`;
      }
    } else {
      // Use the Cloud Function endpoint URL
      sitemapUrl = process.env.SITEMAP_ENDPOINT_URL || 'https://generatesitemap-4alcog3g7q-uc.a.run.app';
    }
    
    // Store sitemap metadata in Firestore for tracking
    try {
      await db.collection(CollectionNames.SETTINGS).doc('sitemap').set({
        lastGenerated: new Date(),
        postCount: sitemapData.postCount,
        generatedAt: sitemapData.generatedAt,
        cached: cacheToStorage,
        sitemapUrl: sitemapUrl
      }, { merge: true });
      
      logger.info('Sitemap metadata updated in Firestore');
    } catch (firestoreError) {
      // Don't fail if metadata update fails
      logger.warn('Failed to update sitemap metadata:', firestoreError);
    }
    
    // Automatically submit sitemap to Google Search Console
    const autoSubmitSitemap = process.env.AUTO_SUBMIT_SITEMAP !== 'false'; // Default to true
    
    if (autoSubmitSitemap) {
      try {
        const { submitSitemapToSearchConsole } = require('../utils/searchConsole');
        const googleClientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        const googlePrivateKey = process.env.GOOGLE_PRIVATE_KEY;

        if (googleClientEmail && googlePrivateKey) {
          logger.info(`Submitting sitemap to Google Search Console: ${sitemapUrl}`);
          
          const submitResult = await submitSitemapToSearchConsole(sitemapUrl, siteUrl);
          
          if (submitResult.success) {
            logger.info('Sitemap successfully submitted to Google Search Console');
            
            // Update metadata with submission status
            await db.collection(CollectionNames.SETTINGS).doc('sitemap').update({
              searchConsoleSubmitted: true,
              searchConsoleSubmittedAt: new Date(),
              searchConsoleSitemapUrl: sitemapUrl
            }).catch(() => {}); // Ignore errors
          } else {
            logger.warn(`Failed to submit sitemap to Search Console: ${submitResult.error}`);
          }
        } else {
          logger.info('Google Search Console credentials not configured, skipping sitemap submission');
        }
      } catch (submitError) {
        // Don't fail the whole process if submission fails
        logger.warn('Error submitting sitemap to Search Console:', submitError.message);
      }
    }
    
    return {
      success: true,
      postCount: sitemapData.postCount,
      generatedAt: sitemapData.generatedAt,
      sitemapUrl: sitemapUrl
    };

  } catch (error) {
    // Log error but don't throw - we don't want to fail the publishing process
    logger.error('Error updating sitemap:', error);
    return {
      success: false,
      error: error.message
    };
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
      publishedAt: toISOString(postData.publishedAt)
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
 * Submits new/updated post URLs to Google for faster indexing
 */
async function indexWithGoogle(postId, postData) {
  try {
    const { submitUrlToIndexing } = require('../utils/googleIndexing');
    let siteUrl = process.env.SITE_URL || 'https://www.techblit.com';
    // Ensure www version for consistency
    siteUrl = siteUrl.replace(/^https?:\/\/(?!www\.)/, 'https://www.');
    
    // Check if Google Indexing API is configured
    const googleClientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const googlePrivateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!googleClientEmail || !googlePrivateKey) {
      logger.info('Google Indexing API not configured (missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY), skipping');
      return {
        success: false,
        skipped: true,
        reason: 'Not configured'
      };
    }

    // Only index published posts
    if (postData.status !== 'published') {
      logger.info(`Skipping Google indexing for non-published post: ${postId}`);
      return {
        success: false,
        skipped: true,
        reason: 'Post not published'
      };
    }

    // Skip posts with noindex set to true
    if (postData.seo?.noindex === true) {
      logger.info(`Skipping Google indexing for post with noindex: ${postId}`);
      return {
        success: false,
        skipped: true,
        reason: 'Post has noindex set'
      };
    }

    // Construct the post URL
    const postUrl = `${siteUrl}/${postData.slug}`;
    
    if (!postData.slug) {
      logger.warn(`Cannot index post ${postId}: missing slug`);
      return {
        success: false,
        error: 'Missing slug'
      };
    }

    logger.info(`Submitting URL to Google Indexing API: ${postUrl}`);

    // Submit URL to Google Indexing API
    // Use URL_UPDATED for new posts or updated posts
    const result = await submitUrlToIndexing(postUrl, 'URL_UPDATED');

    if (result.success) {
      logger.info(`Successfully submitted post to Google Indexing API: ${postId} (${postUrl})`);
      
      // Store indexing status in Firestore for tracking
      try {
        await db.collection(CollectionNames.POSTS).doc(postId).update({
          googleIndexing: {
            submitted: true,
            submittedAt: new Date(),
            url: postUrl,
            type: 'URL_UPDATED'
          }
        });
      } catch (firestoreError) {
        // Don't fail if metadata update fails
        logger.warn(`Failed to update Google indexing metadata for post ${postId}:`, firestoreError);
      }
    } else {
      logger.warn(`Failed to submit post to Google Indexing API: ${postId}`, result.error);
    }

    return result;

  } catch (error) {
    // Log error but don't throw - we don't want to fail the publishing process
    logger.error(`Error indexing with Google for ${postId}:`, error);
    return {
      success: false,
      error: error.message
    };
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
