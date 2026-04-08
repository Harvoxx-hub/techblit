import { ImageResponse } from 'next/og';
import { fetchFounderBySlug } from '@/lib/foundersApi';

export const runtime = 'nodejs';
export const alt = "TechBlit Founder's Repository";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const founder = await fetchFounderBySlug(slug);

  const title = founder?.startup_name || 'TechBlit';
  const subtitle = founder?.one_liner || "Founder's Repository";
  const photo = founder?.profile_photo_url;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: 60,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
          <span style={{ fontSize: 28, color: '#94a3b8', fontWeight: 600 }}>TechBlit</span>
          <span style={{ fontSize: 52, color: 'white', fontWeight: 700, lineHeight: 1.1 }}>
            {title}
          </span>
          <span style={{ fontSize: 26, color: '#cbd5e1', lineHeight: 1.35 }}>{subtitle}</span>
        </div>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            width={280}
            height={280}
            style={{
              borderRadius: 140,
              objectFit: 'cover',
              border: '6px solid rgba(255,255,255,0.15)',
            }}
          />
        ) : (
          <div
            style={{
              width: 280,
              height: 280,
              borderRadius: 140,
              background: 'rgba(59, 130, 246, 0.35)',
            }}
          />
        )}
      </div>
    ),
    { ...size }
  );
}
