/**
 * API base URL for the backend (Railway).
 * Used by server components and server-side fetch.
 *
 * Production (Vercel): Set NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL in project
 * settings to this value, or leave unset to use the default below.
 */
export const DEFAULT_API_BASE_URL =
  'https://techblit-cloud-function-production.up.railway.app';

export function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || DEFAULT_API_BASE_URL
  );
}

export function getPostsApiUrl(): string {
  return `${getApiBaseUrl()}/api/v1`;
}
