/**
 * Image URL utilities for SEO-friendly, crawlable image URLs
 * 
 * Google cannot reliably index images with:
 * - Firebase Storage token-based URLs (?alt=media&token=xxxx)
 * - Auth-required URLs
 * - Blob URLs
 * 
 * This utility helps convert token-based URLs to public URLs when possible.
 */

/**
 * Check if a URL is a Firebase Storage token-based URL
 */
export function isTokenBasedUrl(url: string): boolean {
  if (!url) return false;
  
  // Check for Firebase Storage token URLs
  if (url.includes('firebasestorage.googleapis.com') && url.includes('token=')) {
    return true;
  }
  
  // Check for alt=media parameter (Firebase Storage download URL pattern)
  if (url.includes('alt=media') && url.includes('token=')) {
    return true;
  }
  
  return false;
}

/**
 * Check if a URL is a blob URL (not crawlable)
 */
export function isBlobUrl(url: string): boolean {
  return url?.startsWith('blob:') || false;
}

/**
 * Check if a URL is a local Next.js image (not crawlable)
 */
export function isLocalImageUrl(url: string): boolean {
  if (!url) return false;
  
  // Check for Next.js image optimization URLs
  if (url.startsWith('/_next/image')) {
    return true;
  }
  
  // Check for local paths without domain
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true;
  }
  
  return false;
}

/**
 * Convert Firebase Storage token URL to public URL
 * 
 * Example:
 * Input:  https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fimage.jpg?alt=media&token=xyz
 * Output: https://storage.googleapis.com/bucket/path/image.jpg
 * 
 * Note: This only works if the file has been made public in Firebase Storage
 */
export function convertToPublicUrl(tokenUrl: string): string | null {
  if (!isTokenBasedUrl(tokenUrl)) {
    return null; // Not a token URL, return null
  }
  
  try {
    // Parse Firebase Storage URL pattern
    // Pattern: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token=xxx
    const url = new URL(tokenUrl);
    
    // Extract bucket name and path from the URL
    const pathMatch = url.pathname.match(/\/v0\/b\/([^/]+)\/o\/(.+)/);
    if (!pathMatch) {
      return null;
    }
    
    const bucket = pathMatch[1];
    const encodedPath = pathMatch[2];
    
    // Decode the path (URL encoded)
    const decodedPath = decodeURIComponent(encodedPath);
    
    // Construct public URL
    // Format: https://storage.googleapis.com/{bucket}/{path}
    const publicUrl = `https://storage.googleapis.com/${bucket}/${decodedPath}`;
    
    return publicUrl;
  } catch (error) {
    console.warn('Failed to convert token URL to public URL:', error);
    return null;
  }
}

/**
 * Get the best crawlable URL for an image
 * 
 * Priority:
 * 1. Cloudinary URL (best - CDN, SEO-friendly, optimized)
 * 2. Already public CDN URL
 * 3. Original token URL (works but not optimal for SEO)
 * 4. Original URL (fallback)
 * 
 * @param url - The image URL or public_id to process
 * @param options - Optional Cloudinary transformation options
 * @returns The best crawlable URL
 */
export function getCrawlableImageUrl(
  url: string | null | undefined,
  options?: { width?: number; height?: number; crop?: string }
): string | null {
  if (!url) return null;
  
  // Import Cloudinary utilities (dynamic import to avoid circular dependencies)
  const { getImageUrl, isCloudinaryPublicId, normalizeToPublicId } = require('./cloudinaryUtils');
  
  // Check if it's a Cloudinary public_id
  const publicId = normalizeToPublicId(url);
  if (publicId) {
    // Construct Cloudinary URL with transformations
    const cloudinaryUrl = getImageUrl(publicId, options || 'cover');
    if (cloudinaryUrl) {
      return cloudinaryUrl;
    }
  }
  
  // If it's already a Cloudinary URL, return as-is
  if (url.includes('res.cloudinary.com') || url.includes('cloudinary.com')) {
    return url;
  }
  
  // If it's already a good URL (CDN, public storage, etc.), return as-is
  if (!isTokenBasedUrl(url) && !isBlobUrl(url) && !isLocalImageUrl(url)) {
    return url;
  }
  
  // For token-based URLs, keep the original URL
  // Token URLs work for display, they're just not crawlable by Google
  // Converting to public URLs can fail if files aren't public
  if (isTokenBasedUrl(url)) {
    // In development, log a note (not a warning since this is expected)
    if (process.env.NODE_ENV === 'development') {
      console.log(
        'ℹ️ Image uses token-based Firebase Storage URL (works for display, not optimal for SEO).\n' +
        'To improve SEO: Migrate to Cloudinary or make files public in Firebase Storage.'
      );
    }
    return url; // Return original token URL to avoid access errors
  }
  
  // Blob URLs are not crawlable
  if (isBlobUrl(url)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '⚠️ SEO Warning: Image uses blob URL which is not crawlable.\n' +
        `URL: ${url}\n` +
        'Recommendation: Upload image to Cloudinary or Firebase Storage.'
      );
    }
  }
  
  // Local Next.js images need to be converted
  if (isLocalImageUrl(url)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '⚠️ SEO Warning: Image uses local Next.js path.\n' +
        `URL: ${url}\n` +
        'Recommendation: Use absolute URLs with Cloudinary or Firebase Storage.'
      );
    }
  }
  
  // Return original URL as fallback
  return url;
}

/**
 * Validate if an image URL is SEO-friendly (crawlable by Google)
 */
export function isCrawlableUrl(url: string): boolean {
  if (!url) return false;
  
  // Check for problematic URL patterns
  if (isTokenBasedUrl(url)) return false;
  if (isBlobUrl(url)) return false;
  if (isLocalImageUrl(url)) return false;
  
  // Must be absolute URL with http/https
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return false;
  }
  
  return true;
}

/**
 * Check if a URL is a WordPress URL (old site)
 */
export function isWordPressUrl(url: string): boolean {
  if (!url) return false;
  
  // Check for WordPress URL patterns
  if (url.includes('wp-content/uploads')) return true;
  if (url.includes('www.techblit.com/wp-content')) return true;
  if (url.includes('techblit.com/wp-content')) return true;
  
  return false;
}

/**
 * Sanitize HTML content by removing or replacing WordPress image URLs
 * This prevents 403 errors from trying to load images from the old WordPress site
 * 
 * @param html - The HTML content to sanitize
 * @param replacement - What to replace WordPress URLs with (default: empty string to remove images)
 * @returns Sanitized HTML with WordPress image URLs removed or replaced
 */
export function sanitizeWordPressUrls(html: string, replacement: string = ''): string {
  if (!html) return html;
  
  // Use regex to find and replace WordPress image URLs in img src attributes
  // Pattern matches: <img ... src="https://www.techblit.com/wp-content/..." ...>
  const wordPressImagePattern = /<img([^>]*)\s+src=["'](https?:\/\/(www\.)?techblit\.com\/wp-content\/[^"']+)["']([^>]*)>/gi;
  
  const sanitized = html.replace(wordPressImagePattern, (match, before, src, www, after) => {
    // Log the removal in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `⚠️ Removed WordPress image URL from content:\n` +
        `URL: ${src}\n` +
        `This image was removed to prevent 403 errors. Please re-upload images to Firebase Storage.`
      );
    }
    
    // If replacement is provided, use it; otherwise remove the entire img tag
    if (replacement) {
      return `<img${before} src="${replacement}"${after}>`;
    }
    
    // Remove the entire img tag
    return '';
  });
  
  // Also handle background-image URLs in style attributes
  const backgroundImagePattern = /style=["']([^"']*background-image:\s*url\(["']?https?:\/\/(www\.)?techblit\.com\/wp-content\/[^"')]+["']?\)[^"']*)["']/gi;
  
  return sanitized.replace(backgroundImagePattern, (match, styleContent) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `⚠️ Removed WordPress background-image URL from content:\n` +
        `Style: ${styleContent}`
      );
    }
    // Remove the background-image property
    return `style="${styleContent.replace(/background-image:\s*url\([^)]+\);\s*/gi, '')}"`;
  });
}

