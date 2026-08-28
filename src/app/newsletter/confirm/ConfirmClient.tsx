'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { confirmNewsletterSubscription } from '@/lib/newsletter';
import NewsletterStatusCard from '@/components/newsletter/NewsletterStatusCard';

type State = { status: 'working' } | { status: 'done'; success: boolean; message: string };

export default function ConfirmClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<State>({ status: 'working' });

  // React runs effects twice in development StrictMode; the confirm endpoint is
  // idempotent, but there's no reason to call it twice either.
  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) return;
    requested.current = true;

    let active = true;
    confirmNewsletterSubscription(token).then((result) => {
      if (!active) return;
      setState({ status: 'done', success: result.success, message: result.message });
    });

    return () => {
      active = false;
    };
  }, [token]);

  // A link with no token never had a request to make, so this is a render-time
  // outcome rather than something the effect has to discover.
  if (!token) {
    return (
      <NewsletterStatusCard
        tone="error"
        eyebrow="Invalid link"
        title="This link is incomplete"
        message="It's missing its confirmation code. Please use the link exactly as it appears in your email."
      >
        <Link
          href="/#footer-newsletter"
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-3 font-medium text-white transition-colors hover:bg-slate-800"
        >
          Subscribe again
        </Link>
      </NewsletterStatusCard>
    );
  }

  if (state.status === 'working') {
    return (
      <NewsletterStatusCard
        tone="working"
        eyebrow="One moment"
        title="Confirming your subscription"
        message="This will only take a second."
      />
    );
  }

  if (!state.success) {
    return (
      <NewsletterStatusCard
        tone="error"
        eyebrow="Not confirmed"
        title="We couldn't confirm this link"
        message={state.message}
      >
        <Link
          href="/#footer-newsletter"
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-3 font-medium text-white transition-colors hover:bg-slate-800"
        >
          Subscribe again
        </Link>
      </NewsletterStatusCard>
    );
  }

  return (
    <NewsletterStatusCard
      tone="success"
      eyebrow="Confirmed"
      title="You're on the list"
      message={state.message}
    >
      <Link
        href="/blog"
        className="inline-flex items-center justify-center rounded-lg bg-yellow-400 px-6 py-3 font-medium text-slate-900 transition-colors hover:bg-yellow-500"
      >
        Start reading
      </Link>
    </NewsletterStatusCard>
  );
}
