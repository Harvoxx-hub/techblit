import { HomepagePost } from '@/lib/homepageTypes'

export const formatAuthorName = (author: HomepagePost['author']): string => {
  if (typeof author === 'string') return author
  if (author && typeof author === 'object' && author.name) return author.name
  return 'TechBlit Team'
}

export const getPostImageUrl = (
  imageData: unknown,
  getImageUrlFromData: (data: unknown, opts: { preset: string }) => string | null,
  preset: 'cover' | 'thumbnail' = 'cover'
): string | null => {
  return getImageUrlFromData(imageData, { preset })
}
