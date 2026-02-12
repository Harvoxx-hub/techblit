import Navigation from '@/components/ui/Navigation';
import HeroSection from '@/components/ui/HeroSection';
import CategoryHighlights from '@/components/ui/CategoryHighlights';
import BrandPressSection from '@/components/ui/BrandPressSection';
import CategorySection from '@/components/ui/CategorySection';
import EventBanner from '@/components/ui/EventBanner';
import NewsletterSection from '@/components/ui/NewsletterSection';
import Footer from '@/components/ui/Footer';
import { Metadata } from 'next';

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

export default function Home() {
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
      <HeroSection />
      <CategoryHighlights />
      <BrandPressSection />
      <CategorySection categoryLabel="Startup" categorySlug="Startup" title="Startup" />
      <CategorySection categoryLabel="Tech News" categorySlug="tech-news" title="Tech News" />
      <CategorySection categoryLabel="Events" categorySlug="events" title="Events" />
      <NewsletterSection />
      <Footer />
    </div>
  );
}
