import Link from 'next/link'
import Image from 'next/image'

const FoundersRepoCta = () => {
  return (
    <section
      className="relative overflow-hidden rounded-lg sm:rounded-xl mx-4 sm:mx-6 lg:mx-8 my-2"
      aria-labelledby="founders-cta-heading"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-blue-800 to-blue-600" />

      {/* Decorative blur — right side texture */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1/3 opacity-30 pointer-events-none hidden sm:block"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-40 h-64 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm rotate-6" />
        <div className="absolute right-20 top-1/2 -translate-y-1/2 w-36 h-56 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm -rotate-3" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-10 px-6 sm:px-8 lg:px-10 py-8 sm:py-10 lg:py-12">
        <div className="flex-1 max-w-xl">
          <div className="flex items-center gap-3 mb-3">
            <Image
              src="/favicon.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
            <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">
              Founder&apos;s Repository
            </span>
          </div>
          <h2
            id="founders-cta-heading"
            className="text-2xl sm:text-3xl font-bold text-white leading-tight"
          >
            Join the TechBlit Founders Repo
          </h2>
          <p className="mt-3 text-sm sm:text-base text-blue-100/90 leading-relaxed">
            Building in African tech? Get listed alongside Nigeria&apos;s most exciting founders —
            visible to investors, press, and the ecosystem.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
          <Link
            href="/founders/apply"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors font-semibold text-sm w-full sm:w-auto sm:min-w-[180px]"
            aria-label="Apply to join the founders repository"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Apply to Join
          </Link>
          <Link
            href="/founders"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors font-semibold text-sm w-full sm:w-auto sm:min-w-[180px]"
            aria-label="Browse the founders repository"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Browse Founders
          </Link>
        </div>
      </div>
    </section>
  )
}

export default FoundersRepoCta
