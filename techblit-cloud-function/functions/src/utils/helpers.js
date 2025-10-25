// Utility functions for Cloud Functions

/**
 * Generate a unique slug from title
 * @param {string} title - The title to convert to slug
 * @param {string} existingSlug - Optional existing slug to check against
 * @returns {Promise<string>} - Unique slug
 */
async function generateUniqueSlug(title, existingSlug = null) {
  const { db } = require('../config/firebase');
  const { CollectionNames } = require('../types/constants');
  
  let baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  if (existingSlug === baseSlug) {
    return baseSlug;
  }
  
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const doc = await db.collection(CollectionNames.POSTS)
      .where('slug', '==', slug)
      .limit(1)
      .get();
    
    if (doc.empty) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize HTML content
 * @param {string} html - HTML content to sanitize
 * @returns {string} - Sanitized HTML
 */
function sanitizeHtml(html) {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/**
 * Generate audit log entry
 * @param {string} action - Action performed
 * @param {string} actor - User who performed the action
 * @param {string} target - Target of the action
 * @param {object} metadata - Additional metadata
 * @returns {object} - Audit log entry
 */
function createAuditLog(action, actor, target, metadata = {}) {
  return {
    action,
    actor,
    target,
    timestamp: new Date(),
    metadata,
    ipAddress: metadata.ipAddress || null,
    userAgent: metadata.userAgent || null
  };
}

/**
 * Format error response
 * @param {string} message - Error message
 * @param {number} code - HTTP status code
 * @param {object} details - Additional error details
 * @returns {object} - Formatted error response
 */
function formatErrorResponse(message, code = 400, details = {}) {
  return {
    success: false,
    error: {
      message,
      code,
      details,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Format success response
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @returns {object} - Formatted success response
 */
function formatSuccessResponse(data, message = 'Success') {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  generateUniqueSlug,
  isValidEmail,
  sanitizeHtml,
  createAuditLog,
  formatErrorResponse,
  formatSuccessResponse
};
