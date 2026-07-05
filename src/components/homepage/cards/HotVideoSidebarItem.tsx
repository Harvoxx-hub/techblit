import Link from 'next/link'
import Image from 'next/image'
import { VideoItem } from '@/lib/homepageTypes'
import { formatDateShort } from '@/lib/dateUtils'

interface HotVideoSidebarItemProps {
  video: VideoItem
}

const HotVideoSidebarItem = ({ video }: HotVideoSidebarItemProps) => {
  const dateLabel = video.publishedAt ? formatDateShort(video.publishedAt) : null

  return (
    <li>
      <Link
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
        aria-label={`Watch: ${video.title}`}
      >
        <div className="relative aspect-video rounded overflow-hidden bg-brand-navy mb-3">
          {video.thumbnail ? (
            <Image
              src={video.thumbnail}
              alt=""
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="320px"
              unoptimized
            />
          ) : null}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-11 h-11 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4 text-brand-navy ml-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
        <h3 className="text-sm font-bold text-white leading-snug group-hover:text-brand-gold transition-colors line-clamp-2">
          {video.title}
        </h3>
        {dateLabel && (
          <time className="text-[11px] uppercase tracking-wide text-gray-400 mt-1.5 block">
            {dateLabel}
          </time>
        )}
      </Link>
    </li>
  )
}

export default HotVideoSidebarItem
