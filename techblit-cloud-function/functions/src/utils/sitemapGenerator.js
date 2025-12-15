const { db } = require('../config/firebase');
const { CollectionNames } = require('../types/constants');
const logger = require('firebase-functions/logger');

/**
 * Helper function to convert Firestore timestamp to ISO string
 */
function toISOString(timestamp) {
  if (!timestamp) return new Date().toISOString();
  if (timestamp.toDate) return timestamp.toDate().toISOString();
  if (timestamp instanceof Date) return timestamp.toISOString();
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toISOString();
  return new Date().toISOString();
}

/**
 * Helper function to calculate priority based on post age
 */
function calculatePriority(publishedAt) {
  if (!publishedAt) return 0.7;
  
  let publishDate;
  if (publishedAt.toDate) {
    publishDate = publishedAt.toDate();
  } else if (publishedAt.seconds) {
    publishDate = new Date(publishedAt.seconds * 1000);
  } else if (publishedAt instanceof Date) {
    publishDate = publishedAt;
  } else {
    return 0.7;
  }

  const postAge = Date.now() - publishDate.getTime();
  const daysSincePublished = postAge / (1000 * 60 * 60 * 24);
  
  if (daysSincePublished < 7) return 0.9;
  if (daysSincePublished < 30) return 0.8;
  if (daysSincePublished < 90) return 0.7;
  return 0.6;
}

/**
 * Fetch all published posts with pagination
 */
async function fetchAllPublishedPosts() {
  let allPosts = [];
  let lastDoc = null;
  const batchSize = 500; // Firestore limit is 500 per query
  
  // Fetch from posts collection
  const collectionName = CollectionNames.POSTS;
  
  try {
    logger.info(`Fetching published posts from ${collectionName} collection`);
    
    let snapshot;
    do {
      let query = db.collection(collectionName)
        .where('status', '==', 'published')
        .orderBy('publishedAt', 'desc')
        .limit(batchSize);
      
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
      
      snapshot = await query.get();
      
      logger.info(`Fetched ${snapshot.size} posts from ${collectionName} (batch ${Math.floor(allPosts.length / batchSize) + 1})`);
      
      if (snapshot.empty) break;
      
      const batchPosts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          slug: data.slug,
          publishedAt: data.publishedAt,
          updatedAt: data.updatedAt || data.publishedAt,
          featuredImage: data.featuredImage,
          title: data.title,
          category: data.category || data.categories?.[0]
        };
      }).filter(post => post.slug); // Filter out posts without slugs
      
      allPosts = allPosts.concat(batchPosts);
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      
    } while (lastDoc && snapshot.docs.length === batchSize);
    
    logger.info(`Successfully fetched ${allPosts.length} published posts from ${collectionName}`);
    
  } catch (error) {
    logger.error(`Failed to fetch from ${collectionName} collection:`, error.message);
    
    // If it's an index error, provide helpful message
    if (error.message && error.message.includes('index')) {
      logger.error('Firestore index missing! Create a composite index for:');
      logger.error(`  Collection: ${collectionName}`);
      logger.error('  Fields: status (Ascending), publishedAt (Descending)');
      logger.error('  Go to: Firebase Console > Firestore > Indexes');
    }
    
    // Return empty array on error
    return [];
  }
  
  // Log final count
  logger.info(`Total published posts found: ${allPosts.length}`);
  
  return allPosts;
}

/**
 * Generate sitemap XML string
 * @param {string} siteUrl - The base URL of the site
 * @returns {Promise<{xml: string, postCount: number}>} - The sitemap XML and post count
 */
async function generateSitemapXML(siteUrl) {
  try {
    // Ensure siteUrl uses www version for consistency
    const normalizedSiteUrl = siteUrl.replace(/^https?:\/\/(?!www\.)/, 'https://www.');
    
    const allPosts = await fetchAllPublishedPosts();
    
    // Helper function to convert Firebase Storage token URL to public URL
    function convertToPublicUrl(tokenUrl) {
      if (!tokenUrl || !tokenUrl.includes('firebasestorage.googleapis.com')) {
        return tokenUrl; // Not a Firebase Storage URL, return as-is
      }
      
      try {
        // Parse Firebase Storage URL pattern
        // Pattern: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token=xxx
        const url = new URL(tokenUrl);
        const pathMatch = url.pathname.match(/\/v0\/b\/([^/]+)\/o\/(.+)/);
        
        if (pathMatch) {
          const bucket = pathMatch[1];
          const encodedPath = pathMatch[2];
          const decodedPath = decodeURIComponent(encodedPath);
          
          // Construct public URL: https://storage.googleapis.com/{bucket}/{path}
          return `https://storage.googleapis.com/${bucket}/${decodedPath}`;
        }
      } catch (error) {
        logger.warn('Failed to convert token URL to public URL:', error.message);
      }
      
      return tokenUrl; // Return original if conversion fails
    }
    
    // Helper function to get image URL from featured image
    // Converts token-based URLs to public URLs for better SEO
    function getImageUrl(featuredImage) {
      if (!featuredImage) return null;
      
      let imageUrl = null;
      
      // ProcessedImage format (has original, ogImage, etc.)
      if (featuredImage.original && featuredImage.original.url) {
        imageUrl = featuredImage.original.url;
      }
      // OG image format (preferred for SEO)
      else if (featuredImage.ogImage && featuredImage.ogImage.url) {
        imageUrl = featuredImage.ogImage.url;
      }
      // Legacy format (has url directly)
      else if (featuredImage.url) {
        imageUrl = featuredImage.url;
      }
      
      if (!imageUrl) return null;
      
      // Convert token-based URLs to public URLs for better crawlability
      return convertToPublicUrl(imageUrl);
    }
    
    // Helper function to get image alt text
    function getImageAlt(featuredImage, title, category) {
      if (featuredImage && featuredImage.alt) {
        return featuredImage.alt;
      }
      return `${title} - TechBlit${category ? ` coverage of ${category}` : ''}`;
    }
    
    // Build sitemap XML with image namespace
    const now = new Date().toISOString();
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${normalizedSiteUrl}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${normalizedSiteUrl}/about</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;

    // Add blog posts with images
    allPosts.forEach(post => {
      if (!post.slug) return; // Skip posts without slugs
      
      const lastmod = toISOString(post.updatedAt);
      const priority = calculatePriority(post.publishedAt);
      const imageUrl = getImageUrl(post.featuredImage);
      const imageAlt = getImageAlt(post.featuredImage, post.title, post.category);
      
      sitemap += `
  <url>
    <loc>${normalizedSiteUrl}/${encodeURIComponent(post.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority.toFixed(1)}</priority>`;
      
      // Add image tag if featured image exists
      if (imageUrl) {
        // Escape XML special characters in alt text
        const escapedAlt = imageAlt
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
        
        sitemap += `
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:title>${escapedAlt}</image:title>
    </image:image>`;
      }
      
      sitemap += `
  </url>`;
    });
    
    sitemap += '\n</urlset>';
    
    logger.info(`Sitemap generated successfully with ${allPosts.length} posts`);
    
    return {
      xml: sitemap,
      postCount: allPosts.length,
      generatedAt: now
    };
  } catch (error) {
    logger.error('Error generating sitemap XML:', error);
    throw error;
  }
}

module.exports = {
  generateSitemapXML,
  fetchAllPublishedPosts,
  toISOString,
  calculatePriority
};

