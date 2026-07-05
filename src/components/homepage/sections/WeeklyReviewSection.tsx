import { VideoItem } from '@/lib/homepageTypes'
import SectionContainer from '../layout/SectionContainer'
import SectionHeader from '../layout/SectionHeader'
import PodcastCard from '../cards/PodcastCard'

interface WeeklyReviewSectionProps {
  episodes: VideoItem[]
}

const WeeklyReviewSection = ({ episodes }: WeeklyReviewSectionProps) => {
  if (!episodes.length) return null

  const channelUrl = process.env.NEXT_PUBLIC_YT_CHANNEL_URL || 'https://www.youtube.com/@techblitblog'

  return (
    <SectionContainer className="bg-gray-50 dark:bg-gray-900/30 rounded-none">
      <SectionHeader label="Weekly News Review" href={channelUrl} />
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 -mt-2">
        Our weekly breakdown of the biggest stories in African tech
      </p>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {episodes.slice(0, 4).map((episode) => (
          <PodcastCard key={episode.id} episode={episode} />
        ))}
      </div>
    </SectionContainer>
  )
}

export default WeeklyReviewSection
