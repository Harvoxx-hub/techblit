import Link from 'next/link';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/ui/Footer';
import { Metadata } from 'next';
import { getImageUrlFromData } from '@/lib/imageHelpers';

export const metadata: Metadata = {
  title: 'Page Not Found - TechBlit',
  description: 'The page you are looking for does not exist or has been moved. Explore our latest tech news and articles.',
  robots: {
    index: false, // Don't index 404 pages
    follow: true, // But follow links
  },
};

// Server-side fetch for suggested posts
async function getSuggestedPosts() {
  try {
    const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
                          'https://us-central1-techblit.cloudfunctions.net';
    const API_BASE = `${FUNCTIONS_URL}/api/v1`;
    
    const response = await fetch(`${API_BASE}/posts?limit=6`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) return [];
    
    const result = await response.json();
    return result.data || result || [];
  } catch {
    return [];
  }
}

export default async function NotFound() {
  const suggestedPosts = await getSuggestedPosts();

  // Popular categories for navigation
  const popularCategories = [
    { name: 'Startup', slug: 'startup' },
    { name: 'Tech News', slug: 'tech-news' },
    { name: 'Funding', slug: 'funding' },
    { name: 'Fintech', slug: 'fintech' },
    { name: 'AI & Innovation', slug: 'ai-innovation' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* 404 Header */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <span className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-slate-900">
              404
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Sorry, the page you're looking for doesn't exist or may have been moved. 
            Don't worry though, we have plenty of great content for you to explore!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
            >
              ← Back to Home
            </Link>
            <Link 
              href="/blog"
              className="inline-flex items-center justify-center px-6 py-3 bg-yellow-400 text-slate-900 rounded-lg hover:bg-yellow-500 transition-colors font-medium"
            >
              Browse All Articles
            </Link>
          </div>
        </div>

        {/* Quick Categories */}
        <div className="mb-16">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Explore by Category
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {popularCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Suggested Articles */}
        {suggestedPosts.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-8 text-center">
              You Might Be Interested In
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestedPosts.slice(0, 6).map((post: any) => (
                <Link 
                  key={post.id}
                  href={`/${post.slug}`}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
                >
                  {/* Image */}
                  {post.featuredImage && (
                    <div className="aspect-video bg-gray-100 relative overflow-hidden">
                      {(() => {
                        const imageUrl = getImageUrlFromData(post.featuredImage, { preset: 'cover' });
                        
                        if (imageUrl) {
                          return (
                            <img 
                              src={imageUrl} 
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                  
                  <div className="p-4">
                    {post.category && (
                      <span className="text-xs font-medium text-yellow-600 mb-2 block">
                        {post.category}
                      </span>
                    )}
                    <h3 className="font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            Looking for something specific?{' '}
            <Link href="/about" className="text-yellow-600 hover:underline">
              Contact us
            </Link>{' '}
            and we'll help you find it.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}


