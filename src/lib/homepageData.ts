import { getPostsApiUrl } from '@/lib/apiConfig'

export interface HomepagePost {
  id: string
  title: string
  slug: string
  excerpt?: string
  category?: string
  categories?: string[]
  author?: string | { uid: string; name: string }
  publishedAt?: unknown
  featuredImage?: unknown
}

export interface HomepageData {
  heroPosts: HomepagePost[]
  highlights: HomepagePost[]
  brandPress: HomepagePost[]
  categories: {
    startup: HomepagePost[]
    techNews: HomepagePost[]
    events: HomepagePost[]
  }
}

export async function getHomepageData(): Promise<HomepageData> {
  const API_BASE = getPostsApiUrl()

  try {
    const response = await fetch(`${API_BASE}/homepage`, {
      next: { revalidate: 3600 },
    })

    if (response.ok) {
      const json = await response.json()
      const data = json.data || json
      return {
        heroPosts: data.heroPosts || [],
        highlights: data.highlights || [],
        brandPress: data.brandPress || [],
        categories: data.categories || { startup: [], techNews: [], events: [] },
      }
    }
  } catch (error) {
    console.error('Homepage endpoint unavailable, falling back to posts list:', error)
  }

  const fallback = await fetch(`${API_BASE}/posts?limit=20`, {
    next: { revalidate: 3600 },
  })

  if (!fallback.ok) {
    return {
      heroPosts: [],
      highlights: [],
      brandPress: [],
      categories: { startup: [], techNews: [], events: [] },
    }
  }

  const json = await fallback.json()
  const posts: HomepagePost[] = json.data || json || []

  const matchCategory = (post: HomepagePost, label: string) => {
    const lower = label.toLowerCase()
    return (
      post.category?.toLowerCase() === lower ||
      (post.categories || []).some((c) => String(c).toLowerCase() === lower)
    )
  }

  return {
    heroPosts: posts.slice(0, 5),
    highlights: posts.slice(0, 8),
    brandPress: posts.filter((p) => matchCategory(p, 'Brand Press')).slice(0, 6),
    categories: {
      startup: posts.filter((p) => matchCategory(p, 'Startup')).slice(0, 4),
      techNews: posts.filter((p) => matchCategory(p, 'Tech News')).slice(0, 4),
      events: posts.filter((p) => matchCategory(p, 'Events')).slice(0, 4),
    },
  }
}
