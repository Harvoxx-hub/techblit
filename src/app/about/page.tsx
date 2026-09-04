import Link from 'next/link';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/ui/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - TechBlit | African Tech News Platform',
  description:
    "TechBlit covers startups, funding, policy, and innovation across Africa. Learn about our mission, editorial team, standards, ownership, and how to reach us.",
  keywords: ['African tech', 'tech news platform', 'Nigeria tech', 'startup news', 'African innovation', 'tech journalism'],
  openGraph: {
    title: 'About TechBlit',
    description:
      'TechBlit covers startups, funding, policy, and innovation across Africa. Our mission, team, standards, and ownership.',
    type: 'website',
    url: 'https://www.techblit.com/about',
  },
  alternates: {
    canonical: 'https://www.techblit.com/about',
  },
};

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * SCAFFOLD — Google News transparency requirements
 *
 * Google News weighs authoritativeness and transparency heavily. Before
 * publishing, replace every [BRACKETED PLACEHOLDER] and resolve every TODO
 * with real, verifiable information:
 *   • Named masthead (editor, key reporters) with links to their author pages
 *   • A dated, specific editorial-standards / ethics statement
 *   • Ownership and funding disclosure
 *   • A corrections policy with a contact route
 *   • A real registered/mailing address (also add it to /contact and the footer)
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
  // TODO: replace with the real registered/mailing address.
  address: {
    '@type': 'PostalAddress',
    streetAddress: '[STREET ADDRESS]',
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
  // TODO: fill in once the masthead is confirmed.
  // founder: { '@type': 'Person', name: '[FOUNDER NAME]' },
  // foundingDate: '[YYYY-MM-DD]',
  ethicsPolicy: 'https://www.techblit.com/about#editorial-standards',
  diversityPolicy: 'https://www.techblit.com/about#editorial-standards',
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
            ecosystem &mdash; startups, funding rounds, product launches, policy and regulation,
            and the people building the continent&rsquo;s digital economy, with particular depth on
            Nigeria.
          </p>

          <h2 id="mission">Our mission</h2>
          <p>
            {/* TODO: replace with the newsroom's own mission statement. */}
            To report African tech accurately and in context &mdash; explaining not just what
            happened, but why it matters for founders, investors, operators, and policymakers
            across the continent.
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
            {/* TODO: list real people with roles and links to their /authors/<name> pages.
                Google News expects a named masthead, not "the team". */}
            TechBlit&rsquo;s journalism is produced by a named editorial team:
          </p>
          <ul>
            <li>
              <strong>[EDITOR-IN-CHIEF NAME]</strong> &mdash; Editor-in-Chief.{' '}
              {/* <Link href="/authors/[slug]">Profile</Link> */}
            </li>
            <li>
              <strong>[REPORTER NAME]</strong> &mdash; Senior Reporter, [beat].
            </li>
            <li>
              <strong>[REPORTER NAME]</strong> &mdash; Reporter, [beat].
            </li>
          </ul>
          <p>
            Full contributor list:{' '}
            <Link href="/authors">TechBlit authors</Link>.
          </p>

          <h2 id="editorial-standards">Editorial standards &amp; ethics</h2>
          <p>
            {/* TODO: expand into a real standards statement and give it a "last reviewed" date.
                Cover: sourcing and verification, use of anonymous sources, conflicts of
                interest, gifts and paid travel, AI use in the newsroom, and how sponsored or
                partner content is labelled and kept separate from editorial. */}
            TechBlit reports independently. Our journalism is not for sale: we do not accept
            payment to publish, alter, or suppress a story. Any sponsored or partner content is
            clearly labelled as such and is produced separately from the newsroom. We correct
            errors promptly and transparently (see below).
          </p>

          <h2 id="ownership-funding">Ownership &amp; funding</h2>
          <p>
            {/* TODO: state who owns TechBlit (parent company / individuals), how it is funded
                (advertising, events, partnerships, investment), and disclose any investor whose
                interests overlap with companies we cover. */}
            TechBlit is [owned and operated by [LEGAL ENTITY NAME], registered in Nigeria].
            It is funded through [advertising, brand partnerships, and events]. [Disclose any
            relevant investors or conflicts here.]
          </p>

          <h2 id="corrections">Corrections</h2>
          <p>
            {/* TODO: confirm the corrections mailbox and turnaround commitment. */}
            If you believe we have published something inaccurate, email{' '}
            <a href="mailto:editor@techblit.com">editor@techblit.com</a> with the article URL and
            the details. We review every request and, where a correction is warranted, update the
            article and note the change.
          </p>

          <h2 id="contact">Contact</h2>
          <p>
            Newsroom and general enquiries:{' '}
            <a href="mailto:editor@techblit.com">editor@techblit.com</a>. Partnerships:{' '}
            <a href="mailto:partnership@techblit.com">partnership@techblit.com</a>. Full details,
            including our postal address, are on the{' '}
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
