import { formatDateShort } from '@/lib/dateUtils'
import { formatAuthorName } from '../utils'
import { HomepagePost } from '@/lib/homepageTypes'

interface PostMetaProps {
  post: HomepagePost
  showAuthor?: boolean
  showReadTime?: boolean
  className?: string
}

const PostMeta = ({
  post,
  showAuthor = true,
  showReadTime = true,
  className = '',
}: PostMetaProps) => {
  const dateLabel = post.publishedAt ? formatDateShort(post.publishedAt) : null

  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400 ${className}`}>
      {dateLabel && (
        <time dateTime={dateLabel}>
          {dateLabel}
        </time>
      )}
      {showAuthor && post.author && (
        <>
          <span aria-hidden="true">·</span>
          <span>{formatAuthorName(post.author)}</span>
        </>
      )}
      {showReadTime && post.readTime && (
        <>
          <span aria-hidden="true">·</span>
          <span>{post.readTime} read</span>
        </>
      )}
    </div>
  )
}

export default PostMeta
