import type { Metadata } from 'next';
import { Outfit, Fraunces } from 'next/font/google';

const fontBody = Outfit({
  subsets: ['latin'],
  variable: '--font-founders-body',
  display: 'swap',
});

const fontDisplay = Fraunces({
  subsets: ['latin'],
  variable: '--font-founders-display',
  display: 'swap',
});

const SITE = process.env.SITE_URL || 'https://www.techblit.com';

export const metadata: Metadata = {
  title: "Founder's Repository | TechBlit",
  description:
    'Discover founders building across Nigeria — Niger Delta and beyond. Search by region, sector, and stage.',
  openGraph: {
    title: "Founder's Repository | TechBlit",
    description:
      'A curated directory of founders and startups. Apply to be listed after review.',
    url: `${SITE}/founders`,
    type: 'website',
  },
  alternates: {
    canonical: `${SITE}/founders`,
  },
};

export default function FoundersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${fontBody.variable} ${fontDisplay.variable} min-h-screen bg-stone-100 text-stone-900 antialiased [font-family:var(--font-founders-body),system-ui,sans-serif]`}
    >
      {/* Subtle grid + warm wash — depth without heavy gradients */}
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,transparent_35%),radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.08),transparent)]" aria-hidden />
      <div className="relative">{children}</div>
    </div>
  );
}
