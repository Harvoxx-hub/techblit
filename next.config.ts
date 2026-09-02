import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Canonical URL consistency (no trailing slash)
  trailingSlash: false,

  // Performance optimizations
  compress: true,
  
  // Image optimization
  //
  // Images are served through Cloudinary's CDN via a custom loader
  // (src/lib/cloudinaryImageLoader.ts), NOT Vercel's `/_next/image` optimizer.
  // Post images already arrive as fully-transformed Cloudinary URLs, so
  // double-optimizing through Vercel was redundant and exhausted the plan's
  // Image Optimization quota (HTTP 402 on new images). deviceSizes/imageSizes
  // still drive the responsive `srcset` widths passed to the loader; formats,
  // minimumCacheTTL and the SVG/CSP options only affect the built-in
  // optimizer and are now inert but kept for reference.
  images: {
    loader: 'custom',
    loaderFile: './src/lib/cloudinaryImageLoader.ts',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'techblit.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'techblit.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Enable React strict mode
  reactStrictMode: true,
  
  // TypeScript and ESLint
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['@heroicons/react', 'framer-motion'],
  },
  
  // Redirect non-www to www (canonical host)
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'techblit.com' }],
        destination: 'https://www.techblit.com/:path*',
        permanent: true,
      },
    ];
  },

  // Headers for better caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'index, follow',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
