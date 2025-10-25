import Navigation from '@/components/ui/Navigation';
import HeroSection from '@/components/ui/HeroSection';
import CategoryHighlights from '@/components/ui/CategoryHighlights';
import BrandPressSection from '@/components/ui/BrandPressSection';
import NewsletterSection from '@/components/ui/NewsletterSection';
import Footer from '@/components/ui/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />
      <HeroSection />
      <CategoryHighlights />
      <BrandPressSection />
      <NewsletterSection />
      <Footer />
    </div>
  );
}
