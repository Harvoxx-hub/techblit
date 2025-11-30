'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCategoryGradient } from '@/lib/categories';

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

export default function BrandPressSection() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrandPressPosts = async () => {
      setLoading(true);
      try {
        const postsRef = collection(db, 'posts');
        // Query all published posts and filter case-insensitively
        const q = query(
          postsRef,
          where('status', '==', 'published'),
          orderBy('publishedAt', 'desc'),
          limit(100) // Fetch more to filter case-insensitively
        );
        const querySnapshot = await getDocs(q);
        const allPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        
        // Filter posts by category case-insensitively
        const categoryLower = 'Brand Press'.toLowerCase();
        const filteredPosts = allPosts
          .filter(post => post.category?.toLowerCase() === categoryLower)
          .slice(0, 6); // Limit to 6 posts for 3x2 grid
        
        console.log('Brand Press posts fetched:', filteredPosts.length, filteredPosts);
        setPosts(filteredPosts);
      } catch (error) {
        console.error('Error fetching brand press posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrandPressPosts();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
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
      </section>
    );
  }

  if (posts.length === 0) {
    // Show debug info in development
    if (process.env.NODE_ENV === 'development') {
      return (
        <section className="py-16 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Brand Press Section (Debug Mode)
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              No Brand Press posts found. Create posts with category "Brand Press" to see them here.
            </p>
          </div>
        </section>
      );
    }
    return null; // Don't show section if no brand press posts
  }

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-left mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Brand Press</span>
          </div>
        
        </div>

        {/* Brand Press Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link key={post.id} href={`/${post.slug}`} className="group block">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-full transform hover:-translate-y-2">
                {/* Image */}
                <div className={`aspect-video bg-gradient-to-br ${getCategoryGradient('brand-press')} relative overflow-hidden`}>
                  {getImageUrl(post.featuredImage) ? (
                    <img
                      src={getImageUrl(post.featuredImage)!}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-4xl mb-2">📰</div>
                        <div className="text-sm font-medium">Brand Press</div>
                      </div>
                    </div>
                  )}
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white backdrop-blur-sm">
                      Brand Press
                    </span>
                  </div>
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-3">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">{formatAuthor(post.author)}</span>
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
            href="/category/brand-press"
            className="inline-flex items-center px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            View All Brand Press Stories
            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
