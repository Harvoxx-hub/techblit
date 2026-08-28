import Link from 'next/link';
import { ReactNode } from 'react';

export type StatusTone = 'working' | 'success' | 'error';

const toneStyles: Record<StatusTone, { badge: string; heading: string }> = {
  working: { badge: 'bg-gray-100 text-gray-500', heading: 'text-gray-900' },
  success: { badge: 'bg-yellow-100 text-yellow-700', heading: 'text-gray-900' },
  error: { badge: 'bg-red-50 text-red-700', heading: 'text-gray-900' },
};

interface NewsletterStatusCardProps {
  tone: StatusTone;
  eyebrow: string;
  title: string;
  message: string;
  children?: ReactNode;
}

/**
 * Shared shell for the confirm and unsubscribe landing pages — both are a
 * single outcome the reader arrives at from an email, so they get the same
 * quiet, centered treatment rather than a full page of site furniture.
 */
export default function NewsletterStatusCard({
  tone,
  eyebrow,
  title,
  message,
  children,
}: NewsletterStatusCardProps) {
  const styles = toneStyles[tone];

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-20 sm:py-28">
      <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm sm:p-10">
        <span
          className={`mb-6 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${styles.badge}`}
        >
          {eyebrow}
        </span>

        <h1 className={`mb-3 text-2xl font-bold sm:text-3xl ${styles.heading}`}>{title}</h1>

        <p className="mx-auto max-w-md text-gray-600">{message}</p>

        {children ? <div className="mt-8">{children}</div> : null}

        <div className="mt-8 border-t border-gray-100 pt-6">
          <Link href="/" className="text-sm font-medium text-yellow-600 hover:underline">
            Back to TechBlit
          </Link>
        </div>
      </div>
    </div>
  );
}
