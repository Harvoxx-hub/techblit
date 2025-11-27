import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Note: Middleware runs on Edge runtime which doesn't support Node.js modules like firebase-admin
// Redirects are handled via API routes or server components instead
// This middleware only handles basic routing logic

async function getRedirects(): Promise<Array<{ from: string; to: string; type: number }>> {
  // Middleware runs on Edge runtime - cannot use firebase-admin here
  // Redirects should be handled via:
  // 1. API route: /api/redirects
  // 2. Server component redirects
  // 3. Or use a CDN/edge function for redirects
  
  // For now, return empty array - redirects can be handled elsewhere
  return [];
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the path starts with /admin (but not /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    // This will be handled by the client-side authentication
    // The withAuth HOC will redirect to login if not authenticated
    return NextResponse.next();
  }

  // Check for redirects (skip for API routes, static files, etc.)
  if (!pathname.startsWith('/api') && 
      !pathname.startsWith('/_next') && 
      !pathname.startsWith('/favicon')) {
    
    const redirects = await getRedirects();
    
    // Normalize pathname (remove trailing slash for comparison)
    const normalizedPath = pathname.endsWith('/') && pathname !== '/' 
      ? pathname.slice(0, -1) 
      : pathname;
    
    // Check for exact match
    const redirect = redirects.find((r) => {
      const normalizedFrom = r.from.endsWith('/') && r.from !== '/' 
        ? r.from.slice(0, -1) 
        : r.from;
      return normalizedFrom === normalizedPath || normalizedFrom === pathname;
    });

    if (redirect) {
      // Ensure the redirect URL is absolute
      let redirectUrl = redirect.to;
      if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
        // Make it relative to the current origin
        redirectUrl = new URL(redirect.to, request.url).toString();
      }

      return NextResponse.redirect(redirectUrl, {
        status: redirect.type === 302 ? 302 : 301,
      });
    }
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
