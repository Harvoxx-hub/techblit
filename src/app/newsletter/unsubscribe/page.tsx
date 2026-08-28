import { Suspense } from 'react';
import { Metadata } from 'next';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/ui/Footer';
import NewsletterStatusCard from '@/components/newsletter/NewsletterStatusCard';
import UnsubscribeClient from './UnsubscribeClient';

export const metadata: Metadata = {
  title: 'Unsubscribe - TechBlit',
  description: 'Unsubscribe from the TechBlit newsletter.',
  // The URL carries a per-subscriber token, so it must never end up in an index.
  robots: { index: false, follow: false },
};

export default function NewsletterUnsubscribePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main>
        <Suspense
          fallback={
            <NewsletterStatusCard
              tone="working"
              eyebrow="Unsubscribe"
              title="Leaving the TechBlit newsletter?"
              message="One moment…"
            />
          }
        >
          <UnsubscribeClient />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
