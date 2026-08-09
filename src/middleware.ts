import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const SPAM_URL_PATTERNS = [
  '/shop/sv888',
  '/shop/kubet',
  '/shop/binh888',
  '/article/binh-888',
  '/article/binh888',
]
const SPAM_PATH_PATTERN = /^\/(shop|article)\/(sv888|kubet|binh888|binh-888)/i

const BOT_USER_AGENTS = [
  'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget',
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
  'yandexbot', 'facebookexternalhit', 'twitterbot', 'linkedinbot',
  'whatsapp', 'telegram', 'slack', 'discord', 'petalbot',
  'semrushbot', 'ahrefsbot', 'dotbot', 'mj12bot', 'serpstatbot'
]

const BLOCKED_BOTS = [
  'ahrefsbot',
  'semrushbot',
  'mj12bot',
  'dotbot',
  'blexbot',
  'dataforseobot',
  'serpstatbot',
  'petalbot'
]

type ActiveRedirect = { from: string; to: string; type?: number }

// Module-scope cache — persists across requests within a warm Edge Function
// instance (standard pattern for small, slow-changing datasets in Next.js
// middleware; each region gets its own instance, which is fine here).
// Replaces a live per-request Firestore-backed lookup with one shared
// background-refreshed list: every reader visiting every article used to
// trigger its own unbounded `redirects` collection scan on the request's
// critical path (GET /redirects/lookup, see redirects.js's lookupRedirect)
// — this fetches the whole active-redirect list at most once per TTL
// window, shared across all requests hitting this instance.
const REDIRECTS_CACHE_TTL_MS = 5 * 60 * 1000 // matches the backend's own Cache-Control max-age
let redirectsCache: ActiveRedirect[] | null = null
let redirectsCacheFetchedAt = 0
let redirectsCacheInflight: Promise<ActiveRedirect[]> | null = null

async function fetchActiveRedirects(): Promise<ActiveRedirect[]> {
  const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL ||
    'https://techblit-cloud-function-production.up.railway.app'

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 2000)

  try {
    const response = await fetch(`${FUNCTIONS_URL}/api/v1/redirects/active`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`redirects/active returned ${response.status}`)
    const result = await response.json()
    return Array.isArray(result.data) ? result.data : []
  } finally {
    clearTimeout(timeoutId)
  }
}

// Returns the cached redirect list, refreshing it in the background once
// the TTL expires. Serves a stale cache rather than blocking a page render
// on a slow/failed refresh, and never throws — worst case on a cold start
// with a down backend is an empty list (no redirects applied), same as the
// old code's behavior on any lookup failure.
async function getActiveRedirects(): Promise<ActiveRedirect[]> {
  const isFresh = redirectsCache !== null && Date.now() - redirectsCacheFetchedAt < REDIRECTS_CACHE_TTL_MS
  if (isFresh) return redirectsCache as ActiveRedirect[]

  if (!redirectsCacheInflight) {
    redirectsCacheInflight = fetchActiveRedirects()
      .then((redirects) => {
        redirectsCache = redirects
        redirectsCacheFetchedAt = Date.now()
        return redirects
      })
      .catch(() => redirectsCache ?? [])
      .finally(() => { redirectsCacheInflight = null })
  }

  // A cold instance with no cache yet must wait for the first fetch; a warm
  // instance serving a stale cache returns immediately and lets the
  // background refresh (already in flight) update the cache for next time.
  return redirectsCache !== null ? redirectsCache : redirectsCacheInflight
}

function matchRedirect(redirects: ActiveRedirect[], normalizedPath: string): { to: string; type: number } | null {
  const match = redirects.find((r) => {
    const from = r.from || ''
    const normalizedFrom = from.endsWith('/') && from !== '/' ? from.slice(0, -1) : from
    // Same two-way comparison the old server-side matcher used (from.js's
    // lookupRedirect) — kept even though both branches now compare against
    // the same normalizedPath, to avoid changing matching behavior as part
    // of a performance fix.
    return normalizedFrom.toLowerCase() === normalizedPath.toLowerCase() ||
      from.toLowerCase() === normalizedPath.toLowerCase()
  })
  return match ? { to: match.to, type: match.type || 301 } : null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || ''

  if (SPAM_URL_PATTERNS.some((pattern) => pathname.includes(pattern)) || SPAM_PATH_PATTERN.test(pathname)) {
    return new NextResponse(null, { status: 410, statusText: 'Gone' })
  }

  if (BLOCKED_BOTS.some((bot) => userAgent.includes(bot))) {
    return new Response('Forbidden - Bot blocked', {
      status: 403,
      headers: { 'X-Robots-Tag': 'noindex, nofollow' },
    })
  }

  const redirectCount = request.headers.get('x-middleware-redirect-count')
  if (redirectCount && parseInt(redirectCount, 10) > 3) {
    return NextResponse.next()
  }

  const isBot = BOT_USER_AGENTS.some((bot) => userAgent.includes(bot))

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
    pathname.startsWith('/founders') ||
    pathname.startsWith('/preview') ||
    pathname === '/' ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const normalizedPath = pathname.endsWith('/') && pathname !== '/'
    ? pathname.slice(0, -1)
    : pathname

  if (!isBot) {
    const redirects = await getActiveRedirects()
    const redirect = matchRedirect(redirects, normalizedPath)
    if (redirect) {
      let redirectUrl = redirect.to
      if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
        redirectUrl = new URL(redirect.to, request.url).toString()
      }

      const response = NextResponse.redirect(redirectUrl, {
        status: redirect.type === 302 ? 302 : 301,
      })
      const count = redirectCount ? parseInt(redirectCount, 10) + 1 : 1
      response.headers.set('x-middleware-redirect-count', count.toString())
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|favicon\\.png|images|fonts|robots\\.txt|sitemap\\.xml|.*\\.jpg|.*\\.jpeg|.*\\.png|.*\\.gif|.*\\.svg|.*\\.webp|.*\\.ico|.*\\.css|.*\\.js).*)',
  ],
}
