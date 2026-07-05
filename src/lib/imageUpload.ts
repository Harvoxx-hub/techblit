import apiService from '@/lib/apiService'
import {
  getImageDimensions,
  ProcessedImage
} from './imageProcessing'
import { getCloudinaryUrl, CloudinaryPresets } from './cloudinaryUtils'

const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

const ALLOWED_UPLOAD_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp'])

const MAX_UPLOAD_BYTES = 4.5 * 1024 * 1024
const MAX_IMAGE_DIMENSION = 2400

const mimeTypeToExtension = (mimeType: string) => {
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/webp') return 'webp'
  return 'jpg'
}

const withExtension = (fileName: string, extension: string) => {
  const base = fileName.replace(/\.[^/.]+$/, '')
  return `${base}.${extension}`
}

const getFileExtension = (fileName: string) =>
  fileName.split('.').pop()?.toLowerCase() || ''

export const resolveUploadMimeType = (file: File): string => {
  if (file.type && ALLOWED_UPLOAD_MIME_TYPES.has(file.type)) {
    return file.type
  }

  const extension = getFileExtension(file.name)
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg'
  if (extension === 'png') return 'image/png'
  if (extension === 'webp') return 'image/webp'

  return file.type || ''
}

export const isAllowedFeaturedImageFile = (file: File): boolean => {
  if (file.type === 'image/svg+xml') return false

  const mimeType = resolveUploadMimeType(file)
  if (ALLOWED_UPLOAD_MIME_TYPES.has(mimeType)) return true

  const extension = getFileExtension(file.name)
  return ALLOWED_UPLOAD_EXTENSIONS.has(extension)
}

const loadImageElement = (objectUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = objectUrl
  })

const scaleToFit = (width: number, height: number, maxDimension: number) => {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height }
  }

  if (width >= height) {
    return {
      width: maxDimension,
      height: Math.round(height * (maxDimension / width)),
    }
  }

  return {
    width: Math.round(width * (maxDimension / height)),
    height: maxDimension,
  }
}

const canvasToFile = async (
  canvas: HTMLCanvasElement,
  fileName: string,
  mimeType: string,
  quality: number
): Promise<File> => {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) return reject(new Error('Failed to encode image'))
        resolve(result)
      },
      mimeType,
      quality
    )
  })

  const extension = mimeTypeToExtension(mimeType)
  return new File([blob], withExtension(fileName, extension), {
    type: mimeType,
    lastModified: Date.now(),
  })
}

const drawImageToCanvas = (
  img: HTMLImageElement,
  width: number,
  height: number
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to process image')

  ctx.drawImage(img, 0, 0, width, height)
  return canvas
}

const encodeCanvasUnderLimit = async (
  canvas: HTMLCanvasElement,
  fileName: string
): Promise<File> => {
  const outputMime = 'image/jpeg'
  let quality = 0.9
  let prepared = await canvasToFile(canvas, fileName, outputMime, quality)

  while (prepared.size > MAX_UPLOAD_BYTES && quality > 0.45) {
    quality -= 0.08
    prepared = await canvasToFile(canvas, fileName, outputMime, quality)
  }

  if (prepared.size <= MAX_UPLOAD_BYTES) {
    return prepared
  }

  throw new Error('Image is too large after compression. Try a smaller image (max 5MB).')
}

export const prepareImageForUpload = async (file: File): Promise<File> => {
  if (file.type === 'image/svg+xml') {
    throw new Error('SVG images are not supported. Please use JPG, PNG, or WebP.')
  }

  if (!isAllowedFeaturedImageFile(file) && !file.type.startsWith('image/')) {
    throw new Error('Unsupported file type. Please use JPG, PNG, or WebP.')
  }

  if (
    isAllowedFeaturedImageFile(file) &&
    file.size > 0 &&
    file.size <= MAX_UPLOAD_BYTES
  ) {
    const dimensions = await getImageDimensions(file)
    if (
      dimensions.width > 0 &&
      dimensions.height > 0 &&
      dimensions.width <= MAX_IMAGE_DIMENSION &&
      dimensions.height <= MAX_IMAGE_DIMENSION
    ) {
      return file
    }
  }

  const objectUrl = URL.createObjectURL(file)

  try {
    const img = await loadImageElement(objectUrl)
    const sourceWidth = img.naturalWidth || img.width
    const sourceHeight = img.naturalHeight || img.height

    if (!sourceWidth || !sourceHeight) {
      throw new Error('Could not read image dimensions')
    }

    let targetMaxDimension = MAX_IMAGE_DIMENSION
    let prepared: File | null = null

    while (targetMaxDimension >= 800) {
      const { width, height } = scaleToFit(sourceWidth, sourceHeight, targetMaxDimension)
      const canvas = drawImageToCanvas(img, width, height)

      try {
        prepared = await encodeCanvasUnderLimit(canvas, file.name)
        break
      } catch {
        targetMaxDimension = Math.round(targetMaxDimension * 0.8)
      }
    }

    if (!prepared) {
      throw new Error('Image is too large. Please use a smaller image (max 5MB).')
    }

    return prepared
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

/** @deprecated Use prepareImageForUpload */
export const normalizeUploadImageFile = prepareImageForUpload

const rethrowUploadError = (error: unknown, fallback: string): never => {
  if (error instanceof Error && error.message) {
    throw error
  }
  throw new Error(fallback)
}

export const uploadImageToCloudinary = async (
  file: File,
  folder: 'posts' | 'authors' | 'categories' | 'ui' | 'media' = 'media'
): Promise<{
  public_id: string
  image_id: string
  url: string
  width: number
  height: number
  format: string
  filename: string
  size: number
}> => {
  try {
    const preparedFile = await prepareImageForUpload(file)
    const result = await apiService.uploadMedia(preparedFile, { folder })
    return result
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error)
    return rethrowUploadError(error, 'Failed to upload image to Cloudinary')
  }
}

export const uploadProcessedImage = async (
  file: File,
  folder: 'posts' | 'authors' | 'categories' | 'ui' | 'media' = 'media'
): Promise<ProcessedImage> => {
  try {
    const uploadResult = await uploadImageToCloudinary(file, folder)
    const publicId = uploadResult.public_id

    return {
      original: {
        url: getCloudinaryUrl(publicId, CloudinaryPresets.cover) || uploadResult.url,
        path: publicId,
        width: uploadResult.width,
        height: uploadResult.height,
        size: uploadResult.size,
      },
      thumbnail: {
        url: getCloudinaryUrl(publicId, CloudinaryPresets.thumbnail) || uploadResult.url,
        path: publicId,
        width: Math.min(400, uploadResult.width),
        height: Math.min(300, uploadResult.height),
        size: uploadResult.size,
      },
      ogImage: {
        url: getCloudinaryUrl(publicId, CloudinaryPresets.social) || uploadResult.url,
        path: publicId,
        width: 1200,
        height: 630,
        size: uploadResult.size,
      },
    }
  } catch (error) {
    console.error('Error processing and uploading image:', error)
    return rethrowUploadError(error, 'Failed to process and upload image')
  }
}

export const uploadFeaturedImage = async (file: File): Promise<ProcessedImage> => {
  return uploadProcessedImage(file, 'posts')
}

export const uploadImageToMediaLibrary = async (
  file: File,
  _uploadedBy: string,
  alt: string = ''
): Promise<string> => {
  try {
    const preparedFile = await prepareImageForUpload(file)
    const result = await apiService.uploadMedia(preparedFile, {
      folder: 'media',
      alt: alt || file.name,
    })
    return result.public_id
  } catch (error) {
    console.error('Error uploading image to media library:', error)
    return rethrowUploadError(error, 'Failed to upload image to media library')
  }
}
