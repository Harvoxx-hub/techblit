import Link from 'next/link'

const HomepageEmptyState = () => {
  return (
    <section
      className="mx-4 sm:mx-6 lg:mx-8 my-6 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-6 sm:p-8 text-center"
      role="status"
      aria-live="polite"
    >
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        Stories aren&apos;t loading right now
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-lg mx-auto mb-4 leading-relaxed">
        The homepage couldn&apos;t reach the posts API. If you&apos;re developing locally, make sure
        the cloud function is running or remove a bad{' '}
        <code className="text-xs bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded">
          NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL
        </code>{' '}
        override pointing at the Next.js dev server.
      </p>
      <Link
        href="/blog"
        className="inline-flex px-5 py-2.5 text-sm font-bold rounded-lg bg-brand-navy text-white hover:bg-brand-navy/90 transition-colors"
      >
        Browse all stories →
      </Link>
    </section>
  )
}

export default HomepageEmptyState
