import { Metadata } from 'next';
import { ProcessedImage } from './imageProcessing';
import { getCrawlableImageUrl } from './imageUrlUtils';

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

const SITE_URL = 'https://www.techblit.com';

export const defaultSEO = {
  title: "TechBlit - Igniting Africa's Tech Conversation",
  description: 'Discover the latest tech news, startup insights, funding rounds, and innovation stories from across Africa. Your destination for African tech ecosystem coverage.',
  canonical: SITE_URL,
  keywords: ['African tech', 'startups', 'technology news', 'innovation', 'funding', 'FinTech', 'AI', 'Nigeria tech', 'African technology', 'tech ecosystem'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'TechBlit',
    title: "TechBlit - Igniting Africa's Tech Conversation",
    description: 'Discover the latest tech news, startup insights, funding rounds, and innovation stories from across Africa.',
    images: [
      {
        url: `${SITE_URL}/og-image.svg`,
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
  categories?: string[];
  author?: string | { uid: string; name: string };
  publishedAt?: Date | { toDate: () => Date };
  updatedAt?: Date | { toDate: () => Date };
  createdAt?: Date | { toDate: () => Date };
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
  const siteUrl = SITE_URL;
  const postUrl = `${siteUrl}/${post.slug}`;
  
  // Use custom meta title/description or fallback to post title/excerpt
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || 'Read this article on TechBlit';
  
  // Use custom social media titles/descriptions or fallback to main ones
  const ogTitle = post.social?.ogTitle || title;
  const ogDescription = post.social?.ogDescription || description;
  
  // Determine Open Graph image - prefer OG optimized version if available
  let ogImage = `${SITE_URL}/og-image.svg`;
  let ogImageAlt = post.title;
  
  if (post.featuredImage) {
    // Import Cloudinary helper for social images
    const { getSocialImageUrl } = require('./imageHelpers');
    
    // Try to get social image URL (uses Cloudinary social preset if public_id)
    const socialImageUrl = getSocialImageUrl(post.featuredImage);
    if (socialImageUrl) {
      ogImage = socialImageUrl;
      ogImageAlt = (typeof post.featuredImage === 'object' && 'alt' in post.featuredImage) 
        ? post.featuredImage.alt || post.title
        : post.title;
    } else {
      // Fallback to crawlable URL (handles legacy formats)
      const crawlableUrl = getCrawlableImageUrl(
        isProcessedImage(post.featuredImage) ? post.featuredImage.ogImage?.url : 
        isLegacyImage(post.featuredImage) ? post.featuredImage.url : 
        typeof post.featuredImage === 'string' ? post.featuredImage : null,
        { width: 1200, height: 630, crop: 'fill' }
      );
      if (crawlableUrl) {
        ogImage = crawlableUrl;
        ogImageAlt = isLegacyImage(post.featuredImage) && post.featuredImage.alt 
          ? post.featuredImage.alt 
          : post.title;
      }
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

  // Get dates with proper fallbacks - never use empty strings
  // Priority: publishedAt > createdAt for published time
  // Priority: updatedAt > publishedAt > createdAt for modified time
  const publishedTime = getISODateString(post.publishedAt) || getISODateString(post.createdAt);
  const modifiedTime = getISODateString(post.updatedAt) || getISODateString(post.publishedAt) || getISODateString(post.createdAt);

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
      publishedTime: publishedTime,
      modifiedTime: modifiedTime,
      authors: [authorName],
      section: post.category || post.categories?.[0],
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
      'article:section': post.category || post.categories?.[0] || 'Technology',
      'article:tag': post.tags?.join(', ') || '',
      // Only include date meta tags if we have valid dates (never empty strings)
      ...(publishedTime && { 'article:published_time': publishedTime }),
      ...(modifiedTime && { 'article:modified_time': modifiedTime }),
    },
  };

  return metadata;
}

// Generate category page SEO
export function generateCategorySEO(category: string, description?: string): Metadata {
  const siteUrl = SITE_URL;
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
          url: `${SITE_URL}/og-image.svg`,
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
      images: [`${SITE_URL}/og-image.svg`],
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
// Returns an array with Article/NewsArticle and BreadcrumbList schemas
export function generateStructuredData(post: BlogPostSEO) {
  const siteUrl = SITE_URL;
  const postUrl = `${siteUrl}/${post.slug}`;
  
  // Helper function to get author name
  const getAuthorName = (author: string | { uid: string; name: string } | undefined): string => {
    if (!author) return 'TechBlit Team';
    if (typeof author === 'string') return author;
    return author.name;
  };

  const authorName = getAuthorName(post.author);
  const category = post.category || post.categories?.[0] || 'Technology';
  
  // Get featured image URL and convert to crawlable URL for SEO
  let rawFeaturedImageUrl = '';
  if (isProcessedImage(post.featuredImage) && post.featuredImage.ogImage?.url) {
    rawFeaturedImageUrl = post.featuredImage.ogImage.url;
  } else if (isLegacyImage(post.featuredImage) && post.featuredImage.url) {
    rawFeaturedImageUrl = post.featuredImage.url;
  }
  
  const featuredImageUrl = rawFeaturedImageUrl 
    ? getCrawlableImageUrl(rawFeaturedImageUrl)
    : `${SITE_URL}/og-image.svg`;
  
  // Get dates with proper fallbacks - same logic as metadata generation
  const publishedTime = getISODateString(post.publishedAt) || getISODateString(post.createdAt);
  const modifiedTime = getISODateString(post.updatedAt) || getISODateString(post.publishedAt) || getISODateString(post.createdAt);
  
  // Determine if it's a news article (recent posts) or regular article
  // Use publishedAt or createdAt as fallback for date comparison
  // NOTE: We avoid using Date.now() to prevent hydration mismatches between server and client
  // Instead, we use a deterministic approach: check if published within last 7 days using a fixed reference
  const dateForComparison = post.publishedAt || post.createdAt;
  const publishedDate = dateForComparison ? 
    (typeof dateForComparison === 'object' && 'toDate' in dateForComparison 
      ? dateForComparison.toDate() 
      : new Date(dateForComparison)) : 
    null;
  
  // For hydration safety, we'll use Article type for all posts instead of NewsArticle
  // This avoids hydration mismatches while still providing proper schema
  // NewsArticle requires very recent content (within hours/days), which can cause hydration issues
  // Article is more stable and works well for all blog posts
  const isNewsArticle = false;
  
  // Build image array with proper ImageObject structure (required by Google)
  const imageWidth = (isProcessedImage(post.featuredImage) && post.featuredImage.ogImage?.width) || 
                     (isLegacyImage(post.featuredImage) && post.featuredImage.width) || 1200;
  const imageHeight = (isProcessedImage(post.featuredImage) && post.featuredImage.ogImage?.height) || 
                      (isLegacyImage(post.featuredImage) && post.featuredImage.height) || 630;
  
  // Generate descriptive alt text for images (better for Google Images)
  const imageAlt = isLegacyImage(post.featuredImage) && post.featuredImage.alt 
    ? post.featuredImage.alt 
    : `${post.title} - TechBlit coverage of ${category}`;
  
  const imageArray = [{
    '@type': 'ImageObject',
    url: featuredImageUrl,
    width: imageWidth,
    height: imageHeight,
  }];

  // Main Article/NewsArticle schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': isNewsArticle ? 'NewsArticle' : 'Article',
    headline: post.title,
    description: post.metaDescription || post.excerpt || '',
    image: imageArray, // Array of ImageObject (Google best practice)
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'TechBlit',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
        width: 600,
        height: 60,
      },
      sameAs: [
        SITE_URL,
        'https://twitter.com/techblit',
        'https://www.linkedin.com/company/techblit',
      ],
    },
    datePublished: publishedTime,
    dateModified: modifiedTime,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    url: postUrl,
    keywords: post.tags?.join(', ') || category || 'technology',
    articleSection: category,
    wordCount: post.excerpt?.split(' ').length || 0,
  };

  // BreadcrumbList schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${siteUrl}/blog`,
      },
      ...(category ? [{
        '@type': 'ListItem',
        position: 3,
        name: category,
        item: `${siteUrl}/category/${category.toLowerCase().replace(/\s+/g, '-')}`,
      }] : []),
      {
        '@type': 'ListItem',
        position: category ? 4 : 3,
        name: post.title,
        item: postUrl,
      },
    ],
  };

  // Separate ImageObject schema for featured image (Google best practice)
  // This gives Google direct mapping for fast image indexing
  const imageObjectSchema = post.featuredImage ? {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: featuredImageUrl,
    url: featuredImageUrl,
    width: imageWidth,
    height: imageHeight,
    description: imageAlt,
    license: `${siteUrl}/license`,
    creator: {
      '@type': 'Organization',
      name: 'TechBlit',
    },
  } : null;

  // Return array of schemas (filter out null values)
  const schemas: any[] = [articleSchema, breadcrumbSchema];
  if (imageObjectSchema) {
    schemas.push(imageObjectSchema);
  }
  
  return schemas;
}
