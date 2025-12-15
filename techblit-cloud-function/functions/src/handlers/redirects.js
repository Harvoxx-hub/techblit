// Redirects management handlers

const { db } = require('../config/firebase');
const { CollectionNames } = require('../types/constants');
const { createAuditLog, formatErrorResponse, formatSuccessResponse } = require('../utils/helpers');
const logger = require('firebase-functions/logger');

/**
 * Get all redirects
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function getAllRedirects(req, res) {
  try {
    const snapshot = await db.collection(CollectionNames.REDIRECTS)
      .orderBy('createdAt', 'desc')
      .get();
    
    const redirects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(formatSuccessResponse(redirects, 'Redirects retrieved successfully'));
  } catch (error) {
    logger.error('Error retrieving redirects:', error);
    res.status(500).json(formatErrorResponse('Error retrieving redirects', 500, { error: error.message }));
  }
}

/**
 * Create redirect
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function createRedirect(req, res) {
  try {
    const { from, to, type = 301, permanent = true } = req.body;
    
    if (!from || !to) {
      res.status(400).json(formatErrorResponse('From and to URLs are required', 400));
      return;
    }
    
    // Check if redirect already exists
    const existingSnapshot = await db.collection(CollectionNames.REDIRECTS)
      .where('from', '==', from)
      .limit(1)
      .get();
    
    if (!existingSnapshot.empty) {
      res.status(409).json(formatErrorResponse('Redirect with this from URL already exists', 409));
      return;
    }
    
    const redirectData = {
      from,
      to,
      type: type || (permanent ? 301 : 302),
      permanent: permanent !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: {
        uid: req.user.uid,
        name: req.userData.name
      }
    };
    
    const docRef = await db.collection(CollectionNames.REDIRECTS).add(redirectData);
    
    // Create audit log
    const auditLog = createAuditLog('redirect_created', req.user.uid, docRef.id, {
      from,
      to
    });
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    
    res.status(201).json(formatSuccessResponse(
      { id: docRef.id, ...redirectData },
      'Redirect created successfully'
    ));
  } catch (error) {
    logger.error('Error creating redirect:', error);
    res.status(500).json(formatErrorResponse('Error creating redirect', 500, { error: error.message }));
  }
}

/**
 * Update redirect
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function updateRedirect(req, res) {
  try {
    const { id } = req.params;
    const { from, to, type, permanent } = req.body;
    
    const redirectRef = db.collection(CollectionNames.REDIRECTS).doc(id);
    const redirectDoc = await redirectRef.get();
    
    if (!redirectDoc.exists) {
      res.status(404).json(formatErrorResponse('Redirect not found', 404));
      return;
    }
    
    const updateData = {
      updatedAt: new Date(),
      updatedBy: {
        uid: req.user.uid,
        name: req.userData.name
      }
    };
    
    if (from !== undefined) updateData.from = from;
    if (to !== undefined) updateData.to = to;
    if (type !== undefined) updateData.type = type;
    if (permanent !== undefined) updateData.permanent = permanent;
    
    await redirectRef.update(updateData);
    
    // Create audit log
    const auditLog = createAuditLog('redirect_updated', req.user.uid, id, {
      changes: Object.keys(updateData)
    });
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    
    res.json(formatSuccessResponse(null, 'Redirect updated successfully'));
  } catch (error) {
    logger.error('Error updating redirect:', error);
    res.status(500).json(formatErrorResponse('Error updating redirect', 500, { error: error.message }));
  }
}

/**
 * Delete redirect
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function deleteRedirect(req, res) {
  try {
    const { id } = req.params;
    
    const redirectDoc = await db.collection(CollectionNames.REDIRECTS).doc(id).get();
    
    if (!redirectDoc.exists) {
      res.status(404).json(formatErrorResponse('Redirect not found', 404));
      return;
    }
    
    await db.collection(CollectionNames.REDIRECTS).doc(id).delete();
    
    // Create audit log
    const auditLog = createAuditLog('redirect_deleted', req.user.uid, id);
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    
    res.json(formatSuccessResponse(null, 'Redirect deleted successfully'));
  } catch (error) {
    logger.error('Error deleting redirect:', error);
    res.status(500).json(formatErrorResponse('Error deleting redirect', 500, { error: error.message }));
  }
}

/**
 * Lookup a redirect by path (public endpoint for middleware)
 * Optimized for fast edge lookups
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function lookupRedirect(req, res) {
  try {
    const { path } = req.query;
    
    if (!path) {
      res.status(400).json(formatErrorResponse('Path query parameter is required', 400));
      return;
    }
    
    // Normalize path (remove trailing slash for comparison)
    const normalizedPath = path.endsWith('/') && path !== '/' 
      ? path.slice(0, -1) 
      : path;
    
    // Look for active redirects matching this path
    const snapshot = await db.collection(CollectionNames.REDIRECTS)
      .where('active', '!=', false)
      .get();
    
    // Find matching redirect (case-insensitive)
    const redirect = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .find(r => {
        const from = r.from || '';
        const normalizedFrom = from.endsWith('/') && from !== '/' 
          ? from.slice(0, -1) 
          : from;
        return normalizedFrom.toLowerCase() === normalizedPath.toLowerCase() ||
               from.toLowerCase() === path.toLowerCase();
      });
    
    if (redirect) {
      // Cache the response for 5 minutes
      res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
      res.json(formatSuccessResponse({
        found: true,
        to: redirect.to,
        type: redirect.type || 301,
        permanent: redirect.permanent !== false
      }, 'Redirect found'));
    } else {
      // Cache negative responses too (1 minute)
      res.set('Cache-Control', 'public, max-age=60, s-maxage=60');
      res.json(formatSuccessResponse({ found: false }, 'No redirect found'));
    }
  } catch (error) {
    logger.error('Error looking up redirect:', error);
    res.status(500).json(formatErrorResponse('Error looking up redirect', 500, { error: error.message }));
  }
}

/**
 * Get all active redirects (public, cached)
 * For middleware to cache locally
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function getAllActiveRedirects(req, res) {
  try {
    const snapshot = await db.collection(CollectionNames.REDIRECTS)
      .where('active', '!=', false)
      .get();
    
    const redirects = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        from: data.from,
        to: data.to,
        type: data.type || 301
      };
    });
    
    // Cache for 5 minutes
    res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.json(formatSuccessResponse(redirects, 'Active redirects retrieved'));
  } catch (error) {
    logger.error('Error retrieving active redirects:', error);
    res.status(500).json(formatErrorResponse('Error retrieving active redirects', 500, { error: error.message }));
  }
}

module.exports = {
  getAllRedirects,
  createRedirect,
  updateRedirect,
  deleteRedirect,
  lookupRedirect,
  getAllActiveRedirects
};

