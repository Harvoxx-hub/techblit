import { NextResponse } from 'next/server'
import { generateNewsSitemapXml } from '@/lib/newsSitemap'

// News sitemap must reflect the last ~48h of publishing, so keep it dynamic
// and lightly cached rather than baked at build time.
export const runtime = 'nodejs'
export const revalidate = 600

export async function GET() {
  try {
    const xml = await generateNewsSitemapXml()
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=600, s-maxage=600',
      },
    })
  } catch (error) {
    console.error('Error generating news sitemap:', error)
    // Serve a valid, empty news sitemap rather than a 500.
    const empty = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
</urlset>
`
    return new NextResponse(empty, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    })
  }
}
