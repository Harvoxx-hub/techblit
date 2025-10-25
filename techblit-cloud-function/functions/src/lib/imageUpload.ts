import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import { Media } from '@/types/admin';

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

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
    };
    img.src = URL.createObjectURL(file);
  });
};

export const uploadImageToMediaLibrary = async (
  file: File,
  uploadedBy: string,
  alt: string = '',
  caption: string = ''
): Promise<string> => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;
    
    // Create storage reference
    const storageRef = ref(storage, `media/${fileName}`);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Get image dimensions
    const dimensions = await getImageDimensions(file);
    
    // Create media document
    const mediaDoc: Omit<Media, 'id'> = {
      fileName: file.name,
      storagePath: snapshot.ref.fullPath,
      url: downloadURL,
      uploadedBy,
      width: dimensions.width,
      height: dimensions.height,
      alt: alt || file.name,
      caption: caption || '',
      sizes: {
        // For now, we'll use the same URL for all sizes
        // In a production app, you'd generate different sizes
        thumbnail: downloadURL,
        medium: downloadURL,
        large: downloadURL,
      },
      createdAt: new Date(),
      fileSize: file.size,
      mimeType: file.type,
    };
    
    // Add to Firestore media collection
    await addDoc(collection(db, 'media'), {
      ...mediaDoc,
      createdAt: serverTimestamp(),
    });
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image to media library:', error);
    throw new Error('Failed to upload image to media library');
  }
};
