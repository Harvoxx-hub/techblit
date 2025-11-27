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
 * 1. Already public CDN URL (best)
 * 2. Converted public Firebase Storage URL (if file is public)
 * 3. Original URL (fallback - may not be crawlable)
 * 
 * @param url - The image URL to process
 * @returns The best crawlable URL, or original if conversion not possible
 */
export function getCrawlableImageUrl(url: string): string {
  if (!url) return url;
  
  // If it's already a good URL (CDN, public storage, etc.), return as-is
  if (!isTokenBasedUrl(url) && !isBlobUrl(url) && !isLocalImageUrl(url)) {
    return url;
  }
  
  // Try to convert token-based URL to public URL
  if (isTokenBasedUrl(url)) {
    const publicUrl = convertToPublicUrl(url);
    if (publicUrl) {
      // Log warning in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '⚠️ SEO Warning: Image URL converted from token-based to public URL.\n' +
          `Original: ${url}\n` +
          `Public: ${publicUrl}\n` +
          'Note: Ensure the file is actually public in Firebase Storage for this to work.'
        );
      }
      return publicUrl;
    }
    
    // If conversion failed, log warning
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '⚠️ SEO Warning: Image uses token-based Firebase Storage URL.\n' +
        `URL: ${url}\n` +
        'This may slow down Google image indexing.\n' +
        'Recommendation: Use a CDN (Cloudflare R2, Vercel Blob, Uploadthing) or make files public in Firebase Storage.'
      );
    }
  }
  
  // Blob URLs are not crawlable
  if (isBlobUrl(url)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '⚠️ SEO Warning: Image uses blob URL which is not crawlable.\n' +
        `URL: ${url}\n` +
        'Recommendation: Upload image to a CDN or Firebase Storage.'
      );
    }
  }
  
  // Local Next.js images need to be converted
  if (isLocalImageUrl(url)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '⚠️ SEO Warning: Image uses local Next.js path.\n' +
        `URL: ${url}\n` +
        'Recommendation: Use absolute URLs with CDN or Firebase Storage.'
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

