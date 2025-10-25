import { Metadata } from 'next';

// Default SEO configuration for the site
export const defaultSEO = {
  title: 'TechBlit - Your Tech Blog',
  description: 'A modern tech blog built with Next.js and Firebase',
  canonical: 'https://techblit.com',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://techblit.com',
    siteName: 'TechBlit',
    title: 'TechBlit - Your Tech Blog',
    description: 'A modern tech blog built with Next.js and Firebase',
    images: [
      {
        url: 'https://techblit.com/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'TechBlit',
      },
    ],
  },
  twitter: {
    handle: '@techblit',
    site: '@techblit',
    cardType: 'summary_large_image',
  },
};

// Blog post interface for SEO
interface BlogPostSEO {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonical?: string;
  tags?: string[];
  category?: string;
  author?: string | { uid: string; name: string };
  publishedAt?: Date;
  featuredImage?: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
  };
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

// Generate dynamic SEO metadata for blog posts
export function generatePostSEO(post: BlogPostSEO): Metadata {
  const siteUrl = 'https://techblit.com';
  const postUrl = `${siteUrl}/${post.slug}`;
  
  // Use custom meta title/description or fallback to post title/excerpt
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || 'Read this article on TechBlit';
  
  // Use custom social media titles/descriptions or fallback to main ones
  const ogTitle = post.social?.ogTitle || title;
  const ogDescription = post.social?.ogDescription || description;
  
  // Determine Open Graph image
  const ogImage = post.featuredImage?.url || `${siteUrl}/og-image.svg`;
  const ogImageAlt = post.featuredImage?.alt || post.title;
  
  // Build keywords from tags and category
  const keywords = [
    'tech blog',
    'technology',
    'programming',
    'web development',
    'Next.js',
    'React',
    ...(post.tags || []),
    ...(post.category ? [post.category] : [])
  ].filter(Boolean);

  // Helper function to get author name
  const getAuthorName = (author: string | { uid: string; name: string } | undefined): string => {
    if (!author) return 'TechBlit Team';
    if (typeof author === 'string') return author;
    return author.name;
  };

  const authorName = getAuthorName(post.author);

  const metadata: Metadata = {
    title: title,
    description: description,
    keywords: keywords,
    authors: [{ name: authorName }],
    creator: 'TechBlit',
    publisher: 'TechBlit',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: post.canonical || postUrl,
    },
    openGraph: {
      type: 'article',
      locale: 'en_US',
      url: postUrl,
      siteName: 'TechBlit',
      title: ogTitle,
      description: ogDescription,
      images: [
        {
          url: ogImage,
          width: post.featuredImage?.width || 1200,
          height: post.featuredImage?.height || 630,
          alt: ogImageAlt,
        },
      ],
      publishedTime: post.publishedAt?.toISOString(),
      authors: [authorName],
      section: post.category,
      tags: post.tags,
    },
    twitter: {
      card: post.social?.twitterCard || 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
      creator: '@techblit',
      site: '@techblit',
    },
    robots: {
      index: !post.seo?.noindex,
      follow: !post.seo?.nofollow,
      googleBot: {
        index: !post.seo?.noindex,
        follow: !post.seo?.nofollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'article:author': authorName,
      'article:section': post.category || 'Technology',
      'article:tag': post.tags?.join(', ') || '',
    },
  };

  return metadata;
}

// Generate category page SEO
export function generateCategorySEO(category: string, description?: string): Metadata {
  const siteUrl = 'https://techblit.com';
  const categoryUrl = `${siteUrl}/category/${category}`;
  const title = `${category} Articles - TechBlit`;
  const desc = description || `Latest ${category} articles and insights on TechBlit`;

  return {
    title: title,
    description: desc,
    keywords: ['tech blog', 'technology', category.toLowerCase(), 'articles', 'insights'],
    authors: [{ name: 'TechBlit Team' }],
    creator: 'TechBlit',
    publisher: 'TechBlit',
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: categoryUrl,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: categoryUrl,
      siteName: 'TechBlit',
      title: title,
      description: desc,
      images: [
        {
          url: `${siteUrl}/og-image.svg`,
          width: 1200,
          height: 630,
          alt: `${category} Articles - TechBlit`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: desc,
      images: [`${siteUrl}/og-image.svg`],
      creator: '@techblit',
      site: '@techblit',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

// Utility function to extract text content from HTML for meta descriptions
export function extractTextFromHTML(html: string, maxLength: number = 160): string {
  // Remove HTML tags and get plain text
  const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  
  // Truncate if too long
  if (text.length <= maxLength) {
    return text;
  }
  
  // Find the last complete word within the limit
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

// Generate structured data for blog posts (JSON-LD)
export function generateStructuredData(post: BlogPostSEO) {
  const siteUrl = 'https://techblit.com';
  const postUrl = `${siteUrl}/${post.slug}`;
  
  // Helper function to get author name
  const getAuthorName = (author: string | { uid: string; name: string } | undefined): string => {
    if (!author) return 'TechBlit Team';
    if (typeof author === 'string') return author;
    return author.name;
  };

  const authorName = getAuthorName(post.author);
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    image: post.featuredImage?.url || `${siteUrl}/og-image.svg`,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'TechBlit',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.publishedAt?.toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    url: postUrl,
    keywords: post.tags?.join(', ') || post.category || 'technology',
    articleSection: post.category || 'Technology',
    wordCount: post.excerpt?.split(' ').length || 0,
  };
}
