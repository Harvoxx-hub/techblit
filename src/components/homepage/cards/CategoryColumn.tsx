import Link from 'next/link'
import Image from 'next/image'
import { HomepagePost } from '@/lib/homepageTypes'
import { getImageUrlFromData } from '@/lib/imageHelpers'
import { getCategoryGradient } from '@/lib/colors'
import CategoryPill from '../atoms/CategoryPill'
import CompactListItem from './CompactListItem'
import ViewAllLink from '../atoms/ViewAllLink'

interface CategoryColumnProps {
  label: string
  slug: string
  lead: HomepagePost | null
  more: HomepagePost[]
}

const CategoryColumn = ({ label, slug, lead, more }: CategoryColumnProps) => {
  if (!lead) return null

  const imageUrl = getImageUrlFromData(lead.featuredImage, { preset: 'cover' })
  const gradient = getCategoryGradient(lead.category)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-brand-gold">
          {label}
        </h3>
        <ViewAllLink href={`/category/${slug}`} />
      </div>

      <Link href={`/${lead.slug}`} className="group block mb-4">
        <div className={`relative aspect-[16/10] rounded-lg overflow-hidden bg-gradient-to-br ${gradient} mb-3`}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={lead.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 1024px) 100vw, 33vw"
            />
          ) : null}
        </div>
        {lead.category && (
          <div className="mb-2">
            <CategoryPill category={lead.category} asSpan />
          </div>
        )}
        <h4 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-brand-gold transition-colors line-clamp-2">
          {lead.title}
        </h4>
        {lead.excerpt && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {lead.excerpt}
          </p>
        )}
      </Link>

      <ul className="flex-1">
        {more.map((post) => (
          <CompactListItem key={post.id} post={post} />
        ))}
      </ul>
    </div>
  )
}

export default CategoryColumn
