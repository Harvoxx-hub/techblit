'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { gradients } from '@/lib/colors';

interface FeaturedPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
  publishedAt?: any;
  author?: string | { uid: string; name: string };
  readTime?: string;
  featuredImage?: string;
  isFeatured?: boolean;
}

interface HeroSectionProps {
  mainPost?: FeaturedPost;
  secondaryPosts?: FeaturedPost[];
}

export default function HeroSection({ mainPost, secondaryPosts }: HeroSectionProps) {
  const [featuredPosts, setFeaturedPosts] = useState<FeaturedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedPosts = async () => {
      try {
        // Try to fetch featured posts first
        const postsRef = collection(db, 'posts');
        const featuredQuery = query(
          postsRef,
          where('status', '==', 'published'),
          where('isFeatured', '==', true),
          orderBy('publishedAt', 'desc'),
          limit(5)
        );
        
        const featuredSnapshot = await getDocs(featuredQuery);
        
        if (!featuredSnapshot.empty) {
          const posts = featuredSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FeaturedPost[];
          setFeaturedPosts(posts);
        } else {
          // Fallback to most recent posts
          const recentQuery = query(
            postsRef,
            where('status', '==', 'published'),
            orderBy('publishedAt', 'desc'),
            limit(5)
          );
          
          const recentSnapshot = await getDocs(recentQuery);
          const posts = recentSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FeaturedPost[];
          setFeaturedPosts(posts);
        }
      } catch (error) {
        console.error('Error fetching featured posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedPosts();
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getAuthorName = (author: any) => {
    if (typeof author === 'string') return author;
    if (author && author.name) return author.name;
    return 'Techblit Team';
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'Startup': return '🚀';
      case 'tech-news': return '📰';
      case 'funding': return '💰';
      case 'insights': return '🧠';
      case 'events': return '🎤';
      default: return '💡';
    }
  };

  const getCategoryGradient = (category?: string) => {
    switch (category) {
      case 'Startup': return gradients.secondary; // Yellow for Startup
      case 'tech-news': return gradients.primary; // Dark navy for tech news
      case 'funding': return gradients.primarySecondary; // Navy to yellow for funding
      case 'insights': return gradients.primaryAccent; // Navy to green for insights
      case 'events': return gradients.secondaryAccent; // Yellow to green for events
      default: return gradients.primary; // Default to dark navy
    }
  };

  const getImageUrl = (imageData: any, preferThumbnail: boolean = false): string | null => {
    if (!imageData) return null;
    
    // If it's already a string URL, return it
    if (typeof imageData === 'string') return imageData;
    
    // If it's an object, try to extract URL
    if (typeof imageData === 'object') {
      // Handle ProcessedImage format - prefer thumbnail for smaller displays
      if (imageData.thumbnail?.url && preferThumbnail) {
        return imageData.thumbnail.url;
      }
      if (imageData.original?.url) {
        return imageData.original.url;
      }
      
      // Legacy Firebase storage reference
      if (imageData.url) return imageData.url;
      if (imageData.downloadURL) return imageData.downloadURL;
      if (imageData.src) return imageData.src;
      
      // If it has a toString method, try that
      if (typeof imageData.toString === 'function') {
        const url = imageData.toString();
        if (url.startsWith('http')) return url;
      }
    }
    
    return null;
  };


  if (loading) {
    return (
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (featuredPosts.length === 0) {
    return (
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <div className="text-6xl mb-6">📝</div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">No Featured Stories Yet</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              We're working on bringing you amazing featured content. Check back soon!
            </p>
            <Link
              href="/blog"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Browse All Articles
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const mainPostData = mainPost || featuredPosts[0];
  const secondaryPostsData = secondaryPosts || featuredPosts.slice(1, 3);

  return (
    <section className="py-12 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Featured Stories
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            The most important stories from the African tech ecosystem
          </p>
        </div>

        {/* Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Featured Story */}
          <div className="lg:col-span-2">
            <Link href={`/${mainPostData.slug}`} className="group block">
              <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
                {/* Featured Image */}
                <div className={`aspect-video bg-gradient-to-br ${getCategoryGradient(mainPostData.category)} relative overflow-hidden`}>
                  {getImageUrl(mainPostData.featuredImage) ? (
                    <img
                      src={getImageUrl(mainPostData.featuredImage)!}
                      alt={mainPostData.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-6xl mb-4">
                          {getCategoryIcon(mainPostData.category)}
                        </div>
                        <div className="text-xl font-semibold">Featured Story</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Category Badge */}
                  {mainPostData.category && (
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/90 text-gray-900">
                        {getCategoryIcon(mainPostData.category)} {mainPostData.category}
                      </span>
                    </div>
                  )}
                  
                  {/* Featured Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-400 text-gray-900">
                      ⭐ Featured
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 bg-white dark:bg-gray-800">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {mainPostData.title}
                  </h3>
                  
                  {mainPostData.excerpt && (
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                      {mainPostData.excerpt}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                      <span>{getAuthorName(mainPostData.author)}</span>
                      <span>•</span>
                      <span>{formatDate(mainPostData.publishedAt)}</span>
                    </div>
                    {mainPostData.readTime && (
                      <span>{mainPostData.readTime}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Secondary Stories */}
          <div className="space-y-6">
            {secondaryPostsData.map((post, index) => (
              <Link key={post.id} href={`/${post.slug}`} className="group block">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  {/* Image */}
                  <div className={`aspect-video bg-gradient-to-br ${getCategoryGradient(post.category)} relative overflow-hidden`}>
                    {getImageUrl(post.featuredImage, true) ? (
                      <img
                        src={getImageUrl(post.featuredImage, true)!}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="text-3xl mb-2">
                            {getCategoryIcon(post.category)}
                          </div>
                          <div className="text-sm font-medium">Story {index + 2}</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Category Badge */}
                    {post.category && (
                      <div className="absolute top-2 left-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-900">
                          {getCategoryIcon(post.category)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {post.title}
                    </h4>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{getAuthorName(post.author)}</span>
                      <span>{formatDate(post.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* View All Link */}
        <div className="mt-8 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
          >
            View latest Articles
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
