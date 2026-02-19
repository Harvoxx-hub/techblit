import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/ui/Footer';
import SuggestedArticles from '@/components/ui/SuggestedArticles';
import SocialShare from '@/components/ui/SocialShare';
import NewsletterSection from '@/components/ui/NewsletterSection';
import { generatePostSEO, generateStructuredData } from '@/lib/seo';
import { getAuthorUrl } from '@/lib/authorUtils';
import { formatDateShort } from '@/lib/dateUtils';
import { Metadata } from 'next';
// Note: This is a server component, so we'll use direct API calls
// For server-side, we can call the API directly
import { ProcessedImage } from '@/lib/imageProcessing';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  contentHtml?: string;
  createdAt: any;
  updatedAt?: any;
  author?: string | { uid: string; name: string };
  excerpt?: string;
  status?: string;
  publishedAt?: any;
  featuredImage?: ProcessedImage | {
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

import { getCrawlableImageUrl, sanitizeWordPressUrls } from '@/lib/imageUrlUtils';
import { getImageUrlFromData } from '@/lib/imageHelpers';
import { getPostsApiUrl } from '@/lib/apiConfig';
import { renderContent } from '@/lib/markdown';

// Helper function to get image URL from either format
// Prioritizes Cloudinary public_id over legacy URLs for migrated images
function getImageUrl(image: ProcessedImage | { url: string; alt: string; width?: number; height?: number; public_id?: string; image_id?: string } | undefined): string {
  if (!image) return '';
  
  // Use getImageUrlFromData which prioritizes public_id/image_id over legacy URLs
  const cloudinaryUrl = getImageUrlFromData(image, { preset: 'cover' });
  if (cloudinaryUrl) {
    return cloudinaryUrl;
  }
  
  // Fallback to legacy URL extraction (for unmigrated posts)
  let url = '';
  if ('original' in image) {
    url = image.original.url;
  } else {
    url = image.url;
  }
  
  // Convert to crawlable URL (removes tokens, converts to public URLs)
  return getCrawlableImageUrl(url) || '';
}

// Server-side function to fetch post data from API
async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const API_BASE = getPostsApiUrl();
    const response = await fetch(`${API_BASE}/posts/${slug}`, {
      next: { revalidate: 3600 } // Revalidate every hour (ISR)
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch post: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data || result as BlogPost;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

// Generate static params for SSG - fetch all published post slugs at build time
export async function generateStaticParams() {
  try {
    const API_BASE = getPostsApiUrl();
    const response = await fetch(`${API_BASE}/posts?limit=1000`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });
    
    if (!response.ok) {
      console.warn('Failed to fetch posts for static generation');
      return [];
    }
    
    const result = await response.json();
    const posts = result.data || result;
    
    return posts.map((post: any) => ({
      slug: post.slug || post.id
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Enable ISR (Incremental Static Regeneration) - revalidate every hour
export const revalidate = 3600;

// Generate metadata for the blog post
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  
  if (!post) {
    return {
      title: 'Post Not Found - TechBlit',
      description: 'The post you\'re looking for doesn\'t exist or has been removed.',
    };
  }

  return generatePostSEO(post);
}

// Main blog post page component
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  // Post not found: API returned 404 (no published post with this slug in Firestore).
  // Triggers the global 404 page (app/not-found.tsx) with proper 404 status.
  if (!post) {
    notFound();
  }

  // Generate structured data for SEO (returns array of schemas)
  const structuredDataSchemas = generateStructuredData(post);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Structured Data - Multiple schemas */}
      {structuredDataSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <Navigation showBackButton={true} />

      {/* Blog Post Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="relative flex flex-col xl:flex-row gap-4 xl:gap-8">
          {/* Article Content */}
          <article className="flex-1 max-w-4xl mx-auto w-full">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">{post.title}</h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-500 gap-2 sm:gap-4 mb-4 sm:mb-6">
            {post.author && (
              <span>
                By{' '}
                <Link
                  href={getAuthorUrl(typeof post.author === 'string' ? post.author : post.author.name)}
                  className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                >
                  {typeof post.author === 'string' ? post.author : post.author.name}
                </Link>
              </span>
            )}
            <time>
              {formatDateShort(post.publishedAt || post.createdAt)}
            </time>
          </div>
          
          {/* Featured Image */}
          {post.featuredImage && (
            <div className="mb-4 sm:mb-6 -mx-4 sm:mx-0">
              <img
                src={getImageUrl(post.featuredImage)}
                alt={
                  'alt' in post.featuredImage && post.featuredImage.alt 
                    ? post.featuredImage.alt 
                    : `${post.title} - TechBlit${post.categories?.[0] ? ` coverage of ${post.categories[0]}` : ''}`
                }
                className="w-full h-48 sm:h-64 md:h-80 object-cover rounded-lg sm:rounded-lg"
                width={'original' in post.featuredImage ? post.featuredImage.original.width : post.featuredImage.width || 800}
                height={'original' in post.featuredImage ? post.featuredImage.original.height : post.featuredImage.height || 400}
              />
            </div>
          )}
          
          {/* Excerpt */}
          {post.excerpt && (
            <div className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">
              {post.excerpt}
            </div>
          )}
        </header>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 md:p-8">
          <div
            className="prose prose-sm sm:prose-base md:prose-lg max-w-none text-gray-900 prose-img:max-w-full prose-img:rounded-lg prose-img:my-4 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700"
            dangerouslySetInnerHTML={{
              __html: sanitizeWordPressUrls(renderContent(post.content, post.contentHtml))
            }}
          />
        </div>

        {/* Social Share */}
        <div className="mt-8 sm:mt-12 mb-6 sm:mb-8">
          <SocialShare 
            url={`https://www.techblit.com/${post.slug}`}
            title={post.title}
            description={post.excerpt || ''}
          />
        </div>
          </article>
        </div>
      </div>

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