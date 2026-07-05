import { HomepagePost } from '@/lib/homepageTypes'
import SectionContainer from '../layout/SectionContainer'
import SectionHeader from '../layout/SectionHeader'
import GridCard from '../cards/GridCard'

interface PopularNowSectionProps {
  posts: HomepagePost[]
}

const PopularNowSection = ({ posts }: PopularNowSectionProps) => {
  if (!posts.length) return null

  return (
    <SectionContainer>
      <SectionHeader label="Popular Now" href="/blog" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {posts.slice(0, 4).map((post) => (
          <GridCard key={post.id} post={post} />
        ))}
      </div>
    </SectionContainer>
  )
}

export default PopularNowSection
