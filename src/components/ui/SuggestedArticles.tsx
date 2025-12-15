'use client';

import { useState, useEffect, useMemo } from 'react';
import apiService from '@/lib/apiService';
import Link from 'next/link';
import { getImageUrlFromData } from '@/lib/imageHelpers';
 
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: {
    url: string;
    alt: string;
  };
  createdAt: any;
  publishedAt?: any;
  author?: string | { uid: string; name: string };
  categories?: string[];
  tags?: string[];
}

interface SuggestedArticlesProps {
  currentPostId: string;
  currentPostCategories?: string[];
  currentPostTags?: string[];
  className?: string;
}

export default function SuggestedArticles({ 
  currentPostId, 
  currentPostCategories = [], 
  currentPostTags = [],
  className = '' 
}: SuggestedArticlesProps) {
  const [suggestedPosts, setSuggestedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestedPosts = async () => {
      try {
        // Fetch recent posts from API
        const allPosts = await apiService.getPosts({ limit: 10 });
        let posts = allPosts as BlogPost[];

        // Filter out the current post
        posts = posts.filter(post => post.id !== currentPostId);

        // If we have categories, prioritize matching posts
        if (currentPostCategories.length > 0) {
          const categoryPosts = posts.filter(post => 
            post.categories?.some(cat => 
              currentPostCategories.includes(cat)
            )
          );
          if (categoryPosts.length >= 3) {
            posts = categoryPosts;
          }
        }
        
        // Limit to 3 posts
        posts = posts.slice(0, 3);
        setSuggestedPosts(posts);
      } catch (error) {
        console.error('Error fetching suggested posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestedPosts();
    // Use stringified arrays in dependencies to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPostId, JSON.stringify(currentPostCategories), JSON.stringify(currentPostTags)]);

  if (loading) {
    return (
      <section className={`py-16 bg-white ${className}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">You Might Also Like</h2>
            <p className="text-lg text-gray-600">Discover more great content</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                <div className="bg-gray-200 h-4 rounded mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (suggestedPosts.length === 0) {
    return null;
  }

  return (
    <section className={`py-16 bg-white ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            
          </h2>
          <p className="text-lg text-gray-600">Discover more great content</p>
        </div>

        {/* Suggested Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {suggestedPosts.map((post) => (
            <div key={post.id} className="group">
              <Link href={`/${post.slug}`} className="block">
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  {/* Featured Image */}
                  {(() => {
                    const imageUrl = getImageUrlFromData(post.featuredImage, { preset: 'thumbnail' });
                    return imageUrl ? (
                    <div className="aspect-w-16 aspect-h-9">
                      <img
                          src={imageUrl}
                          alt={post.featuredImage?.alt || post.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        {post.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    );
                  })()}

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                      {post.title}
                    </h3>
                    
                    {post.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        {post.author && (
                          <span>
                            By {typeof post.author === 'string' ? post.author : post.author.name}
                          </span>
                        )}
                      </div>
                      <time>
                        {post.publishedAt?.toDate?.()?.toLocaleDateString() || 
                         post.createdAt?.toDate?.()?.toLocaleDateString() || 
                         'Unknown date'}
                      </time>
                    </div>

                    {/* Categories */}
                    {post.categories && post.categories.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {post.categories.slice(0, 2).map((category, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

      
      </div>
    </section>
  );
}
