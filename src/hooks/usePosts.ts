import { useState, useEffect } from 'react';
import apiService from '@/lib/apiService';

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
  featuredImage?: {
    url: string;
    alt: string;
  };
}

interface UsePostsOptions {
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Hook for fetching blog posts from posts collection
 */
export function usePosts(options: UsePostsOptions = {}) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const postsData = await apiService.getPosts({
          limit: options.limit
        });
        
        setPosts(postsData as BlogPost[]);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [options.orderBy, options.orderDirection, options.limit]);

  return { posts, loading, error };
}

/**
 * Hook for fetching a single blog post by slug
 */
export function usePost(slug: string) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const postData = await apiService.getPostBySlug(slug);
        setPost(postData as BlogPost);
      } catch (error) {
        console.error('Error fetching post:', error);
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  return { post, loading, error };
}
