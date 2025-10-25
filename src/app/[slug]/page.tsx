import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/ui/Footer';
import SuggestedArticles from '@/components/ui/SuggestedArticles';
import SocialShare from '@/components/ui/SocialShare';
import NewsletterSection from '@/components/ui/NewsletterSection';
import { generatePostSEO, generateStructuredData } from '@/lib/seo';
import { Metadata } from 'next';

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
  featuredImage?: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
  };
  categories?: string[];
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  canonical?: string;
  social?: {
    ogTitle?: string;
    ogDescription?: string;
    twitterCard?: 'summary' | 'summary_large_image';
  };
  seo?: {
    noindex?: boolean;
    nofollow?: boolean;
  };
}

// Server-side function to fetch post data
async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    if (!db) {
      console.error('Firebase not initialized');
      return null;
    }

    // Try to fetch from publicPosts collection first (optimized)
    const publicPostsRef = collection(db, 'publicPosts');
    const publicPostsQuery = query(
      publicPostsRef,
      where('slug', '==', slug),
      limit(1)
    );
    
    try {
      const publicPostsSnapshot = await getDocs(publicPostsQuery);
      if (!publicPostsSnapshot.empty) {
        const postDoc = publicPostsSnapshot.docs[0];
        return {
          id: postDoc.id,
          ...postDoc.data()
        } as BlogPost;
      }
    } catch (publicPostsError) {
      console.warn('Failed to fetch from publicPosts, falling back to posts collection:', publicPostsError);
    }

    // Fallback to posts collection if publicPosts fails or is empty
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef, 
      where('slug', '==', slug),
      where('status', '==', 'published'),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const postDoc = querySnapshot.docs[0];
    return {
      id: postDoc.id,
      ...postDoc.data()
    } as BlogPost;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

// Generate metadata for the blog post
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);
  
  if (!post) {
    return {
      title: 'Post Not Found - TechBlit',
      description: 'The post you\'re looking for doesn\'t exist or has been removed.',
    };
  }

  return generatePostSEO(post);
}

// Main blog post page component
export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation showBackButton={true} />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
            <p className="text-gray-600 mb-6">The post you're looking for doesn't exist or has been removed.</p>
            <Link 
              href="/" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Generate structured data for SEO
  const structuredData = generateStructuredData(post);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <style jsx global>{`
        .preview-content {
          color: #000000 !important;
        }
        .preview-content h1 {
          color: #000000 !important;
          font-size: 2rem !important;
          font-weight: 700 !important;
          margin: 1.5rem 0 1rem 0 !important;
          line-height: 1.2 !important;
        }
        .preview-content h2 {
          color: #000000 !important;
          font-size: 1.5rem !important;
          font-weight: 600 !important;
          margin: 1.25rem 0 0.75rem 0 !important;
          line-height: 1.3 !important;
        }
        .preview-content h3 {
          color: #000000 !important;
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          margin: 1rem 0 0.5rem 0 !important;
          line-height: 1.4 !important;
        }
        .preview-content h4 {
          color: #000000 !important;
          font-size: 1.125rem !important;
          font-weight: 600 !important;
          margin: 0.875rem 0 0.5rem 0 !important;
          line-height: 1.4 !important;
        }
        .preview-content h5 {
          color: #000000 !important;
          font-size: 1rem !important;
          font-weight: 600 !important;
          margin: 0.75rem 0 0.5rem 0 !important;
          line-height: 1.5 !important;
        }
        .preview-content h6 {
          color: #000000 !important;
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          margin: 0.75rem 0 0.5rem 0 !important;
          line-height: 1.5 !important;
        }
        .preview-content p {
          color: #000000 !important;
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

      {/* Blog Post Content */}
      <article className="max-w-4xl mx-auto px-6 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
          
          <div className="flex items-center text-sm text-gray-500 space-x-4 mb-6">
            {post.author && (
              <span>By {typeof post.author === 'string' ? post.author : post.author.name}</span>
            )}
            <time>
              {post.publishedAt?.toDate?.()?.toLocaleDateString() || 
               post.createdAt?.toDate?.()?.toLocaleDateString() || 
               'Unknown date'}
            </time>
          </div>
          
          {/* Featured Image */}
          {post.featuredImage?.url && (
            <div className="mb-6">
              <img
                src={post.featuredImage.url}
                alt={post.featuredImage.alt || post.title}
                className="w-full h-64 object-cover rounded-lg"
                width={post.featuredImage.width || 800}
                height={post.featuredImage.height || 400}
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

        <div className="prose prose-lg max-w-none">
          <div className="bg-white rounded-lg shadow-sm p-8">
            {post.contentHtml ? (
              <div 
                className="prose prose-lg max-w-none preview-content"
                style={{ color: '#000000 !important' }}
                dangerouslySetInnerHTML={{ __html: post.contentHtml }}
              />
            ) : (
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {post.content}
              </div>
            )}
          </div>
        </div>

        {/* Social Share */}
        <div className="mt-12 mb-8">
          <SocialShare 
            url={`https://techblit.com/${post.slug}`}
            title={post.title}
            description={post.excerpt || ''}
          />
        </div>
      </article>

      {/* Suggested Articles */}
      <SuggestedArticles 
        currentPostId={post.id}
        currentPostCategories={post.categories}
        currentPostTags={post.tags}
        className="bg-gray-50"
      />

      {/* Newsletter Section */}
      <NewsletterSection className="bg-white" />
      
      <Footer />
    </div>
  );
}