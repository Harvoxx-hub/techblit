'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { unsubscribeFromNewsletter } from '@/lib/newsletter';
import NewsletterStatusCard from '@/components/newsletter/NewsletterStatusCard';

type State =
  | { status: 'idle' }
  | { status: 'working' }
  | { status: 'done'; success: boolean; message: string };

export default function UnsubscribeClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<State>({ status: 'idle' });

  // Nothing happens on load. Mail scanners follow links in emails, and an
  // unsubscribe that fired on page view would drop readers off the list
  // without them ever asking. The button below is the actual request.
  const handleUnsubscribe = async () => {
    if (!token) return;
    setState({ status: 'working' });
    const result = await unsubscribeFromNewsletter(token);
    setState({ status: 'done', success: result.success, message: result.message });
  };

  if (!token) {
    return (
      <NewsletterStatusCard
        tone="error"
        eyebrow="Invalid link"
        title="This link is incomplete"
        message="Please use the unsubscribe link from one of our emails, or reply to any of them and we'll remove you."
      />
    );
  }

  if (state.status === 'done') {
    return (
      <NewsletterStatusCard
        tone={state.success ? 'success' : 'error'}
        eyebrow={state.success ? 'Unsubscribed' : "Didn't work"}
        title={state.success ? 'You’re unsubscribed' : "We couldn't unsubscribe you"}
        message={state.message}
      />
    );
  }

  return (
    <NewsletterStatusCard
      tone="working"
      eyebrow="Unsubscribe"
      title="Leaving the TechBlit newsletter?"
      message="Confirm below and we'll stop sending. You can subscribe again at any time."
    >
      <button
        type="button"
        onClick={handleUnsubscribe}
        disabled={state.status === 'working'}
        className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-3 font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state.status === 'working' ? 'Unsubscribing…' : 'Unsubscribe me'}
      </button>
    </NewsletterStatusCard>
  );
}
