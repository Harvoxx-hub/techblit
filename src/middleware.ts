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

// Bot user agents to skip redirect lookups (reduce API calls)
const BOT_USER_AGENTS = [
  'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget',
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
  'yandexbot', 'facebookexternalhit', 'twitterbot', 'linkedinbot',
  'whatsapp', 'telegram', 'slack', 'discord', 'petalbot',
  'semrushbot', 'ahrefsbot', 'dotbot', 'mj12bot', 'serpstatbot'
];

// Note: In-memory caching removed - Edge runtime doesn't support module-level state reliably
// If caching is needed, use Vercel KV or other edge-compatible store

async function lookupRedirect(path: string): Promise<{ to: string; type: number } | null> {
  try {
    const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL ||
                          'https://techblit-cloud-function-production.up.railway.app';

    // Add timeout to prevent slow API calls from blocking Edge
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const response = await fetch(
      `${FUNCTIONS_URL}/api/v1/redirects/lookup?path=${encodeURIComponent(path)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

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
    // Silently fail on timeout or error - don't block the request
    if ((error as Error).name !== 'AbortError') {
      console.error('Error looking up redirect:', error);
    }
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

  // Prevent redirect loops - check if this is already a redirected request
  const redirectCount = request.headers.get('x-middleware-redirect-count');
  if (redirectCount && parseInt(redirectCount) > 3) {
    console.error(`[Middleware] Redirect loop detected for: ${pathname}`);
    return NextResponse.next();
  }

  // Check if request is from a bot (skip expensive redirect lookups for bots)
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  const isBot = BOT_USER_AGENTS.some(bot => userAgent.includes(bot));

  // CRITICAL: Block legacy WordPress routes immediately (prevent bot spam)
  const blockedPaths = [
    '/wp-admin',
    '/wp-login.php',
    '/wp-json',
    '/xmlrpc.php',
    '/wp-content',
    '/wp-includes',
  ];

  if (blockedPaths.some(p => pathname.startsWith(p))) {
    return new Response('Not Found', { status: 404 });
  }

  // Skip redirect lookups for known valid routes (major optimization)
  // Only check redirects for potentially legacy/unknown URLs
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/sitemap') ||
    pathname.startsWith('/robots') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/category') ||
    pathname.startsWith('/authors') ||
    pathname.startsWith('/writers') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/preview') ||
    pathname === '/' ||
    pathname.includes('.')
  ) {
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
      const response = NextResponse.redirect(redirectUrl, { status: 301 });
      // Track redirect count to prevent loops
      const count = redirectCount ? parseInt(redirectCount) + 1 : 1;
      response.headers.set('x-middleware-redirect-count', count.toString());
      return response;
    }
    // If null handler returned, continue to let it 404
  }

  // 2. Check for custom redirects from the database
  // OPTIMIZATION: Skip redirect lookup for bots to reduce API calls
  let redirect = null;
  if (!isBot) {
    redirect = await lookupRedirect(normalizedPath);
  }

  if (redirect) {
    // Ensure the redirect URL is absolute
    let redirectUrl = redirect.to;
    if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
      redirectUrl = new URL(redirect.to, request.url).toString();
    }

    const response = NextResponse.redirect(redirectUrl, {
      status: redirect.type === 302 ? 302 : 301,
    });
    // Track redirect count to prevent loops
    const count = redirectCount ? parseInt(redirectCount) + 1 : 1;
    response.headers.set('x-middleware-redirect-count', count.toString());
    return response;
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
     * - favicon.ico, favicon.png (favicon files)
     * - images, fonts (public static assets)
     * - robots.txt, sitemap.xml (SEO files)
     *
     * This optimized matcher reduces Edge Request usage significantly
     */
    '/((?!_next/static|_next/image|favicon\\.ico|favicon\\.png|images|fonts|robots\\.txt|sitemap\\.xml|.*\\.jpg|.*\\.jpeg|.*\\.png|.*\\.gif|.*\\.svg|.*\\.webp|.*\\.ico|.*\\.css|.*\\.js).*)',
  ],
};
