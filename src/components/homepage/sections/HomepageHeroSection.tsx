import Link from 'next/link'
import Image from 'next/image'
import { HomepagePost } from '@/lib/homepageTypes'
import { getImageUrlFromData } from '@/lib/imageHelpers'
import { getCategoryGradient } from '@/lib/colors'
import { formatDateShort } from '@/lib/dateUtils'

interface HomepageHeroSectionProps {
  hotNow: HomepagePost | null
  breaking: HomepagePost[]
  trending: HomepagePost[]
}

const TrendingHeroCard = ({ post }: { post: HomepagePost }) => {
  const imageUrl = getImageUrlFromData(post.featuredImage, { preset: 'thumbnail' })
  const gradient = getCategoryGradient(post.category)

  return (
    <Link href={`/${post.slug}`} className="group block min-w-0 shrink-0 snap-start w-[70%] min-[480px]:w-[48%] sm:w-auto sm:shrink">
      <div className={`relative aspect-[4/3] rounded overflow-hidden bg-gradient-to-br ${gradient} mb-2`}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="200px"
          />
        ) : null}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
      </div>
      <h4 className="text-xs sm:text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-brand-gold transition-colors">
        {post.title}
      </h4>
    </Link>
  )
}

const BreakingThumbItem = ({ post }: { post: HomepagePost }) => {
  const imageUrl = getImageUrlFromData(post.featuredImage, { preset: 'thumbSquare' })
  const gradient = getCategoryGradient(post.category)
  const dateLabel = post.publishedAt ? formatDateShort(post.publishedAt) : null

  return (
    <li>
      <Link
        href={`/${post.slug}`}
        className="group flex gap-3 py-3 border-b border-white/10 last:border-0"
      >
        <div className={`relative w-16 h-16 shrink-0 rounded overflow-hidden bg-gradient-to-br ${gradient}`}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              width={64}
              height={64}
              className="object-cover w-16 h-16 group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
          ) : null}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-brand-gold transition-colors line-clamp-2">
            {post.title}
          </h3>
          {dateLabel && (
            <time className="text-xs text-gray-400 mt-1 block">{dateLabel}</time>
          )}
        </div>
      </Link>
    </li>
  )
}

const HomepageHeroSection = ({ hotNow, breaking, trending }: HomepageHeroSectionProps) => {
  if (!hotNow) return null

  const imageUrl = getImageUrlFromData(hotNow.featuredImage, { preset: 'cover' })
  const gradient = getCategoryGradient(hotNow.category)

  return (
    <section className="w-full bg-white dark:bg-gray-950" aria-label="Featured stories">
      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden rounded-sm shadow-lg">
          {/* Left — Hot Now + Trending strip */}
          <div className="lg:col-span-8 relative flex flex-col min-h-[300px] sm:min-h-[400px] lg:min-h-[560px]">
            {/* Background image */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  priority
                />
              ) : null}
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />

            {/* Hot Now content — upper area */}
            <Link
              href={`/${hotNow.slug}`}
              className="group relative z-10 flex-1 flex flex-col justify-start p-4 sm:p-6 lg:p-10 pt-6 sm:pt-8 lg:pt-10"
            >
              <span className="inline-block self-start bg-red-600 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 sm:px-3 py-1 mb-3 sm:mb-4">
                Hot Now
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[2.5rem] font-bold text-white leading-tight max-w-2xl group-hover:underline decoration-brand-gold underline-offset-4">
                {hotNow.title}
              </h2>
              {hotNow.excerpt && (
                <p className="mt-4 text-sm sm:text-base text-gray-200 line-clamp-3 max-w-xl leading-relaxed">
                  {hotNow.excerpt}
                </p>
              )}
            </Link>

            {/* Trending Now — bottom horizontal strip */}
            {trending.length > 0 && (
              <div className="relative z-10 bg-brand-navy/95 backdrop-blur-sm border-t border-white/10 px-4 sm:px-6 lg:px-8 py-3 sm:py-5">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-brand-gold shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-gold">
                    Trending Now
                  </h3>
                </div>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 sm:snap-none">
                  {trending.slice(0, 3).map((post) => (
                    <TrendingHeroCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — Breaking News with thumbnails */}
          <div className="lg:col-span-4 bg-brand-navy p-4 sm:p-6 lg:p-7">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-gold">
                Breaking News
              </h3>
            </div>
            <ul>
              {breaking.slice(0, 5).map((post) => (
                <BreakingThumbItem key={post.id} post={post} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HomepageHeroSection
