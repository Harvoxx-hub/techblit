import { HomepagePost } from '@/lib/homepageTypes'
import SectionHeader from '../layout/SectionHeader'
import CompactListItem from '../cards/CompactListItem'

interface SidebarRailProps {
  latest: HomepagePost[]
}

const SidebarRail = ({ latest }: SidebarRailProps) => {
  if (!latest.length) return null

  return (
    <div>
      <SectionHeader label="Latest Stories" href="/blog" />
      <ul>
        {latest.slice(0, 8).map((post, i) => (
          <CompactListItem key={post.id} post={post} index={i} />
        ))}
      </ul>
    </div>
  )
}

export default SidebarRail
