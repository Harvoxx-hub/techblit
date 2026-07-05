import { HomepagePost } from '@/lib/homepageTypes'
import SectionContainer from '../layout/SectionContainer'
import SectionHeader from '../layout/SectionHeader'
import GridCard from '../cards/GridCard'

interface EditorsChoiceSectionProps {
  posts: HomepagePost[]
}

const EditorsChoiceSection = ({ posts }: EditorsChoiceSectionProps) => {
  if (!posts.length) return null

  return (
    <SectionContainer>
      <SectionHeader label="Editor's Choice" href="/blog" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
        {posts.slice(0, 8).map((post) => (
          <GridCard key={post.id} post={post} />
        ))}
      </div>
    </SectionContainer>
  )
}

export default EditorsChoiceSection
