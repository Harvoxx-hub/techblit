import Link from 'next/link'
import Image from 'next/image'
import { HomepagePost } from '@/lib/homepageTypes'
import { getImageUrlFromData } from '@/lib/imageHelpers'
import { getCategoryGradient } from '@/lib/colors'
import CategoryPill from '../atoms/CategoryPill'
import PostMeta from '../atoms/PostMeta'

interface HeroLeadCardProps {
  post: HomepagePost
  label?: string
}

const HeroLeadCard = ({ post, label = 'Hot Now' }: HeroLeadCardProps) => {
  const imageUrl = getImageUrlFromData(post.featuredImage, { preset: 'cover' })
  const gradient = getCategoryGradient(post.category)

  return (
    <article>
      <p className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-3">
        {label}
      </p>
      <Link href={`/${post.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-xl">
          <div className={`aspect-[16/9] bg-gradient-to-br ${gradient} relative`}>
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-7">
              {post.category && (
                <div className="mb-3">
                  <CategoryPill category={post.category} asSpan />
                </div>
              )}
              <h2 className="text-2xl lg:text-4xl font-bold text-white leading-tight group-hover:underline decoration-brand-gold underline-offset-4">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="mt-3 text-sm lg:text-base text-gray-200 line-clamp-2 hidden sm:block">
                  {post.excerpt}
                </p>
              )}
              <div className="mt-3">
                <PostMeta post={post} className="text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}

export default HeroLeadCard
