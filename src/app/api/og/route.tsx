/**
 * Dynamic OG Image API
 *
 * Returns a 1200x630 PNG for Open Graph / social sharing.
 * WhatsApp and Facebook do NOT support SVG - this provides a raster fallback.
 */
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = "TechBlit - Igniting Africa's Tech Conversation"
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.techblit.com'

export async function GET() {
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
    {
      ...size,
    }
  )
}
