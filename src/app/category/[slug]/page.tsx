'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/ui/Footer';
import { CATEGORIES, getCategoryBySlug } from '@/lib/categories';
import { gradients } from '@/lib/colors';

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

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.slug as string;
  const [posts, setPosts] = useState<Post[]>([]);
  const [recommendedPosts, setRecommendedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const category = getCategoryBySlug(categorySlug);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        if (!db) {
          setError('Firebase not initialized');
          setLoading(false);
          return;
        }

        // Fetch posts for this category
        const postsRef = collection(db, 'posts');
        const categoryQuery = query(
          postsRef,
          where('status', '==', 'published'),
          where('category', '==', category?.label || ''),
          orderBy('publishedAt', 'desc'),
          limit(20)
        );

        const categorySnapshot = await getDocs(categoryQuery);
        const categoryPosts = categorySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];

        setPosts(categoryPosts);

        // If no posts found, fetch recommended posts (latest posts)
        if (categoryPosts.length === 0) {
          const recommendedQuery = query(
            postsRef,
            where('status', '==', 'published'),
            orderBy('publishedAt', 'desc'),
            limit(6)
          );

          const recommendedSnapshot = await getDocs(recommendedQuery);
          const recommended = recommendedSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Post[];

          setRecommendedPosts(recommended);
        }

      } catch (error) {
        console.error('Error fetching posts:', error);
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    if (categorySlug) {
      fetchPosts();
    }
  }, [categorySlug, category?.label]);

  const getImageUrl = (imageData: any): string | null => {
    if (!imageData) return null;
    if (typeof imageData === 'string') return imageData;
    if (typeof imageData === 'object') {
      if (imageData.url) return imageData.url;
      if (imageData.downloadURL) return imageData.downloadURL;
      if (imageData.src) return imageData.src;
      if (typeof imageData.toString === 'function') {
        const url = imageData.toString();
        if (url.startsWith('http')) return url;
      }
    }
    return null;
  };

  const getCategoryGradient = (categoryName?: string) => {
    switch (categoryName?.toLowerCase()) {
      case 'startups': return 'from-yellow-400 to-yellow-500';
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
    
    let dateObj: Date;
    if (date.toDate) {
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      dateObj = new Date(date);
    }
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(dateObj);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Unable to Load Posts
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {error}
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
              The category "{categorySlug}" doesn't exist.
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
              Explore the latest {category.label.toLowerCase()} content and insights
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
                        <span>{formatDate(post.publishedAt)}</span>
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
                            <span>{formatDate(post.publishedAt)}</span>
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
                {CATEGORIES.filter(cat => cat.slug !== categorySlug).map((cat) => (
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
