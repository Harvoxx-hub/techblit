const { db } = require('../config/firebase');
const { CollectionNames } = require('../types/constants');
const { createAuditLog } = require('../utils/helpers');
const logger = require('firebase-functions/logger');
const crypto = require('crypto');

/**
 * Generate a signed preview token for a draft post
 * @param {string} postId - The ID of the post to generate preview for
 * @param {string} userId - The ID of the user requesting the preview
 * @param {number} expiresInHours - Token expiration time in hours (default: 24)
 * @returns {Promise<{token: string, expiresAt: Date, previewUrl: string}>}
 */
async function generatePreviewToken(postId, userId, expiresInHours = 24) {
  try {
    // Verify the post exists and user has permission
    const postRef = db.collection(CollectionNames.POSTS).doc(postId);
    const postDoc = await postRef.get();
    
    if (!postDoc.exists) {
      throw new Error('Post not found');
    }
    
    const postData = postDoc.data();
    
    // Check if user has permission to preview this post
    const canPreviewAnyPost = postData.author?.uid === userId || 
                             postData.status === 'published' ||
                             postData.status === 'in_review';
    
    if (!canPreviewAnyPost) {
      throw new Error('Insufficient permissions to preview this post');
    }
    
    // Generate token payload
    const expiresAt = new Date(Date.now() + (expiresInHours * 60 * 60 * 1000));
    const payload = {
      postId,
      userId,
      expiresAt: expiresAt.getTime(),
      issuedAt: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex')
    };
    
    // Create signed token (using a simple HMAC for now)
    const secret = process.env.PREVIEW_TOKEN_SECRET || 'default-secret-change-in-production';
    const token = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    // Store token in Firestore for validation
    const tokenRef = db.collection(CollectionNames.PREVIEW_TOKENS).doc(token);
    await tokenRef.set({
      postId,
      userId,
      expiresAt,
      issuedAt: new Date(),
      used: false,
      createdAt: new Date()
    });
    
    // Create audit log
    await createAuditLog({
      action: 'preview_token_generated',
      resourceType: 'post',
      resourceId: postId,
      userId,
      metadata: {
        expiresAt,
        expiresInHours
      }
    });
    
    const previewUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/preview/${postId}?token=${token}`;
    
    logger.info('Preview token generated', {
      postId,
      userId,
      expiresAt,
      tokenLength: token.length
    });
    
    return {
      token,
      expiresAt,
      previewUrl,
      expiresInHours
    };
    
  } catch (error) {
    logger.error('Error generating preview token', {
      postId,
      userId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Validate a preview token
 * @param {string} token - The token to validate
 * @returns {Promise<{valid: boolean, postId?: string, userId?: string, error?: string}>}
 */
async function validatePreviewToken(token) {
  try {
    if (!token) {
      return { valid: false, error: 'No token provided' };
    }
    
    // Check token in Firestore
    const tokenRef = db.collection(CollectionNames.PREVIEW_TOKENS).doc(token);
    const tokenDoc = await tokenRef.get();
    
    if (!tokenDoc.exists) {
      return { valid: false, error: 'Invalid token' };
    }
    
    const tokenData = tokenDoc.data();
    
    // Check if token has expired
    if (new Date() > tokenData.expiresAt.toDate()) {
      // Clean up expired token
      await tokenRef.delete();
      return { valid: false, error: 'Token has expired' };
    }
    
    // Check if token has been used (optional - you might want to allow multiple uses)
    if (tokenData.used) {
      return { valid: false, error: 'Token has already been used' };
    }
    
    // Mark token as used (optional)
    await tokenRef.update({ used: true, usedAt: new Date() });
    
    return {
      valid: true,
      postId: tokenData.postId,
      userId: tokenData.userId,
      expiresAt: tokenData.expiresAt
    };
    
  } catch (error) {
    logger.error('Error validating preview token', {
      token: token ? token.substring(0, 8) + '...' : 'null',
      error: error.message
    });
    return { valid: false, error: 'Token validation failed' };
  }
}

/**
 * Clean up expired preview tokens (should be called periodically)
 */
async function cleanupExpiredTokens() {
  try {
    const now = new Date();
    const expiredTokensQuery = db.collection(CollectionNames.PREVIEW_TOKENS)
      .where('expiresAt', '<', now);
    
    const expiredTokens = await expiredTokensQuery.get();
    
    if (expiredTokens.empty) {
      logger.info('No expired preview tokens found');
      return { cleaned: 0 };
    }
    
    const batch = db.batch();
    expiredTokens.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    logger.info('Cleaned up expired preview tokens', {
      count: expiredTokens.size
    });
    
    return { cleaned: expiredTokens.size };
    
  } catch (error) {
    logger.error('Error cleaning up expired preview tokens', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Get preview token statistics
 */
async function getPreviewTokenStats() {
  try {
    const tokensRef = db.collection(CollectionNames.PREVIEW_TOKENS);
    
    // Get total count
    const totalSnapshot = await tokensRef.get();
    const total = totalSnapshot.size;
    
    // Get active (non-expired) count
    const now = new Date();
    const activeSnapshot = await tokensRef.where('expiresAt', '>', now).get();
    const active = activeSnapshot.size;
    
    // Get used count
    const usedSnapshot = await tokensRef.where('used', '==', true).get();
    const used = usedSnapshot.size;
    
    return {
      total,
      active,
      used,
      expired: total - active
    };
    
  } catch (error) {
    logger.error('Error getting preview token stats', {
      error: error.message
    });
    throw error;
  }
}

module.exports = {
  // Core functions
  generatePreviewToken,
  validatePreviewToken,
  cleanupExpiredTokens,
  getPreviewTokenStats,
  
  // HTTP handlers
  generatePreviewTokenHandler: async (req, res) => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      
      const { postId, expiresInHours = 24 } = req.body;
      const userId = req.user?.uid;
      
      if (!postId) {
        return res.status(400).json({ error: 'Post ID is required' });
      }
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const result = await generatePreviewToken(postId, userId, expiresInHours);
      
      res.status(200).json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('Error in generatePreviewToken handler', {
        error: error.message,
        postId: req.body?.postId,
        userId: req.user?.uid
      });
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  validatePreviewTokenHandler: async (req, res) => {
    try {
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      
      const { token } = req.query;
      
      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }
      
      const result = await validatePreviewToken(token);
      
      if (result.valid) {
        res.status(200).json({
          success: true,
          data: {
            postId: result.postId,
            userId: result.userId,
            expiresAt: result.expiresAt
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      logger.error('Error in validatePreviewToken handler', {
        error: error.message,
        token: req.query?.token ? req.query.token.substring(0, 8) + '...' : 'null'
      });
      
      res.status(500).json({
        success: false,
        error: 'Token validation failed'
      });
    }
  },
  
  getPreviewTokenStatsHandler: async (req, res) => {
    try {
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      
      const stats = await getPreviewTokenStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      logger.error('Error in getPreviewTokenStats handler', {
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};
