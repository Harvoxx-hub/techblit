import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel handles image optimization automatically
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'techblit.firebaseapp.com',
        pathname: '/**',
      },
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
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Enable React strict mode
  reactStrictMode: true,
  
  // TypeScript and ESLint
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
