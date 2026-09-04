import Link from 'next/link'
import Navigation from '@/components/ui/Navigation'
import Footer from '@/components/ui/Footer'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Content & Image Licensing - TechBlit',
  description:
    'How TechBlit articles, photography, and graphics may be used, quoted, and syndicated, and how to request a licence.',
  alternates: { canonical: 'https://www.techblit.com/license' },
}

export default function LicensePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
          Content &amp; Image Licensing
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p>
            All articles, photography, illustrations, charts, and other material published on
            TechBlit are &copy; TechBlit and its contributors unless otherwise credited. They are
            protected by copyright and may not be reproduced, republished, or redistributed in
            full without a written licence.
          </p>

          <h2>Quoting and linking</h2>
          <p>
            You are welcome to quote a short extract (up to roughly 90 words) from any TechBlit
            article for the purposes of reporting, commentary, or criticism, provided you clearly
            attribute TechBlit and link to the original article.
          </p>

          <h2>Republishing full articles</h2>
          <p>
            Full-text republication, translation, or inclusion in a newsletter, aggregator, or
            print publication requires a written licence. TechBlit content is not published
            under a Creative Commons licence, and no third party has standing permission to
            republish it in full.
          </p>

          <h2>Images</h2>
          <p>
            Photographs and graphics credited to a wire service, contributor, or third party are
            licensed to TechBlit only and are not available for onward licensing. Images produced
            by TechBlit may be licensed on request.
          </p>

          <h2>Request a licence</h2>
          <p>
            To license an article or image, or to discuss a syndication arrangement, email{' '}
            <a href="mailto:partnership@techblit.com">partnership@techblit.com</a> with the URL of
            the material and details of the intended use. See our{' '}
            <Link href="/contact">contact page</Link> for postal details.
          </p>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated 4 September 2026. This page is provided for general guidance and does
            not itself constitute a licence or legal advice.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
