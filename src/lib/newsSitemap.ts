/**
 * Google News sitemap generation.
 *
 * Google News expects a sitemap that lists ONLY articles published in the
 * last 48 hours (older entries are ignored / should be removed), with the
 * <news:news> extension carrying the publication name, language, publish
 * date and headline.
 *
 * https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */
import { getPostsApiUrl } from '@/lib/apiConfig'
import { parseDate } from '@/lib/dateUtils'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.techblit.com'
const PUBLICATION_NAME = 'TechBlit'
const PUBLICATION_LANGUAGE = 'en'

// Google drops anything older than 48h from a news sitemap; use a small
// margin so an article published just under two days ago is still present.
const MAX_AGE_MS = 50 * 60 * 60 * 1000
// Hard cap per Google's news-sitemap limit (1,000 URLs).
const MAX_URLS = 1000

interface NewsPost {
  slug?: string
  id?: string
  title?: string
  status?: string
  publishedAt?: unknown
  createdAt?: unknown
}

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

async function fetchRecentPosts(): Promise<NewsPost[]> {
  try {
    const response = await fetch(`${getPostsApiUrl()}/posts?limit=200`, {
      // Keep this fresh — a news sitemap that lags by an hour is much less
      // useful to Google News.
      next: { revalidate: 600 },
    })
    if (!response.ok) return []
    const json = await response.json()
    return (json.data || json || []) as NewsPost[]
  } catch {
    return []
  }
}

interface NewsEntry {
  slug: string
  title: string
  published: Date
}

export async function generateNewsSitemapXml(): Promise<string> {
  const posts = await fetchRecentPosts()
  const cutoff = Date.now() - MAX_AGE_MS

  const entries: NewsEntry[] = []
  for (const post of posts) {
    const slug = post.slug || post.id
    const title = post.title
    const published = parseDate(post.publishedAt) || parseDate(post.createdAt)
    if (!slug || !title || !published || Number.isNaN(published.getTime())) continue
    if (published.getTime() < cutoff) continue
    if (post.status !== undefined && post.status !== 'published') continue
    entries.push({ slug, title, published })
  }

  entries.sort((a, b) => b.published.getTime() - a.published.getTime())
  const limited = entries.slice(0, MAX_URLS)

  const urls = limited
    .map(
      ({ slug, title, published }) => `  <url>
    <loc>${SITE_URL}/${escapeXml(slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>${PUBLICATION_NAME}</news:name>
        <news:language>${PUBLICATION_LANGUAGE}</news:language>
      </news:publication>
      <news:publication_date>${published.toISOString()}</news:publication_date>
      <news:title>${escapeXml(title)}</news:title>
    </news:news>
  </url>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>
`
}
