import { NextRequest, NextResponse } from 'next/server';
import { generateSitemapXML } from '@/lib/sitemap';

const SITEMAP_GENERATOR_URL = 'https://generatesitemap-4alcog3g7q-uc.a.run.app/';

export async function GET(request: NextRequest) {
  try {
    // Fetch sitemap from external generator service
    const response = await fetch(SITEMAP_GENERATOR_URL, {
      headers: {
        'Accept': 'application/xml',
      },
      next: {
        revalidate: 3600, // Revalidate every hour
      },
    });

    if (!response.ok) {
      throw new Error(`Sitemap generator returned ${response.status}`);
    }

    const sitemapXML = await response.text();
    
    return new NextResponse(sitemapXML, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error fetching sitemap from generator:', error);
    
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
      {
        loc: `${siteUrl}/blog`,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: 0.9,
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

