// Media management handlers

const { db, admin } = require('../config/firebase');
const { CollectionNames } = require('../types/constants');
const { createAuditLog, formatErrorResponse, formatSuccessResponse } = require('../utils/helpers');
const logger = require('firebase-functions/logger');
const cloudinaryService = require('../services/cloudinary');

/**
 * Get all media files
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function getAllMedia(req, res) {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const snapshot = await db.collection(CollectionNames.MEDIA)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();
    
    const media = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(formatSuccessResponse(media, 'Media retrieved successfully'));
  } catch (error) {
    logger.error('Error retrieving media:', error);
    res.status(500).json(formatErrorResponse('Error retrieving media', 500, { error: error.message }));
  }
}

/**
 * Upload media file to Cloudinary
 * Handles multipart/form-data file uploads
 * @param {object} req - Request object (with multer file)
 * @param {object} res - Response object
 */
async function uploadMediaFile(req, res) {
  try {
    if (!req.file) {
      res.status(400).json(formatErrorResponse('No file provided', 400));
      return;
    }

    // Get folder from query parameter or default to 'media'
    const folder = req.query.folder || req.body.folder || 'media';
    const alt = req.body.alt || req.file.originalname;

    // Upload to Cloudinary
    const uploadResult = await cloudinaryService.uploadImage(req.file, folder);

    // Prepare media data for Firestore
    // Store public_id as primary identifier, keep url for migration period
    const mediaData = {
      public_id: uploadResult.public_id,
      image_id: uploadResult.public_id, // Alias for backward compatibility
      url: uploadResult.url, // Keep for migration period
      filename: req.file.originalname,
      size: uploadResult.bytes,
      type: 'image',
      alt: alt,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      uploadedBy: {
        uid: req.user.uid,
        name: req.userData.name
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store in Firestore
    const docRef = await db.collection(CollectionNames.MEDIA).add(mediaData);

    // Create audit log
    const auditLog = createAuditLog('media_uploaded', req.user.uid, docRef.id, {
      filename: req.file.originalname,
      public_id: uploadResult.public_id,
      folder
    });
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);

    logger.info('Media uploaded successfully:', {
      id: docRef.id,
      public_id: uploadResult.public_id,
      folder
    });

    res.status(201).json(formatSuccessResponse(
      {
        id: docRef.id,
        public_id: uploadResult.public_id,
        image_id: uploadResult.public_id,
        url: uploadResult.url,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        ...mediaData
      },
      'Media uploaded successfully'
    ));
  } catch (error) {
    logger.error('Error uploading media file:', error);
    res.status(500).json(formatErrorResponse(
      error.message || 'Error uploading media',
      500,
      { error: error.message }
    ));
  }
}

/**
 * Register media metadata (for existing URLs or manual registration)
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function uploadMedia(req, res) {
  try {
    const { url, filename, size, type, alt, public_id, image_id } = req.body;
    
    // Support both old format (url) and new format (public_id/image_id)
    if (!url && !public_id && !image_id) {
      res.status(400).json(formatErrorResponse('URL or public_id/image_id is required', 400));
      return;
    }
    
    const mediaData = {
      url: url || null, // Keep for backward compatibility
      public_id: public_id || image_id || null,
      image_id: public_id || image_id || null, // Alias
      filename: filename || 'unknown',
      size: size || 0,
      type: type || 'image',
      alt: alt || filename || 'image',
      uploadedBy: {
        uid: req.user.uid,
        name: req.userData.name
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await db.collection(CollectionNames.MEDIA).add(mediaData);
    
    // Create audit log
    const auditLog = createAuditLog('media_uploaded', req.user.uid, docRef.id, {
      filename,
      public_id: public_id || image_id,
      type
    });
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    
    res.status(201).json(formatSuccessResponse(
      { id: docRef.id, ...mediaData },
      'Media registered successfully'
    ));
  } catch (error) {
    logger.error('Error registering media:', error);
    res.status(500).json(formatErrorResponse('Error registering media', 500, { error: error.message }));
  }
}

/**
 * Delete media file
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function deleteMedia(req, res) {
  try {
    const { id } = req.params;
    
    const mediaDoc = await db.collection(CollectionNames.MEDIA).doc(id).get();
    
    if (!mediaDoc.exists) {
      res.status(404).json(formatErrorResponse('Media not found', 404));
      return;
    }
    
    const mediaData = mediaDoc.data();
    
    // Delete from Cloudinary if public_id exists
    if (mediaData.public_id || mediaData.image_id) {
      try {
        const publicId = mediaData.public_id || mediaData.image_id;
        await cloudinaryService.deleteImage(publicId);
        logger.info('Deleted from Cloudinary:', { public_id: publicId });
      } catch (cloudinaryError) {
        logger.warn('Error deleting from Cloudinary (file may not exist):', cloudinaryError);
        // Continue even if Cloudinary deletion fails
      }
    }
    
    // Try to delete from Firebase Storage if URL is a storage URL (legacy)
    // NOTE: Storage operations disabled - using Cloudinary for all storage needs
    if (mediaData.url && mediaData.url.includes('firebasestorage.googleapis.com')) {
      try {
        // Initialize storage only if needed for legacy cleanup (Storage API not enabled)
        const storage = admin.storage();
        // Extract path from URL
        const urlParts = mediaData.url.split('/o/');
        if (urlParts.length > 1) {
          const path = decodeURIComponent(urlParts[1].split('?')[0]);
          const fileRef = storage.bucket().file(path);
          await fileRef.delete();
        }
      } catch (storageError) {
        // Don't fail if storage API is not enabled (expected since we use Cloudinary)
        logger.warn('Error deleting from storage (Storage API not enabled or file may not exist):', storageError);
        // Continue even if storage deletion fails
      }
    }
    
    // Delete from Firestore
    await db.collection(CollectionNames.MEDIA).doc(id).delete();
    
    // Create audit log
    const auditLog = createAuditLog('media_deleted', req.user.uid, id, {
      filename: mediaData.filename,
      public_id: mediaData.public_id || mediaData.image_id
    });
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    
    res.json(formatSuccessResponse(null, 'Media deleted successfully'));
  } catch (error) {
    logger.error('Error deleting media:', error);
    res.status(500).json(formatErrorResponse('Error deleting media', 500, { error: error.message }));
  }
}

module.exports = {
  getAllMedia,
  uploadMedia,
  uploadMediaFile,
  deleteMedia
};

