import Link from 'next/link'
import Image from 'next/image'
import { HomepagePost } from '@/lib/homepageTypes'
import { getImageUrlFromData } from '@/lib/imageHelpers'
import { getCategoryGradient } from '@/lib/colors'
import CategoryPill from '../atoms/CategoryPill'
import PostMeta from '../atoms/PostMeta'

interface GridCardProps {
  post: HomepagePost
}

const GridCard = ({ post }: GridCardProps) => {
  const imageUrl = getImageUrlFromData(post.featuredImage, { preset: 'cover' })
  const gradient = getCategoryGradient(post.category)

  return (
    <Link href={`/${post.slug}`} className="group block h-full">
      <article className="h-full flex flex-col">
        <div className={`relative aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br ${gradient} mb-3`}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, 25vw"
            />
          ) : null}
        </div>
        {post.category && (
          <div className="mb-2">
            <CategoryPill category={post.category} />
          </div>
        )}
        <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug group-hover:underline line-clamp-2 flex-1">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {post.excerpt}
          </p>
        )}
        <PostMeta post={post} showAuthor={false} className="mt-2" />
      </article>
    </Link>
  )
}

export default GridCard
