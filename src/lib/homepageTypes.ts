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
  readTime?: string
  viewCount?: number
}

export interface VideoItem {
  id: string
  title: string
  url: string
  thumbnail: string
  publishedAt: string
  playlistKey: string
}

export interface CategoryColumn {
  key: string
  label: string
  slug: string
  lead: HomepagePost | null
  more: HomepagePost[]
}

export interface FeaturedCategory {
  slug: string
  label: string
  lead: HomepagePost | null
  more: HomepagePost[]
}

export interface HomepageMedia {
  series101: {
    featured: VideoItem | null
    episodes: VideoItem[]
  }
  newsReview: VideoItem[]
  hotVideos: VideoItem[]
}

export interface HomepageData {
  hotNow: HomepagePost | null
  heroSecondary: HomepagePost[]
  trending: HomepagePost[]
  breaking: HomepagePost[]
  popular: HomepagePost[]
  editorsChoice: HomepagePost[]
  worthReading: HomepagePost[]
  featuredCategory: FeaturedCategory
  categoryColumns: CategoryColumn[]
  brandPress: HomepagePost[]
  media: HomepageMedia
}
