import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/ui/Footer';
import BlogCard from '@/components/ui/BlogCard';
import apiService from '@/lib/apiService';

interface AuthorPageProps {
  params: Promise<{
    name: string;
  }>;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: {
    uid: string;
    name: string;
  };
  category?: string;
  publishedAt: any;
  featuredImage?: {
    url?: string;
    original?: { url: string };
  };
}

// Helper to decode URL-encoded author name
function decodeAuthorName(encodedName: string): string {
  return decodeURIComponent(encodedName.replace(/\+/g, ' '));
}

// Helper to encode author name for URLs
export function encodeAuthorName(name: string): string {
  return encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'));
}

// Fetch author's articles
async function getAuthorArticles(authorName: string): Promise<BlogPost[]> {
  try {
    const response = await apiService.getPosts({ limit: 1000 });
    const allPosts = response.data || [];

    // Filter posts by author name (case-insensitive)
    const authorPosts = allPosts.filter((post: BlogPost) =>
      post.author?.name?.toLowerCase() === authorName.toLowerCase()
    );

    // Sort by published date (newest first)
    return authorPosts.sort((a: BlogPost, b: BlogPost) => {
      const dateA = a.publishedAt?.seconds || a.publishedAt?.toDate?.() || new Date(a.publishedAt);
      const dateB = b.publishedAt?.seconds || b.publishedAt?.toDate?.() || new Date(b.publishedAt);
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  } catch (error) {
    console.error('Error fetching author articles:', error);
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const authorName = decodeAuthorName(resolvedParams.name);
  const articles = await getAuthorArticles(authorName);

  if (articles.length === 0) {
    return {
      title: 'Author Not Found | TechBlit',
      description: 'This author profile could not be found.',
    };
  }

  const articleCount = articles.length;

  return {
    title: `${authorName} - TechBlit Author`,
    description: `Read all ${articleCount} article${articleCount !== 1 ? 's' : ''} written by ${authorName} on TechBlit. Covering tech news, startups, and innovation in Africa.`,
    keywords: [authorName, 'TechBlit author', 'tech writer', 'African tech', 'startup news'],
    openGraph: {
      title: `${authorName} - TechBlit Author`,
      description: `${articleCount} article${articleCount !== 1 ? 's' : ''} written by ${authorName}`,
      type: 'profile',
      url: `https://techblit.com/authors/${resolvedParams.name}`,
    },
    alternates: {
      canonical: `https://techblit.com/authors/${resolvedParams.name}`,
    },
  };
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const resolvedParams = await params;
  const authorName = decodeAuthorName(resolvedParams.name);
  const articles = await getAuthorArticles(authorName);

  // If author has no articles, show 404
  if (articles.length === 0) {
    notFound();
  }

  // Generate author bio (you can make this dynamic by storing bios in database)
  const authorBio = `${authorName} is a contributor at TechBlit, covering technology, startups, and innovation stories across Africa.`;

  // Get first letter for avatar fallback
  const avatarLetter = authorName.charAt(0).toUpperCase();

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: authorName,
      description: authorBio,
      url: `https://techblit.com/authors/${resolvedParams.name}`,
      worksFor: {
        '@type': 'Organization',
        name: 'TechBlit',
        url: 'https://techblit.com',
      },
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navigation />

      {/* Author Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Author Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
                <span className="text-6xl md:text-7xl font-bold text-white">
                  {avatarLetter}
                </span>
              </div>
            </div>

            {/* Author Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {authorName}
              </h1>
              <p className="text-xl text-blue-100 mb-6">
                {authorBio}
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/30">
                  <span className="font-bold text-2xl">{articles.length}</span>
                  <span className="ml-2 text-blue-100">Article{articles.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Articles by Author */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Articles by {authorName}
          </h2>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((post) => (
              <BlogCard
                key={post.id}
                title={post.title}
                excerpt={post.excerpt}
                slug={post.slug}
                author={post.author.name}
                date={post.publishedAt}
                category={post.category}
                imageUrl={post.featuredImage?.url || post.featuredImage?.original?.url}
              />
            ))}
          </div>

          {/* No articles message (shouldn't happen due to notFound check) */}
          {articles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 dark:text-gray-400">
                No articles found by this author.
              </p>
              <Link
                href="/blog"
                className="inline-block mt-6 text-blue-600 dark:text-blue-400 hover:underline"
              >
                Browse all articles →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 dark:bg-gray-800 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Want to Write for TechBlit?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Join our community of writers and contributors documenting Africa's tech ecosystem.
          </p>
          <Link
            href="/writers"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-700 text-white px-8 py-4 rounded-lg font-bold text-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          >
            Become a Contributor
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
