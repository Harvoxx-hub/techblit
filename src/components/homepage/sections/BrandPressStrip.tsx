import Link from 'next/link'
import Image from 'next/image'
import { HomepagePost } from '@/lib/homepageTypes'
import { getImageUrlFromData } from '@/lib/imageHelpers'
import { getCategoryGradient } from '@/lib/colors'
import SectionContainer from '../layout/SectionContainer'
import SectionHeader from '../layout/SectionHeader'

interface BrandPressStripProps {
  posts: HomepagePost[]
}

const BrandPressStrip = ({ posts }: BrandPressStripProps) => {
  if (!posts.length) return null

  return (
    <SectionContainer className="pb-12">
      <SectionHeader label="Brand Press" href="/category/brand-press" />
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {posts.map((post) => {
          const imageUrl = getImageUrlFromData(post.featuredImage, { preset: 'cover' })
          const gradient = getCategoryGradient('brand-press')

          return (
            <Link
              key={post.id}
              href={`/${post.slug}`}
              className="group shrink-0 w-64 sm:w-72"
            >
              <article>
                <div className={`relative aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br ${gradient} mb-2`}>
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="288px"
                    />
                  ) : null}
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-brand-gold transition-colors line-clamp-2">
                  {post.title}
                </h3>
              </article>
            </Link>
          )
        })}
      </div>
    </SectionContainer>
  )
}

export default BrandPressStrip
