import { getPostsApiUrl } from '@/lib/apiConfig'
import { HomepageData, HomepagePost } from '@/lib/homepageTypes'
import { normalizeHomepageData, emptyHomepageData, buildHomepageFromPosts } from '@/lib/homepageBuckets'

export type { HomepagePost, HomepageData } from '@/lib/homepageTypes'

export async function getHomepageData(): Promise<HomepageData> {
  const API_BASE = getPostsApiUrl()

  try {
    const response = await fetch(`${API_BASE}/homepage`, {
      next: { revalidate: 3600 },
    })

    if (response.ok) {
      const json = await response.json()
      const data = json.data || json
      return normalizeHomepageData(data)
    }
  } catch (error) {
    console.error('Homepage endpoint unavailable, falling back to posts list:', error)
  }

  try {
    const fallback = await fetch(`${API_BASE}/posts?limit=120`, {
      next: { revalidate: 3600 },
    })

    if (!fallback.ok) {
      return emptyHomepageData()
    }

    const json = await fallback.json()
    const posts: HomepagePost[] = json.data || json || []
    return buildHomepageFromPosts(posts)
  } catch (error) {
    console.error('Posts fallback unavailable, returning empty homepage:', error)
    return emptyHomepageData()
  }
}
