import { getPostsApiUrl } from '@/lib/apiConfig'
import { HomepagePost } from '@/lib/homepageTypes'
import { VideoItem } from '@/lib/homepageTypes'
import { getHomepageData } from '@/lib/homepageData'

export async function fetchPostsList(limit = 40): Promise<HomepagePost[]> {
  try {
    const response = await fetch(`${getPostsApiUrl()}/posts?limit=${limit}`, {
      next: { revalidate: 3600 },
    })
    if (!response.ok) return []
    const json = await response.json()
    return json.data || json || []
  } catch {
    return []
  }
}

export const getPrimaryCategory = (post: {
  category?: string
  categories?: string[]
}): string | null => post.category || post.categories?.[0] || null

const matchCategory = (post: HomepagePost, category: string): boolean => {
  const lower = category.toLowerCase()
  return (
    post.category?.toLowerCase() === lower ||
    (post.categories || []).some((c) => String(c).toLowerCase() === lower)
  )
}

export const filterRelatedPosts = (
  posts: HomepagePost[],
  currentId: string,
  category: string | null,
  limit = 5
): HomepagePost[] => {
  const others = posts.filter((p) => p.id !== currentId)
  if (category) {
    const matched = others.filter((p) => matchCategory(p, category))
    if (matched.length >= 2) return matched.slice(0, limit)
  }
  return others.slice(0, limit)
}

export const filterLatestPosts = (
  posts: HomepagePost[],
  currentId: string,
  limit = 6
): HomepagePost[] => posts.filter((p) => p.id !== currentId).slice(0, limit)

export async function getAtnFeaturedVideo(): Promise<VideoItem | null> {
  try {
    const data = await getHomepageData()
    return data.media.newsReview[0] ?? null
  } catch {
    return null
  }
}

export const FOUNDERS_CTA_CATEGORIES = ['Startup', 'Funding', 'Fintech']
