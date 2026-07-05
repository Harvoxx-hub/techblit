import { HomepagePost } from '@/lib/homepageTypes'
import SectionContainer from '../layout/SectionContainer'
import HeroLeadCard from '../cards/HeroLeadCard'
import HeroSecondaryCard from '../cards/HeroSecondaryCard'

interface HotNowSectionProps {
  hotNow: HomepagePost | null
  secondary: HomepagePost[]
}

const HotNowSection = ({ hotNow, secondary }: HotNowSectionProps) => {
  if (!hotNow) return null

  return (
    <SectionContainer className="pt-6 lg:pt-8 pb-0">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <HeroLeadCard post={hotNow} />
        </div>
        <div className="space-y-5">
          {secondary.map((post) => (
            <HeroSecondaryCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </SectionContainer>
  )
}

export default HotNowSection
