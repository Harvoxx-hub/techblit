/**
 * Image Helper Utilities
 * 
 * Shared utilities for extracting and normalizing image URLs
 * Supports both Cloudinary public_ids and legacy Firebase Storage URLs
 */

import { getImageUrl, normalizeToPublicId, CloudinaryPresets } from './cloudinaryUtils';

/**
 * Extract image URL from various data formats
 * Handles:
 * - Cloudinary public_id (string starting with 'techblit/')
 * - Cloudinary URLs
 * - ProcessedImage format (original, thumbnail, ogImage)
 * - Legacy Firebase Storage URLs
 * - Simple string URLs
 */
export function getImageUrlFromData(
  imageData: any,
  options?: {
    preferThumbnail?: boolean;
    preset?: keyof typeof CloudinaryPresets;
    width?: number;
    height?: number;
  }
): string | null {
  if (!imageData) return null;

  let identifier: string | null = null;

  // Handle string (could be URL or public_id)
  if (typeof imageData === 'string') {
    identifier = imageData;
  }
  // Handle object formats
  else if (typeof imageData === 'object') {
    // PRIORITY 1: Check for Cloudinary public_id/image_id FIRST (migrated images)
    // This ensures migrated posts use Cloudinary URLs instead of legacy Firebase URLs
    if (imageData.public_id) {
      identifier = imageData.public_id;
    } else if (imageData.image_id) {
      identifier = imageData.image_id;
    }
    // PRIORITY 2: Check nested Cloudinary identifiers (ProcessedImage format)
    else if (imageData.original?.public_id) {
      identifier = imageData.original.public_id;
    } else if (imageData.original?.image_id) {
      identifier = imageData.original.image_id;
    }
    // PRIORITY 3: Handle ProcessedImage format with original, thumbnail, ogImage (legacy URLs)
    else if (imageData.original?.url || imageData.original?.path) {
      identifier = imageData.original.url || imageData.original.path;
    } else if (options?.preferThumbnail && (imageData.thumbnail?.url || imageData.thumbnail?.path)) {
      identifier = imageData.thumbnail.url || imageData.thumbnail.path;
    } else if (imageData.thumbnail?.url || imageData.thumbnail?.path) {
      identifier = imageData.thumbnail.url || imageData.thumbnail.path;
    } else if (imageData.ogImage?.url || imageData.ogImage?.path) {
      identifier = imageData.ogImage.url || imageData.ogImage.path;
    }
    // PRIORITY 4: Handle simple format with url, downloadURL, src (legacy URLs)
    else if (imageData.url) {
      identifier = imageData.url;
    } else if (imageData.downloadURL) {
      identifier = imageData.downloadURL;
    } else if (imageData.src) {
      identifier = imageData.src;
    }
    // Handle toString method
    else if (typeof imageData.toString === 'function') {
      const urlStr = imageData.toString();
      if (urlStr.startsWith('http') || urlStr.startsWith('techblit/')) {
        identifier = urlStr;
      }
    }
  }

  if (!identifier) return null;

  // Filter out WordPress URLs to prevent 403 errors
  if (identifier.includes('wp-content/uploads') || identifier.includes('www.techblit.com/wp-content')) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ Filtered out WordPress featured image URL: ${identifier}`);
    }
    return null;
  }

  // Filter out Firebase Storage URLs if we don't have a Cloudinary public_id
  // This ensures we only use Cloudinary URLs after migration
  if (identifier.includes('firebasestorage.googleapis.com')) {
    // Check if we can extract a public_id from the identifier
    const publicId = normalizeToPublicId(identifier);
    if (!publicId) {
      // This is a Firebase Storage URL without a Cloudinary public_id
      // Filter it out to prevent showing Firebase URLs after migration
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ Filtered out Firebase Storage URL (no public_id found): ${identifier.substring(0, 100)}...`);
      }
      return null;
    }
    // If we have a public_id, use it instead
    identifier = publicId;
  }

  // Use Cloudinary utility to get the final URL
  // This handles both Cloudinary public_ids and legacy URLs
  if (options?.preset) {
    return getImageUrl(identifier, options.preset);
  } else if (options?.width || options?.height) {
    return getImageUrl(identifier, {
      width: options.width,
      height: options.height,
    });
  } else {
    return getImageUrl(identifier, 'cover'); // Default to cover preset
  }
}

/**
 * Get thumbnail image URL
 */
export function getThumbnailUrl(imageData: any): string | null {
  return getImageUrlFromData(imageData, { preset: 'thumbnail' });
}

/**
 * Get cover image URL
 */
export function getCoverUrl(imageData: any): string | null {
  return getImageUrlFromData(imageData, { preset: 'cover' });
}

/**
 * Get social preview image URL (OG/Twitter)
 */
export function getSocialImageUrl(imageData: any): string | null {
  return getImageUrlFromData(imageData, { preset: 'social' });
}

/**
 * Get inline image URL
 */
export function getInlineImageUrl(imageData: any): string | null {
  return getImageUrlFromData(imageData, { preset: 'inline' });
}

