/**
 * Cloudinary Monitoring Service
 * 
 * Tracks Cloudinary usage, transformations, and costs
 * Provides utilities for monitoring and optimization
 */

const { db } = require('../config/firebase');
const { CollectionNames } = require('../types/constants');
const logger = require('firebase-functions/logger');

/**
 * Get Cloudinary usage statistics from Firestore
 * @returns {Promise<Object>} Usage statistics
 */
async function getCloudinaryStats() {
  try {
    const mediaSnapshot = await db.collection(CollectionNames.MEDIA).get();
    const mediaDocs = mediaSnapshot.docs.map(doc => doc.data());
    
    // Count total Cloudinary images
    const cloudinaryImages = mediaDocs.filter(doc => 
      doc.public_id || doc.image_id || 
      (doc.url && (doc.url.includes('res.cloudinary.com') || doc.url.includes('cloudinary.com')))
    );
    
    // Count by folder
    const folderCounts = {};
    cloudinaryImages.forEach(doc => {
      const publicId = doc.public_id || doc.image_id || '';
      if (publicId.startsWith('techblit/')) {
        const folder = publicId.split('/')[1] || 'unknown';
        folderCounts[folder] = (folderCounts[folder] || 0) + 1;
      }
    });
    
    // Count migrated images
    const migratedImages = mediaDocs.filter(doc => doc.migratedAt || doc.migratedFrom);
    
    // Count legacy images (Firebase Storage)
    const legacyImages = mediaDocs.filter(doc => 
      doc.url && 
      doc.url.includes('firebasestorage.googleapis.com') && 
      !doc.public_id && 
      !doc.image_id
    );
    
    // Calculate total storage (approximate)
    const totalBytes = mediaDocs.reduce((sum, doc) => {
      return sum + (doc.size || doc.fileSize || 0);
    }, 0);
    
    // Recent uploads (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUploads = mediaDocs.filter(doc => {
      const createdAt = doc.createdAt?.toDate?.() || doc.createdAt || new Date(0);
      return createdAt > sevenDaysAgo;
    });
    
    return {
      total: {
        images: mediaDocs.length,
        cloudinary: cloudinaryImages.length,
        migrated: migratedImages.length,
        legacy: legacyImages.length,
      },
      byFolder: folderCounts,
      storage: {
        totalBytes,
        totalMB: Math.round(totalBytes / 1024 / 1024 * 100) / 100,
        totalGB: Math.round(totalBytes / 1024 / 1024 / 1024 * 100) / 100,
      },
      recent: {
        uploads7Days: recentUploads.length,
        migrated7Days: migratedImages.filter(doc => {
          const migratedAt = doc.migratedAt?.toDate?.() || doc.migratedAt || new Date(0);
          return migratedAt > sevenDaysAgo;
        }).length,
      },
      migration: {
        progress: mediaDocs.length > 0 
          ? Math.round((cloudinaryImages.length / mediaDocs.length) * 100) 
          : 0,
        remaining: legacyImages.length,
      },
      lastUpdated: new Date(),
    };
  } catch (error) {
    logger.error('Error getting Cloudinary stats:', error);
    throw error;
  }
}

/**
 * Get Cloudinary transformation usage
 * Analyzes image URLs to determine transformation patterns
 * @returns {Promise<Object>} Transformation statistics
 */
async function getTransformationStats() {
  try {
    const mediaSnapshot = await db.collection(CollectionNames.MEDIA).get();
    const mediaDocs = mediaSnapshot.docs.map(doc => doc.data());
    
    // Count transformation patterns (from URLs)
    const transformationPatterns = {
      cover: 0,      // w_1200
      inline: 0,    // w_800
      thumbnail: 0, // w_400
      social: 0,    // w_1200,h_630
      custom: 0,
    };
    
    // Analyze URLs for transformation patterns
    mediaDocs.forEach(doc => {
      const url = doc.url || '';
      if (url.includes('res.cloudinary.com')) {
        if (url.includes('w_1200') && url.includes('h_630')) {
          transformationPatterns.social++;
        } else if (url.includes('w_1200')) {
          transformationPatterns.cover++;
        } else if (url.includes('w_800')) {
          transformationPatterns.inline++;
        } else if (url.includes('w_400')) {
          transformationPatterns.thumbnail++;
        } else {
          transformationPatterns.custom++;
        }
      }
    });
    
    return {
      patterns: transformationPatterns,
      totalTransformations: Object.values(transformationPatterns).reduce((a, b) => a + b, 0),
      lastUpdated: new Date(),
    };
  } catch (error) {
    logger.error('Error getting transformation stats:', error);
    throw error;
  }
}

/**
 * Check Cloudinary quota usage (approximate)
 * Note: Actual quota is managed by Cloudinary, this is an estimate
 * @returns {Promise<Object>} Quota information
 */
async function getQuotaEstimate() {
  try {
    const stats = await getCloudinaryStats();
    
    // Cloudinary free tier limits (approximate)
    const FREE_TIER_LIMITS = {
      storage: 25 * 1024 * 1024 * 1024, // 25 GB
      bandwidth: 25 * 1024 * 1024 * 1024, // 25 GB/month
      transformations: 25000, // 25k transformations/month
    };
    
    // Estimate usage
    const estimatedUsage = {
      storage: {
        used: stats.storage.totalBytes,
        limit: FREE_TIER_LIMITS.storage,
        percentage: Math.round((stats.storage.totalBytes / FREE_TIER_LIMITS.storage) * 100),
        unit: 'bytes',
      },
      bandwidth: {
        // Estimate: assume each image is viewed 10 times on average
        estimated: stats.total.cloudinary * 10 * (stats.storage.totalBytes / stats.total.cloudinary || 0),
        limit: FREE_TIER_LIMITS.bandwidth,
        percentage: 0, // Will be calculated based on actual usage
        unit: 'bytes',
      },
      transformations: {
        // Estimate based on transformation patterns
        estimated: stats.total.cloudinary * 5, // Assume 5 transformations per image
        limit: FREE_TIER_LIMITS.transformations,
        percentage: Math.round(((stats.total.cloudinary * 5) / FREE_TIER_LIMITS.transformations) * 100),
        unit: 'count',
      },
    };
    
    // Check if approaching limits
    const warnings = [];
    if (estimatedUsage.storage.percentage > 80) {
      warnings.push('Storage usage is above 80%');
    }
    if (estimatedUsage.transformations.percentage > 80) {
      warnings.push('Transformation usage is above 80%');
    }
    
    return {
      limits: FREE_TIER_LIMITS,
      usage: estimatedUsage,
      warnings,
      lastUpdated: new Date(),
    };
  } catch (error) {
    logger.error('Error getting quota estimate:', error);
    throw error;
  }
}

/**
 * Get optimization recommendations
 * @returns {Promise<Object>} Optimization recommendations
 */
async function getOptimizationRecommendations() {
  try {
    const stats = await getCloudinaryStats();
    const quota = await getQuotaEstimate();
    const recommendations = [];
    
    // Check migration progress
    if (stats.migration.remaining > 0) {
      recommendations.push({
        type: 'migration',
        priority: 'high',
        message: `${stats.migration.remaining} images still need migration to Cloudinary`,
        action: 'Run migration script to complete migration',
      });
    }
    
    // Check storage usage
    if (quota.usage.storage.percentage > 70) {
      recommendations.push({
        type: 'storage',
        priority: 'medium',
        message: `Storage usage is at ${quota.usage.storage.percentage}%`,
        action: 'Consider cleaning up unused images or upgrading plan',
      });
    }
    
    // Check for duplicate uploads
    const mediaSnapshot = await db.collection(CollectionNames.MEDIA).get();
    const publicIds = new Set();
    const duplicates = [];
    
    mediaSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const publicId = data.public_id || data.image_id;
      if (publicId) {
        if (publicIds.has(publicId)) {
          duplicates.push({ id: doc.id, public_id: publicId });
        }
        publicIds.add(publicId);
      }
    });
    
    if (duplicates.length > 0) {
      recommendations.push({
        type: 'duplicates',
        priority: 'low',
        message: `Found ${duplicates.length} potential duplicate images`,
        action: 'Review and remove duplicate entries',
      });
    }
    
    // Check for large images
    const largeImages = mediaSnapshot.docs.filter(doc => {
      const size = doc.data().size || doc.data().fileSize || 0;
      return size > 2 * 1024 * 1024; // > 2MB
    });
    
    if (largeImages.length > 0) {
      recommendations.push({
        type: 'large_images',
        priority: 'low',
        message: `${largeImages.length} images are larger than 2MB`,
        action: 'Consider optimizing large images before upload',
      });
    }
    
    return {
      recommendations,
      duplicates: duplicates.length,
      largeImages: largeImages.length,
      lastUpdated: new Date(),
    };
  } catch (error) {
    logger.error('Error getting optimization recommendations:', error);
    throw error;
  }
}

/**
 * Log Cloudinary operation for monitoring
 * @param {string} operation - Operation type (upload, delete, transform)
 * @param {Object} metadata - Operation metadata
 */
function logOperation(operation, metadata = {}) {
  logger.info('Cloudinary operation:', {
    operation,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

module.exports = {
  getCloudinaryStats,
  getTransformationStats,
  getQuotaEstimate,
  getOptimizationRecommendations,
  logOperation,
};

