// Middleware functions for Cloud Functions

const { formatErrorResponse } = require('../utils/helpers');
const config = require('../config');
const logger = require('firebase-functions/logger');

/**
 * CORS middleware
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {function} next - Next middleware function
 */
function corsMiddleware(req, res, next) {
  // Extract origin from headers
  const origin = req.headers.origin;
  
  // Get allowed origins from config
  const allowedOrigins = config.cors.origin || [];
  const allowVercelPreviews = config.cors.allowVercelPreviews !== false;
  const isDevelopment = process.env.NODE_ENV !== 'production' || 
                       process.env.FUNCTIONS_EMULATOR === 'true' ||
                       !process.env.NODE_ENV;
  
  // Determine if origin is allowed
  let isAllowedOrigin = false;
  let allowedOrigin = null;
  
  if (origin) {
    // Check if origin matches allowed list exactly
    if (allowedOrigins.includes(origin)) {
      isAllowedOrigin = true;
      allowedOrigin = origin;
    }
    // Check for Vercel preview deployments (if enabled)
    else if (allowVercelPreviews && origin.match(/^https:\/\/.*\.vercel\.app$/)) {
      isAllowedOrigin = true;
      allowedOrigin = origin;
    }
    // Check for Netlify preview deployments
    else if (origin.match(/^https:\/\/.*\.netlify\.app$/) || 
             origin.match(/^https:\/\/.*\.netlify\.com$/)) {
      isAllowedOrigin = true;
      allowedOrigin = origin;
    }
    // In development, allow localhost and 127.0.0.1
    else if (isDevelopment) {
      if (origin.match(/^http:\/\/localhost(:\d+)?$/) || 
          origin.match(/^http:\/\/127\.0\.0\.1(:\d+)?$/)) {
        isAllowedOrigin = true;
        allowedOrigin = origin;
      }
    }
  }
  
  // If no origin header (same-origin request), allow it
  if (!origin) {
    isAllowedOrigin = true;
  }
  
  // Set CORS headers
  // Since we're using Bearer tokens (not cookies), we don't need Access-Control-Allow-Credentials
  if (isAllowedOrigin && origin) {
    res.set('Access-Control-Allow-Origin', allowedOrigin || origin);
  } else if (isAllowedOrigin && !origin) {
    // Same-origin request, no CORS headers needed
  } else {
    // Unallowed origin - in production, reject; in development, allow with warning
    if (isDevelopment) {
      logger.warn('CORS request from unconfigured origin (allowing in dev):', origin);
      if (origin) {
        res.set('Access-Control-Allow-Origin', origin);
      }
    } else {
      logger.warn('CORS request from unconfigured origin (blocked):', origin);
      res.status(403).json({
        success: false,
        error: 'CORS policy violation: Origin not allowed',
        origin: origin
      });
      return;
    }
  }
  
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  next();
}

/**
 * Authentication middleware
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {function} next - Next middleware function
 */
async function authMiddleware(req, res, next) {
  try {
    const { auth } = require('../config/firebase');
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json(formatErrorResponse('No authorization token provided', 401));
      return;
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json(formatErrorResponse('Invalid authorization token', 401));
  }
}

/**
 * Admin role middleware
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {function} next - Next middleware function
 */
async function adminMiddleware(req, res, next) {
  try {
    const { db } = require('../config/firebase');
    const { CollectionNames, UserRole } = require('../types/constants');
    
    if (!req.user) {
      res.status(401).json(formatErrorResponse('User not authenticated', 401));
      return;
    }
    
    const userDoc = await db.collection(CollectionNames.USERS)
      .doc(req.user.uid)
      .get();
    
    if (!userDoc.exists) {
      res.status(403).json(formatErrorResponse('User not found', 403));
      return;
    }
    
    const userData = userDoc.data();
    const adminRoles = [UserRole.SUPER_ADMIN, UserRole.EDITOR];
    
    if (!adminRoles.includes(userData.role)) {
      res.status(403).json(formatErrorResponse('Insufficient permissions', 403));
      return;
    }
    
    req.userData = userData;
    next();
  } catch (error) {
    res.status(500).json(formatErrorResponse('Error checking user permissions', 500));
  }
}

/**
 * Rate limiting middleware (basic implementation)
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {function} next - Next middleware function
 */
function rateLimitMiddleware(req, res, next) {
  // This is a basic implementation
  // In production, use a proper rate limiting library
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  // For now, just pass through
  // TODO: Implement proper rate limiting with Redis or similar
  next();
}

/**
 * Request logging middleware
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {function} next - Next middleware function
 */
function loggingMiddleware(req, res, next) {
  const logger = require('firebase-functions/logger');
  
  logger.info('Request received', {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    timestamp: new Date().toISOString()
  });
  
  next();
}

module.exports = {
  corsMiddleware,
  authMiddleware,
  adminMiddleware,
  rateLimitMiddleware,
  loggingMiddleware
};
