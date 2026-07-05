'use client'

import { useState, useRef, useCallback } from 'react'
import { PhotoIcon, XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui'
import { isAllowedFeaturedImageFile } from '@/lib/imageUpload'
import { FeaturedImageRef, getCoverUrl, extractPublicId } from '@/lib/imageHelpers'

interface RecommendedImage {
  url: string
  description?: string
  source?: string
}

interface FeaturedImageUploadProps {
  value?: FeaturedImageRef | unknown
  onChange: (image: FeaturedImageRef | null) => void
  onUpload: (file: File) => Promise<FeaturedImageRef>
  required?: boolean
  error?: string
  recommendedImages?: RecommendedImage[]
}

export default function FeaturedImageUpload({
  value,
  onChange,
  onUpload,
  required = false,
  error,
  recommendedImages = []
}: FeaturedImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const previewUrl = getCoverUrl(value)

  const handleFileUpload = useCallback(async (file: File) => {
    if (!isAllowedFeaturedImageFile(file)) {
      alert('Please use a JPG, PNG, or WebP image (max 5MB). SVG and GIF are not supported.')
      return
    }

    setIsUploading(true)
    try {
      const result = await onUpload(file)
      onChange(result)
    } catch (uploadError) {
      console.error('Error uploading image:', uploadError)
      const message = uploadError instanceof Error ? uploadError.message : 'Failed to upload image. Please try again.'
      alert(message)
    } finally {
      setIsUploading(false)
    }
  }, [onUpload, onChange])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find((file) => isAllowedFeaturedImageFile(file))

    if (imageFile) {
      handleFileUpload(imageFile)
      return
    }

    if (files.some((file) => file.type.startsWith('image/'))) {
      alert('Please use a JPG, PNG, or WebP image (max 5MB). SVG and GIF are not supported.')
    }
  }, [handleFileUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }, [handleFileUpload])

  const handleRemoveImage = useCallback(() => {
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onChange])

  const handleClickUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const imageRef = value as FeaturedImageRef | undefined
  const altText = imageRef?.alt || 'Featured image'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Featured Image {required && <span className="text-red-500">*</span>}
        </label>
        {previewUrl && (
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

      {previewUrl ? (
        <div className="relative group">
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
            <img
              src={previewUrl}
              alt={altText}
              className="w-full h-full object-cover"
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
          {extractPublicId(value) && (
            <div className="mt-2 text-xs text-gray-500">
              {imageRef?.width && imageRef?.height && `${imageRef.width} × ${imageRef.height}`}
              {imageRef?.alt && ` • ${imageRef.alt}`}
            </div>
          )}
        </div>
      ) : (
        <>
          {recommendedImages.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI-Recommended Images
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Recommended images must be uploaded manually — external URLs are not stored.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {recommendedImages.map((image, index) => (
                  <div
                    key={index}
                    className="relative border-2 border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div className="aspect-video bg-gray-100">
                      <img
                        src={image.url}
                        alt={image.description || `Recommended image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {image.description && (
                      <div className="p-2 bg-gray-50">
                        <p className="text-xs text-gray-600 line-clamp-2">{image.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
              accept="image/jpeg,image/png,image/webp"
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
                    JPG, PNG, or WebP up to 5MB
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <div className="text-xs text-gray-500">
        <strong>Tip:</strong> Use a high-quality image (1200×630px recommended) for best results across all platforms.
      </div>
    </div>
  )
}
