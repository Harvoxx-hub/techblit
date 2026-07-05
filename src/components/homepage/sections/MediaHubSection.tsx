import { HomepageMedia } from '@/lib/homepageTypes'
import { ATN_LABEL, ATN_PLAYLIST_URL } from '@/lib/atn'
import SectionContainer from '../layout/SectionContainer'
import SectionHeader from '../layout/SectionHeader'
import VideoCard from '../cards/VideoCard'

interface MediaHubSectionProps {
  media: HomepageMedia
}

const MediaHubSection = ({ media }: MediaHubSectionProps) => {
  const { series101 } = media
  const has101 = series101.featured || series101.episodes.length > 0

  if (!has101) return null

  return (
    <SectionContainer className="bg-brand-navy/5 dark:bg-brand-navy/20">
      <SectionHeader label={ATN_LABEL} href={ATN_PLAYLIST_URL} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {series101.featured && (
          <div className="lg:col-span-2">
            <VideoCard
              video={series101.featured}
              size="large"
              badge="Featured"
            />
          </div>
        )}
        <div className="space-y-4">
          {series101.episodes.map((ep) => (
            <VideoCard key={ep.id} video={ep} badge={ATN_LABEL} />
          ))}
        </div>
      </div>
    </SectionContainer>
  )
}

export default MediaHubSection
