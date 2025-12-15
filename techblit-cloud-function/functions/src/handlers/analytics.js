// Analytics handlers

const { db } = require('../config/firebase');
const { CollectionNames } = require('../types/constants');
const { formatErrorResponse, formatSuccessResponse } = require('../utils/helpers');
const logger = require('firebase-functions/logger');
const cloudinaryMonitoring = require('../services/cloudinaryMonitoring');

/**
 * Get analytics dashboard data (Admin only)
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function getAnalytics(req, res) {
  try {
    // Get posts statistics
    const postsSnapshot = await db.collection(CollectionNames.POSTS).get();
    const totalPosts = postsSnapshot.size;
    
    const publishedPosts = postsSnapshot.docs.filter(doc => doc.data().status === 'published').length;
    const draftPosts = postsSnapshot.docs.filter(doc => doc.data().status === 'draft').length;
    
    // Get recent posts
    const recentPostsQuery = db.collection(CollectionNames.POSTS)
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .limit(5);
    
    const recentPostsSnapshot = await recentPostsQuery.get();
    const recentPosts = recentPostsSnapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      publishedAt: doc.data().publishedAt,
      viewCount: doc.data().viewCount || 0
    }));
    
    // Get users statistics
    const usersSnapshot = await db.collection(CollectionNames.USERS).get();
    const totalUsers = usersSnapshot.size;
    
    const recentUsersQuery = db.collection(CollectionNames.USERS)
      .orderBy('createdAt', 'desc')
      .limit(5);
    
    const recentUsersSnapshot = await recentUsersQuery.get();
    const recentUsers = recentUsersSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      email: doc.data().email,
      role: doc.data().role,
      createdAt: doc.data().createdAt
    }));
    
    // Get top posts by views
    const topPostsQuery = db.collection(CollectionNames.POSTS)
      .where('status', '==', 'published')
      .orderBy('viewCount', 'desc')
      .limit(10);
    
    const topPostsSnapshot = await topPostsQuery.get();
    const topPosts = topPostsSnapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      viewCount: doc.data().viewCount || 0,
      publishedAt: doc.data().publishedAt
    }));
    
    // Get Cloudinary statistics
    let cloudinaryStats = null;
    try {
      cloudinaryStats = await cloudinaryMonitoring.getCloudinaryStats();
    } catch (cloudinaryError) {
      logger.warn('Error getting Cloudinary stats:', cloudinaryError);
      // Continue without Cloudinary stats
    }

    res.json(formatSuccessResponse({
      posts: {
        total: totalPosts,
        published: publishedPosts,
        draft: draftPosts,
        recent: recentPosts,
        top: topPosts
      },
      users: {
        total: totalUsers,
        recent: recentUsers
      },
      cloudinary: cloudinaryStats
    }, 'Analytics retrieved successfully'));
  } catch (error) {
    logger.error('Error retrieving analytics:', error);
    res.status(500).json(formatErrorResponse('Error retrieving analytics', 500, { error: error.message }));
  }
}

/**
 * Get Cloudinary-specific analytics
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function getCloudinaryAnalytics(req, res) {
  try {
    const [stats, transformations, quota, recommendations] = await Promise.all([
      cloudinaryMonitoring.getCloudinaryStats(),
      cloudinaryMonitoring.getTransformationStats(),
      cloudinaryMonitoring.getQuotaEstimate(),
      cloudinaryMonitoring.getOptimizationRecommendations(),
    ]);

    res.json(formatSuccessResponse({
      stats,
      transformations,
      quota,
      recommendations,
    }, 'Cloudinary analytics retrieved successfully'));
  } catch (error) {
    logger.error('Error retrieving Cloudinary analytics:', error);
    res.status(500).json(formatErrorResponse('Error retrieving Cloudinary analytics', 500, { error: error.message }));
  }
}

module.exports = {
  getAnalytics,
  getCloudinaryAnalytics
};

