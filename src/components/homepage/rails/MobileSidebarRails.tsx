import { HomepagePost } from '@/lib/homepageTypes'
import HorizontalScrollRail from './HorizontalScrollRail'
import CompactListItem from '../cards/CompactListItem'

interface MobileSidebarRailsProps {
  latest: HomepagePost[]
}

const MobileSidebarRails = ({ latest }: MobileSidebarRailsProps) => {
  if (!latest.length) return null

  return (
    <HorizontalScrollRail label="Latest Stories">
      {latest.slice(0, 5).map((post) => (
        <div key={post.id} className="shrink-0 w-[85vw] max-w-[280px] sm:w-72">
          <CompactListItem post={post} showThumbnail />
        </div>
      ))}
    </HorizontalScrollRail>
  )
}

export default MobileSidebarRails
