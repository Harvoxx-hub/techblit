import { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/ui/Footer';
import { authorNameToSlug } from '@/lib/authorUtils';
import AuthorGrid from '@/components/authors/AuthorGrid';

interface Author {
  name: string;
  uid: string;
  articleCount: number;
  slug: string;
  totalViews?: number;
  categories?: string[];
}

// Fetch all authors from the API
async function getAllAuthors(): Promise<Author[]> {
  try {
    const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL ||
                          'https://techblit-cloud-function-production.up.railway.app';

    const response = await fetch(
      `${FUNCTIONS_URL}/api/v1/authors`,
      {
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch authors:', response.status);
      return [];
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching authors:', error);
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
  const authors = await getAllAuthors();

  return {
    title: 'Our Authors | TechBlit',
    description: `Meet the ${authors.length} talented writers and contributors documenting Africa's tech ecosystem on TechBlit. Browse author profiles and their published work.`,
    keywords: ['TechBlit authors', 'tech writers', 'African tech journalists', 'contributors', 'blog authors'],
    openGraph: {
      title: 'Our Authors | TechBlit',
      description: `Meet the ${authors.length} talented writers documenting Africa's tech ecosystem`,
      type: 'website',
      url: 'https://www.techblit.com/authors',
    },
    alternates: {
      canonical: 'https://www.techblit.com/authors',
    },
  };
}

export default async function AuthorsPage() {
  const authors = await getAllAuthors();

  // Sort authors by article count (descending)
  const sortedAuthors = authors.sort((a, b) => b.articleCount - a.articleCount);

  const totalArticles = authors.reduce((sum, author) => sum + author.articleCount, 0);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <Navigation />

      {/* Hero Section with Geometric Patterns */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 dark:from-orange-600 dark:via-amber-600 dark:to-yellow-500">
        {/* Animated geometric background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="kente-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="50" height="50" fill="currentColor" className="text-black" />
                <rect x="50" y="50" width="50" height="50" fill="currentColor" className="text-black" />
                <path d="M0 50 L50 0 M50 100 L100 50" stroke="currentColor" strokeWidth="8" className="text-teal-600" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#kente-pattern)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-32">
          <div className="max-w-4xl">
            {/* Small eyebrow */}
            <div className="inline-block mb-6 px-4 py-2 bg-black/20 backdrop-blur-sm rounded-full">
              <span className="text-sm font-bold tracking-widest uppercase text-white">
                The Voices Behind The Stories
              </span>
            </div>

            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-6 text-white leading-[0.9] tracking-tight">
              Our<br />Authors
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl font-medium leading-relaxed">
              Talented writers documenting Africa's vibrant tech ecosystem, from Lagos to Nairobi, Cape Town to Cairo.
            </p>

            {/* Stats with animated counters */}
            <div className="flex flex-wrap gap-6">
              <div className="group">
                <div className="bg-white/20 backdrop-blur-md border-2 border-white/40 px-8 py-4 rounded-2xl hover:bg-white/30 transition-all duration-300 hover:scale-105">
                  <div className="text-5xl font-black text-white mb-1">{authors.length}</div>
                  <div className="text-sm font-bold tracking-wide uppercase text-white/80">
                    Author{authors.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <div className="group">
                <div className="bg-white/20 backdrop-blur-md border-2 border-white/40 px-8 py-4 rounded-2xl hover:bg-white/30 transition-all duration-300 hover:scale-105">
                  <div className="text-5xl font-black text-white mb-1">{totalArticles}</div>
                  <div className="text-sm font-bold tracking-wide uppercase text-white/80">
                    Articles
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Diagonal cut-off at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-white dark:bg-[#0a0a0a] transform -skew-y-2 origin-top-left"></div>
      </section>

      {/* Authors Grid */}
      <section className="py-20 md:py-28 relative">
        {/* Decorative element */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-teal-500/10 dark:bg-teal-400/10 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-6">
          {authors.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">✍️</div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No authors yet
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Check back soon for our talented contributors!
              </p>
            </div>
          ) : (
            <>
              <div className="mb-12">
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
                  Meet The Team
                </h2>
                <div className="w-20 h-1 bg-gradient-to-r from-orange-500 to-amber-500"></div>
              </div>

              <AuthorGrid authors={sortedAuthors} />
            </>
          )}
        </div>
      </section>

      {/* CTA Section with geometric shapes */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        {/* Background with pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-teal-800 dark:from-teal-700 dark:to-teal-900"></div>

        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 border-8 border-white rotate-45"></div>
          <div className="absolute bottom-20 right-20 w-60 h-60 border-8 border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-white rotate-12"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
            <span className="text-sm font-bold tracking-widest uppercase text-white">
              Join Us
            </span>
          </div>

          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            Shape Africa's<br />Tech Narrative
          </h2>

          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto">
            We're looking for passionate writers to help document the continent's tech revolution.
          </p>

          <Link
            href="/writers"
            className="group inline-flex items-center gap-3 bg-white text-teal-900 px-10 py-5 rounded-full font-black text-lg hover:bg-amber-400 hover:text-black transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
          >
            <span>Become a Contributor</span>
            <svg
              className="w-6 h-6 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
