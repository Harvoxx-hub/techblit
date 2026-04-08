import { getPostsApiUrl } from '@/lib/apiConfig';
import type { FounderRecord } from '@/lib/foundersConstants';

function unwrap<T>(json: { data?: T; success?: boolean } & Record<string, unknown>): T | null {
  if (json && typeof json === 'object' && 'data' in json && json.data !== undefined) {
    return json.data as T;
  }
  return json as unknown as T;
}

export async function fetchFounderBySlug(slug: string): Promise<FounderRecord | null> {
  const base = getPostsApiUrl();
  try {
    const res = await fetch(`${base}/founders/${encodeURIComponent(slug)}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = unwrap<FounderRecord>(json);
    return data && (data as FounderRecord).startup_name ? (data as FounderRecord) : null;
  } catch {
    return null;
  }
}

function approvedAtToIso(v: unknown): string {
  if (!v) return new Date().toISOString();
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null && 'seconds' in v) {
    const s = (v as { seconds: number }).seconds;
    return new Date(s * 1000).toISOString();
  }
  return new Date().toISOString();
}

export async function fetchFoundersForSitemap(): Promise<{ slug: string; approved_at?: string }[]> {
  const base = getPostsApiUrl();
  try {
    const res = await fetch(`${base}/founders?limit=1000&offset=0`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const payload = unwrap<{ items: FounderRecord[] }>(json);
    const items = payload?.items || [];
    return items
      .filter((i) => i.slug)
      .map((i) => ({
        slug: i.slug as string,
        approved_at: approvedAtToIso(i.approved_at),
      }));
  } catch {
    return [];
  }
}
