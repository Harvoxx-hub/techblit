'use client'

/**
 * next/image custom loader — serves image optimization from Cloudinary
 * instead of Vercel's `/_next/image` optimizer.
 *
 * Why this exists: post images already live on Cloudinary, and the app builds
 * fully-transformed Cloudinary URLs for them (see src/lib/cloudinaryUtils.ts —
 * e.g. `.../image/upload/f_auto,q_auto,w_1200/techblit/posts/<id>`). Passing
 * those through Vercel's optimizer on top was a second, redundant transform
 * that consumed the plan's Image Optimization quota and, once exhausted,
 * returned HTTP 402 (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED) for every new
 * image — which is why recent posts showed broken images.
 *
 * This loader rewrites the Cloudinary transformation segment to the width
 * next/image actually requested and lets Cloudinary's own CDN deliver it, so
 * `/_next/image` is never hit. Responsive `srcset` still works (Next calls
 * this once per width in images.deviceSizes / imageSizes).
 *
 * Anything that is not a Cloudinary delivery URL (local /public assets, the
 * favicon, other hosts) is returned untouched — unoptimized, but unbroken.
 */

interface LoaderArgs {
  src: string
  width: number
  /** next/image passes this (default 75); Cloudinary's q_auto beats a fixed
   *  number for byte size, and every URL the app builds already carries its
   *  own q_ token, so it is intentionally not used here. */
  quality?: number
}

const UPLOAD_MARKER = '/image/upload/'

/**
 * A path segment is a Cloudinary transformation list if it carries at least
 * one `key_value` token (`w_800`, `c_fill`, `f_auto`, `g_auto`…). A `v1729…`
 * version segment and the public id itself never match.
 */
const TRANSFORM_TOKEN = /(?:^|,)[a-z]{1,4}_[^,/]+/i

export default function cloudinaryImageLoader({ src, width }: LoaderArgs): string {
  const markerAt = src.indexOf(UPLOAD_MARKER)
  if (markerAt === -1 || !src.includes('res.cloudinary.com')) {
    return src
  }

  const base = src.slice(0, markerAt + UPLOAD_MARKER.length)
  const segments = src.slice(markerAt + UPLOAD_MARKER.length).split('/')

  const hasLeadingTransform =
    segments.length > 1 &&
    !/^v\d+$/.test(segments[0]) &&
    TRANSFORM_TOKEN.test(segments[0])

  const existing = hasLeadingTransform ? (segments.shift() as string).split(',') : []
  const publicPath = segments.join('/')

  // Keep a fixed-aspect crop (thumbSquare 1:1, social 1200x630) in proportion
  // when scaling to the width next/image asked for.
  const oldWidth = readToken(existing, 'w_')
  const oldHeight = readToken(existing, 'h_')

  const transform = existing.filter((t) => !/^(w_|h_|dpr_)/.test(t))

  if (!transform.some((t) => t.startsWith('f_'))) transform.push('f_auto')
  if (!transform.some((t) => t.startsWith('q_'))) transform.push('q_auto')
  if (!transform.some((t) => t.startsWith('c_'))) transform.push('c_limit')

  transform.push(`w_${width}`)
  if (oldWidth && oldHeight) {
    transform.push(`h_${Math.round((width * oldHeight) / oldWidth)}`)
  }

  return `${base}${transform.join(',')}/${publicPath}`
}

function readToken(tokens: string[], prefix: string): number | null {
  const hit = tokens.find((t) => t.startsWith(prefix))
  if (!hit) return null
  const value = Number(hit.slice(prefix.length))
  return Number.isFinite(value) ? value : null
}
