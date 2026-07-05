import Navigation from '@/components/ui/Navigation'
import Footer from '@/components/ui/Footer'
import HomepageShell from '@/components/homepage/layout/HomepageShell'
import MagazineGrid from '@/components/homepage/layout/MagazineGrid'
import SidebarRail from '@/components/homepage/rails/SidebarRail'
import MobileSidebarRails from '@/components/homepage/rails/MobileSidebarRails'
import BreakingTicker from '@/components/homepage/sections/BreakingTicker'
import HomepageHeroSection from '@/components/homepage/sections/HomepageHeroSection'
import PopularNowSection from '@/components/homepage/sections/PopularNowSection'
import EditorsChoiceSection from '@/components/homepage/sections/EditorsChoiceSection'
import WorthReadingSection from '@/components/homepage/sections/WorthReadingSection'
import CategoryColumnsSection from '@/components/homepage/sections/CategoryColumnsSection'
import VideoSessionSection from '@/components/homepage/sections/VideoSessionSection'
import BrandPressStrip from '@/components/homepage/sections/BrandPressStrip'
import MediaHubSection from '@/components/homepage/sections/MediaHubSection'
import FoundersRepoCta from '@/components/homepage/sections/FoundersRepoCta'
import FooterNewsletter from '@/components/homepage/sections/FooterNewsletter'
import HomepageEmptyState from '@/components/homepage/sections/HomepageEmptyState'
import { getHomepageData } from '@/lib/homepageData'
import { generateHomepageSEO } from '@/lib/seo'
import { Metadata } from 'next'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  return generateHomepageSEO()
}

export default async function Home() {
  const data = await getHomepageData()
  const hasStories = Boolean(data.hotNow)

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TechBlit',
    description: "Igniting Africa's Tech Conversation",
    url: 'https://www.techblit.com',
    publisher: {
      '@type': 'Organization',
      name: 'TechBlit',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.techblit.com/favicon.png',
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.techblit.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <HomepageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navigation />
      <BreakingTicker posts={data.breaking} />

      {!hasStories && <HomepageEmptyState />}

      <HomepageHeroSection
        hotNow={data.hotNow}
        breaking={data.breaking}
        trending={data.trending}
      />

      <MagazineGrid
        mobileRails={
          <MobileSidebarRails latest={data.latest} />
        }
        main={
          <>
            <PopularNowSection posts={data.popular} />
            <EditorsChoiceSection posts={data.editorsChoice} />
            <WorthReadingSection posts={data.worthReading} />
            <FoundersRepoCta />
            <CategoryColumnsSection columns={data.categoryColumns} />
            <VideoSessionSection
              newsReview={data.media.newsReview}
              hotVideos={data.media.hotVideos}
            />
            <MediaHubSection media={data.media} />
            <BrandPressStrip posts={data.brandPress} />
          </>
        }
        sidebar={
          <SidebarRail latest={data.latest} />
        }
      />

      <FooterNewsletter id="footer-newsletter" />
      <Footer />
    </HomepageShell>
  )
}
