import Link from 'next/link'
import { getCategoryByLabel } from '@/lib/categories'

interface CategoryPillProps {
  category?: string
  href?: string
  variant?: 'default' | 'breaking'
}

const CategoryPill = ({ category, href, variant = 'default' }: CategoryPillProps) => {
  if (!category) return null

  const cat = getCategoryByLabel(category)
  const slug = cat?.slug || category.toLowerCase().replace(/\s+/g, '-')
  const linkHref = href || `/category/${slug}`

  const baseClasses = 'inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded'
  const variantClasses =
    variant === 'breaking'
      ? 'bg-brand-gold text-brand-navy'
      : 'bg-brand-navy text-brand-gold dark:bg-brand-navy dark:text-brand-gold'

  return (
    <Link
      href={linkHref}
      className={`${baseClasses} ${variantClasses} hover:opacity-90 transition-opacity`}
    >
      {category}
    </Link>
  )
}

export default CategoryPill
