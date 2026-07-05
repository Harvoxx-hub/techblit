import { HomepageMedia } from '@/lib/homepageTypes'
import SectionContainer from '../layout/SectionContainer'
import SectionHeader from '../layout/SectionHeader'
import VideoCard from '../cards/VideoCard'

interface MediaHubSectionProps {
  media: HomepageMedia
}

const MediaHubSection = ({ media }: MediaHubSectionProps) => {
  const { series101, hotVideos } = media
  const has101 = series101.featured || series101.episodes.length > 0
  const hasHot = hotVideos.length > 0

  if (!has101 && !hasHot) return null

  return (
    <SectionContainer className="bg-brand-navy/5 dark:bg-brand-navy/20">
      {has101 && (
        <div className="mb-10">
          <SectionHeader label="TechBlit 101" href="/series/101" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {series101.featured && (
              <div className="lg:col-span-2">
                <VideoCard
                  video={series101.featured}
                  size="large"
                  badge="Dignities Week"
                />
              </div>
            )}
            <div className="space-y-4">
              {series101.episodes.map((ep) => (
                <VideoCard key={ep.id} video={ep} badge="101" />
              ))}
            </div>
          </div>
        </div>
      )}

      {hasHot && (
        <div>
          <SectionHeader label="Hot Videos" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
            {hotVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>
      )}
    </SectionContainer>
  )
}

export default MediaHubSection
