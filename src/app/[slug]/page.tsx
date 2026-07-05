import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Navigation from '@/components/ui/Navigation'
import Footer from '@/components/ui/Footer'
import SocialShare from '@/components/ui/SocialShare'
import FooterNewsletter from '@/components/homepage/sections/FooterNewsletter'
import CategoryPill from '@/components/homepage/atoms/CategoryPill'
import ArticleSidebar from '@/components/article/ArticleSidebar'
import ArticleRelatedPosts from '@/components/article/ArticleRelatedPosts'
import { generatePostSEO, generateStructuredData, type BlogPostSEO } from '@/lib/seo'
import { getAuthorUrl } from '@/lib/authorUtils'
import { formatDateShort } from '@/lib/dateUtils'
import { getImageUrlFromData } from '@/lib/imageHelpers'
import { getPostsApiUrl } from '@/lib/apiConfig'
import { renderContent } from '@/lib/markdown'
import { getCategoryByLabel } from '@/lib/categories'
import {
  fetchPostsList,
  getPrimaryCategory,
  filterRelatedPosts,
  filterLatestPosts,
  getAtnFeaturedVideo,
  FOUNDERS_CTA_CATEGORIES,
} from '@/lib/articlePageData'
import { ProcessedImage } from '@/lib/imageProcessing'
import { Metadata } from 'next'

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  contentHtml?: string
  createdAt: unknown
  updatedAt?: unknown
  author?: string | { uid: string; name: string }
  excerpt?: string
  status?: string
  publishedAt?: unknown
  category?: string
  featuredImage?: ProcessedImage | {
    url: string
    alt: string
    width?: number
    height?: number
  }
  categories?: string[]
  tags?: string[]
  readTime?: string
  metaTitle?: string
  metaDescription?: string
  canonical?: string
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

const getImageUrl = (image: BlogPost['featuredImage']): string =>
  getImageUrlFromData(image, { preset: 'cover' }) || ''

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const API_BASE = getPostsApiUrl()
    const response = await fetch(`${API_BASE}/posts/${slug}`, {
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`Failed to fetch post: ${response.status}`)
    }

    const result = await response.json()
    return result.data || result as BlogPost
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

export async function generateStaticParams() {
  try {
    const API_BASE = getPostsApiUrl()
    const response = await fetch(`${API_BASE}/posts?limit=1000`, {
      next: { revalidate: 3600 },
    })

    if (!response.ok) return []

    const result = await response.json()
    const posts = result.data || result

    return posts.map((post: { slug?: string; id?: string }) => ({
      slug: post.slug || post.id,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return {
      title: 'Post Not Found - TechBlit',
      description: "The post you're looking for doesn't exist or has been removed.",
    }
  }

  return generatePostSEO(post as BlogPostSEO)
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  const [allPosts, atnVideo] = await Promise.all([
    fetchPostsList(40),
    getAtnFeaturedVideo(),
  ])

  const primaryCategory = getPrimaryCategory(post)
  const categoryMeta = primaryCategory ? getCategoryByLabel(primaryCategory) : null
  const categorySlug = categoryMeta?.slug || null

  const latest = filterLatestPosts(allPosts, post.id, 6)
  const categoryPosts = filterRelatedPosts(allPosts, post.id, primaryCategory, 5)
  const relatedPosts = filterRelatedPosts(allPosts, post.id, primaryCategory, 3)
  const showFoundersCta = primaryCategory
    ? FOUNDERS_CTA_CATEGORIES.includes(primaryCategory)
    : false

  const structuredDataSchemas = generateStructuredData(post as BlogPostSEO)
  const articleUrl = `https://www.techblit.com/${post.slug}`
  const imageUrl = getImageUrl(post.featuredImage)
  const dateLabel = formatDateShort(post.publishedAt || post.createdAt)
  const authorName =
    typeof post.author === 'string' ? post.author : post.author?.name

  const proseClasses =
    'prose prose-sm sm:prose-base md:prose-lg max-w-none dark:prose-invert ' +
    'prose-img:max-w-full prose-img:rounded-lg prose-img:my-4 ' +
    'prose-a:text-brand-gold prose-a:no-underline hover:prose-a:underline ' +
    'prose-headings:text-gray-900 dark:prose-headings:text-white ' +
    'prose-p:text-gray-700 dark:prose-p:text-gray-300 ' +
    'prose-li:text-gray-700 dark:prose-li:text-gray-300 ' +
    'prose-strong:text-gray-900 dark:prose-strong:text-white'

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-x-hidden">
      {structuredDataSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <Navigation />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav
          className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-6"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-brand-gold transition-colors">
            Home
          </Link>
          {primaryCategory && categorySlug && (
            <>
              <span aria-hidden="true">/</span>
              <Link
                href={`/category/${categorySlug}`}
                className="hover:text-brand-gold transition-colors"
              >
                {primaryCategory}
              </Link>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span className="text-gray-700 dark:text-gray-300 line-clamp-1">{post.title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 xl:gap-10">
          <article className="flex-1 min-w-0 max-w-4xl">
            <header className="mb-6 sm:mb-8">
              {primaryCategory && (
                <div className="mb-3">
                  <CategoryPill category={primaryCategory} />
                </div>
              )}

              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-5">
                {authorName && (
                  <span>
                    By{' '}
                    <Link
                      href={getAuthorUrl(authorName)}
                      className="text-brand-navy dark:text-brand-gold font-medium hover:underline transition-colors"
                    >
                      {authorName}
                    </Link>
                  </span>
                )}
                {authorName && <span aria-hidden="true">·</span>}
                <time>{dateLabel}</time>
                {post.readTime && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{post.readTime} read</span>
                  </>
                )}
              </div>

              {imageUrl && (
                <div className="relative aspect-[16/9] rounded-lg sm:rounded-xl overflow-hidden mb-5 sm:mb-6 bg-gray-100 dark:bg-gray-900">
                  <Image
                    src={imageUrl}
                    alt={
                      typeof post.featuredImage === 'object' &&
                      post.featuredImage &&
                      'alt' in post.featuredImage &&
                      post.featuredImage.alt
                        ? post.featuredImage.alt
                        : post.title
                    }
                    fill
                    sizes="(max-width: 1024px) 100vw, 896px"
                    className="object-cover"
                    priority
                  />
                </div>
              )}

              {post.excerpt && (
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-5 border-l-4 border-brand-gold pl-4">
                  {post.excerpt}
                </p>
              )}

              <SocialShare
                url={articleUrl}
                title={post.title}
                description={post.excerpt || ''}
                variant="compact"
              />
            </header>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-6 md:p-8 mb-8">
              <div
                className={proseClasses}
                dangerouslySetInnerHTML={{
                  __html: renderContent(post.content, post.contentHtml),
                }}
              />
            </div>

            <SocialShare
              url={articleUrl}
              title={post.title}
              description={post.excerpt || ''}
            />
          </article>

          <div className="lg:w-[300px] xl:w-[320px] shrink-0">
            <div className="lg:sticky lg:top-20 xl:top-24">
              <ArticleSidebar
                latest={latest}
                categoryPosts={categoryPosts}
                categoryLabel={primaryCategory}
                categorySlug={categorySlug}
                atnVideo={atnVideo}
                showFoundersCta={showFoundersCta}
              />
            </div>
          </div>
        </div>
      </div>

      <ArticleRelatedPosts posts={relatedPosts} />
      <FooterNewsletter />
      <Footer />
    </div>
  )
}
