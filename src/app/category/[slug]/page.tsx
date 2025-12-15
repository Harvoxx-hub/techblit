// Server-side API calls
import Link from 'next/link';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/ui/Footer';
import { CATEGORIES, getCategoryBySlug } from '@/lib/categories';
import { generateCategorySEO } from '@/lib/seo';
import { Metadata } from 'next';
import { getImageUrlFromData } from '@/lib/imageHelpers';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
  categories?: string[];
  author?: string | { name: string };
  publishedAt?: any;
  createdAt?: any;
  featuredImage?: any;
  readTime?: string;
}

// Server-side function to fetch posts for a category
async function getCategoryPosts(categorySlug: string): Promise<{ posts: Post[]; recommendedPosts: Post[] }> {
  try {
    const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
                          'https://us-central1-techblit.cloudfunctions.net';
    const API_BASE = `${FUNCTIONS_URL}/api/v1`;
    
    // Fetch posts by category from API
    const response = await fetch(`${API_BASE}/categories/${categorySlug}/posts?limit=20`, {
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Category API error (${response.status}) for slug "${categorySlug}":`, errorText);
      
      // If category not found, try fetching all posts and filtering client-side as fallback
      try {
        const allPostsResponse = await fetch(`${API_BASE}/posts?limit=100`, {
          next: { revalidate: 3600 }
        });
        if (allPostsResponse.ok) {
          const allPostsResult = await allPostsResponse.json();
          const allPosts = (allPostsResult.data || allPostsResult) as Post[];
          
          // Map slug to category name
          const slugToCategoryMap: Record<string, string> = {
            'events': 'Events',
            'startup': 'Startup',
            'tech-news': 'Tech News',
            'brand-press': 'Brand Press'
          };
          
          const categoryName = slugToCategoryMap[categorySlug.toLowerCase()] || 
                              categorySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          
          // Filter posts by category
          const filteredPosts = allPosts.filter(post => {
            const postCategory = post.category?.toLowerCase();
            const postCategories = (post.categories || []).map((c: string) => c.toLowerCase());
            const searchCategory = categoryName.toLowerCase();
            
            return postCategory === searchCategory || postCategories.includes(searchCategory);
          });
          
          console.log(`Fallback: Found ${filteredPosts.length} posts for category "${categoryName}"`);
          return { posts: filteredPosts.slice(0, 20), recommendedPosts: [] };
        }
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
      }
      
      return { posts: [], recommendedPosts: [] };
    }
    
    const result = await response.json();
    const categoryData = result.data || result;
    const categoryPosts = categoryData.posts || [];
    
    console.log(`Found ${categoryPosts.length} posts for category slug "${categorySlug}"`);
    
    // Fetch recommended posts if no category posts
    let recommendedPosts: Post[] = [];
    if (categoryPosts.length === 0) {
      const recommendedResponse = await fetch(`${API_BASE}/posts?limit=6`, {
        next: { revalidate: 3600 }
      });
      if (recommendedResponse.ok) {
        const recommendedResult = await recommendedResponse.json();
        recommendedPosts = recommendedResult.data || recommendedResult;
      }
    }

    return { posts: categoryPosts, recommendedPosts };

  } catch (error) {
    console.error('Error fetching category posts:', error);
    return { posts: [], recommendedPosts: [] };
  }
}

// Generate metadata for the category page
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  
  if (!category) {
    return {
      title: 'Category Not Found - TechBlit',
      description: 'The category you\'re looking for doesn\'t exist.',
    };
  }

  return generateCategorySEO(category.label, category.description);
}

// Main category page component
export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  const { posts, recommendedPosts } = await getCategoryPosts(slug);

  if (!category) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="text-6xl mb-6">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Category Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              The category "{slug}" doesn't exist.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

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

  const formatDate = (date: any): string => {
    if (!date) return '';
    
    try {
      let dateObj: Date | null = null;
      
      if (date.toDate && typeof date.toDate === 'function') {
        try {
          dateObj = date.toDate();
        } catch {
          dateObj = null;
        }
      } else if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string' || typeof date === 'number') {
        dateObj = new Date(date);
      }
      
      // Check if date is valid
      if (!dateObj || isNaN(dateObj.getTime())) {
        return '';
      }
      
      // Additional validation - ensure the date is reasonable
      const timestamp = dateObj.getTime();
      if (timestamp < 0 || timestamp > Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) {
        return '';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(dateObj);
    } catch (error) {
      console.warn('Error formatting date:', error, date);
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />
      
      {/* Category Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {category.label}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {category.description || `Explore the latest ${category.label.toLowerCase()} content and insights`}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {posts.length > 0 ? (
          <>
            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                        <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                      </div>
                      
                      {post.readTime && (
                        <div className="mt-2 text-xs text-gray-400">
                          {post.readTime} read
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          /* Empty State with Recommendations */
          <div className="text-center">
            <div className="text-6xl mb-6">📝</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No {category.label} Posts Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              We haven't published any {category.label.toLowerCase()} content yet. 
              Check out our latest articles below:
            </p>

            {/* Recommended Posts */}
            {recommendedPosts.length > 0 && (
              <>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Latest Articles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendedPosts.map((post) => (
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
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                            {post.title}
                          </h3>
                          
                          {post.excerpt && (
                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                              {post.excerpt}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{formatAuthor(post.author)}</span>
                            <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {/* Browse Categories */}
            <div className="mt-12">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Browse Other Categories
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {CATEGORIES.filter(cat => cat.slug !== slug).map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}