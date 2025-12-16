import { NextRequest, NextResponse } from 'next/server';
import { generateSitemapXML, generateSitemap, SitemapUrl } from '@/lib/sitemap';

const SITEMAP_GENERATOR_URL = 'https://generatesitemap-4alcog3g7q-uc.a.run.app/';
const FETCH_TIMEOUT = 10000; // 10 seconds timeout

// Helper function to add timeout to fetch
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

export async function GET(request: NextRequest) {
  // Skip external generator during build to avoid timeouts - go straight to local generation
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
  
  if (!isBuildTime) {
    try {
      // Fetch sitemap from external generator service with timeout
      const response = await fetchWithTimeout(SITEMAP_GENERATOR_URL, {
        headers: {
          'Accept': 'application/xml',
        },
        next: {
          revalidate: 3600, // Revalidate every hour
        },
      }, 5000); // 5 second timeout for external service

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
      // Fall through to local generation
    }
  }
  
  // Generate sitemap locally using Admin SDK (includes all articles)
  try {
    const sitemapUrls = await Promise.race([
      generateSitemap(),
      new Promise<SitemapUrl[]>((_, reject) => 
        setTimeout(() => reject(new Error('Sitemap generation timeout')), 30000)
      )
    ]);
    
    const fallbackSitemap = generateSitemapXML(sitemapUrls);
    
    return new NextResponse(fallbackSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300, s-maxage=300', // Cache for 5 minutes
      },
    });
  } catch (localError) {
    console.error('Error generating local sitemap:', localError);
    
    // Ultimate fallback - basic static pages only
    const siteUrl = process.env.SITE_URL || 'https://techblit.com';
    const basicSitemap = generateSitemapXML([
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
    
    return new NextResponse(basicSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  }
}

