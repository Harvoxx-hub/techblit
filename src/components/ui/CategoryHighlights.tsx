'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

export default function CategoryHighlights() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestPosts = async () => {
      try {
        setLoading(true);
        
        // Query latest 8 posts across all categories
        const postsQuery = query(
          collection(db, 'posts'),
          orderBy('publishedAt', 'desc'),
          limit(8)
        );

        const postsSnapshot = await getDocs(postsQuery);
        const fetchedPosts: Post[] = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];

        setPosts(fetchedPosts);
      } catch (err) {
        console.error('Error fetching latest posts:', err);
        setError('Failed to load latest posts');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestPosts();
  }, []);

  const getImageUrl = (imageData: any): string | null => {
    if (!imageData) return null;
    
    let url: string | null = null;
    
    if (typeof imageData === 'string') {
      url = imageData;
    } else if (typeof imageData === 'object') {
      // Handle ProcessedImage format with original, thumbnail, ogImage
      if (imageData.original && imageData.original.url) url = imageData.original.url;
      else if (imageData.thumbnail && imageData.thumbnail.url) url = imageData.thumbnail.url;
      else if (imageData.ogImage && imageData.ogImage.url) url = imageData.ogImage.url;
      // Handle simple format
      else if (imageData.url) url = imageData.url;
      else if (imageData.downloadURL) url = imageData.downloadURL;
      else if (imageData.src) url = imageData.src;
      else if (typeof imageData.toString === 'function') {
        const urlStr = imageData.toString();
        if (urlStr.startsWith('http')) url = urlStr;
      }
    }
    
    // Filter out WordPress URLs to prevent 403 errors
    if (url && (url.includes('wp-content/uploads') || url.includes('www.techblit.com/wp-content'))) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ Filtered out WordPress featured image URL: ${url}`);
      }
      return null;
    }
    
    return url;
  };

  const getCategoryGradient = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'Startup': return gradients.secondary; // Yellow
      case 'fintech': return gradients.primary; // Navy
      case 'funding': return gradients.primarySecondary; // Navy to yellow
      case 'ai & innovation': return gradients.primaryAccent; // Navy to green
      case 'developer tools': return gradients.secondaryAccent; // Yellow to green
      case 'opinions': return gradients.accent; // Green
      case 'tech news': return gradients.primary; // Navy
      case 'insights': return gradients.primaryAccent; // Navy to green
      case 'events': return gradients.secondaryAccent; // Yellow to green
      default: return gradients.primary;
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
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-12"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Unable to Load Latest News
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {error}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
       

        {/* 4x2 Grid of News Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {posts.map((post, index) => (
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
                        <div className="text-sm font-medium">News {index + 1}</div>
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
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                    {post.title}
                  </h3>
                  
                  {/* Category Name */}
                  {post.category && (
                    <div className="mb-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {post.category}
                      </span>
                    </div>
                  )}
                  
                  {post.excerpt && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                      {post.excerpt}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
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

        {/* View All Link */}
        <div className="text-center mt-12">
          <Link
            href="/blog"
            className="inline-flex items-center text-lg font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors border-b border-gray-300 dark:border-gray-600 hover:border-gray-900 dark:hover:"
          >
            View All Articles
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
