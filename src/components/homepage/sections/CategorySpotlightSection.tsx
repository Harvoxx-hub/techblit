import Link from 'next/link'
import Image from 'next/image'
import { CategoryColumn } from '@/lib/homepageTypes'
import { getImageUrlFromData } from '@/lib/imageHelpers'
import { getCategoryGradient } from '@/lib/colors'
import SectionContainer from '../layout/SectionContainer'
import SectionHeader from '../layout/SectionHeader'
import CategoryPill from '../atoms/CategoryPill'
import PostMeta from '../atoms/PostMeta'
import CompactListItem from '../cards/CompactListItem'

interface CategorySpotlightSectionProps {
  category: CategoryColumn
}

const CategorySpotlightSection = ({ category }: CategorySpotlightSectionProps) => {
  const { lead, more, label, slug } = category
  if (!lead) return null

  const imageUrl = getImageUrlFromData(lead.featuredImage, { preset: 'cover' })
  const gradient = getCategoryGradient(lead.category)

  return (
    <SectionContainer>
      <SectionHeader label={label} href={`/category/${slug}`} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="md:col-span-2">
          <Link href={`/${lead.slug}`} className="group block">
            <div className={`relative aspect-[16/9] sm:aspect-[16/9] rounded-lg sm:rounded-xl overflow-hidden bg-gradient-to-br ${gradient} mb-3 sm:mb-4`}>
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={lead.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              ) : null}
            </div>
            {lead.category && (
              <div className="mb-2">
                <CategoryPill category={lead.category} asSpan />
              </div>
            )}
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white group-hover:text-brand-gold transition-colors">
              {lead.title}
            </h3>
            {lead.excerpt && (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-4">
                {lead.excerpt}
              </p>
            )}
            <PostMeta post={lead} className="mt-3" />
          </Link>
        </div>

        <div className="pt-5 md:pt-0 border-t border-gray-100 dark:border-gray-800 md:border-t-0">
          <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">
            More from {label}
          </h4>
          <ul>
            {more.map((post) => (
              <CompactListItem key={post.id} post={post} showThumbnail />
            ))}
          </ul>
        </div>
      </div>
    </SectionContainer>
  )
}

export default CategorySpotlightSection
