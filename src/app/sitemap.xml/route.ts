import { NextRequest, NextResponse } from 'next/server';
import { generateSitemap, generateSitemapXML } from '@/lib/sitemap';

export async function GET(request: NextRequest) {
  try {
    const urls = await generateSitemap();
    const sitemapXML = generateSitemapXML(urls);
    
    return new NextResponse(sitemapXML, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Return a basic sitemap if there's an error
    const siteUrl = process.env.SITE_URL || 'https://techblit.com';
    const fallbackSitemap = generateSitemapXML([
      {
        loc: siteUrl,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: 1.0,
      },
      {
        loc: `${siteUrl}/about`,
        lastmod: new Date().toISOString(),
        changefreq: 'monthly',
        priority: 0.8,
      },
    ]);
    
    return new NextResponse(fallbackSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300, s-maxage=300', // Cache for 5 minutes on error
      },
    });
  }
}

