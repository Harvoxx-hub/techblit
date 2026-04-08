import type { Metadata } from 'next';
import type { FounderRecord } from '@/lib/foundersConstants';

/** Canonical site URL for founders SEO (matches root layout / env) */
export function getFounderSiteUrl(): string {
  return process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.techblit.com';
}

/** Truncate for meta description (~155–160 chars is ideal for SERPs) */
export function truncateMetaDescription(text: string, max = 158): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

export const FOUNDERS_DIRECTORY_TITLE =
  "Founder's Repository — Nigeria startup & founder directory | TechBlit";

export const FOUNDERS_DIRECTORY_DESCRIPTION =
  'Discover curated founders and startups across Nigeria and the Niger Delta. Filter by region, sector, stage, and funding. Apply to be listed after editorial review.';

export const FOUNDERS_DIRECTORY_KEYWORDS = [
  'Nigeria startups',
  'African founders',
  'Niger Delta startups',
  'startup directory Nigeria',
  'TechBlit founders',
  'Nigeria tech ecosystem',
  'early-stage startups',
  'founder profiles',
];

export const FOUNDERS_APPLY_TITLE = "Apply to be listed | TechBlit Founder's Repository";

export const FOUNDERS_APPLY_DESCRIPTION =
  "Submit your startup to the TechBlit Founder's Repository. Share your story, traction, and team — we review every application and publish approved profiles.";

export const FOUNDERS_APPLY_KEYWORDS = [
  'list startup Nigeria',
  'founder application',
  'TechBlit apply',
  'startup directory apply',
  'Nigeria founder listing',
];

export function getFoundersRobots(): Metadata['robots'] {
  const prod = process.env.VERCEL_ENV === 'production';
  return {
    index: prod,
    follow: prod,
    googleBot: {
      index: prod,
      follow: prod,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  };
}

export function buildFoundersDirectoryJsonLd(siteUrl: string) {
  const pageUrl = `${siteUrl}/founders`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        name: 'TechBlit',
        url: siteUrl,
        publisher: { '@id': `${siteUrl}/#organization` },
      },
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'TechBlit',
        url: siteUrl,
        logo: `${siteUrl}/logo.png`,
        sameAs: [
          'https://twitter.com/techblit',
          'https://facebook.com/techblit',
          'https://linkedin.com/company/techblit',
        ],
      },
      {
        '@type': 'CollectionPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: "TechBlit Founder's Repository",
        description: FOUNDERS_DIRECTORY_DESCRIPTION,
        isPartOf: { '@id': `${siteUrl}/#website` },
        about: {
          '@type': 'Thing',
          name: 'Technology founders and startups in Nigeria',
        },
        inLanguage: 'en-NG',
      },
    ],
  };
}

export function buildFounderProfileJsonLd(founder: FounderRecord, slug: string) {
  const siteUrl = getFounderSiteUrl();
  const url = `${siteUrl}/founders/${slug}`;
  const sameAs = [
    founder.linkedin_url,
    founder.twitter_handle
      ? `https://twitter.com/${founder.twitter_handle.replace(/^@/, '')}`
      : null,
  ].filter(Boolean) as string[];

  const industries = founder.industry || [];
  const regionLine = [founder.region, founder.state].filter(Boolean).join(', ');

  const org: Record<string, unknown> = {
    '@type': 'Organization',
    '@id': `${url}#organization`,
    name: founder.startup_name,
    url: founder.startup_website || url,
    description: founder.one_liner,
    ...(founder.startup_logo_url
      ? {
          logo: {
            '@type': 'ImageObject',
            url: founder.startup_logo_url,
          },
        }
      : {}),
  };

  if (regionLine) {
    org.areaServed = {
      '@type': 'AdministrativeArea',
      name: regionLine,
    };
  }

  const person: Record<string, unknown> = {
    '@type': 'Person',
    '@id': `${url}#person`,
    name: founder.full_name,
    url,
    jobTitle: 'Founder',
    worksFor: { '@id': `${url}#organization` },
    ...(founder.profile_photo_url ? { image: founder.profile_photo_url } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };

  if (industries.length) {
    person.knowsAbout = industries.map((name) => ({ '@type': 'Thing', name }));
  }

  const webPage: Record<string, unknown> = {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: `${founder.startup_name} — ${founder.full_name}`,
    description: truncateMetaDescription(
      `${founder.one_liner} ${regionLine ? `· ${regionLine}` : ''} · ${industries.join(', ')}`
    ),
    isPartOf: { '@id': `${siteUrl}/#website` },
    inLanguage: 'en-NG',
    mainEntity: { '@id': `${url}#person` },
    breadcrumb: { '@id': `${url}#breadcrumb` },
  };
  if (founder.profile_photo_url) {
    webPage.primaryImageOfPage = {
      '@type': 'ImageObject',
      url: founder.profile_photo_url,
    };
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      webPage,
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: "Founder's Repository",
            item: `${siteUrl}/founders`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: founder.startup_name,
            item: url,
          },
        ],
      },
      org,
      person,
    ],
  };
}
