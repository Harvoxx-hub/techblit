import Link from 'next/link'
import Image from 'next/image'
import { VideoItem } from '@/lib/homepageTypes'

interface VideoCardProps {
  video: VideoItem
  size?: 'default' | 'large'
  badge?: string
}

const VideoCard = ({ video, size = 'default', badge }: VideoCardProps) => {
  const isLarge = size === 'large'

  return (
    <Link
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block h-full"
      aria-label={`Watch: ${video.title}`}
    >
      <article className="h-full flex flex-col">
        <div className={`relative rounded-lg overflow-hidden bg-brand-navy mb-3 ${isLarge ? 'aspect-video' : 'aspect-[4/3]'}`}>
          {video.thumbnail ? (
            <Image
              src={video.thumbnail}
              alt={video.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes={isLarge ? '(max-width: 1024px) 100vw, 66vw' : '(max-width: 640px) 50vw, 25vw'}
              unoptimized
            />
          ) : null}
          <div className="absolute inset-0 bg-brand-navy/30 group-hover:bg-brand-navy/10 transition-colors" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-brand-gold/90 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-brand-navy ml-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          {badge && (
            <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-brand-gold text-brand-navy px-2 py-0.5 rounded">
              {badge}
            </span>
          )}
        </div>
        <h3 className={`font-bold text-gray-900 dark:text-white group-hover:text-brand-gold transition-colors line-clamp-2 ${isLarge ? 'text-base lg:text-lg' : 'text-sm'}`}>
          {video.title}
        </h3>
      </article>
    </Link>
  )
}

export default VideoCard
