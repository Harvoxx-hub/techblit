import Navigation from '@/components/ui/Navigation';
import HeroSection from '@/components/ui/HeroSection';
import CategoryHighlights from '@/components/ui/CategoryHighlights';
import BrandPressSection from '@/components/ui/BrandPressSection';
import CategorySection from '@/components/ui/CategorySection';
import NewsletterSection from '@/components/ui/NewsletterSection';
import Footer from '@/components/ui/Footer';
import { getHomepageData } from '@/lib/homepageData';
import { Metadata } from 'next';

export const revalidate = 3600;

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
};

export default async function Home() {
  const data = await getHomepageData();

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
        url: 'https://www.techblit.com/logo.png',
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
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navigation />
      <HeroSection
        mainPost={data.heroPosts[0]}
        secondaryPosts={data.heroPosts.slice(1, 3)}
      />
      <CategoryHighlights posts={data.highlights} />
      <BrandPressSection posts={data.brandPress} />
      <CategorySection
        categoryLabel="Startup"
        categorySlug="Startup"
        title="Startup"
        posts={data.categories.startup}
      />
      <CategorySection
        categoryLabel="Tech News"
        categorySlug="tech-news"
        title="Tech News"
        posts={data.categories.techNews}
      />
      <CategorySection
        categoryLabel="Events"
        categorySlug="events"
        title="Events"
        posts={data.categories.events}
      />
      <NewsletterSection />
      <Footer />
    </div>
  );
}
