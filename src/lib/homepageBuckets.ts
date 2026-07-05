import {
  HomepageData,
  HomepagePost,
  HomepageMedia,
  CategoryColumn,
  FeaturedCategory,
} from '@/lib/homepageTypes'

const FEATURED_CATEGORY = { slug: 'funding', label: 'Funding' }

const COLUMN_BUCKETS = [
  { key: 'startup', label: 'Startup', slug: 'Startup' },
  { key: 'funding', label: 'Funding', slug: 'funding' },
  { key: 'techNews', label: 'Tech News', slug: 'tech-news' },
]

const EMPTY_MEDIA: HomepageMedia = {
  series101: { featured: null, episodes: [] },
  newsReview: [],
  hotVideos: [],
}

function matchCategory(post: HomepagePost, label: string, slug: string): boolean {
  const categoryLower = label.toLowerCase()
  const slugLower = slug.toLowerCase()
  const postCategory = post.category?.toLowerCase()
  const postCategories = (post.categories || []).map((c) => String(c).toLowerCase())
  return (
    postCategory === categoryLower ||
    postCategory === slugLower ||
    postCategories.includes(categoryLower) ||
    postCategories.includes(slugLower.replace(/-/g, ' '))
  )
}

function getPostTimestamp(post: HomepagePost): number {
  const d = post.publishedAt as { _seconds?: number; seconds?: number } | string | undefined
  if (!d) return 0
  if (typeof d === 'object') {
    if (d._seconds) return d._seconds * 1000
    if (d.seconds) return d.seconds * 1000
  }
  const parsed = new Date(d as string).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

function isWithin48Hours(post: HomepagePost): boolean {
  const ts = getPostTimestamp(post)
  if (!ts) return false
  return ts > Date.now() - 48 * 60 * 60 * 1000
}

function buildCategoryColumn(allPosts: HomepagePost[], bucket: typeof COLUMN_BUCKETS[0]): CategoryColumn {
  const filtered = allPosts.filter((p) => matchCategory(p, bucket.label, bucket.slug))
  return {
    key: bucket.key,
    label: bucket.label,
    slug: bucket.slug,
    lead: filtered[0] || null,
    more: filtered.slice(1, 4),
  }
}

function buildFeaturedCategory(allPosts: HomepagePost[]): FeaturedCategory {
  const filtered = allPosts.filter((p) =>
    matchCategory(p, FEATURED_CATEGORY.label, FEATURED_CATEGORY.slug)
  )
  return {
    slug: FEATURED_CATEGORY.slug,
    label: FEATURED_CATEGORY.label,
    lead: filtered[0] || null,
    more: filtered.slice(1, 7),
  }
}

function buildPopular(allPosts: HomepagePost[]): HomepagePost[] {
  const withViews = [...allPosts]
    .filter((p) => (p.viewCount || 0) > 0)
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))

  if (withViews.length >= 4) return withViews.slice(0, 4)
  return allPosts.slice(2, 6)
}

function buildEditorsChoice(allPosts: HomepagePost[]): HomepagePost[] {
  const dayOffset = Math.floor(Date.now() / (24 * 60 * 60 * 1000)) % 4
  const start = 6 + dayOffset
  const slice = allPosts.slice(start, start + 8)
  if (slice.length >= 4) return slice
  return allPosts.slice(6, 14)
}

function buildBreaking(allPosts: HomepagePost[]): HomepagePost[] {
  const recent = allPosts.filter(isWithin48Hours).slice(0, 5)
  if (recent.length > 0) return recent
  return allPosts.slice(0, 5)
}

export function buildHomepageFromPosts(
  allPosts: HomepagePost[],
  media: HomepageMedia = EMPTY_MEDIA
): HomepageData {
  const brandPress = allPosts
    .filter((p) => matchCategory(p, 'Brand Press', 'brand-press'))
    .slice(0, 8)

  return {
    hotNow: allPosts[0] || null,
    heroSecondary: allPosts.slice(1, 3),
    trending: allPosts.slice(0, 5),
    breaking: buildBreaking(allPosts),
    popular: buildPopular(allPosts),
    editorsChoice: buildEditorsChoice(allPosts),
    worthReading: allPosts.slice(14, 20),
    featuredCategory: buildFeaturedCategory(allPosts),
    categoryColumns: COLUMN_BUCKETS.map((bucket) => buildCategoryColumn(allPosts, bucket)),
    brandPress,
    media,
  }
}

function isNewHomepageShape(data: Record<string, unknown>): boolean {
  return 'hotNow' in data || 'trending' in data
}

function migrateLegacyShape(data: Record<string, unknown>): HomepageData {
  const heroPosts = (data.heroPosts as HomepagePost[]) || []
  const highlights = (data.highlights as HomepagePost[]) || []
  const categories = (data.categories as Record<string, HomepagePost[]>) || {}

  const allPosts = [
    ...heroPosts,
    ...highlights,
    ...(categories.startup || []),
    ...(categories.techNews || []),
    ...(categories.events || []),
    ...(data.brandPress as HomepagePost[] || []),
  ].filter((post, index, arr) => arr.findIndex((p) => p.id === post.id) === index)

  return buildHomepageFromPosts(allPosts, (data.media as HomepageMedia) || EMPTY_MEDIA)
}

export function normalizeHomepageData(data: Record<string, unknown>): HomepageData {
  if (isNewHomepageShape(data)) {
    return {
      hotNow: (data.hotNow as HomepagePost) || null,
      heroSecondary: (data.heroSecondary as HomepagePost[]) || [],
      trending: (data.trending as HomepagePost[]) || [],
      breaking: (data.breaking as HomepagePost[]) || [],
      popular: (data.popular as HomepagePost[]) || [],
      editorsChoice: (data.editorsChoice as HomepagePost[]) || [],
      worthReading: (data.worthReading as HomepagePost[]) || [],
      featuredCategory: (data.featuredCategory as FeaturedCategory) || buildFeaturedCategory([]),
      categoryColumns: (data.categoryColumns as CategoryColumn[]) || [],
      brandPress: (data.brandPress as HomepagePost[]) || [],
      media: (data.media as HomepageMedia) || EMPTY_MEDIA,
    }
  }
  return migrateLegacyShape(data)
}

export const emptyHomepageData = (): HomepageData => buildHomepageFromPosts([])
