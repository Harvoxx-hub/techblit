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
        
        // Map Post to BlogPost format
        const mappedPosts: BlogPost[] = postsData.map((post) => {
          // Extract featured image URL
          let featuredImage: { url: string; alt: string } | undefined;
          if (post.featuredImage) {
            if ('url' in post.featuredImage && typeof post.featuredImage.url === 'string') {
              featuredImage = {
                url: post.featuredImage.url,
                alt: ('alt' in post.featuredImage ? post.featuredImage.alt : post.title) || post.title
              };
            } else if ('original' in post.featuredImage && post.featuredImage.original?.url) {
              featuredImage = {
                url: post.featuredImage.original.url,
                alt: post.title
              };
            }
          }
          
          return {
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
            featuredImage,
          };
        });
        
        setPosts(mappedPosts);
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
        if (postData) {
          // Map Post to BlogPost format
          let featuredImage: { url: string; alt: string } | undefined;
          if (postData.featuredImage) {
            if ('url' in postData.featuredImage && typeof postData.featuredImage.url === 'string') {
              featuredImage = {
                url: postData.featuredImage.url,
                alt: ('alt' in postData.featuredImage ? postData.featuredImage.alt : postData.title) || postData.title
              };
            } else if ('original' in postData.featuredImage && postData.featuredImage.original?.url) {
              featuredImage = {
                url: postData.featuredImage.original.url,
                alt: postData.title
              };
            }
          }
          
          const mappedPost: BlogPost = {
            id: postData.id || postData.slug,
            title: postData.title,
            slug: postData.slug,
            content: postData.contentHtml || '',
            contentHtml: postData.contentHtml,
            createdAt: postData.publishedAt || postData.updatedAt,
            author: postData.author,
            excerpt: postData.excerpt,
            category: postData.category,
            status: postData.status,
            publishedAt: postData.publishedAt,
            featuredImage,
          };
          setPost(mappedPost);
        } else {
          setPost(null);
        }
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
