import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel handles image optimization automatically
  images: {
    domains: ['firebasestorage.googleapis.com', 'techblit.firebaseapp.com'],
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
