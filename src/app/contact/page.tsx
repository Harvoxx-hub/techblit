import Link from 'next/link';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/ui/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact TechBlit',
  description:
    'How to reach the TechBlit newsroom: editorial enquiries, story tips, corrections, partnerships, and our postal address.',
  openGraph: {
    title: 'Contact TechBlit',
    description: 'Reach the TechBlit newsroom — tips, corrections, partnerships, and postal address.',
    type: 'website',
    url: 'https://www.techblit.com/contact',
  },
  alternates: {
    canonical: 'https://www.techblit.com/contact',
  },
};

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * SCAFFOLD — Google News transparency requires a contact page with a name,
 * an email address, AND a physical/postal address.
 *
 * Replace [BRACKETED PLACEHOLDERS] with the real registered/mailing address
 * and confirm the mailbox routing below. Keep the address identical here, in
 * /about (orgSchema + "Ownership & funding"), and in the site footer.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const contactSchema = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact TechBlit',
  url: 'https://www.techblit.com/contact',
  mainEntity: {
    '@type': 'NewsMediaOrganization',
    name: 'TechBlit',
    url: 'https://www.techblit.com',
    logo: 'https://www.techblit.com/icon-512.png',
    email: 'editor@techblit.com',
    // TODO: real address — must match /about and the footer.
    address: {
      '@type': 'PostalAddress',
      streetAddress: '[STREET ADDRESS]',
      addressLocality: 'Port Harcourt',
      addressRegion: 'Rivers State',
      postalCode: '[POSTAL CODE]',
      addressCountry: 'NG',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'editorial',
        email: 'editor@techblit.com',
      },
      {
        '@type': 'ContactPoint',
        contactType: 'partnerships',
        email: 'partnership@techblit.com',
      },
    ],
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Contact us
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p>
            TechBlit is an independent African tech news publication. Here is how to reach the
            right person.
          </p>

          <h2>Newsroom &amp; story tips</h2>
          <p>
            News tips, press releases, and editorial enquiries:{' '}
            <a href="mailto:editor@techblit.com">editor@techblit.com</a>.
            {/* TODO: add a secure/anonymous tip route (e.g. Signal number or SecureDrop) if the
                newsroom offers one. */}
          </p>

          <h2>Corrections</h2>
          <p>
            To report an inaccuracy, email{' '}
            <a href="mailto:editor@techblit.com">editor@techblit.com</a> with the article URL and
            details. See our{' '}
            <Link href="/about#corrections">corrections policy</Link>.
          </p>

          <h2>Partnerships, advertising &amp; licensing</h2>
          <p>
            <a href="mailto:partnership@techblit.com">partnership@techblit.com</a>. For
            republishing or syndication, see{' '}
            <Link href="/license">content &amp; image licensing</Link>.
          </p>

          <h2>Write for TechBlit</h2>
          <p>
            Pitch a contribution via our{' '}
            <Link href="/writers">writers page</Link>.
          </p>

          <h2>Postal address</h2>
          <p>
            {/* TODO: replace with the real registered/mailing address. */}
            TechBlit
            <br />
            [STREET ADDRESS]
            <br />
            Port Harcourt, Rivers State
            <br />
            Nigeria
          </p>

          <h2>Follow TechBlit</h2>
          <ul>
            <li>
              <a href="https://twitter.com/techblit" target="_blank" rel="noopener noreferrer">
                X (Twitter)
              </a>
            </li>
            <li>
              <a
                href="https://www.linkedin.com/company/techblit"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            </li>
            <li>
              <a
                href="https://www.instagram.com/techblitblog/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href="https://www.facebook.com/techblitblog/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook
              </a>
            </li>
          </ul>
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
