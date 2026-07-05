import { ATN_PLAYLIST_URL } from '@/lib/atn'
import { HomepageMedia, VideoItem } from '@/lib/homepageTypes'

const DEFAULT_PLAYLIST_ID = 'PLNkAU1vbJDcCKlSqwqxtKQbT9VTVYuMXY'
const CACHE_TTL_MS = 60 * 60 * 1000

const cache = new Map<string, { data: VideoItem[]; ts: number }>()

const decodeXmlEntities = (str: string): string =>
  str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

const parseEntry = (entryXml: string, playlistKey: string): VideoItem | null => {
  const videoId =
    entryXml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ||
    entryXml.match(/<id>yt:video:([^<]+)<\/id>/)?.[1]

  if (!videoId) return null

  const mediaTitle = entryXml.match(/<media:title>([^<]+)<\/media:title>/)?.[1]
  const entryTitle = entryXml.match(/<entry>[\s\S]*?<title>([^<]+)<\/title>/)?.[1]
  const title = decodeXmlEntities(mediaTitle || entryTitle || 'Untitled')
  const publishedAt = entryXml.match(/<published>([^<]+)<\/published>/)?.[1] || ''
  const thumbnail =
    entryXml.match(/<media:thumbnail[^>]+url="([^"]+)"/)?.[1] ||
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

  return {
    id: videoId,
    title,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    thumbnail,
    publishedAt,
    playlistKey,
  }
}

const getCached = (key: string): VideoItem[] | null => {
  const entry = cache.get(key)
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) {
    return entry.data
  }
  return null
}

const setCached = (key: string, data: VideoItem[]) => {
  cache.set(key, { data, ts: Date.now() })
}

const getPlaylistId = (envValue: string | undefined, fallbackUrl: string): string => {
  if (envValue?.trim()) return envValue.trim()
  const fromUrl = fallbackUrl.match(/list=([^&]+)/)?.[1]
  return fromUrl || DEFAULT_PLAYLIST_ID
}

export async function fetchPlaylistVideos(
  playlistId: string,
  playlistKey: string,
  limit = 10
): Promise<VideoItem[]> {
  if (!playlistId.trim()) return []

  const cacheKey = `${playlistKey}:${playlistId}`
  const cached = getCached(cacheKey)
  if (cached) return cached.slice(0, limit)

  try {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`
    const response = await fetch(feedUrl, {
      headers: { 'User-Agent': 'TechBlit-Homepage/1.0' },
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      console.error(`YouTube RSS fetch failed for ${playlistKey}: HTTP ${response.status}`)
      return []
    }

    const xml = await response.text()
    const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || []
    const videos = entries
      .map((entry) => parseEntry(entry, playlistKey))
      .filter((video): video is VideoItem => Boolean(video))
      .slice(0, limit)

    setCached(cacheKey, videos)
    return videos
  } catch (error) {
    console.error(`YouTube RSS fetch failed for ${playlistKey}:`, error)
    return []
  }
}

export async function fetchHomepageMediaFallback(): Promise<HomepageMedia> {
  const fallbackPlaylist = getPlaylistId(
    process.env.YT_PLAYLIST_DEFAULT,
    ATN_PLAYLIST_URL
  )
  const playlist101 = getPlaylistId(process.env.YT_PLAYLIST_101, '')
  const playlistNewsReview = getPlaylistId(
    process.env.YT_PLAYLIST_NEWS_REVIEW,
    ATN_PLAYLIST_URL
  ) || fallbackPlaylist
  const playlistHotVideos = getPlaylistId(
    process.env.YT_PLAYLIST_HOT_VIDEOS,
    ATN_PLAYLIST_URL
  ) || fallbackPlaylist

  const [episodes101, newsReview, hotVideosRaw] = await Promise.all([
    fetchPlaylistVideos(playlist101, 'series101', 8),
    fetchPlaylistVideos(playlistNewsReview, 'newsReview', 8),
    fetchPlaylistVideos(playlistHotVideos, 'hotVideos', 8),
  ])

  const featuredId = newsReview[0]?.id
  const hotVideos =
    playlistHotVideos === playlistNewsReview && featuredId
      ? hotVideosRaw.filter((video) => video.id !== featuredId).slice(0, 4)
      : hotVideosRaw.slice(0, 4)

  return {
    series101: {
      featured: episodes101[0] || null,
      episodes: episodes101.slice(1, 4),
    },
    newsReview: newsReview.slice(0, 8),
    hotVideos,
  }
}

export const isHomepageMediaEmpty = (media: HomepageMedia): boolean =>
  media.newsReview.length === 0 &&
  media.hotVideos.length === 0 &&
  !media.series101.featured &&
  media.series101.episodes.length === 0
