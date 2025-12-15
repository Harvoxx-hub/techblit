// Categories handlers

const { db } = require('../config/firebase');
const { CollectionNames } = require('../types/constants');
const { formatErrorResponse, formatSuccessResponse } = require('../utils/helpers');
const logger = require('firebase-functions/logger');

/**
 * Get all categories
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function getAllCategories(req, res) {
  try {
    const snapshot = await db.collection(CollectionNames.CATEGORIES)
      .orderBy('name', 'asc')
      .get();
    
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(formatSuccessResponse(categories, 'Categories retrieved successfully'));
  } catch (error) {
    logger.error('Error retrieving categories:', error);
    res.status(500).json(formatErrorResponse('Error retrieving categories', 500, { error: error.message }));
  }
}

/**
 * Get posts by category
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function getPostsByCategory(req, res) {
  try {
    const { slug } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    let category = null;
    let categoryName = null;
    
    // Try to get category by slug (exact match)
    let categorySnapshot = await db.collection(CollectionNames.CATEGORIES)
      .where('slug', '==', slug)
      .limit(1)
      .get();
    
    // If not found, try case-insensitive match
    if (categorySnapshot.empty) {
      const allCategoriesSnapshot = await db.collection(CollectionNames.CATEGORIES).get();
      const matchingCategory = allCategoriesSnapshot.docs.find(doc => {
        const catData = doc.data();
        return catData.slug?.toLowerCase() === slug.toLowerCase();
      });
      
      if (matchingCategory) {
        category = matchingCategory.data();
        categoryName = category.name;
      }
    } else {
      category = categorySnapshot.docs[0].data();
      categoryName = category.name;
    }
    
    // If still no category found, try to derive category name from slug
    // Common mappings: 'startup' -> 'Startup', 'tech-news' -> 'Tech News', 'events' -> 'Events'
    if (!categoryName) {
      // Convert slug to category name (capitalize first letter, replace hyphens with spaces)
      categoryName = slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      // Special cases
      const slugToNameMap = {
        'startup': 'Startup',
        'tech-news': 'Tech News',
        'tech news': 'Tech News',
        'events': 'Events',
        'brand-press': 'Brand Press',
        'brand press': 'Brand Press',
        'ai-innovation': 'AI & Innovation',
        'developer-tools': 'Developer Tools'
      };
      
      if (slugToNameMap[slug.toLowerCase()]) {
        categoryName = slugToNameMap[slug.toLowerCase()];
      }
      
      // Create a virtual category object
      category = {
        name: categoryName,
        slug: slug,
        id: slug
      };
    }
    
    // Get posts in this category
    // Try multiple query strategies
    let posts = [];
    let postsSnapshot;
    
    // Strategy 1: Try array-contains with categories field
    try {
      let postsQuery = db.collection(CollectionNames.POSTS)
        .where('status', '==', 'published')
        .where('categories', 'array-contains', categoryName);
      
      // Only add orderBy if publishedAt exists and is indexed
      try {
        postsQuery = postsQuery.orderBy('publishedAt', 'desc');
      } catch (orderError) {
        logger.warn(`Cannot orderBy publishedAt, will sort manually: ${orderError.message}`);
      }
      
      postsQuery = postsQuery.limit(parseInt(limit) * 2); // Fetch more to ensure we have enough
      postsSnapshot = await postsQuery.get();
      posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      logger.info(`Found ${posts.length} posts using categories array-contains for "${categoryName}"`);
    } catch (arrayError) {
      logger.warn(`Array-contains query failed: ${arrayError.message}`);
      
      // Strategy 2: Try with category field (single string)
      try {
        let postsQuery = db.collection(CollectionNames.POSTS)
          .where('status', '==', 'published')
          .where('category', '==', categoryName);
        
        try {
          postsQuery = postsQuery.orderBy('publishedAt', 'desc');
        } catch (orderError) {
          // Ignore orderBy error
        }
        
        postsQuery = postsQuery.limit(parseInt(limit) * 2);
        postsSnapshot = await postsQuery.get();
        posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        logger.info(`Found ${posts.length} posts using category field for "${categoryName}"`);
      } catch (categoryFieldError) {
        logger.warn(`Category field query also failed: ${categoryFieldError.message}`);
        
        // Strategy 3: Fetch all published posts and filter manually
        try {
          let allPostsQuery = db.collection(CollectionNames.POSTS)
            .where('status', '==', 'published');
          
          try {
            allPostsQuery = allPostsQuery.orderBy('publishedAt', 'desc');
          } catch (orderError) {
            // Ignore orderBy error
          }
          
          allPostsQuery = allPostsQuery.limit(parseInt(limit) * 5); // Fetch more to filter
          postsSnapshot = await allPostsQuery.get();
          posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          logger.info(`Fetched ${posts.length} total posts, will filter for "${categoryName}"`);
        } catch (allPostsError) {
          logger.error(`Failed to fetch all posts: ${allPostsError.message}`);
          posts = [];
        }
      }
    }
    
    // Always filter posts by category (case-insensitive)
    if (posts.length > 0) {
      const categoryLower = categoryName.toLowerCase();
      const slugLower = slug.toLowerCase();
      
      posts = posts.filter(post => {
        const postCategory = post.category?.toLowerCase();
        const postCategories = (post.categories || []).map(cat => String(cat).toLowerCase());
        
        return postCategory === categoryLower || 
               postCategory === slugLower ||
               postCategories.includes(categoryLower) ||
               postCategories.includes(slugLower);
      });
      
      // Sort by publishedAt if available
      posts.sort((a, b) => {
        const aDate = a.publishedAt?.toDate ? a.publishedAt.toDate() : (a.publishedAt ? new Date(a.publishedAt) : new Date(0));
        const bDate = b.publishedAt?.toDate ? b.publishedAt.toDate() : (b.publishedAt ? new Date(b.publishedAt) : new Date(0));
        return bDate.getTime() - aDate.getTime();
      });
      
      // Limit to requested amount
      posts = posts.slice(0, parseInt(limit));
      
      logger.info(`Filtered to ${posts.length} posts for category "${categoryName}"`);
    }
    
    res.json(formatSuccessResponse({
      category,
      posts
    }, 'Category posts retrieved successfully'));
  } catch (error) {
    logger.error('Error retrieving category posts:', error);
    res.status(500).json(formatErrorResponse('Error retrieving category posts', 500, { error: error.message }));
  }
}

module.exports = {
  getAllCategories,
  getPostsByCategory
};

