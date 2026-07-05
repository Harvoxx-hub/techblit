import { getPostsApiUrl } from '@/lib/apiConfig'
import { HomepageData, HomepagePost } from '@/lib/homepageTypes'
import { normalizeHomepageData, emptyHomepageData, buildHomepageFromPosts } from '@/lib/homepageBuckets'
import { fetchHomepageMediaFallback, isHomepageMediaEmpty } from '@/lib/youtubeRss'

export type { HomepagePost, HomepageData } from '@/lib/homepageTypes'

const isHomepageEmpty = (data: HomepageData): boolean =>
  !data.hotNow &&
  data.breaking.length === 0 &&
  data.popular.length === 0 &&
  data.editorsChoice.length === 0

async function fetchPublishedPosts(limit = 120): Promise<HomepagePost[]> {
  const API_BASE = getPostsApiUrl()
  const response = await fetch(`${API_BASE}/posts?limit=${limit}`, {
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    console.error(`Posts API returned ${response.status} from ${API_BASE}/posts`)
    return []
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    console.error(
      `Posts API returned non-JSON (${contentType}). Check NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL — it may point at the Next.js dev server instead of the cloud function.`
    )
    return []
  }

  const json = await response.json()
  const posts: HomepagePost[] = json.data || json || []
  return Array.isArray(posts) ? posts : []
}

async function withMediaFallback(data: HomepageData): Promise<HomepageData> {
  if (!isHomepageMediaEmpty(data.media)) {
    return data
  }

  try {
    const media = await fetchHomepageMediaFallback()
    return { ...data, media }
  } catch (error) {
    console.error('YouTube media fallback failed:', error)
    return data
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
      const data = normalizeHomepageData(json.data || json)
      if (!isHomepageEmpty(data)) {
        return withMediaFallback(data)
      }
      console.warn('Homepage endpoint returned empty buckets, falling back to posts list')
    } else if (response.status !== 404) {
      console.error(`Homepage API returned ${response.status} from ${API_BASE}/homepage`)
    }
  } catch (error) {
    console.error('Homepage endpoint unavailable, falling back to posts list:', error)
  }

  try {
    const posts = await fetchPublishedPosts(120)
    if (posts.length > 0) {
      return withMediaFallback(buildHomepageFromPosts(posts))
    }
  } catch (error) {
    console.error('Posts fallback unavailable, returning empty homepage:', error)
  }

  return withMediaFallback(emptyHomepageData())
}
