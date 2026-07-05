import { HomepagePost } from '@/lib/homepageTypes'
import SectionContainer from '../layout/SectionContainer'
import SectionHeader from '../layout/SectionHeader'
import CompactListItem from '../cards/CompactListItem'

interface WorthReadingSectionProps {
  posts: HomepagePost[]
}

const WorthReadingSection = ({ posts }: WorthReadingSectionProps) => {
  if (!posts.length) return null

  return (
    <SectionContainer className="bg-gray-50 dark:bg-gray-900/30">
      <SectionHeader label="Worth Reading" href="/blog" />
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        {posts.map((post) => (
          <CompactListItem key={post.id} post={post} showCategory />
        ))}
      </ul>
    </SectionContainer>
  )
}

export default WorthReadingSection
