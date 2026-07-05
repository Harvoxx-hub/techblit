import { HomepagePost } from '@/lib/homepageTypes'
import HorizontalScrollRail from '../rails/HorizontalScrollRail'
import CompactListItem from '../cards/CompactListItem'

interface MobileSidebarRailsProps {
  trending: HomepagePost[]
  breaking: HomepagePost[]
}

const MobileSidebarRails = ({ trending, breaking }: MobileSidebarRailsProps) => {
  return (
    <>
      {trending.length > 0 && (
        <HorizontalScrollRail label="Trending Now">
          {trending.slice(0, 5).map((post) => (
            <div key={post.id} className="shrink-0 w-56">
              <CompactListItem post={post} />
            </div>
          ))}
        </HorizontalScrollRail>
      )}
      {breaking.length > 0 && (
        <HorizontalScrollRail label="Breaking News">
          {breaking.slice(0, 5).map((post) => (
            <div key={post.id} className="shrink-0 w-56">
              <CompactListItem post={post} />
            </div>
          ))}
        </HorizontalScrollRail>
      )}
    </>
  )
}

export default MobileSidebarRails
