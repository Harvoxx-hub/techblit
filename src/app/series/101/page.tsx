import Navigation from '@/components/ui/Navigation'
import Footer from '@/components/ui/Footer'
import VideoCard from '@/components/homepage/cards/VideoCard'
import SectionContainer from '@/components/homepage/layout/SectionContainer'
import { getHomepageData } from '@/lib/homepageData'
import { ATN_FULL_NAME, ATN_LABEL, ATN_PLAYLIST_URL } from '@/lib/atn'
import { Metadata } from 'next'

export const revalidate = 3600

export const metadata: Metadata = {
  title: `${ATN_FULL_NAME} — Video Series`,
  description: `${ATN_FULL_NAME} breaks down African tech news, founders, and stories. Watch weekly reviews and deep dives on YouTube.`,
  openGraph: {
    title: `${ATN_FULL_NAME} — Video Series`,
    description: `${ATN_FULL_NAME} breaks down African tech news, founders, and stories.`,
    type: 'website',
    url: 'https://www.techblit.com/series/101',
  },
}

export default async function Series101Page() {
  const data = await getHomepageData()
  const { series101 } = data.media
  const allEpisodes = [
    ...(series101.featured ? [series101.featured] : []),
    ...series101.episodes,
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navigation />

      <SectionContainer className="pt-8">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-2">
          Video Series
        </p>
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          {ATN_FULL_NAME}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mb-8">
          Weekly African tech news breakdowns, founder stories, and the context behind the headlines — on YouTube.
        </p>

        {series101.featured && (
          <div className="mb-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-4">
              Latest Episode
            </h2>
            <div className="max-w-3xl">
              <VideoCard
                video={series101.featured}
                size="large"
                badge="Featured"
              />
            </div>
          </div>
        )}

        {allEpisodes.length > 0 ? (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-4">
              All Episodes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allEpisodes.map((ep) => (
                <VideoCard key={ep.id} video={ep} badge={ATN_LABEL} />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Episodes will appear here once the YouTube playlist is configured.
            </p>
            <a
              href={ATN_PLAYLIST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex px-6 py-3 font-bold rounded-lg bg-brand-gold text-brand-navy hover:bg-brand-gold/90 transition-colors"
            >
              Watch on YouTube
            </a>
          </div>
        )}
      </SectionContainer>

      <Footer />
    </div>
  )
}
