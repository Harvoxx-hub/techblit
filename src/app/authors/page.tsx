import { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/ui/Footer';
import { encodeAuthorName } from './[name]/page';

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
                          'https://us-central1-techblit.cloudfunctions.net';

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
      url: 'https://techblit.com/authors',
    },
    alternates: {
      canonical: 'https://techblit.com/authors',
    },
  };
}

export default async function AuthorsPage() {
  const authors = await getAllAuthors();

  // Sort authors by article count (descending)
  const sortedAuthors = authors.sort((a, b) => b.articleCount - a.articleCount);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Meet Our Authors
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Talented writers and contributors documenting Africa's vibrant tech ecosystem, startup stories, and innovation journeys.
            </p>
            <div className="flex gap-6 text-lg">
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/30">
                <span className="font-bold text-2xl">{authors.length}</span>
                <span className="ml-2 text-blue-100">Author{authors.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/30">
                <span className="font-bold text-2xl">
                  {authors.reduce((sum, author) => sum + author.articleCount, 0)}
                </span>
                <span className="ml-2 text-blue-100">Articles</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Authors Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          {authors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 dark:text-gray-400">
                No authors found. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedAuthors.map((author) => (
                <Link
                  key={author.uid}
                  href={`/authors/${author.slug || encodeAuthorName(author.name)}`}
                  className="group"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 dark:border-gray-700 h-full">
                    {/* Avatar */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-2xl font-bold text-white">
                          {author.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1 truncate">
                          {author.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Contributor
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                        {author.articleCount} article{author.articleCount !== 1 ? 's' : ''}
                      </div>
                      {author.totalViews && author.totalViews > 0 && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm font-medium">
                          {author.totalViews.toLocaleString()} views
                        </div>
                      )}
                      {author.categories && author.categories.length > 0 && (
                        <div className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
                          {author.categories.length} {author.categories.length === 1 ? 'category' : 'categories'}
                        </div>
                      )}
                    </div>

                    {/* Categories */}
                    {author.categories && author.categories.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Writes about:</p>
                        <div className="flex flex-wrap gap-1">
                          {author.categories.slice(0, 3).map((category, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 px-2 py-1 rounded"
                            >
                              {category}
                            </span>
                          ))}
                          {author.categories.length > 3 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                              +{author.categories.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* View Profile Link */}
                    <div className="text-blue-600 dark:text-blue-400 font-medium text-sm group-hover:text-blue-800 dark:group-hover:text-blue-300 flex items-center">
                      View profile
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 dark:bg-gray-800 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Want to Join Our Team?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            We're always looking for passionate writers to help document Africa's tech revolution.
          </p>
          <Link
            href="/writers"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-700 text-white px-8 py-4 rounded-lg font-bold text-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          >
            Become a Contributor
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
