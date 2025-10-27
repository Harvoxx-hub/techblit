'use client';

import { useState, useRef, useCallback } from 'react';
import { PhotoIcon, XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { ProcessedImage } from '@/lib/imageProcessing';

interface FeaturedImageUploadProps {
  value?: ProcessedImage | {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
    storagePath?: string;
  };
  onChange: (image: ProcessedImage | {
    url: string;
    alt: string;
    width: number;
    height: number;
    storagePath: string;
  } | null) => void;
  onUpload: (file: File) => Promise<ProcessedImage | string>;
  required?: boolean;
  error?: string;
}

export default function FeaturedImageUpload({
  value,
  onChange,
  onUpload,
  required = false,
  error
}: FeaturedImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to get image URL from various formats
  const getImageUrl = (imageData: any): string | null => {
    if (!imageData) return null;
    if (typeof imageData === 'string') return imageData;
    if (typeof imageData === 'object') {
      // Handle ProcessedImage format
      if (imageData.original?.url) return imageData.original.url;
      if (imageData.thumbnail?.url) return imageData.thumbnail.url;
      if (imageData.ogImage?.url) return imageData.ogImage.url;
      // Handle legacy format
      if (imageData.url) return imageData.url;
      if (imageData.downloadURL) return imageData.downloadURL;
      if (imageData.src) return imageData.src;
      if (typeof imageData.toString === 'function') {
        const url = imageData.toString();
        if (url.startsWith('http')) return url;
      }
    }
    return null;
  };

  // Helper function to check if image data is ProcessedImage format
  const isProcessedImage = (imageData: any): imageData is ProcessedImage => {
    return imageData && typeof imageData === 'object' && 
           imageData.original && imageData.thumbnail && imageData.ogImage;
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setIsUploading(true);
    try {
      const result = await onUpload(file);
      
      // Handle ProcessedImage response
      if (isProcessedImage(result)) {
        onChange(result);
        setIsUploading(false);
        return;
      }
      
      // Handle legacy string response
      const url = typeof result === 'string' ? result : (result as any)?.url || '';
      
      // Create a temporary image to get dimensions
      const img = new Image();
      img.onload = () => {
        onChange({
          url,
          alt: file.name.split('.')[0] || 'Featured image',
          width: img.width,
          height: img.height,
          storagePath: url
        });
        setIsUploading(false);
      };
      img.onerror = () => {
        onChange({
          url,
          alt: file.name.split('.')[0] || 'Featured image',
          width: 0,
          height: 0,
          storagePath: url
        });
        setIsUploading(false);
      };
      img.src = url;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      setIsUploading(false);
    }
  }, [onUpload, onChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileUpload(imageFile);
    }
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleRemoveImage = useCallback(() => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  const handleClickUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Featured Image {required && <span className="text-red-500">*</span>}
        </label>
        {value && getImageUrl(value) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveImage}
            className="text-red-600 hover:text-red-700"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
          {error}
        </div>
      )}

      {value && getImageUrl(value) ? (
        /* Image Preview */
        <div className="relative group">
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
            <img
              src={getImageUrl(value)!}
              alt={'alt' in value ? value.alt || 'Featured image' : 'Featured image'}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Image failed to load:', getImageUrl(value));
                console.error('Image data:', value);
                // Show error message instead of hiding
                e.currentTarget.style.display = 'none';
                const errorDiv = document.createElement('div');
                errorDiv.className = 'w-full h-full flex items-center justify-center bg-red-50 text-red-600 text-sm';
                errorDiv.innerHTML = `
                  <div class="text-center">
                    <div class="font-semibold mb-2">Image failed to load</div>
                    <div class="text-xs break-all">${getImageUrl(value)}</div>
                  </div>
                `;
                e.currentTarget.parentNode?.appendChild(errorDiv);
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', getImageUrl(value));
              }}
            />
            <div className="absolute inset-0 group-hover:bg-black group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClickUpload}
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-white"
              >
                <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                Replace Image
              </Button>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {isProcessedImage(value) ? (
              <div className="space-y-1">
                <div>Original: {value.original.width} × {value.original.height}</div>
                <div>Thumbnail: {value.thumbnail.width} × {value.thumbnail.height}</div>
                <div>OG Image: {value.ogImage.width} × {value.ogImage.height}</div>
                <div className="break-all text-xs">URL: {getImageUrl(value)}</div>
                {value.original.url && <div>Alt: {value.original.url.split('/').pop()?.split('.')[0] || 'Featured image'}</div>}
              </div>
            ) : (
              <>
                {value.width && value.height && `${value.width} × ${value.height}`}
                {value.alt && ` • ${value.alt}`}
                <div className="break-all text-xs">URL: {getImageUrl(value)}</div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Upload Area */
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-400 bg-blue-50'
              : error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {isUploading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <div className="text-sm text-gray-600">Uploading image...</div>
            </div>
          ) : (
            <div className="space-y-4">
              <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto" />
              <div className="space-y-2">
                <div className="text-lg font-medium text-gray-700">
                  {isDragging ? 'Drop image here' : 'Upload featured image'}
                </div>
                <div className="text-sm text-gray-500">
                  Drag and drop an image, or{' '}
                  <button
                    type="button"
                    onClick={handleClickUpload}
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    browse files
                  </button>
                </div>
                <div className="text-xs text-gray-400">
                  PNG, JPG, GIF up to 10MB
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500">
        <strong>Tip:</strong> Use a high-quality image (1200×630px recommended) for best results across all platforms.
      </div>
    </div>
  );
}
