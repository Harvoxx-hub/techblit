import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = "TechBlit Founder's Repository";
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
          background: 'linear-gradient(145deg, #0c1222 0%, #1e3a5f 45%, #0f172a 100%)',
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
            fontSize: 56,
            color: 'white',
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          Founder&apos;s Repository
        </span>
        <span style={{ marginTop: 20, fontSize: 28, color: '#cbd5e1', lineHeight: 1.4, maxWidth: 820 }}>
          Curated founders & startups across Nigeria — discover by region, sector, and stage.
        </span>
        <span style={{ marginTop: 40, fontSize: 22, color: '#64748b' }}>www.techblit.com/founders</span>
      </div>
    ),
    { ...size }
  );
}
