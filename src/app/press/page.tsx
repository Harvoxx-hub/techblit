import type { Metadata } from 'next';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/ui/Footer';
import { getPressPricing, PROMO_END_LABEL } from '@/lib/press';
import PressLanding from './PressLanding';

const SITE_URL = 'https://www.techblit.com';

export const metadata: Metadata = {
  title: 'Publish Your Story on TechBlit | Brand Press',
  description:
    'For founders, builders, and developers — publish your announcement on techblit.com under the Brand Press label. Live in 24–48 hours.',
  alternates: { canonical: `${SITE_URL}/press` },
  openGraph: {
    title: 'Publish Your Story on TechBlit',
    description:
      'For founders, builders, and developers — anyone with something real happening in tech. Live in 24–48 hours.',
    url: `${SITE_URL}/press`,
    siteName: 'TechBlit',
    type: 'website',
    locale: 'en_NG',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Publish Your Story on TechBlit',
    description:
      'For founders, builders, and developers — anyone with something real happening in tech.',
    site: '@techblit',
  },
};

/**
 * Static render, re-checked hourly so the launch-promo price reverts on its own
 * shortly after the window closes (spec §7) without a deploy.
 */
export const revalidate = 3600;

export default function PressPage() {
  const pricing = getPressPricing();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'TechBlit Feature — Brand Press',
    serviceType: 'Sponsored article publication',
    provider: { '@type': 'Organization', name: 'TechBlit', url: SITE_URL },
    areaServed: 'Africa',
    description:
      'A buyer-submitted announcement published on techblit.com under a clearly labeled Brand Press section, with light editorial review, live within 24–48 hours.',
    offers: {
      '@type': 'Offer',
      price: pricing.current,
      priceCurrency: pricing.currency,
      url: `${SITE_URL}/press`,
      ...(pricing.isPromo
        ? { priceValidUntil: '2026-10-31', description: `Launch promo price until ${PROMO_END_LABEL}` }
        : {}),
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navigation />
      <PressLanding pricing={pricing} />
      <Footer />
    </div>
  );
}
