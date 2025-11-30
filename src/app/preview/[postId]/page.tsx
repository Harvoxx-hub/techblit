'use client';

import { Suspense, useState, useEffect } from 'react';
import { notFound, useParams, useSearchParams } from 'next/navigation';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/ui/Footer';
import Link from 'next/link';
import { ProcessedImage } from '@/lib/imageProcessing';
import { sanitizeWordPressUrls } from '@/lib/imageUrlUtils';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  contentHtml?: string;
  createdAt: any;
  author?: string | { uid: string; name: string };
  excerpt?: string;
  status?: string;
  publishedAt?: any;
  featuredImage?: ProcessedImage | {
    url: string;
    alt: string;
  };
  categories?: string[];
  tags?: string[];
  isPreview?: boolean;
  tokenExpiresAt?: any;
}

async function getPostData(postId: string, token?: string) {
  try {
    const url = new URL('/api/preview', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
    url.searchParams.set('postId', postId);
    if (token) {
      url.searchParams.set('token', token);
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh data for previews
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch post');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching post data:', error);
    return null;
  }
}

function PreviewBanner({ isPreview, expiresAt }: { isPreview: boolean; expiresAt?: any }) {
  if (!isPreview) return null;
  
  const expiresDate = expiresAt ? new Date(expiresAt.seconds * 1000) : null;
  
  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">
            This is a preview of unpublished content
          </p>
          {expiresDate && (
            <p className="text-xs mt-1">
              Preview expires: {expiresDate.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation showBackButton={true} />
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default function PreviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const postId = params.postId as string;
  const token = searchParams.get('token');
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postData = await getPostData(postId, token || undefined);
        if (!postData) {
          setError(true);
        } else {
          setPost(postData);
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId, token]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !post) {
    notFound();
  }
  
  const getAuthorName = () => {
    if (!post.author) return 'Unknown Author';
    return typeof post.author === 'string' ? post.author : post.author.name;
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx global>{`
        .preview-content {
          color: #000000 !important;
        }
        .preview-content h1 {
          color: #000000 !important;
          font-size: 2rem !important;
          font-weight: 700 !important;
          margin-top: 1.5rem !important;
          margin-bottom: 1rem !important;
          line-height: 1.2 !important;
        }
        .preview-content h2 {
          color: #000000 !important;
          font-size: 1.5rem !important;
          font-weight: 600 !important;
          margin-top: 1.25rem !important;
          margin-bottom: 0.75rem !important;
          line-height: 1.3 !important;
        }
        .preview-content h3 {
          color: #000000 !important;
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          margin-top: 1rem !important;
          margin-bottom: 0.5rem !important;
          line-height: 1.4 !important;
        }
        .preview-content h4 {
          color: #000000 !important;
          font-size: 1.125rem !important;
          font-weight: 600 !important;
          margin-top: 0.875rem !important;
          margin-bottom: 0.5rem !important;
          line-height: 1.4 !important;
        }
        .preview-content h5 {
          color: #000000 !important;
          font-size: 1rem !important;
          font-weight: 600 !important;
          margin-top: 0.75rem !important;
          margin-bottom: 0.5rem !important;
          line-height: 1.5 !important;
        }
        .preview-content h6 {
          color: #000000 !important;
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          margin-top: 0.75rem !important;
          margin-bottom: 0.5rem !important;
          line-height: 1.5 !important;
        }
        .preview-content p {
          color: #000000 !important;
          margin-top: 1.25rem !important;
          margin-bottom: 1.25rem !important;
          line-height: 1.75 !important;
        }
        .preview-content li {
          color: #000000 !important;
        }
        .preview-content strong {
          color: #000000 !important;
        }
        .preview-content em {
          color: #000000 !important;
        }
        .preview-content blockquote {
          color: #000000 !important;
        }
        .preview-content code {
          color: #000000 !important;
        }
        .preview-content td,
        .preview-content th {
          color: #000000 !important;
        }
      `}</style>
      <Navigation showBackButton={true} />
      
      {/* Preview Banner */}
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <PreviewBanner 
          isPreview={post.isPreview || false} 
          expiresAt={post.tokenExpiresAt} 
        />
      </div>

      {/* Blog Post Content */}
      <article className="max-w-4xl mx-auto px-6 pb-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {post.title || 'Untitled Post'}
          </h1>
          
          <div className="flex items-center text-sm text-gray-500 space-x-4 mb-6">
            <span>By {getAuthorName()}</span>
            <time>
              {post.createdAt?.toDate?.()?.toLocaleDateString() || 
               post.publishedAt?.toDate?.()?.toLocaleDateString() || 
               'Unknown date'}
            </time>
            {post.status && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {post.status}
              </span>
            )}
          </div>
          
          {/* Featured Image */}
          {post.featuredImage && (
            <div className="mb-6">
              <img
                src={'original' in post.featuredImage ? post.featuredImage.original.url : post.featuredImage.url}
                alt={'alt' in post.featuredImage ? post.featuredImage.alt : post.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}
          
          {/* Excerpt */}
          {post.excerpt && (
            <div className="text-lg text-gray-600 mb-6">
              {post.excerpt}
            </div>
          )}
        </header>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div className="bg-white rounded-lg shadow-sm p-8">
            {post.contentHtml ? (
              <div 
                className="prose prose-lg max-w-none preview-content"
                style={{ color: '#000000 !important' }}
                dangerouslySetInnerHTML={{ __html: sanitizeWordPressUrls(post.contentHtml) }}
              />
            ) : (
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {sanitizeWordPressUrls(post.content || 'No content available.')}
              </div>
            )}
          </div>
        </div>

        {/* Tags and Categories */}
        {(post.tags?.length && post.tags.length > 0) || (post.categories?.length && post.categories.length > 0) ? (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-wrap gap-4">
              {post.categories?.length && post.categories.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Categories:</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.categories.map((category: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {post.tags?.length && post.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Tags:</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Back to Admin */}
        <div className="mt-12 text-center">
          <Link 
            href="/admin/posts" 
            className="inline-block bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
          >
            ← Back to Posts
          </Link>
        </div>
      </article>
      
      <Footer />
    </div>
  );
}
