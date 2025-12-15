/**
 * Cloudinary Integration Test Utility
 * 
 * Test Cloudinary URL construction and image helpers
 * Run this in browser console or as a test script
 */

import { getCloudinaryUrl, CloudinaryPresets } from './cloudinaryUtils';
import { getImageUrlFromData, getCoverUrl, getThumbnailUrl, getSocialImageUrl } from './imageHelpers';

/**
 * Test Cloudinary URL construction
 */
export function testCloudinaryUrls() {
  const publicId = 'techblit/media/migrated-41nyyesourq0gyholkzk-1765802369087-alzsno';
  
  console.log('🧪 Testing Cloudinary URL Construction\n');
  console.log('Public ID:', publicId);
  console.log('');
  
  // Test presets
  console.log('📸 Preset URLs:');
  console.log('Cover (1200px):', getCloudinaryUrl(publicId, 'cover'));
  console.log('Inline (800px):', getCloudinaryUrl(publicId, 'inline'));
  console.log('Thumbnail (400px):', getCloudinaryUrl(publicId, 'thumbnail'));
  console.log('Social (1200x630):', getCloudinaryUrl(publicId, 'social'));
  console.log('Avatar (200x200):', getCloudinaryUrl(publicId, 'avatar'));
  console.log('');
  
  // Test custom transformations
  console.log('🎨 Custom Transformations:');
  console.log('800x600 fill:', getCloudinaryUrl(publicId, { width: 800, height: 600, crop: 'fill' }));
  console.log('400x400 face crop:', getCloudinaryUrl(publicId, { width: 400, height: 400, crop: 'fill', gravity: 'face' }));
  console.log('');
  
  return {
    publicId,
    cover: getCloudinaryUrl(publicId, 'cover'),
    thumbnail: getCloudinaryUrl(publicId, 'thumbnail'),
    social: getCloudinaryUrl(publicId, 'social'),
  };
}

/**
 * Test image helper functions
 */
export function testImageHelpers() {
  const imageData = {
    public_id: 'techblit/media/migrated-41nyyesourq0gyholkzk-1765802369087-alzsno',
    image_id: 'techblit/media/migrated-41nyyesourq0gyholkzk-1765802369087-alzsno',
    url: 'https://res.cloudinary.com/dzzpqr69w/image/upload/v1765802380/techblit/media/migrated-41nyyesourq0gyholkzk-1765802369087-alzsno.png',
  };
  
  console.log('🧪 Testing Image Helper Functions\n');
  console.log('Input data:', imageData);
  console.log('');
  
  console.log('📸 Helper URLs:');
  console.log('getCoverUrl():', getCoverUrl(imageData));
  console.log('getThumbnailUrl():', getThumbnailUrl(imageData));
  console.log('getSocialImageUrl():', getSocialImageUrl(imageData));
  console.log('getImageUrlFromData(cover):', getImageUrlFromData(imageData, { preset: 'cover' }));
  console.log('');
  
  return {
    cover: getCoverUrl(imageData),
    thumbnail: getThumbnailUrl(imageData),
    social: getSocialImageUrl(imageData),
  };
}

/**
 * Verify migrated image URLs
 */
export function verifyMigratedImage() {
  const publicId = 'techblit/media/migrated-41nyyesourq0gyholkzk-1765802369087-alzsno';
  
  console.log('✅ Verifying Migrated Image\n');
  console.log('Public ID:', publicId);
  console.log('');
  
  const urls = {
    original: getCloudinaryUrl(publicId),
    cover: getCloudinaryUrl(publicId, 'cover'),
    thumbnail: getCloudinaryUrl(publicId, 'thumbnail'),
    social: getCloudinaryUrl(publicId, 'social'),
  };
  
  console.log('Generated URLs:');
  Object.entries(urls).forEach(([key, url]) => {
    console.log(`${key}:`, url);
  });
  console.log('');
  
  console.log('✅ All URLs generated successfully!');
  console.log('💡 Test these URLs in your browser to verify images load correctly.');
  
  return urls;
}

// Export test runner
if (typeof window !== 'undefined') {
  (window as any).testCloudinary = {
    testUrls: testCloudinaryUrls,
    testHelpers: testImageHelpers,
    verifyMigrated: verifyMigratedImage,
  };
  
  console.log('💡 Cloudinary test utilities loaded!');
  console.log('   Run: testCloudinary.testUrls()');
  console.log('   Run: testCloudinary.testHelpers()');
  console.log('   Run: testCloudinary.verifyMigrated()');
}

