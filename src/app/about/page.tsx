import Link from 'next/link';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/ui/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - TechBlit | African Tech News Platform',
  description:
    "TechBlit is an independent news publication covering startups, funding, policy, and innovation across Africa. Our mission, team, editorial standards, ownership, and how to reach us.",
  keywords: ['African tech', 'tech news platform', 'Nigeria tech', 'startup news', 'African innovation', 'tech journalism'],
  openGraph: {
    title: 'About TechBlit',
    description:
      'TechBlit is an independent news publication covering startups, funding, policy, and innovation across Africa.',
    type: 'website',
    url: 'https://www.techblit.com/about',
  },
  alternates: {
    canonical: 'https://www.techblit.com/about',
  },
};

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * Still needed for full Google News / AI-source transparency — replace the
 * bracketed spots and drop this note once done:
 *   1. A named editor-in-chief (and ideally 1–2 senior reporters) in
 *      "Editorial team", each linked to their /authors/<name> page.
 *   2. The legal entity that owns TechBlit + how it is funded, in
 *      "Ownership & funding".
 *   3. A street / registered address in the footer, /contact, and the
 *      `address` block below — all three must match.
 *   4. A real "last reviewed" date on "Editorial standards".
 * ─────────────────────────────────────────────────────────────────────────────
 */

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'NewsMediaOrganization',
  name: 'TechBlit',
  url: 'https://www.techblit.com',
  logo: 'https://www.techblit.com/icon-512.png',
  description: "Igniting Africa's Tech Conversation",
  email: 'editor@techblit.com',
  address: {
    '@type': 'PostalAddress',
    // TODO: add streetAddress once confirmed.
    addressLocality: 'Port Harcourt',
    addressRegion: 'Rivers State',
    addressCountry: 'NG',
  },
  sameAs: [
    'https://twitter.com/techblit',
    'https://www.linkedin.com/company/techblit',
    'https://www.facebook.com/techblitblog/',
    'https://www.instagram.com/techblitblog/',
  ],
  ethicsPolicy: 'https://www.techblit.com/about#editorial-standards',
  masthead: 'https://www.techblit.com/about#editorial-team',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-8">
          About TechBlit
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p>
            TechBlit is an independent news publication covering the African technology
            ecosystem &mdash; startups, funding rounds, product launches, policy and
            regulation, and the people building the continent&rsquo;s digital economy, with
            particular depth on Nigeria. We publish original reporting daily from Port
            Harcourt, Nigeria.
          </p>

          <h2 id="mission">Our mission</h2>
          <p>
            To report African tech accurately and in context &mdash; explaining not just
            what happened, but why it matters for founders, investors, operators, and
            policymakers across the continent.
          </p>

          <h2 id="what-we-cover">What we cover</h2>
          <ul>
            <li>Startup and company news</li>
            <li>Funding rounds, M&amp;A, and investor activity</li>
            <li>Fintech, payments, and financial inclusion</li>
            <li>Policy, regulation, and government technology</li>
            <li>Telecoms, connectivity, and infrastructure</li>
            <li>AI and emerging technology in an African context</li>
            <li>Founder and operator profiles</li>
          </ul>

          <h2 id="editorial-team">Editorial team</h2>
          <p>
            Every TechBlit article carries a byline, and every writer has a profile page
            listing their work and the areas they cover. You can browse the full team on
            the <Link href="/authors">contributors page</Link>.
          </p>
          <p>
            {/* TODO: name the editor-in-chief (and any senior reporters) here, each
                linked to their /authors/<slug> page. */}
            Editorial decisions and corrections are the responsibility of the TechBlit
            editor, reachable at{' '}
            <a href="mailto:editor@techblit.com">editor@techblit.com</a>.
          </p>

          <h2 id="editorial-standards">Editorial standards &amp; ethics</h2>
          <p>
            TechBlit reports independently. Our journalism is not for sale: we do not
            accept payment to publish, alter, or suppress a story, and no advertiser or
            partner sees coverage before publication.
          </p>
          <ul>
            <li>
              We verify information before publishing and attribute claims to named
              sources or primary documents wherever possible.
            </li>
            <li>
              Anonymous sources are used only when the information is in the public
              interest and cannot be obtained on the record; a TechBlit editor knows the
              source&rsquo;s identity in every such case.
            </li>
            <li>
              Reporters do not cover companies they hold a financial stake in or a close
              personal relationship with, and do not accept paid travel, gifts, or
              hospitality that could influence coverage.
            </li>
            <li>
              Any sponsored, partner, or press-release content is clearly labelled as
              such and is produced separately from the newsroom. It is not presented as
              independent reporting.
            </li>
            <li>
              AI tools may assist with research, transcription, or drafting, but every
              published article is reviewed and stands behind a named human byline.
            </li>
          </ul>
          <p>
            {/* TODO: set a real "last reviewed" date once an editor signs off. */}
          </p>

          <h2 id="ownership-funding">Ownership &amp; funding</h2>
          <p>
            TechBlit is editorially independent and is not owned or controlled by any of
            the companies, investors, or government bodies it covers.
          </p>
          <p>
            {/* TODO: state the legal entity that owns/operates TechBlit and its revenue
                sources (advertising, partnerships, events, investment), and disclose any
                investor whose interests overlap with companies we cover. */}
          </p>

          <h2 id="corrections">Corrections</h2>
          <p>
            If you believe we have published something inaccurate, email{' '}
            <a href="mailto:editor@techblit.com">editor@techblit.com</a> with the article
            URL and the details. We review every request and, where a correction is
            warranted, we update the article and add a note recording what changed.
          </p>

          <h2 id="contact">Contact</h2>
          <p>
            Newsroom and general enquiries:{' '}
            <a href="mailto:editor@techblit.com">editor@techblit.com</a>. Partnerships and
            advertising: <a href="mailto:partnership@techblit.com">partnership@techblit.com</a>.
            Full details, including our postal address, are on the{' '}
            <Link href="/contact">contact page</Link>.
          </p>
        </div>

        <div className="mt-12">
          <Link
            href="/"
            className="inline-block bg-brand-navy text-white px-6 py-3 rounded-lg hover:bg-brand-navy/90 transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
