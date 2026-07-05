import Link from 'next/link'
import Image from 'next/image'
import { VideoItem } from '@/lib/homepageTypes'
import { formatDateShort } from '@/lib/dateUtils'
import { ATN_PLAYLIST_URL } from '@/lib/atn'
import SectionContainer from '../layout/SectionContainer'
import HotVideoSidebarItem from '../cards/HotVideoSidebarItem'

interface VideoSessionSectionProps {
  newsReview: VideoItem[]
  hotVideos: VideoItem[]
}

const ClockIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const FlameIcon = () => (
  <svg className="w-4 h-4 text-brand-gold" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 23c-3.9 0-7-2.4-7-6.5 0-2.2 1.2-4.1 2.5-5.7.5-.6 1.1-1.2 1.6-1.7.3-.3.6-.6.8-.9.2.3.5.6.8.9.5.5 1.1 1.1 1.6 1.7 1.3 1.6 2.5 3.5 2.5 5.7C19 20.6 15.9 23 12 23zm0-2c2.8 0 5-1.6 5-4.5 0-1.4-.8-2.8-1.8-4.1-.4-.5-.8-.9-1.2-1.3-.4.4-.8.8-1.2 1.3-1 1.3-1.8 2.7-1.8 4.1 0 2.9 2.2 4.5 5 4.5z" />
  </svg>
)

const WeeklyReviewMoreItem = ({ episode, withTopBorder = false }: { episode: VideoItem; withTopBorder?: boolean }) => {
  const dateLabel = episode.publishedAt ? formatDateShort(episode.publishedAt) : null

  return (
    <Link
      href={episode.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block py-4 ${withTopBorder ? 'border-t border-white/10' : ''}`}
      aria-label={`Watch: ${episode.title}`}
    >
      <h4 className="text-sm font-bold text-white leading-snug group-hover:text-brand-gold transition-colors line-clamp-2">
        {episode.title}
      </h4>
      {dateLabel && (
        <time className="text-[11px] uppercase tracking-wide text-gray-400 mt-1.5 block">
          {dateLabel}
        </time>
      )}
    </Link>
  )
}

const VideoSessionSection = ({ newsReview, hotVideos }: VideoSessionSectionProps) => {
  const featured = newsReview[0] ?? null
  const moreEpisodes = newsReview.slice(1, 7)
  const hasHot = hotVideos.length > 0
  const hasReview = Boolean(featured)

  const channelUrl = ATN_PLAYLIST_URL
  const featuredDate = featured?.publishedAt ? formatDateShort(featured.publishedAt) : null

  return (
    <SectionContainer className="py-4 sm:py-6 lg:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden rounded-sm shadow-lg min-h-0 lg:min-h-[500px]">
        {/* Left — featured weekly review or placeholder */}
        <div
          className="relative flex flex-col lg:col-span-8 min-h-[280px] sm:min-h-[360px] lg:min-h-[500px]"
        >
          <div className="absolute inset-0 bg-brand-navy">
            {hasReview && featured?.thumbnail ? (
              <Image
                src={featured.thumbnail}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-blue-900 to-brand-navy" />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/85" />

          <div className="relative z-10 flex flex-col flex-1 p-4 sm:p-6 lg:p-10">
            {hasReview ? (
              <Link
                href={featured!.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex-1"
                aria-label={`Watch: ${featured!.title}`}
              >
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="inline-block bg-brand-gold text-brand-navy text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
                    Weekly Review
                  </span>
                  {featuredDate && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-gray-300">
                      <ClockIcon />
                      <time>{featuredDate}</time>
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight max-w-3xl group-hover:underline decoration-brand-gold underline-offset-4">
                  {featured!.title}
                </h2>
                <p className="mt-4 text-sm sm:text-base text-gray-300 leading-relaxed max-w-2xl line-clamp-3">
                  Our weekly breakdown of the biggest stories in African tech — watch the latest episode on YouTube.
                </p>
              </Link>
            ) : (
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="inline-block bg-brand-gold text-brand-navy text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
                    Weekly Review
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight max-w-3xl">
                  TechBlit Weekly News Review
                </h2>
                <p className="mt-4 text-sm sm:text-base text-gray-300 leading-relaxed max-w-2xl">
                  Our weekly breakdown of the biggest stories in African tech. New episodes drop on YouTube — subscribe so you never miss one.
                </p>
                <Link
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center justify-center gap-2 self-start px-6 py-3 bg-brand-gold text-brand-navy rounded-lg font-bold text-sm hover:bg-yellow-400 transition-colors"
                  aria-label="Subscribe to TechBlit on YouTube"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M23.5 6.2A3 3 0 0021.4 4.4C19.6 4 12 4 12 4s-7.6 0-9.4.4A3 3 0 00.5 6.2C0 8 0 12 0 12s0 4 .5 5.8A3 3 0 002.6 19.6C4.4 20 12 20 12 20s7.6 0 9.4-.4a3 3 0 002.1-2.2C24 16 24 12 24 12s0-4-.5-5.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
                  </svg>
                  Watch on YouTube
                </Link>
              </div>
            )}

            {moreEpisodes.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/15">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-white mb-2">
                  More from Weekly Review
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  {moreEpisodes.map((episode, index) => (
                    <WeeklyReviewMoreItem
                      key={episode.id}
                      episode={episode}
                      withTopBorder={index >= 2}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — hot videos sidebar or placeholder */}
        <aside
          className="bg-brand-navy lg:border-l border-white/10 p-4 sm:p-6 lg:p-8 flex flex-col lg:col-span-4"
          aria-label="Hot videos"
        >
          <div className="flex items-center gap-2 mb-6">
            <FlameIcon />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">
              Hot Videos
            </h2>
          </div>

          {hasHot ? (
            <>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6 flex-1">
                {hotVideos.slice(0, 4).map((video) => (
                  <HotVideoSidebarItem key={video.id} video={video} />
                ))}
              </ul>
              <Link
                href={channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 text-xs font-semibold uppercase tracking-wider text-brand-gold hover:text-white transition-colors"
              >
                View all on YouTube →
              </Link>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-brand-gold" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-6">
                Fresh video picks from the TechBlit channel — episodes, explainers, and event highlights.
              </p>
              <Link
                href={channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-brand-gold text-brand-gold rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-brand-gold hover:text-brand-navy transition-colors"
                aria-label="Browse TechBlit videos on YouTube"
              >
                Browse Videos →
              </Link>
            </div>
          )}
        </aside>
      </div>
    </SectionContainer>
  )
}

export default VideoSessionSection
