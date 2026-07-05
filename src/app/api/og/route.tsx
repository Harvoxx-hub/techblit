/**
 * Dynamic OG Image API
 *
 * Returns a 1200x630 PNG for Open Graph / social sharing.
 * Uses the latest published story's featured image when available.
 */
import { ImageResponse } from 'next/og'
import { getPostsApiUrl } from '@/lib/apiConfig'
import { getSocialImageUrl } from '@/lib/imageHelpers'

export const runtime = 'edge'
export const alt = "TechBlit - Igniting Africa's Tech Conversation"
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.techblit.com'

type LatestPost = {
  title?: string
  excerpt?: string
  featuredImage?: unknown
}

const fetchLatestPost = async (): Promise<LatestPost | null> => {
  try {
    const apiBase = getPostsApiUrl()
    const response = await fetch(`${apiBase}/posts?limit=1`, {
      next: { revalidate: 3600 },
    })
    if (!response.ok) return null
    const json = await response.json()
    const posts = json.data || json || []
    return posts[0] ?? null
  } catch {
    return null
  }
}

export async function GET() {
  const latestPost = await fetchLatestPost()
  const storyImage = latestPost?.featuredImage
    ? getSocialImageUrl(latestPost.featuredImage)
    : null

  if (storyImage) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            position: 'relative',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <img
            src={storyImage}
            alt=""
            width={1200}
            height={630}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,16,43,0.95) 0%, rgba(0,16,43,0.4) 45%, transparent 100%)',
            }}
          />
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              padding: '48px 56px',
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#F2C200',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              TechBlit
            </span>
            <span
              style={{
                fontSize: 42,
                fontWeight: 700,
                color: 'white',
                lineHeight: 1.15,
                maxWidth: 1000,
              }}
            >
              {latestPost?.title || "Igniting Africa's Tech Conversation"}
            </span>
          </div>
        </div>
      ),
      { ...size }
    )
  }

  const logoUrl = `${SITE_URL}/favicon.png`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #00102B 0%, #000817 100%)',
          padding: 80,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginBottom: 16,
          }}
        >
          <img
            src={logoUrl}
            alt="TechBlit logo"
            width={80}
            height={80}
            style={{ borderRadius: 12 }}
          />
          <span
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: 'white',
              letterSpacing: '-0.02em',
            }}
          >
            TechBlit
          </span>
        </div>
        <span
          style={{
            fontSize: 32,
            color: '#F2C200',
            marginBottom: 8,
          }}
        >
          Igniting Africa&apos;s Tech Conversation
        </span>
        <span
          style={{
            fontSize: 24,
            color: '#d1d5db',
            marginBottom: 48,
          }}
        >
          Latest tech news, startup insights & funding from across Africa
        </span>
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 50,
            background: '#F2C200',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
