import Link from 'next/link'
import Image from 'next/image'
import { VideoItem } from '@/lib/homepageTypes'

import { ATN_FULL_NAME, ATN_PLAYLIST_URL } from '@/lib/atn'

interface ArticleAtnWidgetProps {
  video: VideoItem | null
}

const ArticleAtnWidget = ({ video }: ArticleAtnWidgetProps) => {
  return (
    <div className="rounded-lg overflow-hidden bg-brand-navy border border-white/10">
      <div className="px-4 py-3 border-b border-white/10">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">
          {ATN_FULL_NAME}
        </h3>
      </div>
      {video ? (
        <Link
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block p-4"
          aria-label={`Watch ATN: ${video.title}`}
        >
          <div className="relative aspect-video rounded overflow-hidden mb-3 bg-black/40">
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
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-10 h-10 rounded-full bg-brand-gold flex items-center justify-center">
                <svg className="w-4 h-4 text-brand-navy ml-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
          <p className="text-sm font-semibold text-white leading-snug group-hover:text-brand-gold transition-colors line-clamp-2">
            {video.title}
          </p>
        </Link>
      ) : (
        <div className="p-4">
          <p className="text-sm text-gray-300 mb-3 leading-relaxed">
            Weekly African tech news breakdown on YouTube.
          </p>
          <Link
            href={ATN_PLAYLIST_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold uppercase tracking-wider text-brand-gold hover:text-white transition-colors"
          >
            Watch ATN →
          </Link>
        </div>
      )}
    </div>
  )
}

export default ArticleAtnWidget
