import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/ui/Footer';
import BlogCard from '@/components/ui/BlogCard';
import { slugToAuthorName } from '@/lib/authorUtils';
import AuthorHero from '@/components/authors/AuthorHero';
import AuthorArticlesList from '@/components/authors/AuthorArticlesList';

interface AuthorPageProps {
  params: Promise<{
    name: string;
  }>;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  contentHtml?: string;
  excerpt: string;
  author: {
    uid: string;
    name: string;
  };
  category?: string;
  createdAt: any;
  publishedAt: any;
  featuredImage?: {
    url?: string;
    original?: { url: string };
  };
  readTime?: string;
  status?: string;
}

interface AuthorStats {
  name?: string;
  totalArticles?: number;
  totalViews?: number;
  categories?: string[];
  firstPublished?: string;
  lastPublished?: string;
}

// Calculate author statistics from their articles
function calculateAuthorStats(articles: BlogPost[], authorName: string): AuthorStats {
  if (articles.length === 0) {
    return {};
  }

  // Get unique categories
  const categories = Array.from(new Set(
    articles
      .map(post => post.category)
      .filter((cat): cat is string => !!cat)
  ));

  // Helper to safely parse dates
  const parseDate = (post: BlogPost): Date | null => {
    try {
      if (post.publishedAt?.toDate && typeof post.publishedAt.toDate === 'function') {
        return post.publishedAt.toDate();
      }
      if (post.publishedAt && typeof post.publishedAt === 'object' && '_seconds' in post.publishedAt) {
        return new Date((post.publishedAt as any)._seconds * 1000);
      }
      if (post.publishedAt) {
        const date = new Date(post.publishedAt);
        return isNaN(date.getTime()) ? null : date;
      }
      if (post.createdAt) {
        const date = new Date(post.createdAt);
        return isNaN(date.getTime()) ? null : date;
      }
      return null;
    } catch {
      return null;
    }
  };

  const sortedByDate = [...articles]
    .map(post => ({ post, date: parseDate(post) }))
    .filter(({ date }) => date !== null)
    .sort((a, b) => a.date!.getTime() - b.date!.getTime());

  if (sortedByDate.length === 0) {
    return {
      name: authorName,
      totalArticles: articles.length,
      categories,
    };
  }

  return {
    name: authorName,
    totalArticles: articles.length,
    categories,
    firstPublished: sortedByDate[0]?.date?.toISOString(),
    lastPublished: sortedByDate[sortedByDate.length - 1]?.date?.toISOString(),
  };
}

// Fetch author's articles using dedicated author endpoint
async function getAuthorArticles(authorName: string): Promise<BlogPost[]> {
  try {
    const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL ||
                          'https://techblit-cloud-function-production.up.railway.app';

    const response = await fetch(
      `${FUNCTIONS_URL}/api/v1/authors/${encodeURIComponent(authorName)}/posts`,
      {
        next: { revalidate: 3600 }
      }
    );

    if (response.ok) {
      const result = await response.json();
      return result.data || [];
    }

    if (response.status === 404) {
      console.warn('Author endpoint not deployed yet, falling back to client-side filtering');
      const fallbackResponse = await fetch(
        `${FUNCTIONS_URL}/getPosts`,
        { next: { revalidate: 3600 } }
      );

      if (!fallbackResponse.ok) {
        throw new Error(`Failed to fetch posts: ${fallbackResponse.status}`);
      }

      const result = await fallbackResponse.json();
      const posts = result.posts || [];

      return posts.filter((post: BlogPost) => {
        const postAuthorName = typeof post.author === 'string'
          ? post.author
          : post.author?.name || '';
        return postAuthorName.toLowerCase() === authorName.toLowerCase();
      });
    }

    throw new Error(`Failed to fetch author posts: ${response.status}`);
  } catch (error) {
    console.error('Error fetching author articles:', error);
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const authorName = slugToAuthorName(resolvedParams.name);
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
  const authorName = slugToAuthorName(resolvedParams.name);

  const articles = await getAuthorArticles(authorName);
  const stats = calculateAuthorStats(articles, authorName);

  if (articles.length === 0) {
    notFound();
  }

  const authorBio = `${authorName} is a contributor at TechBlit, covering technology, startups, and innovation stories across Africa.`;
  const avatarLetter = authorName.charAt(0).toUpperCase();

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
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navigation />

      {/* Hero Section */}
      <AuthorHero
        authorName={authorName}
        authorBio={authorBio}
        avatarLetter={avatarLetter}
        stats={stats}
        articleCount={articles.length}
      />

      {/* Articles Section */}
      <section className="py-20 md:py-28 relative">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-40 h-40 bg-orange-500/5 dark:bg-orange-400/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-20 w-60 h-60 bg-teal-500/5 dark:bg-teal-400/5 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Published Works
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-20 h-1 bg-gradient-to-r from-orange-500 to-amber-500"></div>
              <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
                {articles.length} article{articles.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <AuthorArticlesList articles={articles} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700"></div>

        {/* Geometric decorations */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 border-8 border-white rounded-full -translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 border-8 border-white rotate-45 translate-x-48 translate-y-48"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
            <span className="text-sm font-bold tracking-widest uppercase text-white">
              Join The Team
            </span>
          </div>

          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            Want to Write<br />for TechBlit?
          </h2>

          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto">
            Join {authorName} and our community of writers documenting Africa's tech revolution.
          </p>

          <Link
            href="/writers"
            className="group inline-flex items-center gap-3 bg-white text-purple-900 px-10 py-5 rounded-full font-black text-lg hover:bg-amber-400 hover:text-black transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
          >
            <span>Become a Contributor</span>
            <svg
              className="w-6 h-6 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
