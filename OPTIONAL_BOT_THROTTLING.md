# Optional: Temporary Bot Throttling

**Status:** OPTIONAL - Only use if Edge Requests remain high after 24 hours

## ⚠️ IMPORTANT WARNING

**Use this ONLY for 24-72 hours maximum!**

Blocking all bots is aggressive and will:
- Prevent legitimate crawlers (Google, Bing, etc.)
- Hurt SEO temporarily
- Block monitoring tools

**Only enable if:**
1. You've deployed all other fixes
2. Edge Requests are still >500K/day after 24 hours
3. You can monitor and remove this within 72 hours

---

## How to Enable

Add this code to the **TOP** of `src/middleware.ts` (right after the redirect loop check):

```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Prevent redirect loops
  const redirectCount = request.headers.get('x-middleware-redirect-count');
  if (redirectCount && parseInt(redirectCount) > 3) {
    console.error(`[Middleware] Redirect loop detected for: ${pathname}`);
    return NextResponse.next();
  }

  // ========================================
  // TEMPORARY BOT THROTTLING (24-72 hours)
  // TODO: REMOVE after traffic stabilizes!
  // ========================================
  const ua = request.headers.get("user-agent") || "";

  // Aggressive bot blocking (temporary)
  if (/bot|crawler|spider|ahrefs|semrush|mj12|scrapy|curl|wget|python-requests|go-http-client/i.test(ua)) {
    console.log(`[Bot Throttle] Blocked: ${ua} on ${pathname}`);
    return new Response("Forbidden - Temporary Bot Throttling Active", {
      status: 403,
      headers: {
        'Retry-After': '86400' // Tell bots to retry after 24 hours
      }
    });
  }
  // ========================================
  // END TEMPORARY BOT THROTTLING
  // ========================================

  // CRITICAL: Block legacy WordPress routes...
  // (rest of middleware continues)
```

---

## More Refined Version (Recommended)

This version allows Google/Bing but blocks aggressive crawlers:

```typescript
// TEMPORARY BOT THROTTLING - More selective
const ua = request.headers.get("user-agent") || "";

// Allow major search engines
const allowedBots = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot/i;
const isAllowedBot = allowedBots.test(ua);

// Block aggressive crawlers but allow major search engines
const isBlockedBot = /ahrefs|semrush|mj12|scrapy|curl|wget|python-requests|go-http-client|petalbot|dotbot|serpstatbot|blexbot/i.test(ua);

if (isBlockedBot && !isAllowedBot) {
  console.log(`[Bot Throttle] Blocked: ${ua} on ${pathname}`);
  return new Response("Forbidden - Temporary Bot Throttling Active", {
    status: 403,
    headers: {
      'Retry-After': '86400'
    }
  });
}
```

---

## Monitoring

While bot throttling is active:

1. **Track blocked requests:**
   ```bash
   vercel logs | grep "Bot Throttle" | wc -l
   ```

2. **Monitor Edge Requests** in Vercel dashboard hourly

3. **Check for false positives:**
   - Look for legitimate traffic being blocked
   - Review user agents in logs

---

## When to Remove

Remove bot throttling when:
- ✅ Edge Requests drop below 100K/day
- ✅ Traffic has stabilized for 24 hours
- ✅ 72 hours have passed (maximum)

**To remove:** Simply delete the bot throttling code block from middleware.

---

## Alternative: Rate Limiting by IP

If specific IPs are causing issues, use IP-based rate limiting instead:

```typescript
// Track requests per IP (simple in-memory - for emergency use only)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                 request.headers.get('x-real-ip') ||
                 'unknown';

const now = Date.now();
const ipData = requestCounts.get(clientIP);

if (ipData && ipData.resetAt > now) {
  ipData.count++;
  if (ipData.count > 100) { // 100 requests per minute
    return new Response("Rate limit exceeded", { status: 429 });
  }
} else {
  requestCounts.set(clientIP, { count: 1, resetAt: now + 60000 });
}

// Clean up old entries every 1000 requests
if (requestCounts.size > 1000) {
  for (const [ip, data] of requestCounts.entries()) {
    if (data.resetAt < now) requestCounts.delete(ip);
  }
}
```

**Note:** In-memory rate limiting doesn't work well in Edge runtime. For production rate limiting, use Vercel KV or Upstash.

---

## Better Long-term Solutions

Instead of bot throttling, consider:

1. **Vercel Edge Config** - Store blocked IPs/UAs
2. **Vercel Firewall** - WAF rules (Enterprise only)
3. **Upstash Rate Limiting** - Persistent rate limits
4. **Cloudflare** - Bot management (if you're willing to add it)

---

**Remember: Bot throttling is a TEMPORARY emergency measure only!**
