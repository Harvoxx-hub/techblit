/**
 * Server-side Algolia search, used by the crawlable /search page.
 *
 * Uses the same public, search-only key as the client SearchModal.
 */
const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || 'YIZ3TZ073A'
const ALGOLIA_API_KEY =
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '3416d2344394220af7857d4fa1aa6e3b'
const ALGOLIA_INDEX_NAME = 'techblit_posts'
const ALGOLIA_URL = `https://${ALGOLIA_APP_ID}-dsn.algolia.net`

export interface SearchHit {
  objectID: string
  title: string
  slug: string
  excerpt?: string
  category?: string
  author?: string
  publishedAt?: number
}

export async function searchPosts(query: string, hitsPerPage = 20): Promise<SearchHit[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  try {
    const res = await fetch(`${ALGOLIA_URL}/1/indexes/${ALGOLIA_INDEX_NAME}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        'X-Algolia-API-Key': ALGOLIA_API_KEY,
      },
      body: JSON.stringify({
        query: trimmed,
        hitsPerPage,
        attributesToRetrieve: [
          'objectID',
          'title',
          'slug',
          'excerpt',
          'category',
          'author',
          'publishedAt',
        ],
      }),
      // Search results change with the index; don't cache aggressively.
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.hits || []) as SearchHit[]
  } catch {
    return []
  }
}
