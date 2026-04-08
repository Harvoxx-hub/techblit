import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Apply to the TechBlit Founders Repository';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'linear-gradient(155deg, #1c1917 0%, #292524 40%, #1c3a5f 100%)',
          padding: 72,
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <span style={{ fontSize: 26, color: '#93c5fd', fontWeight: 700, letterSpacing: '0.08em' }}>
          TECHBLIT
        </span>
        <span
          style={{
            marginTop: 24,
            fontSize: 52,
            color: 'white',
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: 920,
          }}
        >
          Apply to be listed
        </span>
        <span style={{ marginTop: 20, fontSize: 26, color: '#d6d3d1', lineHeight: 1.45, maxWidth: 800 }}>
          Join Nigeria&apos;s curated founder directory. We review every application.
        </span>
        <span style={{ marginTop: 40, fontSize: 22, color: '#78716c' }}>www.techblit.com/founders/apply</span>
      </div>
    ),
    { ...size }
  );
}
