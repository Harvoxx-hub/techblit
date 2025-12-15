import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

        // Fetch from posts collection
        const postsRef = collection(db, 'posts');
        let postsQuery = query(
          postsRef,
          where('status', '==', 'published')
        );
        
        // Apply ordering
        if (options.orderBy) {
          postsQuery = query(
            postsRef,
            where('status', '==', 'published'),
            orderBy(options.orderBy, options.orderDirection || 'desc')
          );
        }
        
        // Apply limit
        if (options.limit) {
          postsQuery = query(postsQuery, limit(options.limit));
        }
        
        const postsSnapshot = await getDocs(postsQuery);
        const postsData = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BlogPost[];
        
        setPosts(postsData);
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

        // Fetch from posts collection
        const postsRef = collection(db, 'posts');
        const postQuery = query(
          postsRef, 
          where('slug', '==', slug),
          where('status', '==', 'published'),
          limit(1)
        );
        
        const querySnapshot = await getDocs(postQuery);
        
        if (querySnapshot.empty) {
          setError('Post not found or not published');
          return;
        }

        const postDoc = querySnapshot.docs[0];
        setPost({
          id: postDoc.id,
          ...postDoc.data()
        } as BlogPost);
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
