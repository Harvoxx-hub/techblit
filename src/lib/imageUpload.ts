import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Media } from '@/types/admin';
import apiService from '@/lib/apiService';
import { 
  compressImage, 
  createOGImage, 
  getImageDimensions, 
  generateUniqueFileName,
  ProcessedImage 
} from './imageProcessing';
import { getCloudinaryUrl, CloudinaryPresets } from './cloudinaryUtils';

export interface UploadResult {
  url: string;
  path: string;
  name: string;
  size: number;
  type: string;
}

/**
 * Upload image to Cloudinary via backend API
 * @param file - Image file to upload
 * @param folder - Folder type ('posts', 'authors', 'categories', 'ui', 'media')
 * @returns Upload result with public_id and metadata
 */
export const uploadImageToCloudinary = async (
  file: File,
  folder: 'posts' | 'authors' | 'categories' | 'ui' | 'media' = 'media'
): Promise<{
  public_id: string;
  image_id: string;
  url: string;
  width: number;
  height: number;
  format: string;
  filename: string;
  size: number;
}> => {
  try {
    const result = await apiService.uploadMedia(file, { folder });
    return result;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

/**
 * Upload image to Firebase Storage (legacy - kept for backward compatibility)
 * @deprecated Use uploadImageToCloudinary instead
 */
export const uploadImageToFirebase = async (
  file: File,
  path: string = 'images'
): Promise<UploadResult> => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;
    
    // Create reference
    const imageRef = ref(storage, `${path}/${fileName}`);
    
    // Upload file
    const snapshot = await uploadBytes(imageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      path: snapshot.ref.fullPath,
      name: fileName,
      size: file.size,
      type: file.type,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
};

/**
 * Upload post image to Cloudinary
 * Returns Cloudinary public_id (use getCloudinaryUrl to construct URLs)
 */
export const uploadPostImage = async (file: File): Promise<string> => {
  const result = await uploadImageToCloudinary(file, 'posts');
  // Return public_id - frontend will construct Cloudinary URLs as needed
  return result.public_id;
};

/**
 * Upload a single file to Firebase Storage
 */
const uploadSingleFile = async (file: File, path: string): Promise<{ url: string; path: string; size: number }> => {
  const fileName = generateUniqueFileName(file.name);
  const storageRef = ref(storage, `${path}/${fileName}`);
  
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  console.log('Uploaded file:', {
    fileName,
    path: snapshot.ref.fullPath,
    url: downloadURL,
    size: file.size
  });
  
  return {
    url: downloadURL,
    path: snapshot.ref.fullPath,
    size: file.size,
  };
};

/**
 * Upload image to Cloudinary (single upload, transformations handled by Cloudinary)
 * Cloudinary handles transformations on-the-fly, so we only need one upload
 */
export const uploadProcessedImage = async (
  file: File,
  folder: 'posts' | 'authors' | 'categories' | 'ui' | 'media' = 'media'
): Promise<ProcessedImage> => {
  try {
    // Get original image dimensions
    const originalDimensions = await getImageDimensions(file);
    
    // Upload single image to Cloudinary
    const uploadResult = await uploadImageToCloudinary(file, folder);
    
    // Cloudinary handles transformations on-the-fly
    // We construct URLs with different transformations for different use cases
    const publicId = uploadResult.public_id;
    
    const result: ProcessedImage = {
      original: {
        url: getCloudinaryUrl(publicId, CloudinaryPresets.cover) || uploadResult.url,
        path: publicId, // Use public_id as path identifier
        width: uploadResult.width,
        height: uploadResult.height,
        size: uploadResult.size,
      },
      thumbnail: {
        url: getCloudinaryUrl(publicId, CloudinaryPresets.thumbnail) || uploadResult.url,
        path: publicId,
        width: Math.min(400, uploadResult.width), // Approximate thumbnail dimensions
        height: Math.min(300, uploadResult.height),
        size: uploadResult.size, // Approximate
      },
      ogImage: {
        url: getCloudinaryUrl(publicId, CloudinaryPresets.social) || uploadResult.url,
        path: publicId,
        width: 1200,
        height: 630,
        size: uploadResult.size, // Approximate
      },
    };
    
    console.log('Processed image result (Cloudinary):', result);
    return result;
  } catch (error) {
    console.error('Error processing and uploading image:', error);
    throw new Error('Failed to process and upload image');
  }
};

/**
 * Upload featured image for posts
 * Uses Cloudinary with on-the-fly transformations
 */
export const uploadFeaturedImage = async (file: File): Promise<ProcessedImage> => {
  return uploadProcessedImage(file, 'posts');
};

export const uploadImageToMediaLibrary = async (
  file: File,
  uploadedBy: string,
  alt: string = '',
  caption: string = ''
): Promise<string> => {
  try {
    // Upload to Cloudinary via API (this also registers in media library)
    const result = await apiService.uploadMedia(file, {
      folder: 'media',
      alt: alt || file.name,
    });
    
    // Return public_id - frontend will construct Cloudinary URLs as needed
    return result.public_id;
  } catch (error) {
    console.error('Error uploading image to media library:', error);
    throw new Error('Failed to upload image to media library');
  }
};
