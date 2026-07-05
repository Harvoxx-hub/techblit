import { Metadata } from 'next'
import { ProcessedImage } from './imageProcessing'
import { getSocialImageUrl, getImageUrlFromData, extractPublicId } from './imageHelpers'

function getISODateString(date: Date | { toDate: () => Date } | undefined): string | undefined {
  if (!date) return undefined
  if (typeof date === 'object' && 'toDate' in date) {
    return date.toDate().toISOString()
  }
  if (date instanceof Date) {
    return date.toISOString()
  }
  return undefined
}

const SITE_URL = 'https://www.techblit.com'

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
        url: `${SITE_URL}/api/og`,
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
}

interface BlogPostSEO {
  id: string
  title: string
  slug: string
  excerpt?: string
  metaTitle?: string
  metaDescription?: string
  canonical?: string
  tags?: string[]
  category?: string
  categories?: string[]
  author?: string | { uid: string; name: string }
  publishedAt?: Date | { toDate: () => Date }
  updatedAt?: Date | { toDate: () => Date }
  createdAt?: Date | { toDate: () => Date }
  featuredImage?: ProcessedImage | {
    public_id?: string
    url?: string
    alt?: string
    width?: number
    height?: number
  }
  social?: {
    ogTitle?: string
    ogDescription?: string
    twitterCard?: 'summary' | 'summary_large_image'
  }
  seo?: {
    noindex?: boolean
    nofollow?: boolean
  }
}

const getFeaturedImageMeta = (featuredImage: BlogPostSEO['featuredImage']) => {
  const socialUrl = featuredImage ? getSocialImageUrl(featuredImage) : null
  const coverUrl = featuredImage ? getImageUrlFromData(featuredImage, { preset: 'social' }) : null
  const url = socialUrl || coverUrl || `${SITE_URL}/api/og`

  let alt = 'TechBlit'
  let width = 1200
  let height = 630

  if (featuredImage && typeof featuredImage === 'object') {
    if ('alt' in featuredImage && featuredImage.alt) {
      alt = featuredImage.alt
    }
    if ('width' in featuredImage && featuredImage.width) {
      width = featuredImage.width
    }
    if ('height' in featuredImage && featuredImage.height) {
      height = featuredImage.height
    }
    if ('ogImage' in featuredImage && featuredImage.ogImage) {
      width = featuredImage.ogImage.width || width
      height = featuredImage.ogImage.height || height
    }
  }

  return { url, alt, width, height }
}

export function generatePostSEO(post: BlogPostSEO): Metadata {
  const siteUrl = SITE_URL
  const postUrl = `${siteUrl}/${post.slug}`

  const title = post.metaTitle || post.title
  const description = post.metaDescription || post.excerpt || 'Read this article on TechBlit'

  const ogTitle = post.social?.ogTitle || title
  const ogDescription = post.social?.ogDescription || description

  const { url: ogImage, alt: ogImageAlt, width: ogWidth, height: ogHeight } = getFeaturedImageMeta(post.featuredImage)

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
  ].filter(Boolean)

  const getAuthorName = (author: string | { uid: string; name: string } | undefined): string => {
    if (!author) return 'TechBlit Team'
    if (typeof author === 'string') return author
    return author.name
  }

  const authorName = getAuthorName(post.author)

  const publishedTime = getISODateString(post.publishedAt) || getISODateString(post.createdAt)
  const modifiedTime = getISODateString(post.updatedAt) || getISODateString(post.publishedAt) || getISODateString(post.createdAt)

  return {
    title,
    description,
    keywords,
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
          width: ogWidth,
          height: ogHeight,
          alt: ogImageAlt || post.title,
        },
      ],
      publishedTime,
      modifiedTime,
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
      ...(publishedTime && { 'article:published_time': publishedTime }),
      ...(modifiedTime && { 'article:modified_time': modifiedTime }),
    },
  }
}

export function generateCategorySEO(category: string, description?: string): Metadata {
  const siteUrl = SITE_URL
  const categoryUrl = `${siteUrl}/category/${category}`
  const title = `${category} - TechBlit | African Tech News`
  const desc = description || `Latest ${category} news, insights, and analysis from Africa's tech ecosystem`

  return {
    title,
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
      title,
      description: desc,
      images: [
        {
          url: `${SITE_URL}/api/og`,
          width: 1200,
          height: 630,
          alt: `${category} Articles - TechBlit`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [`${SITE_URL}/api/og`],
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
  }
}

export function extractTextFromHTML(html: string, maxLength: number = 160): string {
  const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

  if (text.length <= maxLength) {
    return text
  }

  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...'
}

export function generateStructuredData(post: BlogPostSEO) {
  const siteUrl = SITE_URL
  const postUrl = `${siteUrl}/${post.slug}`

  const getAuthorName = (author: string | { uid: string; name: string } | undefined): string => {
    if (!author) return 'TechBlit Team'
    if (typeof author === 'string') return author
    return author.name
  }

  const authorName = getAuthorName(post.author)
  const category = post.category || post.categories?.[0] || 'Technology'

  const { url: featuredImageUrl, alt: imageAlt, width: imageWidth, height: imageHeight } = getFeaturedImageMeta(post.featuredImage)

  const publishedTime = getISODateString(post.publishedAt) || getISODateString(post.createdAt)
  const modifiedTime = getISODateString(post.updatedAt) || getISODateString(post.publishedAt) || getISODateString(post.createdAt)

  const imageArray = [{
    '@type': 'ImageObject',
    url: featuredImageUrl,
    width: imageWidth,
    height: imageHeight,
  }]

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription || post.excerpt || '',
    image: imageArray,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'TechBlit',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/favicon.png`,
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
  }

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
  }

  const imageObjectSchema = extractPublicId(post.featuredImage) ? {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: featuredImageUrl,
    url: featuredImageUrl,
    width: imageWidth,
    height: imageHeight,
    description: imageAlt || `${post.title} - TechBlit coverage of ${category}`,
    license: `${siteUrl}/license`,
    creator: {
      '@type': 'Organization',
      name: 'TechBlit',
    },
  } : null

  const schemas: unknown[] = [articleSchema, breadcrumbSchema]
  if (imageObjectSchema) {
    schemas.push(imageObjectSchema)
  }

  return schemas
}
