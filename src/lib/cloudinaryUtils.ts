/**
 * Cloudinary URL Utilities
 * 
 * Constructs Cloudinary image URLs from public_id with transformations
 * for optimized image delivery.
 */

// Cloudinary cloud name - should match backend configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dzzpqr69w';
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Cloudinary transformation options
 */
export interface CloudinaryTransformOptions {
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Crop mode: 'fill', 'fit', 'scale', 'crop', 'thumb', etc. */
  crop?: string;
  /** Format: 'auto' (default), 'webp', 'jpg', 'png', etc. */
  format?: string;
  /** Quality: 'auto' (default), or number 1-100 */
  quality?: string | number;
  /** Gravity for cropping: 'auto', 'face', 'center', etc. */
  gravity?: string;
  /** Fetch format: 'auto' enables automatic format selection */
  fetchFormat?: string;
}

/**
 * Default transformation options
 * - f_auto: Automatic format selection (WebP/AVIF when supported)
 * - q_auto: Automatic quality optimization
 */
const DEFAULT_TRANSFORMATIONS = 'f_auto,q_auto';

/**
 * Preset transformation configurations
 */
export const CloudinaryPresets = {
  /** Cover images: 1200px width, auto format/quality */
  cover: { width: 1200, format: 'auto', quality: 'auto' },
  /** Inline images: 800px width, auto format/quality */
  inline: { width: 800, format: 'auto', quality: 'auto' },
  /** Thumbnails: 400px width, auto format/quality */
  thumbnail: { width: 400, format: 'auto', quality: 'auto' },
  /** Social preview (OG/Twitter): 1200x630, fill crop */
  social: { width: 1200, height: 630, crop: 'fill', format: 'auto', quality: 'auto' },
  /** Avatar: 200x200, fill crop, face gravity */
  avatar: { width: 200, height: 200, crop: 'fill', gravity: 'face', format: 'auto', quality: 'auto' },
} as const;

/**
 * Build Cloudinary transformation string from options
 */
function buildTransformationString(options: CloudinaryTransformOptions): string {
  const transformations: string[] = [];

  // Format (f_auto is default)
  if (options.format || options.fetchFormat) {
    transformations.push(`f_${options.format || options.fetchFormat || 'auto'}`);
  } else {
    transformations.push('f_auto');
  }

  // Quality (q_auto is default)
  if (options.quality) {
    transformations.push(`q_${options.quality}`);
  } else {
    transformations.push('q_auto');
  }

  // Width
  if (options.width) {
    transformations.push(`w_${options.width}`);
  }

  // Height
  if (options.height) {
    transformations.push(`h_${options.height}`);
  }

  // Crop mode
  if (options.crop) {
    transformations.push(`c_${options.crop}`);
  }

  // Gravity
  if (options.gravity) {
    transformations.push(`g_${options.gravity}`);
  }

  return transformations.join(',');
}

/**
 * Get Cloudinary URL from public_id with transformations
 * 
 * @param publicId - Cloudinary public_id (e.g., 'techblit/posts/image-123')
 * @param options - Transformation options or preset name
 * @returns Full Cloudinary URL
 * 
 * @example
 * getCloudinaryUrl('techblit/posts/image-123', { width: 800 })
 * // Returns: https://res.cloudinary.com/dzzpqr69w/image/upload/f_auto,q_auto,w_800/techblit/posts/image-123
 * 
 * @example
 * getCloudinaryUrl('techblit/posts/image-123', CloudinaryPresets.cover)
 * // Returns: https://res.cloudinary.com/dzzpqr69w/image/upload/f_auto,q_auto,w_1200/techblit/posts/image-123
 */
export function getCloudinaryUrl(
  publicId: string | null | undefined,
  options?: CloudinaryTransformOptions | keyof typeof CloudinaryPresets
): string | null {
  if (!publicId) {
    return null;
  }

  // If options is a preset name, use the preset
  let transformOptions: CloudinaryTransformOptions;
  if (typeof options === 'string' && options in CloudinaryPresets) {
    transformOptions = CloudinaryPresets[options as keyof typeof CloudinaryPresets];
  } else if (options) {
    transformOptions = options as CloudinaryTransformOptions;
  } else {
    // Default: just auto format and quality
    transformOptions = {};
  }

  // Build transformation string
  const transformations = buildTransformationString(transformOptions);

  // Construct URL
  // Format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}
  return `${CLOUDINARY_BASE_URL}/${transformations}/${publicId}`;
}

/**
 * Check if a URL is a Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com') || url.includes('cloudinary.com');
}

/**
 * Extract public_id from a Cloudinary URL
 * 
 * @param url - Full Cloudinary URL
 * @returns public_id or null if not a Cloudinary URL
 * 
 * @example
 * extractPublicId('https://res.cloudinary.com/dzzpqr69w/image/upload/f_auto,q_auto/techblit/posts/image-123')
 * // Returns: 'techblit/posts/image-123'
 */
export function extractPublicId(url: string): string | null {
  if (!isCloudinaryUrl(url)) {
    return null;
  }

  try {
    // Pattern: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}
    const match = url.match(/\/image\/upload\/[^/]+\/(.+)$/);
    if (match && match[1]) {
      // Remove any file extension that might be added
      return match[1].split('.')[0];
    }
  } catch (error) {
    console.warn('Failed to extract public_id from Cloudinary URL:', error);
  }

  return null;
}

/**
 * Get Cloudinary URL with preset
 * 
 * @param publicId - Cloudinary public_id
 * @param preset - Preset name ('cover', 'inline', 'thumbnail', 'social', 'avatar')
 * @returns Full Cloudinary URL
 */
export function getCloudinaryUrlWithPreset(
  publicId: string | null | undefined,
  preset: keyof typeof CloudinaryPresets
): string | null {
  return getCloudinaryUrl(publicId, preset);
}

/**
 * Check if an image identifier is a Cloudinary public_id
 * (starts with 'techblit/' or is a Cloudinary URL)
 */
export function isCloudinaryPublicId(identifier: string): boolean {
  if (!identifier) return false;
  
  // Check if it's a Cloudinary URL
  if (isCloudinaryUrl(identifier)) return true;
  
  // Check if it starts with techblit/ (our folder structure)
  if (identifier.startsWith('techblit/')) return true;
  
  return false;
}

/**
 * Normalize image identifier to public_id
 * Handles both Cloudinary URLs and public_ids
 */
export function normalizeToPublicId(identifier: string | null | undefined): string | null {
  if (!identifier) return null;
  
  // If it's already a public_id (starts with techblit/), return as-is
  if (identifier.startsWith('techblit/')) {
    return identifier;
  }
  
  // If it's a Cloudinary URL, extract public_id
  if (isCloudinaryUrl(identifier)) {
    return extractPublicId(identifier);
  }
  
  // Otherwise, assume it's a legacy URL or other format
  return null;
}

/**
 * Get image URL - handles both Cloudinary public_ids and legacy URLs
 * 
 * @param identifier - public_id, Cloudinary URL, or legacy URL
 * @param options - Transformation options or preset name
 * @returns Image URL (Cloudinary URL if public_id, otherwise original URL)
 */
export function getImageUrl(
  identifier: string | null | undefined,
  options?: CloudinaryTransformOptions | keyof typeof CloudinaryPresets
): string | null {
  if (!identifier) return null;
  
  // Try to normalize to public_id
  const publicId = normalizeToPublicId(identifier);
  
  // If we have a public_id, construct Cloudinary URL
  if (publicId) {
    return getCloudinaryUrl(publicId, options);
  }
  
  // Otherwise, return original URL (legacy Firebase Storage, etc.)
  return identifier;
}

