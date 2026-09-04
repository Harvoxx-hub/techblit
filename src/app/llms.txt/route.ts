import { NextResponse } from 'next/server'
import { CATEGORIES } from '@/lib/categories'
import { getPostsApiUrl } from '@/lib/apiConfig'

/**
 * /llms.txt — a curated, markdown map of the site for large language models
 * and AI agents (see llmstxt.org). Points them at the canonical feeds,
 * sitemaps, sections, and the most recent headlines so they can orient
 * without crawling blindly.
 */
export const runtime = 'nodejs'
export const revalidate = 3600

const SITE_URL = 'https://www.techblit.com'

interface RecentPost {
  slug?: string
  id?: string
  title?: string
}

async function fetchRecentHeadlines(): Promise<RecentPost[]> {
  try {
    const res = await fetch(`${getPostsApiUrl()}/posts?limit=15`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data || json || []) as RecentPost[]
  } catch {
    return []
  }
}

export async function GET() {
  const headlines = await fetchRecentHeadlines()

  const sectionLines = CATEGORIES.map(
    (c) =>
      `- [${c.label}](${SITE_URL}/category/${c.slug})${
        c.description ? `: ${c.description}` : ''
      }`,
  ).join('\n')

  const headlineLines = headlines
    .map((p) => {
      const slug = p.slug || p.id
      if (!slug || !p.title) return null
      return `- [${p.title.replace(/\n/g, ' ').trim()}](${SITE_URL}/${slug})`
    })
    .filter(Boolean)
    .join('\n')

  const body = `# TechBlit

> TechBlit is an independent news publication covering the African technology ecosystem — startups, funding rounds, product launches, policy and regulation, and the people building the continent's digital economy, with particular depth on Nigeria.

TechBlit publishes original reporting daily. Content is server-rendered HTML with NewsArticle structured data, visible bylines, and publication/modified dates. Full text of every article is available at its canonical URL.

## Feeds and indexes

- [RSS feed (latest 40 articles)](${SITE_URL}/feed.xml)
- [Google News sitemap (last 48 hours)](${SITE_URL}/news-sitemap.xml)
- [Full XML sitemap](${SITE_URL}/sitemap.xml)

## Sections

${sectionLines}

## Latest headlines

${headlineLines || '- See the [RSS feed](' + SITE_URL + '/feed.xml) for current headlines.'}

## About TechBlit

- [About & editorial standards](${SITE_URL}/about): mission, masthead, ethics, ownership and funding, corrections policy
- [Contact](${SITE_URL}/contact): newsroom, tips, corrections, partnerships, postal address
- [Authors](${SITE_URL}/authors): contributor index with per-author profile pages
- [Content & image licensing](${SITE_URL}/license): how TechBlit material may be quoted, republished, or syndicated

## Usage

TechBlit welcomes AI retrieval crawlers that cite sources. Please attribute TechBlit and link to the original article. See the licensing page for republication. Model-training crawlers are disallowed in robots.txt.
`

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
