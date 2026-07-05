import Link from 'next/link'
import Image from 'next/image'
import { VideoItem } from '@/lib/homepageTypes'
import { formatDateShort } from '@/lib/dateUtils'

interface PodcastCardProps {
  episode: VideoItem
}

const PodcastCard = ({ episode }: PodcastCardProps) => {
  return (
    <Link
      href={episode.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block shrink-0 w-64 sm:w-72"
      aria-label={`Listen: ${episode.title}`}
    >
      <article>
        <div className="relative aspect-video rounded-lg overflow-hidden bg-brand-navy mb-3">
          {episode.thumbnail ? (
            <Image
              src={episode.thumbnail}
              alt={episode.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="288px"
              unoptimized
            />
          ) : null}
          <div className="absolute top-2 left-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-navy text-brand-gold px-2 py-0.5 rounded">
              Weekly Review
            </span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-brand-navy/40">
            <div className="w-10 h-10 rounded-full bg-brand-gold flex items-center justify-center">
              <svg className="w-4 h-4 text-brand-navy ml-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-brand-gold transition-colors line-clamp-2">
          {episode.title}
        </h3>
        {episode.publishedAt && (
          <time className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
            {formatDateShort(episode.publishedAt)}
          </time>
        )}
      </article>
    </Link>
  )
}

export default PodcastCard
