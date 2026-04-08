import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/ui/Footer';
import { fetchFounderBySlug } from '@/lib/foundersApi';
import { FOUNDER_STAGES } from '@/lib/foundersConstants';
import RequestUpdateModal from '@/components/founders/RequestUpdateModal';

const SITE = process.env.SITE_URL || 'https://www.techblit.com';

function stageLabel(value: string) {
  return FOUNDER_STAGES.find((s) => s.value === value)?.label || value;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const founder = await fetchFounderBySlug(slug);
  if (!founder || !founder.slug) {
    return { title: "Founder | TechBlit Founder's Repository" };
  }
  const title = `${founder.full_name} — ${founder.startup_name} | TechBlit Founder's Repository`;
  const desc = `${founder.one_liner} · ${founder.region} · ${(founder.industry || []).join(', ')}`;
  const url = `${SITE}/founders/${slug}`;
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      type: 'profile',
      images: [{ url: `${SITE}/founders/${slug}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [`${SITE}/founders/${slug}/opengraph-image`],
    },
  };
}

export default async function FounderProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const founder = await fetchFounderBySlug(slug);
  if (!founder || founder.status !== 'approved' || !founder.slug) {
    notFound();
  }

  const sameAs = [founder.linkedin_url, founder.twitter_handle ? `https://twitter.com/${founder.twitter_handle.replace(/^@/, '')}` : null].filter(
    Boolean
  ) as string[];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        name: founder.full_name,
        image: founder.profile_photo_url || undefined,
        sameAs: sameAs.length ? sameAs : undefined,
        jobTitle: 'Founder',
        worksFor: { '@id': `${SITE}/founders/${slug}#org` },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE}/founders/${slug}#org`,
        name: founder.startup_name,
        url: founder.startup_website || undefined,
        description: founder.one_liner,
        areaServed: founder.region,
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navigation />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <Link
          href="/founders"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-stone-900"
        >
          ← Founder&apos;s Repository
        </Link>

        <article className="mt-8 overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-[0_1px_0_rgba(0,0,0,0.04),0_24px_48px_-12px_rgba(28,25,23,0.08)]">
          <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-blue-950 px-6 py-10 text-white sm:px-10 sm:py-12">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_100%_0%,rgba(59,130,246,0.25),transparent)]"
              aria-hidden
            />
            {founder.startup_logo_url && (
              <div className="absolute right-6 top-6 z-10 h-16 w-16 rounded-2xl bg-white/10 p-2 ring-1 ring-white/20 backdrop-blur-sm sm:right-10 sm:top-10">
                <Image
                  src={founder.startup_logo_url}
                  alt=""
                  width={64}
                  height={64}
                  className="h-full w-full object-contain"
                />
              </div>
            )}
            <div className="relative flex flex-col items-start gap-8 sm:flex-row sm:gap-10">
              <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-full border-4 border-white/25 bg-stone-700 shadow-xl ring-2 ring-white/10">
                {founder.profile_photo_url && (
                  <Image
                    src={founder.profile_photo_url}
                    alt={founder.full_name}
                    width={128}
                    height={128}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1 pr-0 sm:pr-24">
                <h1 className="text-3xl font-semibold tracking-tight [font-family:var(--font-founders-display),Georgia,serif] sm:text-4xl">
                  {founder.full_name}
                </h1>
                <p className="mt-2 text-lg text-stone-200">{founder.startup_name}</p>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-stone-300">{founder.one_liner}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                    {founder.region}
                    {founder.state ? ` · ${founder.state}` : ''}
                  </span>
                  {(founder.industry || []).map((i) => (
                    <span
                      key={i}
                      className="rounded-full bg-blue-500/35 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/10"
                    >
                      {i}
                    </span>
                  ))}
                  <span className="rounded-full bg-emerald-500/35 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/10">
                    {stageLabel(founder.stage)}
                  </span>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  {founder.startup_website && (
                    <a
                      href={founder.startup_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
                    >
                      Website
                    </a>
                  )}
                  {founder.linkedin_url && (
                    <a
                      href={founder.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
                    >
                      LinkedIn
                    </a>
                  )}
                  {founder.twitter_handle && (
                    <a
                      href={`https://twitter.com/${founder.twitter_handle.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
                    >
                      X / Twitter
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-10 px-6 py-10 sm:px-10 sm:py-12">
            <section className="max-w-none">
              <h2 className="text-xl font-semibold text-stone-900 [font-family:var(--font-founders-display),Georgia,serif]">
                About the startup
              </h2>
              <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                What are you building?
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-stone-700">{founder.what_building}</p>
              <h3 className="mt-8 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                Problem you&apos;re solving
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-stone-700">{founder.problem_solving}</p>
              <dl className="mt-8 grid grid-cols-1 gap-6 border-t border-stone-100 pt-8 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">Year founded</dt>
                  <dd className="mt-1 text-lg font-semibold text-stone-900">{founder.year_founded}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">Funding</dt>
                  <dd className="mt-1 text-lg font-semibold capitalize text-stone-900">
                    {founder.is_funded === 'yes'
                      ? `Funded (${founder.funding_stage || '—'})`
                      : founder.is_funded === 'bootstrapped'
                        ? 'Bootstrapped'
                        : 'Not funded'}
                  </dd>
                </div>
              </dl>
            </section>

            <div className="flex justify-center border-t border-stone-100 pt-10">
              <RequestUpdateModal slug={slug} />
            </div>
          </div>
        </article>
      </div>
      <Footer />
    </div>
  );
}
