/**
 * Image helpers — Cloudinary public_id only
 */
import { getCloudinaryUrl, CloudinaryPresets, normalizeToPublicId } from './cloudinaryUtils'

export interface FeaturedImageRef {
  public_id?: string
  image_id?: string
  alt?: string
  width?: number
  height?: number
}

export function extractPublicId(imageData: unknown): string | null {
  if (!imageData) return null

  if (typeof imageData === 'string') {
    return normalizeToPublicId(imageData)
  }

  if (typeof imageData === 'object' && imageData !== null) {
    const img = imageData as Record<string, unknown>

    if (typeof img.public_id === 'string') return img.public_id
    if (typeof img.image_id === 'string') return img.image_id

    const original = img.original as Record<string, unknown> | undefined
    if (typeof original?.public_id === 'string') return original.public_id
    if (typeof original?.image_id === 'string') return original.image_id
    if (typeof original?.path === 'string' && String(original.path).startsWith('techblit/')) {
      return String(original.path)
    }

    if (typeof img.url === 'string') return normalizeToPublicId(img.url)
  }

  return null
}

export function getImageUrlFromData(
  imageData: unknown,
  options?: {
    preferThumbnail?: boolean
    preset?: keyof typeof CloudinaryPresets
    width?: number
    height?: number
  }
): string | null {
  const publicId = extractPublicId(imageData)
  if (!publicId) return null

  if (options?.preset) {
    return getCloudinaryUrl(publicId, options.preset)
  }

  if (options?.width || options?.height) {
    return getCloudinaryUrl(publicId, {
      width: options.width,
      height: options.height,
    })
  }

  return getCloudinaryUrl(publicId, 'cover')
}

export function getThumbnailUrl(imageData: unknown): string | null {
  return getImageUrlFromData(imageData, { preset: 'thumbnail' })
}

export function getCoverUrl(imageData: unknown): string | null {
  return getImageUrlFromData(imageData, { preset: 'cover' })
}

export function getSocialImageUrl(imageData: unknown): string | null {
  return getImageUrlFromData(imageData, { preset: 'social' })
}

export function getInlineImageUrl(imageData: unknown): string | null {
  return getImageUrlFromData(imageData, { preset: 'inline' })
}

export function normalizeFeaturedImageForSave(
  uploadResult: {
    public_id: string
    width: number
    height: number
  },
  alt: string
): FeaturedImageRef {
  return {
    public_id: uploadResult.public_id,
    image_id: uploadResult.public_id,
    alt,
    width: uploadResult.width,
    height: uploadResult.height,
  }
}
