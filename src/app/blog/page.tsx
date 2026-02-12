// Server-side API calls
import Link from 'next/link';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/ui/Footer';
import { Metadata } from 'next';
import { getImageUrlFromData } from '@/lib/imageHelpers';
import { formatDateShort } from '@/lib/dateUtils';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
  author?: string | { name: string };
  publishedAt?: any;
  featuredImage?: any;
  readTime?: string;
}

// Server-side function to fetch paginated published posts
async function getBlogPosts(page: number = 1): Promise<{ posts: Post[]; total: number }> {
  const pageSize = 25;
  try {
    const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
                          'https://techblit-cloud-function-production.up.railway.app';
    const API_BASE = `${FUNCTIONS_URL}/api/v1`;
    
    // Fetch all posts (API doesn't support pagination yet, so we fetch all and paginate client-side)
    const response = await fetch(`${API_BASE}/posts?limit=1000`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });
    
    if (!response.ok) {
      console.error('Failed to fetch posts');
      return { posts: [], total: 0 };
    }
    
    const result = await response.json();
    const allPosts = (result.data || result) as Post[];
    
    const total = allPosts.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const posts = allPosts.slice(startIndex, endIndex);
    
    return { posts, total };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { posts: [], total: 0 };
  }
}

export const metadata: Metadata = {
  title: 'Blog - TechBlit | African Tech News',
  description: 'Explore all published articles covering African tech news, startups, innovation, and technology ecosystem developments across the continent.',
  keywords: ['African tech', 'Nigeria tech', 'startups', 'tech news', 'innovation', 'African technology', 'startup ecosystem'],
  openGraph: {
    title: 'Blog - TechBlit | African Tech News',
    description: 'Explore all published articles covering African tech news, startups, innovation, and technology ecosystem developments.',
    type: 'website',
    url: 'https://www.techblit.com/blog',
  },
  alternates: {
    canonical: 'https://www.techblit.com/blog',
  },
};

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || '1', 10);
  const { posts, total } = await getBlogPosts(currentPage);
  const totalPages = Math.ceil(total / 25);

  const getImageUrl = (imageData: any): string | null => {
    return getImageUrlFromData(imageData, { preset: 'cover' });
  };

  const getCategoryGradient = (categoryName?: string) => {
    switch (categoryName?.toLowerCase()) {
      case 'Startup': return 'from-yellow-400 to-yellow-500';
      case 'tech news': return 'from-slate-900 to-slate-800';
      case 'funding': return 'from-slate-900 to-yellow-400';
      case 'insights': return 'from-slate-900 to-green-500';
      case 'events': return 'from-yellow-400 to-green-500';
      case 'fintech': return 'from-slate-900 to-slate-800';
      case 'ai & innovation': return 'from-slate-900 to-green-500';
      case 'developer tools': return 'from-yellow-400 to-yellow-500';
      case 'opinions': return 'from-slate-900 to-green-500';
      case 'brand press': return 'from-slate-900 to-slate-800';
      default: return 'from-slate-900 to-slate-800';
    }
  };

  const formatAuthor = (author: any): string => {
    if (typeof author === 'string') return author;
    if (author && author.name) return author.name;
    return 'Techblit Team';
  };

  // formatDate is now imported from dateUtils

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'TechBlit Blog',
    description: 'African tech news, startups, innovation, and technology articles',
    url: 'https://www.techblit.com/blog',
    publisher: {
      '@type': 'Organization',
      name: 'TechBlit',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.techblit.com/logo.png',
      },
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: total,
      itemListElement: posts.slice(0, 10).map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          url: `https://www.techblit.com/${post.slug}`,
        },
      })),
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            All Articles
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Explore all published content
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">📝</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Posts Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Check back soon for the latest content.
            </p>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {posts.map((post) => (
              <Link key={post.id} href={`/${post.slug}`} className="group block">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                  {/* Image */}
                  <div className={`aspect-video bg-gradient-to-br ${getCategoryGradient(post.category)} relative overflow-hidden`}>
                    {getImageUrl(post.featuredImage) ? (
                      <img
                        src={getImageUrl(post.featuredImage)!}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="text-sm font-medium">{post.category}</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Category Badge */}
                    {post.category && (
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-900">
                          {post.category}
                        </span>
                      </div>
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-3">
                      {post.title}
                    </h3>
                    
                    {post.excerpt && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
                        {post.excerpt}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatAuthor(post.author)}</span>
                      <span>{formatDateShort(post.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center space-x-2">
              {/* Previous Button */}
              {currentPage > 1 ? (
                <Link
                  href={`/blog?page=${currentPage - 1}`}
                  className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Previous
                </Link>
              ) : (
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 rounded-lg border border-gray-200 dark:border-gray-700 cursor-not-allowed">
                  Previous
                </div>
              )}

              {/* Page Numbers */}
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Link
                      key={pageNum}
                      href={`/blog?page=${pageNum}`}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}
              </div>

              {/* Next Button */}
              {currentPage < totalPages ? (
                <Link
                  href={`/blog?page=${currentPage + 1}`}
                  className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Next
                </Link>
              ) : (
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 rounded-lg border border-gray-200 dark:border-gray-700 cursor-not-allowed">
                  Next
                </div>
              )}
            </div>
          )}

          {/* Page Info */}
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Showing {posts.length > 0 ? (currentPage - 1) * 25 + 1 : 0} - {Math.min(currentPage * 25, total)} of {total} posts
          </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
