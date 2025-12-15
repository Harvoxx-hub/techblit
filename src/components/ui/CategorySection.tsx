'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import apiService from '@/lib/apiService';
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

interface CategorySectionProps {
  categoryLabel: string;
  categorySlug: string;
  title: string;
  limit?: number;
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

export default function CategorySection({ 
  categoryLabel, 
  categorySlug, 
  title,
  limit: postsLimit = 4 
}: CategorySectionProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryPosts = async () => {
      setLoading(true);
      try {
        // Fetch from API and filter by category
        const allPosts = await apiService.getPosts({ limit: 100 });
        
        // Filter posts by category case-insensitively
        const categoryLower = categoryLabel.toLowerCase();
        const filteredPosts = (allPosts as Post[])
          .filter(post => post.category?.toLowerCase() === categoryLower)
          .slice(0, postsLimit);
        
        setPosts(filteredPosts);
      } catch (error) {
        console.error(`Error fetching ${categoryLabel} posts:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryPosts();
  }, [categoryLabel, postsLimit]);

  if (loading) {
    return (
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
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
    return null; // Don't show section if no posts
  }

  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-left mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 shadow-sm mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>
          </div>
        </div>

        {/* Category Grid - 4x1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {posts.map((post) => (
            <Link key={post.id} href={`/${post.slug}`} className="group block">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                {/* Image */}
                <div className={`aspect-video bg-gradient-to-br ${getCategoryGradient(categoryLabel || categorySlug)} relative overflow-hidden`}>
                  {getImageUrl(post.featuredImage) ? (
                    <img
                      src={getImageUrl(post.featuredImage)!}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-sm font-medium">{categoryLabel}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white backdrop-blur-sm">
                      {categoryLabel}
                    </span>
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                    {post.title}
                  </h3>
                  
                  {post.excerpt && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
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
            href={`/category/${categorySlug}`}
            className="inline-flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
          >
            View All {title}
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

