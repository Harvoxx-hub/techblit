# robots.txt Route - DISABLED

**Status:** Disabled for Edge Request optimization

## Why Disabled?

This dynamic route handler was disabled as part of Vercel Edge Request optimization (Dec 23, 2025).

### Issues:
1. Made API calls to fetch custom settings (slow, adds Edge requests)
2. Conflicted with static `public/robots.txt` file
3. Bots need fast robots.txt responses - static is always faster

### Current Setup:
- **Active:** `public/robots.txt` (static file served directly by Vercel)
- **Disabled:** `src/app/robots.txt/route.ts.backup` (this dynamic route)

### Benefits of Static:
- No Edge runtime execution
- No API calls
- Instant response (CDN cached)
- Better for bot management
- Reduces Edge Requests significantly

## To Re-enable (Not Recommended):

If you need dynamic robots.txt:

1. Rename `route.ts.backup` → `route.ts`
2. Add this to the route to prevent Edge runtime:
   ```typescript
   export const runtime = 'nodejs';
   export const dynamic = 'force-dynamic';
   ```
3. Remove or rename `public/robots.txt`

## Better Alternative:

If you need custom robots.txt rules, update `public/robots.txt` directly and deploy. This is faster and more efficient than dynamic generation.
