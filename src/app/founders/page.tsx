import type { Metadata } from 'next';
import FoundersDirectoryClient from '@/components/founders/FoundersDirectoryClient';
import {
  buildFoundersDirectoryJsonLd,
  FOUNDERS_DIRECTORY_DESCRIPTION,
  FOUNDERS_DIRECTORY_KEYWORDS,
  FOUNDERS_DIRECTORY_TITLE,
  getFounderSiteUrl,
  getFoundersRobots,
} from '@/lib/foundersSeo';

const site = getFounderSiteUrl();

export const metadata: Metadata = {
  title: FOUNDERS_DIRECTORY_TITLE,
  description: FOUNDERS_DIRECTORY_DESCRIPTION,
  keywords: FOUNDERS_DIRECTORY_KEYWORDS,
  alternates: {
    canonical: `${site}/founders`,
  },
  openGraph: {
    title: FOUNDERS_DIRECTORY_TITLE,
    description: FOUNDERS_DIRECTORY_DESCRIPTION,
    url: `${site}/founders`,
    siteName: 'TechBlit',
    type: 'website',
    locale: 'en_NG',
    images: [
      {
        url: '/founders/opengraph-image',
        width: 1200,
        height: 630,
        alt: "TechBlit Founder's Repository — Nigeria startup directory",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: FOUNDERS_DIRECTORY_TITLE,
    description: FOUNDERS_DIRECTORY_DESCRIPTION,
    site: '@techblit',
    creator: '@techblit',
    images: ['/founders/opengraph-image'],
  },
  robots: getFoundersRobots(),
  category: 'technology',
};

export default function FoundersPage() {
  const jsonLd = buildFoundersDirectoryJsonLd(site);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FoundersDirectoryClient />
    </>
  );
}
