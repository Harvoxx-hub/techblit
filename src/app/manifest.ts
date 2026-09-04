import type { MetadataRoute } from 'next'

/**
 * Web App Manifest.
 *
 * Served at /manifest.webmanifest and auto-linked from every page.
 * Supplies the square, high-resolution icons that Chromium-based browsers
 * (Chrome, Edge, Opera / Opera's Speed Dial) use to render the site tile,
 * plus a maskable variant for Android adaptive icons.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TechBlit - Igniting Africa's Tech Conversation",
    short_name: 'TechBlit',
    description:
      'Discover the latest tech news, startup insights, funding rounds, and innovation stories from across Africa.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#00102B',
    theme_color: '#00102B',
    icons: [
      {
        src: '/favicon-96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
