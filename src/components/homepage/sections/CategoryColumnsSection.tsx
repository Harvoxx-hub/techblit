import { CategoryColumn as CategoryColumnType } from '@/lib/homepageTypes'
import SectionContainer from '../layout/SectionContainer'
import CategoryColumn from '../cards/CategoryColumn'

interface CategoryColumnsSectionProps {
  columns: CategoryColumnType[]
}

const CategoryColumnsSection = ({ columns }: CategoryColumnsSectionProps) => {
  const activeColumns = columns.filter((col) => col.lead)
  if (!activeColumns.length) return null

  return (
    <SectionContainer>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
        {activeColumns.map((column) => (
          <CategoryColumn
            key={column.key}
            label={column.label}
            slug={column.slug}
            lead={column.lead}
            more={column.more}
          />
        ))}
      </div>
    </SectionContainer>
  )
}

export default CategoryColumnsSection
