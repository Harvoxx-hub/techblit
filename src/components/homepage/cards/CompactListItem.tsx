import Link from 'next/link'
import Image from 'next/image'
import { HomepagePost } from '@/lib/homepageTypes'
import { formatDateShort } from '@/lib/dateUtils'
import { getImageUrlFromData } from '@/lib/imageHelpers'
import { getCategoryGradient } from '@/lib/colors'
import CategoryPill from '../atoms/CategoryPill'

interface CompactListItemProps {
  post: HomepagePost
  showCategory?: boolean
  showThumbnail?: boolean
  index?: number
}

const CompactListItem = ({
  post,
  showCategory = false,
  showThumbnail = false,
  index,
}: CompactListItemProps) => {
  const dateLabel = post.publishedAt ? formatDateShort(post.publishedAt) : null
  const imageUrl = showThumbnail
    ? getImageUrlFromData(post.featuredImage, { preset: 'thumbSquare' })
    : null
  const gradient = getCategoryGradient(post.category)

  return (
    <li>
      <Link
        href={`/${post.slug}`}
        className="group flex gap-3 py-3 sm:py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0"
      >
        {index !== undefined && (
          <span className="text-base sm:text-lg font-bold text-brand-gold/60 w-5 sm:w-6 shrink-0 tabular-nums">
            {index + 1}
          </span>
        )}
        {showThumbnail && (
          <div className={`relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded overflow-hidden bg-gradient-to-br ${gradient}`}>
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt=""
                width={64}
                height={64}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                unoptimized
              />
            ) : null}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug group-hover:text-brand-gold transition-colors line-clamp-2">
            {post.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {dateLabel && (
              <time className="text-xs text-gray-500 dark:text-gray-400">
                {dateLabel}
              </time>
            )}
            {showCategory && post.category && (
              <CategoryPill category={post.category} asSpan />
            )}
          </div>
        </div>
      </Link>
    </li>
  )
}

export default CompactListItem
