import { Suspense } from 'react';
import { Metadata } from 'next';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/ui/Footer';
import NewsletterStatusCard from '@/components/newsletter/NewsletterStatusCard';
import ConfirmClient from './ConfirmClient';

export const metadata: Metadata = {
  title: 'Confirm your subscription - TechBlit',
  description: 'Confirm your TechBlit newsletter subscription.',
  // The URL carries a one-time token, so it must never end up in an index.
  robots: { index: false, follow: false },
};

export default function NewsletterConfirmPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main>
        <Suspense
          fallback={
            <NewsletterStatusCard
              tone="working"
              eyebrow="One moment"
              title="Confirming your subscription"
              message="This will only take a second."
            />
          }
        >
          <ConfirmClient />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
