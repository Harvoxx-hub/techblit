/**
 * IndexNow submission.
 *
 * IndexNow tells Bing, Yandex, Seznam and others about new/changed URLs
 * immediately instead of waiting for the next crawl. This matters for AI
 * visibility because ChatGPT Search is built on Bing's index — a fresh
 * article can be citable within minutes rather than days.
 *
 * The key is intentionally public: it is served verbatim at
 * https://www.techblit.com/<key>.txt to prove domain ownership.
 */

const INDEXNOW_KEY = '2af99458d9ef85a226675a46f8f6ef65'
const HOST = 'www.techblit.com'
const ENDPOINT = 'https://api.indexnow.org/indexnow'

export async function submitToIndexNow(paths: string[]): Promise<void> {
  const urlList = Array.from(
    new Set(
      paths
        .filter((p) => typeof p === 'string' && p.startsWith('/'))
        .map((p) => `https://${HOST}${p}`),
    ),
  )
  if (urlList.length === 0) return

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    })
    // 200 = accepted, 202 = accepted (validation pending). Anything else is
    // logged but never allowed to affect the caller (revalidation, etc.).
    if (!res.ok && res.status !== 202) {
      console.warn(`IndexNow returned ${res.status} for ${urlList.length} URL(s)`)
    }
  } catch (error) {
    console.warn('IndexNow submission failed:', error)
  }
}
