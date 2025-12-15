'use client';

import { useState, useEffect } from 'react';
import apiService from '@/lib/apiService';
import Navigation from './ui/Navigation';
import Footer from './ui/Footer';
import Hero from './ui/Hero';
import BlogCard from './ui/BlogCard';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  contentHtml?: string;
  createdAt: any;
  author?: string | { uid: string; name: string };
  excerpt?: string;
  category?: string;
  readTime?: string;
  status?: string;
  publishedAt?: any;
}

export default function BlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsData = await apiService.getPosts({ limit: 20 });
        // Map Post to BlogPost format
        const mappedPosts: BlogPost[] = postsData.map((post) => ({
          id: post.id || post.slug,
          title: post.title,
          slug: post.slug,
          content: post.contentHtml || '',
          contentHtml: post.contentHtml,
          createdAt: post.publishedAt || post.updatedAt,
          author: post.author,
          excerpt: post.excerpt,
          category: post.category,
          status: post.status,
          publishedAt: post.publishedAt,
        }));
        setPosts(mappedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Hero />
      
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div id="latest-posts">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white rounded-lg shadow-sm p-12 max-w-2xl mx-auto">
                <div className="text-6xl mb-6">📝</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">No Posts Yet</h2>
                <p className="text-lg text-gray-600 mb-6">
                  We're working on bringing you amazing content. Check back soon for the latest tech insights!
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>For developers:</strong> Make sure your Firebase project is configured and you have some posts in the 'posts' collection.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest Articles</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Discover the latest insights, tutorials, and trends in technology
                </p>
              </div>
              
              {/* Featured Post */}
              {posts.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Featured</h3>
                  <div className="mb-8">
                    <BlogCard key={`${posts[0].id}-featured`} post={posts[0]} featured={true} />
                  </div>
                </div>
              )}
              
              {/* Other Posts */}
              {posts.length > 1 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">More Articles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.slice(1).map((post, index) => (
                      <BlogCard key={`${post.id}-${index}`} post={post} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
