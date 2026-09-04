import { NextResponse } from 'next/server'
import { generateRssFeed } from '@/lib/rssFeed'

export const runtime = 'nodejs'
export const revalidate = 900

export async function GET() {
  try {
    const xml = await generateRssFeed()
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=900, s-maxage=900',
      },
    })
  } catch (error) {
    console.error('Error generating RSS feed:', error)
    return new NextResponse('Feed temporarily unavailable', { status: 503 })
  }
}
