import { CategoryColumn as CategoryColumnType } from '@/lib/homepageTypes'
import CategorySpotlightSection from './CategorySpotlightSection'

interface CategoryColumnsSectionProps {
  columns: CategoryColumnType[]
}

const CategoryColumnsSection = ({ columns }: CategoryColumnsSectionProps) => {
  const activeColumns = columns.filter((col) => col.lead)
  if (!activeColumns.length) return null

  return (
    <>
      {activeColumns.map((column) => (
        <CategorySpotlightSection key={column.key} category={column} />
      ))}
    </>
  )
}

export default CategoryColumnsSection
