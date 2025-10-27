/**
 * Image processing utilities for creating compressed thumbnails and uncompressed versions
 */

export interface ProcessedImage {
  original: {
    url: string;
    path: string;
    width: number;
    height: number;
    size: number;
  };
  thumbnail: {
    url: string;
    path: string;
    width: number;
    height: number;
    size: number;
  };
  ogImage: {
    url: string;
    path: string;
    width: number;
    height: number;
    size: number;
  };
}

/**
 * Compress an image file using canvas
 */
export const compressImage = (
  file: File,
  maxWidth: number = 400,
  maxHeight: number = 300,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Create Open Graph optimized image (1200x630)
 */
export const createOGImage = (
  file: File,
  targetWidth: number = 1200,
  targetHeight: number = 630,
  quality: number = 0.9
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Set canvas to target dimensions
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Calculate scaling to fit image in canvas while maintaining aspect ratio
      const imgAspect = img.width / img.height;
      const canvasAspect = targetWidth / targetHeight;

      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = img.width;
      let sourceHeight = img.height;

      if (imgAspect > canvasAspect) {
        // Image is wider than canvas aspect ratio
        sourceWidth = img.height * canvasAspect;
        sourceX = (img.width - sourceWidth) / 2;
      } else {
        // Image is taller than canvas aspect ratio
        sourceHeight = img.width / canvasAspect;
        sourceY = (img.height - sourceHeight) / 2;
      }

      // Draw image centered and cropped to fit canvas
      ctx?.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, targetWidth, targetHeight
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const ogFile = new File([blob], `og-${file.name}`, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(ogFile);
          } else {
            reject(new Error('Failed to create OG image'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Get image dimensions from file
 */
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

/**
 * Generate unique filename with timestamp and random string
 */
export const generateUniqueFileName = (originalName: string, suffix: string = ''): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = originalName.split('.').pop();
  const baseName = originalName.split('.')[0];
  
  if (suffix) {
    return `${timestamp}-${randomString}-${suffix}-${baseName}.${fileExtension}`;
  }
  return `${timestamp}-${randomString}-${baseName}.${fileExtension}`;
};

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
