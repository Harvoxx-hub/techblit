import Link from 'next/link'
import { HomepagePost } from '@/lib/homepageTypes'
import { VideoItem } from '@/lib/homepageTypes'
import SectionHeader from '@/components/homepage/layout/SectionHeader'
import CompactListItem from '@/components/homepage/cards/CompactListItem'
import ArticleAtnWidget from './ArticleAtnWidget'
import ArticleNewsletterWidget from './ArticleNewsletterWidget'

interface ArticleSidebarProps {
  latest: HomepagePost[]
  categoryPosts: HomepagePost[]
  categoryLabel: string | null
  categorySlug: string | null
  atnVideo: VideoItem | null
  showFoundersCta?: boolean
}

const ArticleSidebar = ({
  latest,
  categoryPosts,
  categoryLabel,
  categorySlug,
  atnVideo,
  showFoundersCta = false,
}: ArticleSidebarProps) => {
  return (
    <aside className="space-y-8" aria-label="Article sidebar">
      <ArticleNewsletterWidget />

      {latest.length > 0 && (
        <div>
          <SectionHeader label="Latest Stories" href="/blog" />
          <ul>
            {latest.map((post, i) => (
              <CompactListItem key={post.id} post={post} index={i} showThumbnail />
            ))}
          </ul>
        </div>
      )}

      {categoryPosts.length > 0 && categoryLabel && (
        <div>
          <SectionHeader
            label={`More from ${categoryLabel}`}
            href={categorySlug ? `/category/${categorySlug}` : undefined}
          />
          <ul>
            {categoryPosts.map((post) => (
              <CompactListItem key={post.id} post={post} showThumbnail />
            ))}
          </ul>
        </div>
      )}

      <ArticleAtnWidget video={atnVideo} />

      {showFoundersCta && (
        <div className="rounded-lg bg-gradient-to-br from-brand-navy to-blue-900 p-4 sm:p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-2">
            Founders Repo
          </h3>
          <p className="text-sm text-gray-200 mb-4 leading-relaxed">
            Building in African tech? Get listed alongside Nigeria&apos;s most exciting founders.
          </p>
          <Link
            href="/founders/apply"
            className="inline-block text-xs font-bold uppercase tracking-wider text-brand-gold hover:text-white transition-colors"
          >
            Apply to join →
          </Link>
        </div>
      )}
    </aside>
  )
}

export default ArticleSidebar
