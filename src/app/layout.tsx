import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Optimize font loading
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

const SITE_URL = 'https://www.techblit.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "TechBlit - Igniting Africa's Tech Conversation",
  description: "Discover the latest tech news, startup insights, funding rounds, and innovation stories from across Africa. Your destination for African tech ecosystem coverage.",
  keywords: ['African tech', 'startups', 'technology news', 'innovation', 'funding', 'FinTech', 'AI', 'Nigeria tech', 'African technology', 'tech ecosystem'],
  authors: [{ name: 'TechBlit Team' }],
  creator: 'TechBlit',
  publisher: 'TechBlit',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'TechBlit',
    title: "TechBlit - Igniting Africa's Tech Conversation",
    description: "Discover the latest tech news, startup insights, funding rounds, and innovation stories from across Africa.",
    images: [{
      url: '/api/og',
      width: 1200,
      height: 630,
      alt: "TechBlit - Igniting Africa's Tech Conversation",
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "TechBlit - Igniting Africa's Tech Conversation",
    description: "Discover the latest tech news, startup insights, funding rounds, and innovation stories from across Africa.",
    images: ['/api/og'],
    creator: '@techblit',
    site: '@techblit',
  },
  robots: {
    // Only index production environment (not preview/dev deployments)
    index: process.env.VERCEL_ENV === 'production',
    follow: process.env.VERCEL_ENV === 'production',
    googleBot: {
      index: process.env.VERCEL_ENV === 'production',
      follow: process.env.VERCEL_ENV === 'production',
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TechBlit',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: "Igniting Africa's Tech Conversation",
    sameAs: [
      'https://twitter.com/techblit',
      'https://facebook.com/techblit',
      'https://linkedin.com/company/techblit',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Editorial',
      email: 'hello@techblit.com',
    },
  };

  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`font-sans antialiased ${inter.className}`}
        suppressHydrationWarning={true}
      >
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-8MTJTQ7N85"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-8MTJTQ7N85');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
