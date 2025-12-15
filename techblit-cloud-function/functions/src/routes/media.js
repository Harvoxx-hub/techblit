/**
 * Media API Routes
 * 
 * All media-related endpoints:
 * - GET /api/v1/media - Get all media (admin)
 * - POST /api/v1/media/upload - Upload media file to Cloudinary (admin, multipart/form-data)
 * - POST /api/v1/media - Register media metadata (admin, JSON)
 * - DELETE /api/v1/media/:id - Delete media (admin)
 */

const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware');
const mediaHandlers = require('../handlers/media');
const cloudinaryService = require('../services/cloudinary');

// Configure multer for file uploads
// Store files in memory (buffer) for Cloudinary upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: cloudinaryService.MAX_FILE_SIZE, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Validate file type
    const validation = cloudinaryService.validateFile({
      mimetype: file.mimetype,
      originalname: file.originalname,
      size: 0, // Size will be checked after upload
    });

    if (!validation.valid) {
      return cb(new Error(validation.error));
    }

    cb(null, true);
  },
});

// All media routes require admin access
router.use(authMiddleware);
router.use(adminMiddleware);

// Routes
router.get('/', mediaHandlers.getAllMedia);

// File upload endpoint (multipart/form-data)
router.post('/upload', upload.single('file'), (req, res, next) => {
  // Additional size check after multer processes the file
  if (req.file && req.file.size > cloudinaryService.MAX_FILE_SIZE) {
    return res.status(400).json({
      success: false,
      error: `File size exceeds maximum allowed size of ${cloudinaryService.MAX_FILE_SIZE / 1024 / 1024}MB`,
    });
  }
  next();
}, mediaHandlers.uploadMediaFile);

// Metadata registration endpoint (JSON)
router.post('/', mediaHandlers.uploadMedia);

// Delete endpoint
router.delete('/:id', mediaHandlers.deleteMedia);

module.exports = router;

