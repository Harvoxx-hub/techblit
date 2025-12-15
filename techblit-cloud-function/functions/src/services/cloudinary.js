/**
 * Cloudinary Service
 * 
 * Handles all Cloudinary operations:
 * - Image uploads with validation
 * - Folder structure management
 * - Error handling and logging
 */

const cloudinary = require('cloudinary').v2;
const logger = require('firebase-functions/logger');

// Initialize Cloudinary
// Support both CLOUDINARY_URL format and individual credentials
const cloudinaryUrl = process.env.CLOUDINARY_URL;
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudinaryUrl) {
  // Use CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
  cloudinary.config({
    cloudinary_url: cloudinaryUrl,
  });
  logger.info('Cloudinary configured using CLOUDINARY_URL');
} else if (cloudName && apiKey && apiSecret) {
  // Use individual credentials
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  logger.info('Cloudinary configured using individual credentials');
} else {
  logger.warn('Cloudinary credentials not configured. Image uploads will fail.');
  logger.warn('Set either CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET');
}

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Folder structure
const FOLDERS = {
  POSTS: 'techblit/posts',
  AUTHORS: 'techblit/authors',
  CATEGORIES: 'techblit/categories',
  UI: 'techblit/ui',
  MEDIA: 'techblit/media', // General media library
};

/**
 * Validate file before upload
 * @param {Object} file - Multer file object
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_FORMATS.join(', ')}`,
    };
  }

  // Check file extension
  const extension = file.originalname.split('.').pop()?.toLowerCase();
  if (!extension || !ALLOWED_FORMATS.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed extensions: ${ALLOWED_FORMATS.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Generate public ID from filename and folder
 * @param {string} filename - Original filename
 * @param {string} folder - Folder path (e.g., 'techblit/posts')
 * @returns {string} Public ID
 */
function generatePublicId(filename, folder) {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Sanitize filename: lowercase, replace spaces/special chars with hyphens
  const sanitized = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  // Add timestamp for uniqueness
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  
  // Construct public ID: folder/filename-timestamp-random
  return `${folder}/${sanitized}-${timestamp}-${randomString}`;
}

/**
 * Upload image to Cloudinary
 * @param {Object} file - Multer file object
 * @param {string} folder - Folder type ('posts', 'authors', 'categories', 'ui', 'media')
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} Cloudinary upload result with public_id
 */
async function uploadImage(file, folder = 'media', options = {}) {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Get folder path
    const folderPath = FOLDERS[folder.toUpperCase()] || FOLDERS.MEDIA;

    // Generate public ID
    const publicId = generatePublicId(file.originalname, folderPath);

    // Upload options
    // Note: public_id already includes the full folder path, so we don't set folder separately
    const uploadOptions = {
      public_id: publicId,
      resource_type: 'image',
      overwrite: false,
      invalidate: true,
      tags: ['techblit', folder, 'uploaded'],
      ...options,
    };

    // Upload to Cloudinary
    // Convert buffer to base64 for upload
    const uploadString = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(uploadString, uploadOptions);

    logger.info('Image uploaded to Cloudinary:', {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    });

    return {
      public_id: result.public_id,
      image_id: result.public_id, // Alias for backward compatibility
      url: result.secure_url, // Keep for migration period
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      created_at: result.created_at,
    };
  } catch (error) {
    logger.error('Cloudinary upload error:', {
      error: error.message,
      folder,
      filename: file?.originalname,
    });

    // Handle specific Cloudinary errors
    if (error.http_code) {
      switch (error.http_code) {
        case 400:
          throw new Error(`Invalid upload request: ${error.message}`);
        case 401:
          throw new Error('Cloudinary authentication failed. Check credentials.');
        case 403:
          throw new Error('Cloudinary access forbidden. Check account permissions.');
        case 404:
          throw new Error('Cloudinary resource not found.');
        case 420:
          throw new Error('Cloudinary rate limit exceeded. Please try again later.');
        case 500:
          throw new Error('Cloudinary server error. Please try again later.');
        default:
          throw new Error(`Cloudinary error (${error.http_code}): ${error.message}`);
      }
    }

    throw error;
  }
}

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public_id
 * @returns {Promise<Object>} Deletion result
 */
async function deleteImage(publicId) {
  try {
    if (!publicId) {
      throw new Error('Public ID is required');
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });

    logger.info('Image deleted from Cloudinary:', {
      public_id: publicId,
      result: result.result,
    });

    return result;
  } catch (error) {
    logger.error('Cloudinary delete error:', {
      error: error.message,
      public_id: publicId,
    });
    throw error;
  }
}

/**
 * Get Cloudinary URL for a public_id with transformations
 * @param {string} publicId - Cloudinary public_id
 * @param {Object} transformations - Transformation options
 * @returns {string} Cloudinary URL
 */
function getCloudinaryUrl(publicId, transformations = {}) {
  if (!publicId) {
    return null;
  }

  // Default transformations: auto format and quality
  const defaultTransformations = {
    fetch_format: 'auto',
    quality: 'auto',
    ...transformations,
  };

  return cloudinary.url(publicId, defaultTransformations);
}

module.exports = {
  uploadImage,
  deleteImage,
  getCloudinaryUrl,
  validateFile,
  generatePublicId,
  FOLDERS,
  MAX_FILE_SIZE,
  ALLOWED_FORMATS,
  ALLOWED_MIME_TYPES,
};

