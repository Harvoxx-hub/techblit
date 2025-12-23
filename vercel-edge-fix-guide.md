# Vercel Edge Request Spike – Engineering Fix Guide

## Context
- **Domain migrated from:** WordPress → Next.js hosted on Vercel  
- **Issue:** ~1M Edge Requests/day with no real user traffic  
- **Status:** URGENT – Immediate action required

---

## 1. Root Cause Summary (Read First)

This spike is **expected behavior** after migrating a previously indexed WordPress domain.

### Key causes:
- Legacy WordPress URLs are still being crawled (`/wp-admin`, `/xmlrpc.php`, etc.)
- Bots and SEO crawlers aggressively re-index after DNS change
- Edge Middleware is likely applied **globally**
- Every bot request counts as an Edge Request on Vercel
- **This is NOT real user traffic**

---

## 2. Mandatory Fixes (Implement Immediately)

### ✅ A. Restrict Edge Middleware Scope (CRITICAL)

**Do NOT apply middleware globally.**

❌ **Bad:**
```typescript
export const config = {
  matcher: "/:path*"
}
```

✅ **Correct:**
```typescript
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/secure/:path*"
    // Only paths that NEED middleware
  ]
}
```

> **Note:** If this is a marketing site, middleware may not be needed at all.

---

### ✅ B. Block Legacy WordPress Routes at Edge

Add this at the **top** of `middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const blockedPaths = [
    "/wp-admin",
    "/wp-login.php",
    "/wp-json",
    "/xmlrpc.php",
    "/wp-content",
    "/wp-includes",
  ];

  if (blockedPaths.some(p => request.nextUrl.pathname.startsWith(p))) {
    return new Response("Not Found", { status: 404 });
  }

  // Rest of your middleware logic...
}
```

This prevents infinite bot retries.

---

### ✅ C. Exclude Static Assets from Middleware

Middleware **must NOT** run on:
- `/_next/*` (Next.js internals)
- `/favicon.ico`
- `/images/*`
- `/fonts/*`
- `/robots.txt`
- `/sitemap.xml`

**Updated matcher example:**
```typescript
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|fonts|robots.txt|sitemap.xml).*)',
  ],
}
```

---

### ✅ D. Add robots.txt (Immediate)

Create `/public/robots.txt`:

```txt
User-agent: *
Disallow: /wp-admin
Disallow: /wp-login.php
Disallow: /wp-json
Disallow: /xmlrpc.php
Disallow: /wp-content
Disallow: /wp-includes

# Allow legitimate crawling
Allow: /
Sitemap: https://yourdomain.com/sitemap.xml
```

This reduces crawl retries from legitimate bots.

---

### ✅ E. Temporary Bot Throttling (Recommended)

Implement short-term bot blocking in middleware:

```typescript
export function middleware(request: NextRequest) {
  const ua = request.headers.get("user-agent") || "";

  // Temporary aggressive bot blocking (24-72 hours)
  if (/bot|crawler|spider|ahrefs|semrush|mj12|scrapy|curl|wget/i.test(ua)) {
    return new Response("Forbidden", { status: 403 });
  }

  // Your other middleware logic...
}
```

⚠️ **Use for 24–72 hours only** to stabilize traffic, then remove or refine.

---

## 3. Structural Improvements (Strongly Recommended)

### 🔧 1. Remove Auth Logic from Edge (If Possible)

Move authentication checks to:
- **Server Actions** (recommended)
- **API Routes** (`/app/api/*`)
- **Route Handlers**

Edge should be **lightweight routing only**.

**Example refactor:**
```typescript
// ❌ Before: Heavy auth in middleware
export function middleware(request: NextRequest) {
  const session = await getSession(); // Heavy operation
  if (!session) return NextResponse.redirect('/login');
}

// ✅ After: Check in server component/action
async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  return <Dashboard />;
}
```

---

### 🔧 2. Prevent Redirect Loops

Audit for:
- Auth → redirect → auth → redirect loops
- Locale redirects
- HTTP → HTTPS → WWW loops
- Middleware redirect chains

**One loop can generate 10–50 requests per visit.**

**Check your middleware for:**
```typescript
// ⚠️ Potential loop
if (!isAuthenticated) {
  return NextResponse.redirect('/login');
}
if (isLoginPage && isAuthenticated) {
  return NextResponse.redirect('/dashboard');
}
```

Add logging to detect loops:
```typescript
console.log('[Middleware] Path:', request.nextUrl.pathname);
```

---

### 🔧 3. Ensure Preview URLs Are Not Indexed

Confirm:
- `*.vercel.app` URLs have `noindex` meta tags
- No external links pointing to preview deployments
- Google Search Console shows no `vercel.app` pages

**Add to preview deployments:**
```typescript
// app/layout.tsx
export const metadata = {
  robots: {
    index: process.env.VERCEL_ENV === 'production',
    follow: process.env.VERCEL_ENV === 'production',
  },
}
```

---

### 🔧 4. Submit Updated Sitemap to Google

In Google Search Console:
1. Submit new sitemap (`yourdomain.com/sitemap.xml`)
2. Request removal of old WordPress URLs
3. Temporarily lower crawl rate (Settings → Crawl Rate)
4. Use URL Inspection Tool to force re-crawl of important pages

---

## 4. Monitoring Checklist

After implementing fixes:

- [ ] Monitor Edge Requests in Vercel dashboard (should drop significantly within 24 hours)
- [ ] Inspect Edge Function logs for errors or patterns
- [ ] Watch for repeating IPs or paths in logs
- [ ] Check for 404s on legitimate routes
- [ ] Verify auth flows still work correctly
- [ ] Test all critical user journeys

**Expected timeline:**
- **24 hours:** 30-50% reduction
- **72 hours:** 70-80% reduction
- **7 days:** Traffic should normalize to actual user levels

---

## 5. Code Audit Checklist (Developer Action Required)

Please audit the codebase for:

### A. Middleware Review
- [ ] Is middleware globally scoped? (Fix: restrict matcher)
- [ ] Does it run on static assets? (Fix: exclude in matcher)
- [ ] Does it perform heavy operations? (Fix: move to server)
- [ ] Are there redirect loops? (Fix: add guards)

### B. Edge Function Usage
- [ ] List all files using Edge Runtime
- [ ] Verify each Edge function is necessary
- [ ] Check for polling or background fetches
- [ ] Ensure no infinite loops or retries

### C. External Integrations
- [ ] Check for webhooks hitting Vercel URLs
- [ ] Verify no monitoring tools auto-refreshing pages
- [ ] Confirm no external services polling the domain

### D. Bot Traffic
- [ ] Review analytics for suspicious patterns
- [ ] Check server logs for bot user agents
- [ ] Identify top 10 most-hit endpoints

---

## 6. Recommended Next Steps

1. **Immediate (Today):**
   - Implement Fixes A, B, C, D from Section 2
   - Deploy to production
   - Monitor for 1 hour

2. **Short-term (This Week):**
   - Implement Fix E (bot throttling)
   - Complete code audit (Section 5)
   - Refactor middleware if needed (Section 3.1)

3. **Medium-term (Next 2 Weeks):**
   - Submit sitemap to Google
   - Remove bot throttling once traffic stabilizes
   - Optimize remaining Edge functions

---

## 7. Communication Plan

### Before Deployment
- [ ] Review all changes with team
- [ ] Test in preview environment
- [ ] Prepare rollback plan

### After Deployment
- [ ] Share Vercel dashboard access for monitoring
- [ ] Send hourly Edge Request count for first 6 hours
- [ ] Report any errors or issues immediately
- [ ] Provide findings and recommendations within 48 hours

---

## 8. Final Notes (Important)

> **Edge Middleware on Vercel is NOT equivalent to WordPress request handling.**  
> It must be surgically scoped, or bots will burn usage instantly.

### Key Principles:
1. **Edge = Fast routing only** (redirects, headers, simple checks)
2. **Server = Heavy logic** (auth, database, APIs)
3. **Static = No execution** (HTML, CSS, images)

### Expected Outcome:
After fixes, Edge Requests should drop from **~1M/day** to **<50K/day** (actual user traffic).

---

## 9. Support & Escalation

If issues persist after 72 hours:
1. Export full Vercel logs
2. Share middleware code + config
3. Provide analytics data
4. Schedule call to review architecture

---

## Questions for Developer

Before starting, please answer:

1. **What does your middleware currently do?** (Auth? Redirects? Logging?)
2. **Do you have any Edge Functions besides middleware?**
3. **Are there any background jobs or cron tasks?**
4. **What's the expected monthly traffic?** (Real users)
5. **Any third-party integrations hitting your domain?**

---

**Document Version:** 1.0  
**Last Updated:** December 23, 2025  
**Status:** Ready for Implementation

---

## Appendix: Useful Commands

```bash
# Check current middleware config
cat middleware.ts

# View recent Vercel logs
vercel logs --follow

# Analyze Edge Request patterns
vercel logs | grep "Edge Request" | tail -100

# Deploy with monitoring
vercel --prod && vercel logs --follow
```

---

**Good luck! This should resolve the issue within 24-72 hours.** 🚀
