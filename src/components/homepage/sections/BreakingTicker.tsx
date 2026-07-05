'use client'

import Link from 'next/link'
import { HomepagePost } from '@/lib/homepageTypes'

interface BreakingTickerProps {
  posts: HomepagePost[]
}

const BreakingTicker = ({ posts }: BreakingTickerProps) => {
  if (!posts.length) return null

  const items = [...posts, ...posts]

  return (
    <div
      className="bg-brand-navy border-b border-brand-gold/20 overflow-hidden"
      aria-label="Latest headlines ticker"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center min-h-9 sm:h-9">
        <span className="shrink-0 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-gold mr-3 sm:mr-4">
          Latest
        </span>
        <div className="flex-1 overflow-hidden">
          <div className="ticker-animate flex whitespace-nowrap gap-8">
            {items.map((post, i) => (
              <Link
                key={`${post.id}-${i}`}
                href={`/${post.slug}`}
                className="text-xs text-gray-300 hover:text-brand-gold transition-colors shrink-0"
              >
                {post.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BreakingTicker
