import Link from 'next/link'
import Navigation from '@/components/ui/Navigation'
import Footer from '@/components/ui/Footer'
import { searchPosts } from '@/lib/algoliaSearch'
import { formatDateShort } from '@/lib/dateUtils'
import type { Metadata } from 'next'

export const revalidate = 300

type SearchParams = Promise<{ q?: string | string[] }>

function readQuery(params: { q?: string | string[] }): string {
  const raw = Array.isArray(params.q) ? params.q[0] : params.q
  return (raw || '').slice(0, 120)
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams
}): Promise<Metadata> {
  const q = readQuery(await searchParams)
  const title = q ? `Search: ${q} - TechBlit` : 'Search - TechBlit'
  return {
    title,
    description: q
      ? `Articles on TechBlit matching “${q}”.`
      : 'Search TechBlit for African tech news, startups, funding, and analysis.',
    alternates: { canonical: 'https://www.techblit.com/search' },
    // Query result pages add little for search engines; keep them out of the index
    // but let crawlers follow through to the articles.
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const q = readQuery(await searchParams)
  const results = q ? await searchPosts(q) : []

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Search TechBlit
        </h1>

        <form method="get" action="/search" role="search" className="mb-8">
          <label htmlFor="q" className="sr-only">
            Search articles
          </label>
          <div className="flex gap-2">
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Search articles…"
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white outline-none focus:border-brand-gold"
            />
            <button
              type="submit"
              className="rounded-lg bg-brand-navy text-white px-5 py-2.5 font-semibold hover:bg-brand-navy/90 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {q && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {results.length > 0
              ? `${results.length} result${results.length === 1 ? '' : 's'} for “${q}”`
              : `No results for “${q}”.`}
          </p>
        )}

        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {results.map((hit) => (
            <li key={hit.objectID} className="py-4">
              <Link href={`/${hit.slug}`} className="group block">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-brand-gold transition-colors">
                  {hit.title}
                </h2>
                {hit.excerpt && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {hit.excerpt}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 text-xs text-gray-500 dark:text-gray-400">
                  {hit.category && <span>{hit.category}</span>}
                  {hit.author && <span>{hit.author}</span>}
                  {hit.publishedAt && <span>{formatDateShort(hit.publishedAt)}</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {!q && (
          <p className="text-gray-600 dark:text-gray-400">
            Enter a term above, or browse{' '}
            <Link href="/blog" className="text-brand-gold hover:underline">
              all articles
            </Link>
            .
          </p>
        )}
      </main>

      <Footer />
    </div>
  )
}
