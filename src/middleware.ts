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

async function lookupRedirect(path: string): Promise<{ to: string; type: number } | null> {
  try {
    const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL ||
      'https://techblit-cloud-function-production.up.railway.app'

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    const response = await fetch(
      `${FUNCTIONS_URL}/api/v1/redirects/lookup?path=${encodeURIComponent(path)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) return null

    const result = await response.json()
    if (result.data?.found) {
      return {
        to: result.data.to,
        type: result.data.type || 301,
      }
    }

    return null
  } catch {
    return null
  }
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
    const redirect = await lookupRedirect(normalizedPath)
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
