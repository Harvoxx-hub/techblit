import {
  HomepageData,
  HomepagePost,
  HomepageMedia,
  CategoryColumn,
  FeaturedCategory,
} from '@/lib/homepageTypes'

const DEFAULT_FEATURED_CATEGORY = { slug: 'funding', label: 'Funding' }

const COLUMN_BUCKETS = [
  { key: 'startup', label: 'Startup', slug: 'Startup' },
  { key: 'techNews', label: 'Tech News', slug: 'tech-news' },
  { key: 'funding', label: 'Funding', slug: 'funding' },
  { key: 'events', label: 'Events', slug: 'events' },
  { key: 'insights', label: 'Insights', slug: 'insights' },
  { key: 'fintech', label: 'Fintech', slug: 'fintech' },
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

function createAllocator(allPosts: HomepagePost[]) {
  const usedIds = new Set<string>()

  const markUsed = (post: HomepagePost | null) => {
    if (post?.id) usedIds.add(post.id)
  }

  const markMany = (posts: HomepagePost[]) => {
    posts.forEach(markUsed)
  }

  const take = (count: number, predicate: (p: HomepagePost) => boolean = () => true) => {
    const result: HomepagePost[] = []
    for (const post of allPosts) {
      if (result.length >= count) break
      if (usedIds.has(post.id)) continue
      if (!predicate(post)) continue
      usedIds.add(post.id)
      result.push(post)
    }
    return result
  }

  const takeOne = (predicate: (p: HomepagePost) => boolean = () => true) =>
    take(1, predicate)[0] || null

  const takeFromSorted = (sortedPosts: HomepagePost[], count: number) => {
    const result: HomepagePost[] = []
    for (const post of sortedPosts) {
      if (result.length >= count) break
      if (usedIds.has(post.id)) continue
      usedIds.add(post.id)
      result.push(post)
    }
    return result
  }

  const takeForCategory = (label: string, slug: string, moreCount = 3) => {
    const predicate = (p: HomepagePost) => matchCategory(p, label, slug)
    const lead = takeOne(predicate)
    const more = take(moreCount, predicate)
    return { lead, more }
  }

  const takeUnusedPinned = (posts: HomepagePost[]) => {
    const unused = posts.filter((p) => p?.id && !usedIds.has(p.id))
    markMany(unused)
    return unused
  }

  return { take, takeOne, takeFromSorted, takeForCategory, takeUnusedPinned, markUsed, usedIds }
}

function resolvePinnedPosts(allPosts: HomepagePost[], ids?: string[]): HomepagePost[] {
  if (!ids?.length) return []
  return ids.map((id) => allPosts.find((p) => p.id === id)).filter(Boolean) as HomepagePost[]
}

export function buildHomepageFromPosts(
  allPosts: HomepagePost[],
  media: HomepageMedia = EMPTY_MEDIA
): HomepageData {
  const allocator = createAllocator(allPosts)

  const hotNow = allocator.takeOne()
  const heroSecondary = allocator.take(2)
  const trending = allocator.take(5)

  let breaking = allocator.take(5, isWithin48Hours)
  if (breaking.length < 5) {
    breaking = [...breaking, ...allocator.take(5 - breaking.length)]
  }

  const popularCandidates = [...allPosts]
    .filter((p) => (p.viewCount || 0) > 0)
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
  let popular = allocator.takeFromSorted(popularCandidates, 4)
  if (popular.length < 4) {
    popular = [...popular, ...allocator.take(4 - popular.length)]
  }

  const editorsChoice = allocator.take(8)
  const worthReading = allocator.take(6)

  const featuredCategory: FeaturedCategory = {
    slug: DEFAULT_FEATURED_CATEGORY.slug,
    label: DEFAULT_FEATURED_CATEGORY.label,
    ...allocator.takeForCategory(DEFAULT_FEATURED_CATEGORY.label, DEFAULT_FEATURED_CATEGORY.slug, 6),
  }

  const categoryColumns: CategoryColumn[] = COLUMN_BUCKETS.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    slug: bucket.slug,
    ...allocator.takeForCategory(bucket.label, bucket.slug, 3),
  }))

  const brandPress = allocator.take(8, (p) => matchCategory(p, 'Brand Press', 'brand-press'))
  const latest = allocator.take(5)

  return {
    hotNow,
    heroSecondary,
    trending,
    breaking,
    popular,
    editorsChoice,
    worthReading,
    featuredCategory,
    categoryColumns,
    brandPress,
    latest,
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
      featuredCategory: (data.featuredCategory as FeaturedCategory) || {
        slug: 'funding',
        label: 'Funding',
        lead: null,
        more: [],
      },
      categoryColumns: (data.categoryColumns as CategoryColumn[]) || [],
      brandPress: (data.brandPress as HomepagePost[]) || [],
      latest: (data.latest as HomepagePost[]) || [],
      media: (data.media as HomepageMedia) || EMPTY_MEDIA,
    }
  }
  return migrateLegacyShape(data)
}

export const emptyHomepageData = (): HomepageData => buildHomepageFromPosts([])
