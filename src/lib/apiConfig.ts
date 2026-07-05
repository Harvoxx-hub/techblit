/**
 * API base URL for the backend (Railway).
 *
 * Defaults to production so local `next dev` loads real posts without
 * running the cloud function. Override for local API:
 *   NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL=http://localhost:3000
 */
export const DEFAULT_API_BASE_URL =
  'https://techblit-cloud-function-production.up.railway.app'

export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL?.replace(/\/$/, '')
  if (configured) {
    return configured
  }

  return DEFAULT_API_BASE_URL
}

export function getPostsApiUrl(): string {
  return `${getApiBaseUrl()}/api/v1`;
}
