import { HomepagePost } from '@/lib/homepageTypes'
import SectionHeader from '../layout/SectionHeader'
import CompactListItem from '../cards/CompactListItem'

interface SidebarRailProps {
  trending: HomepagePost[]
  breaking: HomepagePost[]
  latest: HomepagePost[]
}

const SidebarRail = ({ trending, breaking, latest }: SidebarRailProps) => {
  return (
    <>
      {trending.length > 0 && (
        <div>
          <SectionHeader label="Trending Now" href="/blog" />
          <ul>
            {trending.slice(0, 5).map((post, i) => (
              <CompactListItem key={post.id} post={post} index={i} />
            ))}
          </ul>
        </div>
      )}

      {breaking.length > 0 && (
        <div>
          <SectionHeader label="Breaking News" />
          <ul>
            {breaking.slice(0, 5).map((post) => (
              <CompactListItem key={post.id} post={post} />
            ))}
          </ul>
        </div>
      )}

      {latest.length > 0 && (
        <div>
          <SectionHeader label="Latest" href="/blog" />
          <ul>
            {latest.slice(0, 5).map((post) => (
              <CompactListItem key={post.id} post={post} />
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

export default SidebarRail
