import { Metadata } from 'next';
import { ProcessedImage } from './imageProcessing';

// Helper function to convert Firestore timestamps to ISO strings
function getISODateString(date: Date | { toDate: () => Date } | undefined): string | undefined {
  if (!date) return undefined;
  if (typeof date === 'object' && 'toDate' in date) {
    return date.toDate().toISOString();
  }
  if (date instanceof Date) {
    return date.toISOString();
  }
  return undefined;
}
export const defaultSEO = {
  title: "TechBlit - Igniting Africa's Tech Conversation",
  description: 'Discover the latest tech news, startup insights, funding rounds, and innovation stories from across Africa. Your destination for African tech ecosystem coverage.',
  canonical: 'https://techblit.com',
  keywords: ['African tech', 'startups', 'technology news', 'innovation', 'funding', 'FinTech', 'AI', 'Nigeria tech', 'African technology', 'tech ecosystem'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://techblit.com',
    siteName: 'TechBlit',
    title: "TechBlit - Igniting Africa's Tech Conversation",
    description: 'Discover the latest tech news, startup insights, funding rounds, and innovation stories from across Africa.',
    images: [
      {
        url: 'https://techblit.com/og-image.svg',
        width: 1200,
        height: 630,
        alt: "TechBlit - Igniting Africa's Tech Conversation",
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
  publishedAt?: Date | { toDate: () => Date };
  updatedAt?: Date | { toDate: () => Date };
  featuredImage?: ProcessedImage | {
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

// Helper functions to check image format
const isProcessedImage = (image: any): image is ProcessedImage => {
  return image && typeof image === 'object' && 'original' in image && 'thumbnail' in image && 'ogImage' in image;
};

const isLegacyImage = (image: any): image is { url: string; alt: string; width?: number; height?: number } => {
  return image && typeof image === 'object' && 'url' in image && 'alt' in image;
};

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
  
  // Determine Open Graph image - prefer OG optimized version if available
  let ogImage = `${siteUrl}/og-image.svg`;
  let ogImageAlt = post.title;
  
  if (post.featuredImage) {
    // Check if it's a ProcessedImage format with OG image
    if (isProcessedImage(post.featuredImage) && post.featuredImage.ogImage?.url) {
      ogImage = post.featuredImage.ogImage.url;
      ogImageAlt = post.title; // ProcessedImage doesn't have alt, use title
    } else if (isLegacyImage(post.featuredImage) && post.featuredImage.url) {
      // Fallback to legacy format
      ogImage = post.featuredImage.url;
      ogImageAlt = post.featuredImage.alt || post.title;
    }
  }
  
  // Build keywords from tags and category
  const keywords = [
    'African tech',
    'Nigeria tech',
    'startups',
    'technology news',
    'innovation',
    'funding',
    'startup ecosystem',
    'African technology',
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
          width: (isProcessedImage(post.featuredImage) && post.featuredImage.ogImage?.width) || 
                 (isLegacyImage(post.featuredImage) && post.featuredImage.width) || 1200,
          height: (isProcessedImage(post.featuredImage) && post.featuredImage.ogImage?.height) || 
                  (isLegacyImage(post.featuredImage) && post.featuredImage.height) || 630,
          alt: ogImageAlt,
        },
      ],
      publishedTime: getISODateString(post.publishedAt),
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
  const title = `${category} - TechBlit | African Tech News`;
  const desc = description || `Latest ${category} news, insights, and analysis from Africa's tech ecosystem`;

  return {
    title: title,
    description: desc,
    keywords: ['African tech', 'Nigeria tech', category.toLowerCase(), 'tech news', 'startups', 'innovation', 'African technology'],
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
    image: (isProcessedImage(post.featuredImage) && post.featuredImage.ogImage?.url) || 
           (isLegacyImage(post.featuredImage) && post.featuredImage.url) || 
           `${siteUrl}/og-image.svg`,
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
    datePublished: getISODateString(post.publishedAt),
    dateModified: getISODateString(post.updatedAt) || getISODateString(post.publishedAt),
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
