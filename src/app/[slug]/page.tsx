import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/ui/Footer';
import SuggestedArticles from '@/components/ui/SuggestedArticles';
import SocialShare from '@/components/ui/SocialShare';
import NewsletterSection from '@/components/ui/NewsletterSection';
import SideBanner from '@/components/ui/SideBanner';
import { generatePostSEO, generateStructuredData } from '@/lib/seo';
import { Metadata } from 'next';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ProcessedImage } from '@/lib/imageProcessing';

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

// Helper function to get image URL from either format
function getImageUrl(image: ProcessedImage | { url: string; alt: string; width?: number; height?: number } | undefined): string {
  if (!image) return '';
  if ('original' in image) return image.original.url;
  return image.url;
}

// Server-side function to fetch post data from Firebase
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

    // Fallback to posts collection
    const postsRef = collection(db, 'posts');
    const postsQuery = query(
      postsRef,
      where('slug', '==', slug),
      where('status', '==', 'published'),
      limit(1)
    );
    
    const postsSnapshot = await getDocs(postsQuery);
    if (!postsSnapshot.empty) {
      const postDoc = postsSnapshot.docs[0];
      return {
        id: postDoc.id,
        ...postDoc.data()
      } as BlogPost;
    }

    return null;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

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

      <Navigation showBackButton={true} />

      {/* Blog Post Content with Side Banners */}
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        <div className="relative flex gap-8">
          {/* Left Banner - Only visible on large screens */}
          <div className="hidden xl:block xl:flex-shrink-0">
            <div className="sticky top-24">
              <SideBanner
                title="iBUILD 2025"
                description="The Builder's Evolution - Join Africa's premier tech builders conference"
                imageUrl="/The Builders' Evolution.jpg"
                linkUrl="https://ibuild.techblit.com"
                linkText="Learn More"
                position="left"
                size="medium"
              />
            </div>
          </div>

          {/* Article Content */}
          <article className="flex-1 max-w-4xl mx-auto">
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
          {post.featuredImage && (
            <div className="mb-6">
              <img
                src={getImageUrl(post.featuredImage)}
                alt={'alt' in post.featuredImage ? post.featuredImage.alt : post.title}
                className="w-full h-64 object-cover rounded-lg"
                width={'original' in post.featuredImage ? post.featuredImage.original.width : post.featuredImage.width || 800}
                height={'original' in post.featuredImage ? post.featuredImage.original.height : post.featuredImage.height || 400}
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

        <div className="bg-white rounded-lg shadow-sm p-8">
          {post.contentHtml ? (
            <div 
              className="prose prose-lg max-w-none text-gray-900"
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />
          ) : (
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {post.content}
            </div>
          )}
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

          {/* Right Banner - Only visible on large screens */}
          <div className="hidden xl:block xl:flex-shrink-0">
            <div className="sticky top-24">
              <SideBanner
                title="iBUILD 2025"
                description="Register now for The Builder's Evolution conference"
                imageUrl="/The Builders' Evolution.jpg"
                linkUrl="https://ibuild.techblit.com"
                linkText="Register"
                position="right"
                size="medium"
              />
            </div>
          </div>
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