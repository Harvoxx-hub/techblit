/**
 * RSS 2.0 feed for the latest published articles.
 *
 * Helps news aggregators (and Google) discover new content quickly, and
 * gives readers a subscribe option.
 */
import { getPostsApiUrl } from '@/lib/apiConfig'
import { parseDate } from '@/lib/dateUtils'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.techblit.com'
const FEED_TITLE = "TechBlit - Igniting Africa's Tech Conversation"
const FEED_DESCRIPTION =
  'The latest African tech news, startup insights, funding rounds, and innovation stories from TechBlit.'
const ITEM_LIMIT = 40

interface FeedPost {
  slug?: string
  id?: string
  title?: string
  excerpt?: string
  metaDescription?: string
  status?: string
  category?: string
  categories?: string[]
  author?: string | { name?: string }
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

const authorName = (author: FeedPost['author']): string | null => {
  if (!author) return null
  if (typeof author === 'string') return author
  return author.name || null
}

async function fetchFeedPosts(): Promise<FeedPost[]> {
  try {
    const response = await fetch(`${getPostsApiUrl()}/posts?limit=${ITEM_LIMIT}`, {
      next: { revalidate: 900 },
    })
    if (!response.ok) return []
    const json = await response.json()
    return (json.data || json || []) as FeedPost[]
  } catch {
    return []
  }
}

interface FeedItem {
  post: FeedPost
  slug: string
  published: Date
}

export async function generateRssFeed(): Promise<string> {
  const posts = await fetchFeedPosts()

  const items: FeedItem[] = []
  for (const post of posts) {
    const slug = post.slug || post.id
    const published = parseDate(post.publishedAt) || parseDate(post.createdAt)
    if (!slug || !post.title || !published || Number.isNaN(published.getTime())) continue
    if (post.status !== undefined && post.status !== 'published') continue
    items.push({ post, slug, published })
  }
  items.sort((a, b) => b.published.getTime() - a.published.getTime())
  const limited = items.slice(0, ITEM_LIMIT)

  const now = new Date().toUTCString()

  const itemXml = limited
    .map(({ post, slug, published }) => {
      const link = `${SITE_URL}/${slug}`
      const description = post.excerpt || post.metaDescription || ''
      const category = post.category || post.categories?.[0]
      const author = authorName(post.author)
      return `    <item>
      <title>${escapeXml(post.title || '')}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${published.toUTCString()}</pubDate>${
        category ? `\n      <category>${escapeXml(category)}</category>` : ''
      }${author ? `\n      <dc:creator>${escapeXml(author)}</dc:creator>` : ''}
      <description>${escapeXml(description)}</description>
    </item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
${itemXml}
  </channel>
</rss>
`
}
