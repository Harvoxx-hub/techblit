import Link from 'next/link'
import { HomepagePost } from '@/lib/homepageTypes'
import { formatDateShort } from '@/lib/dateUtils'
import CategoryPill from '../atoms/CategoryPill'

interface CompactListItemProps {
  post: HomepagePost
  showCategory?: boolean
  index?: number
}

const CompactListItem = ({ post, showCategory = false, index }: CompactListItemProps) => {
  const dateLabel = post.publishedAt ? formatDateShort(post.publishedAt) : null

  return (
    <li>
      <Link
        href={`/${post.slug}`}
        className="group flex gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0"
      >
        {index !== undefined && (
          <span className="text-lg font-bold text-brand-gold/60 w-6 shrink-0 tabular-nums">
            {index + 1}
          </span>
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
              <CategoryPill category={post.category} />
            )}
          </div>
        </div>
      </Link>
    </li>
  )
}

export default CompactListItem
