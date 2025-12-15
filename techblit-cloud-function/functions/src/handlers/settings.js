// Settings management handlers

const { db } = require('../config/firebase');
const { CollectionNames } = require('../types/constants');
const { createAuditLog, formatErrorResponse, formatSuccessResponse } = require('../utils/helpers');
const logger = require('firebase-functions/logger');

/**
 * Get site settings
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function getSettings(req, res) {
  try {
    const settingsDoc = await db.collection(CollectionNames.SETTINGS).doc('site').get();
    
    if (!settingsDoc.exists) {
      // Return default settings if none exist
      const defaultSettings = {
        siteName: 'TechBlit',
        siteDescription: 'A modern tech blog',
        siteUrl: process.env.SITE_URL || 'https://www.techblit.com',
        logo: '',
        favicon: '',
        socialLinks: {},
        seo: {
          defaultTitle: 'TechBlit',
          defaultDescription: 'A modern tech blog',
          ogImage: ''
        }
      };
      
      res.json(formatSuccessResponse(defaultSettings, 'Settings retrieved successfully'));
      return;
    }
    
    const settings = settingsDoc.data();
    res.json(formatSuccessResponse(settings, 'Settings retrieved successfully'));
  } catch (error) {
    logger.error('Error retrieving settings:', error);
    res.status(500).json(formatErrorResponse('Error retrieving settings', 500, { error: error.message }));
  }
}

/**
 * Update site settings (Admin only)
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function updateSettings(req, res) {
  try {
    const updateData = {
      ...req.body,
      updatedAt: new Date(),
      updatedBy: {
        uid: req.user.uid,
        name: req.userData.name
      }
    };
    
    await db.collection(CollectionNames.SETTINGS).doc('site').set(updateData, { merge: true });
    
    // Create audit log
    const auditLog = createAuditLog('settings_updated', req.user.uid, 'site', {
      changes: Object.keys(req.body)
    });
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    
    res.json(formatSuccessResponse(updateData, 'Settings updated successfully'));
  } catch (error) {
    logger.error('Error updating settings:', error);
    res.status(500).json(formatErrorResponse('Error updating settings', 500, { error: error.message }));
  }
}

module.exports = {
  getSettings,
  updateSettings
};

