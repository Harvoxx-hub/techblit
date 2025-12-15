import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Common patterns for WordPress to Next.js migration
const LEGACY_URL_PATTERNS: Array<{
  pattern: RegExp;
  handler: (matches: RegExpMatchArray, pathname: string) => string | null;
}> = [
  // WordPress date-based URLs: /2024/01/15/post-slug -> /post-slug
  {
    pattern: /^\/(\d{4})\/(\d{2})\/(\d{2})\/(.+?)\/?$/,
    handler: (matches) => `/${matches[4].replace(/\/$/, '')}`,
  },
  // WordPress category URLs: /category/tech/post-slug -> /category/tech
  {
    pattern: /^\/category\/([^\/]+)\/([^\/]+)\/?$/,
    handler: (matches) => `/category/${matches[1]}`,
  },
  // WordPress author URLs: /author/name -> /writers
  {
    pattern: /^\/author\/(.+?)\/?$/,
    handler: () => '/writers',
  },
  // WordPress tag URLs: /tag/name -> /blog
  {
    pattern: /^\/tag\/(.+?)\/?$/,
    handler: () => '/blog',
  },
  // WordPress page URLs: /page/2 -> /blog?page=2
  {
    pattern: /^\/page\/(\d+)\/?$/,
    handler: (matches) => `/blog?page=${matches[1]}`,
  },
  // WordPress feed URLs: /feed -> /sitemap.xml
  {
    pattern: /^\/(feed|rss|atom)\/?$/i,
    handler: () => '/sitemap.xml',
  },
  // WordPress archives: /archives/123 -> /
  {
    pattern: /^\/archives\/(\d+)\/?$/,
    handler: () => '/',
  },
  // Remove .html extensions: /post.html -> /post
  {
    pattern: /^\/(.+)\.html?\/?$/i,
    handler: (matches) => `/${matches[1]}`,
  },
  // Remove index.php: /index.php/slug -> /slug
  {
    pattern: /^\/index\.php\/(.+?)\/?$/,
    handler: (matches) => `/${matches[1]}`,
  },
  // WordPress wp-content/uploads -> ignore (should be 404)
  {
    pattern: /^\/wp-content\//,
    handler: () => null, // Return null to let it 404
  },
  // WordPress admin URLs -> admin
  {
    pattern: /^\/wp-admin\/?$/,
    handler: () => '/admin',
  },
];

// In-memory cache for redirects
let redirectsCache: { data: Array<{ from: string; to: string; type: number }> | null; expires: number } = {
  data: null,
  expires: 0,
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getRedirects(): Promise<Array<{ from: string; to: string; type: number }>> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (redirectsCache.data && redirectsCache.expires > now) {
    return redirectsCache.data;
  }
  
  try {
    const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
                          'https://us-central1-techblit.cloudfunctions.net';
    
    const response = await fetch(`${FUNCTIONS_URL}/api/v1/redirects/lookup?path=__all__`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Don't cache fetch (we manage our own cache)
    });
    
    if (!response.ok) {
      console.error('Failed to fetch redirects:', response.status);
      return [];
    }
    
    const result = await response.json();
    const redirects = result.data || [];
    
    // Update cache
    redirectsCache = {
      data: redirects,
      expires: now + CACHE_TTL,
    };
    
    return redirects;
  } catch (error) {
    console.error('Error fetching redirects:', error);
    // Return cached data even if expired, as fallback
    return redirectsCache.data || [];
  }
}

async function lookupRedirect(path: string): Promise<{ to: string; type: number } | null> {
  try {
    const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
                          'https://us-central1-techblit.cloudfunctions.net';
    
    const response = await fetch(
      `${FUNCTIONS_URL}/api/v1/redirects/lookup?path=${encodeURIComponent(path)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const result = await response.json();
    
    if (result.data?.found) {
      return {
        to: result.data.to,
        type: result.data.type || 301,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error looking up redirect:', error);
    return null;
  }
}

function handleLegacyPatterns(pathname: string): string | null {
  for (const { pattern, handler } of LEGACY_URL_PATTERNS) {
    const matches = pathname.match(pattern);
    if (matches) {
      return handler(matches, pathname);
    }
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip for API routes, static files, etc.
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/sitemap') ||
    pathname.startsWith('/robots') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if the path starts with /admin (but not /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    // This will be handled by the client-side authentication
    return NextResponse.next();
  }

  // Normalize pathname (remove trailing slash for comparison)
  const normalizedPath = pathname.endsWith('/') && pathname !== '/' 
    ? pathname.slice(0, -1) 
    : pathname;

  // 1. First check legacy WordPress URL patterns
  const legacyRedirect = handleLegacyPatterns(normalizedPath);
  if (legacyRedirect !== null) {
    // legacyRedirect could be empty string (meaning proceed) or a redirect target
    if (legacyRedirect) {
      const redirectUrl = new URL(legacyRedirect, request.url);
      return NextResponse.redirect(redirectUrl, { status: 301 });
    }
    // If null handler returned, continue to let it 404
  }

  // 2. Check for custom redirects from the database
  const redirect = await lookupRedirect(normalizedPath);
  
  if (redirect) {
    // Ensure the redirect URL is absolute
    let redirectUrl = redirect.to;
    if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
      redirectUrl = new URL(redirect.to, request.url).toString();
    }

    return NextResponse.redirect(redirectUrl, {
      status: redirect.type === 302 ? 302 : 301,
    });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.png (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.png).*)',
  ],
};
