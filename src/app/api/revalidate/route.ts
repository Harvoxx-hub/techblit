import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const REVALIDATE_SECRET = process.env.VERCEL_REVALIDATE_SECRET;

/**
 * POST /api/revalidate
 *
 * 1) Backend (automatic): POST with body { paths: ["/slug", "/"] } and
 *    header Authorization: Bearer <VERCEL_REVALIDATE_SECRET>
 *
 * 2) Manual: POST /api/revalidate?slug=article-slug
 *    Optional: ?secret=xxx or Authorization: Bearer xxx
 *
 * Set VERCEL_REVALIDATE_SECRET in Vercel and in your backend (Railway) so
 * publish/update automatically clears cache and 404s don't stick.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const bearerSecret = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;
  const querySecret = request.nextUrl.searchParams.get('secret');
  const slugParam = request.nextUrl.searchParams.get('slug');

  const secret = bearerSecret || querySecret;
  const hasValidSecret =
    REVALIDATE_SECRET && secret && secret === REVALIDATE_SECRET;

  // Paths to revalidate
  let paths: string[] = [];

  // Manual: ?slug= works. If VERCEL_REVALIDATE_SECRET is set, require secret for slug too.
  if (slugParam && (hasValidSecret || !REVALIDATE_SECRET)) {
    if (
      slugParam.includes('/') ||
      slugParam.includes('..') ||
      slugParam.length === 0
    ) {
      return NextResponse.json(
        { error: 'Invalid slug' },
        { status: 400 }
      );
    }
    paths.push(`/${slugParam}`);
  }

  if (paths.length === 0 && hasValidSecret) {
    try {
      const body = await request.json();
      const bodyPaths = Array.isArray(body?.paths) ? body.paths : [];
      for (const p of bodyPaths) {
        if (typeof p === 'string' && p.startsWith('/') && !p.includes('..')) {
          paths.push(p);
        }
      }
    } catch {
      // No body or invalid JSON
    }
  }

  if (paths.length === 0) {
    return NextResponse.json(
      { error: 'Missing slug, or paths in body with valid secret' },
      { status: 400 }
    );
  }

  try {
    for (const path of paths) {
      revalidatePath(path);
    }
    return NextResponse.json({ revalidated: true, paths });
  } catch (err) {
    console.error('Revalidate error:', err);
    return NextResponse.json(
      { error: 'Revalidation failed' },
      { status: 500 }
    );
  }
}
