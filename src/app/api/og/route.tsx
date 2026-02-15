/**
 * Dynamic OG Image API
 *
 * Returns a 1200x630 PNG for Open Graph / social sharing.
 * WhatsApp and Facebook do NOT support SVG - this provides a raster fallback.
 */
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = "TechBlit - Igniting Africa's Tech Conversation";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export async function GET() {
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
          background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
          padding: 80,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Logo block */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: '#3b82f6',
              borderRadius: 12,
            }}
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
        {/* Tagline */}
        <span
          style={{
            fontSize: 32,
            color: '#9ca3af',
            marginBottom: 8,
          }}
        >
          Igniting Africa&apos;s Tech Conversation
        </span>
        {/* Description */}
        <span
          style={{
            fontSize: 24,
            color: '#d1d5db',
            marginBottom: 48,
          }}
        >
          Latest tech news, startup insights & funding from across Africa
        </span>
        {/* Tech icons */}
        <div
          style={{
            display: 'flex',
            gap: 40,
            position: 'absolute',
            right: 80,
            top: 120,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.3)',
            }}
          />
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.3)',
            }}
          />
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.3)',
            }}
          />
        </div>
        {/* Bottom accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 50,
            background: '#3b82f6',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
