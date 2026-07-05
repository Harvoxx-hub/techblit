import Link from 'next/link'
import Image from 'next/image'
import { HomepagePost } from '@/lib/homepageTypes'
import { getImageUrlFromData } from '@/lib/imageHelpers'
import { getCategoryGradient } from '@/lib/colors'
import CategoryPill from '../atoms/CategoryPill'
import PostMeta from '../atoms/PostMeta'

interface HeroSecondaryCardProps {
  post: HomepagePost
}

const HeroSecondaryCard = ({ post }: HeroSecondaryCardProps) => {
  const imageUrl = getImageUrlFromData(post.featuredImage, { preset: 'cover' })
  const gradient = getCategoryGradient(post.category)

  return (
    <Link href={`/${post.slug}`} className="group block">
      <article className="flex gap-4">
        <div className={`relative w-28 h-20 sm:w-36 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-gradient-to-br ${gradient}`}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="144px"
            />
          ) : null}
        </div>
        <div className="flex-1 min-w-0">
          {post.category && (
            <div className="mb-1.5">
              <CategoryPill category={post.category} />
            </div>
          )}
          <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug group-hover:text-brand-gold transition-colors line-clamp-3">
            {post.title}
          </h3>
          <PostMeta post={post} showAuthor={false} showReadTime={false} className="mt-1.5" />
        </div>
      </article>
    </Link>
  )
}

export default HeroSecondaryCard
