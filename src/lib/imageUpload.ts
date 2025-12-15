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

export interface UploadResult {
  url: string;
  path: string;
  name: string;
  size: number;
  type: string;
}

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

export const uploadPostImage = async (file: File): Promise<string> => {
  const result = await uploadImageToFirebase(file, 'posts');
  return result.url;
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
 * Process and upload image with multiple versions (original, thumbnail, OG)
 */
export const uploadProcessedImage = async (
  file: File,
  path: string = 'images'
): Promise<ProcessedImage> => {
  try {
    // Get original image dimensions
    const originalDimensions = await getImageDimensions(file);
    
    // Create compressed thumbnail (400x300 max)
    const thumbnailFile = await compressImage(file, 400, 300, 0.8);
    
    // Create Open Graph image (1200x630)
    const ogFile = await createOGImage(file, 1200, 630, 0.9);
    
    // Upload all three versions
    const [original, thumbnail, ogImage] = await Promise.all([
      uploadSingleFile(file, path),
      uploadSingleFile(thumbnailFile, `${path}/thumbnails`),
      uploadSingleFile(ogFile, `${path}/og`),
    ]);
    
    // Get dimensions for processed images
    const [thumbnailDimensions, ogDimensions] = await Promise.all([
      getImageDimensions(thumbnailFile),
      getImageDimensions(ogFile),
    ]);
    
    const result = {
      original: {
        url: original.url,
        path: original.path,
        width: originalDimensions.width,
        height: originalDimensions.height,
        size: original.size,
      },
      thumbnail: {
        url: thumbnail.url,
        path: thumbnail.path,
        width: thumbnailDimensions.width,
        height: thumbnailDimensions.height,
        size: thumbnail.size,
      },
      ogImage: {
        url: ogImage.url,
        path: ogImage.path,
        width: ogDimensions.width,
        height: ogDimensions.height,
        size: ogImage.size,
      },
    };
    
    console.log('Processed image result:', result);
    return result;
  } catch (error) {
    console.error('Error processing and uploading image:', error);
    throw new Error('Failed to process and upload image');
  }
};

/**
 * Upload featured image for posts with multiple versions
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
    // Process image with multiple versions
    const processedImage = await uploadProcessedImage(file, 'media');
    
    // Create media document with all versions
    const mediaDoc: Omit<Media, 'id'> = {
      fileName: file.name,
      storagePath: processedImage.original.path,
      url: processedImage.original.url,
      uploadedBy,
      width: processedImage.original.width,
      height: processedImage.original.height,
      alt: alt || file.name,
      caption: caption || '',
      sizes: {
        thumbnail: processedImage.thumbnail.url,
        medium: processedImage.original.url,
        large: processedImage.original.url,
      },
      createdAt: new Date(),
      fileSize: processedImage.original.size,
      mimeType: file.type,
    };
    
    // Register in media library via API
    await apiService.uploadMedia(file);
    
    return processedImage.original.url;
  } catch (error) {
    console.error('Error uploading image to media library:', error);
    throw new Error('Failed to upload image to media library');
  }
};
