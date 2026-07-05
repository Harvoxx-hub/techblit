import Link from 'next/link'
import Image from 'next/image'
import { HomepagePost } from '@/lib/homepageTypes'
import { getImageUrlFromData } from '@/lib/imageHelpers'
import { getCategoryGradient } from '@/lib/colors'
import { formatDateShort } from '@/lib/dateUtils'

interface ArticleRelatedPostsProps {
  posts: HomepagePost[]
}

const ArticleRelatedPosts = ({ posts }: ArticleRelatedPostsProps) => {
  if (!posts.length) return null

  return (
    <section className="py-10 sm:py-12 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-6">
          Related Posts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.slice(0, 3).map((post) => {
            const imageUrl = getImageUrlFromData(post.featuredImage, { preset: 'cover' })
            const gradient = getCategoryGradient(post.category)
            const dateLabel = post.publishedAt ? formatDateShort(post.publishedAt) : null

            return (
              <Link key={post.id} href={`/${post.slug}`} className="group block">
                <article>
                  <div className={`relative aspect-[16/10] rounded-lg overflow-hidden bg-gradient-to-br ${gradient} mb-3`}>
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    ) : null}
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-brand-gold transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h3>
                  {dateLabel && (
                    <time className="text-xs text-gray-500 dark:text-gray-400 mt-2 block">
                      {dateLabel}
                    </time>
                  )}
                </article>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default ArticleRelatedPosts
