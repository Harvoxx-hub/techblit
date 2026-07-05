import Navigation from '@/components/ui/Navigation'
import Footer from '@/components/ui/Footer'
import HomepageShell from '@/components/homepage/layout/HomepageShell'
import MagazineGrid from '@/components/homepage/layout/MagazineGrid'
import SidebarRail from '@/components/homepage/rails/SidebarRail'
import MobileSidebarRails from '@/components/homepage/rails/MobileSidebarRails'
import BreakingTicker from '@/components/homepage/sections/BreakingTicker'
import InlineNewsletter from '@/components/homepage/sections/InlineNewsletter'
import HotNowSection from '@/components/homepage/sections/HotNowSection'
import PopularNowSection from '@/components/homepage/sections/PopularNowSection'
import WeeklyReviewSection from '@/components/homepage/sections/WeeklyReviewSection'
import EditorsChoiceSection from '@/components/homepage/sections/EditorsChoiceSection'
import WorthReadingSection from '@/components/homepage/sections/WorthReadingSection'
import FeaturedCategorySection from '@/components/homepage/sections/FeaturedCategorySection'
import MediaHubSection from '@/components/homepage/sections/MediaHubSection'
import CategoryColumnsSection from '@/components/homepage/sections/CategoryColumnsSection'
import BrandPressStrip from '@/components/homepage/sections/BrandPressStrip'
import FooterNewsletter from '@/components/homepage/sections/FooterNewsletter'
import { getHomepageData } from '@/lib/homepageData'
import { Metadata } from 'next'

export const revalidate = 3600

export const metadata: Metadata = {
  title: "TechBlit - Igniting Africa's Tech Conversation",
  description: "Discover the latest African tech news, startup insights, funding rounds, and innovation stories. Your destination for comprehensive coverage of Africa's technology ecosystem.",
  keywords: ['African tech', 'Nigeria tech', 'startups Africa', 'tech news', 'African innovation', 'fintech', 'funding rounds', 'startup ecosystem', 'African technology', 'tech ecosystem'],
  openGraph: {
    title: "TechBlit - Igniting Africa's Tech Conversation",
    description: "Discover the latest African tech news, startup insights, funding rounds, and innovation stories.",
    type: 'website',
    url: 'https://www.techblit.com',
  },
  alternates: {
    canonical: 'https://www.techblit.com',
  },
}

export default async function Home() {
  const data = await getHomepageData()

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
      <InlineNewsletter />

      <MagazineGrid
        mobileRails={
          <MobileSidebarRails
            trending={data.trending}
            breaking={data.breaking}
          />
        }
        main={
          <>
            <HotNowSection hotNow={data.hotNow} secondary={data.heroSecondary} />
            <PopularNowSection posts={data.popular} />
            <WeeklyReviewSection episodes={data.media.newsReview} />
            <EditorsChoiceSection posts={data.editorsChoice} />
            <WorthReadingSection posts={data.worthReading} />
            <FeaturedCategorySection category={data.featuredCategory} />
            <MediaHubSection media={data.media} />
            <CategoryColumnsSection columns={data.categoryColumns} />
            <BrandPressStrip posts={data.brandPress} />
          </>
        }
        sidebar={
          <SidebarRail
            trending={data.trending}
            breaking={data.breaking}
            latest={data.trending}
          />
        }
      />

      <FooterNewsletter id="footer-newsletter" />
      <Footer />
    </HomepageShell>
  )
}
