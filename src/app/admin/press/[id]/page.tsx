'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import apiService from '@/lib/apiService';
import AdminLayout from '@/components/admin/AdminLayout';
import { withAuth } from '@/contexts/AuthContext';
import { Button, Alert, Badge, Select, Textarea } from '@/components/ui';
import { formatDateTime } from '@/lib/dateUtils';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'in_review', label: 'In review' },
  { value: 'payment_sent', label: 'Payment link sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'published', label: 'Published' },
  { value: 'declined', label: 'Declined' },
];

const PAYMENT_OPTIONS = [
  { value: 'awaiting_link', label: 'Awaiting link' },
  { value: 'link_sent', label: 'Link sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'waived', label: 'Waived' },
];

const money = (n: unknown) => (typeof n === 'number' ? `₦${n.toLocaleString('en-NG')}` : '—');

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium break-words">{children}</dd>
    </div>
  );
}

function PressSubmissionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const [status, setStatus] = useState('new');
  const [paymentStatus, setPaymentStatus] = useState('awaiting_link');
  const [adminNotes, setAdminNotes] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const row = (await apiService.getPressSubmission(id)) as Record<string, unknown>;
      setData(row);
      setStatus((row.status as string) || 'new');
      setPaymentStatus((row.paymentStatus as string) || 'awaiting_link');
      setAdminNotes((row.adminNotes as string) || '');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const save = async () => {
    setBusy(true);
    setSaved(false);
    try {
      const row = (await apiService.updatePressSubmission(id, {
        status,
        paymentStatus,
        adminNotes: adminNotes.trim(),
      })) as Record<string, unknown>;
      setData(row);
      setSaved(true);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) {
    return (
      <AdminLayout>
        <p className="text-gray-600">Loading…</p>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <Alert variant="danger">{error || 'Not found'}</Alert>
        <Link href="/admin/press" className="text-blue-600 mt-4 inline-block">
          ← Back to Brand Press
        </Link>
      </AdminLayout>
    );
  }

  const attribution = (data.attribution as Record<string, string> | undefined) || {};
  const utmEntries = Object.entries(attribution).filter(
    ([k, v]) => k.startsWith('utm_') && v,
  );
  const mailtoSubject = encodeURIComponent('Your TechBlit Brand Press feature');
  const mailtoBody = encodeURIComponent(
    `Hi ${String(data.name).split(' ')[0]},\n\nThanks for your submission. Here's your secure payment link for the ${money(
      data.quotedPrice,
    )} TechBlit Feature:\n\n[Paystack link]\n\nOnce payment clears we'll publish within 24–48 hours.\n\n— TechBlit`,
  );

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/admin/press" className="text-sm text-blue-600 hover:underline">
            ← Back to Brand Press
          </Link>
          <div className="flex flex-wrap gap-2">
            <a
              href={`mailto:${String(data.email)}?subject=${mailtoSubject}&body=${mailtoBody}`}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Email payment link
            </a>
            <Badge variant={data.status === 'paid' || data.status === 'published' ? 'success' : 'default'}>
              {String(data.status).replace('_', ' ')}
            </Badge>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{String(data.name)}</h1>
            <p className="text-sm text-gray-500">
              Submitted {data.created_at ? formatDateTime(data.created_at) : '—'} · TechBlit Feature ·{' '}
              {money(data.quotedPrice)}
            </p>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <Field label="Email">
              <a href={`mailto:${String(data.email)}`} className="text-blue-600">
                {String(data.email)}
              </a>
            </Field>
            <Field label="Phone / WhatsApp">{data.phone ? String(data.phone) : '—'}</Field>
            <Field label="Company / project">{data.company ? String(data.company) : '—'}</Field>
            <Field label="Story type">{data.storyType ? String(data.storyType) : '—'}</Field>
            <Field label="Doc link">
              {data.docUrl ? (
                <a href={String(data.docUrl)} target="_blank" rel="noreferrer" className="text-blue-600 break-all">
                  {String(data.docUrl)}
                </a>
              ) : (
                '—'
              )}
            </Field>
            <Field label="Consent recorded">
              {data.consentAt ? formatDateTime(data.consentAt) : '—'}
            </Field>
          </dl>

          <div className="text-sm">
            <p className="text-gray-500 mb-1">Story</p>
            <div className="whitespace-pre-wrap rounded-md bg-gray-50 p-4 text-gray-800">
              {String(data.storyText || '—')}
            </div>
          </div>

          {Boolean(data.links) && (
            <div className="text-sm">
              <p className="text-gray-500 mb-1">Links</p>
              <div className="whitespace-pre-wrap text-gray-800">{String(data.links)}</div>
            </div>
          )}

          {Boolean(data.notes) && (
            <div className="text-sm">
              <p className="text-gray-500 mb-1">Note to editor</p>
              <div className="whitespace-pre-wrap text-gray-800">{String(data.notes)}</div>
            </div>
          )}

          <div className="text-sm border-t border-gray-100 pt-4">
            <p className="text-gray-500 mb-1">Attribution</p>
            <p className="text-gray-700">
              {utmEntries.length
                ? utmEntries.map(([k, v]) => `${k}=${v}`).join('  ·  ')
                : 'No UTM parameters'}
            </p>
            <p className="text-gray-500 mt-1">
              Referrer: {attribution.referrer || '—'} · Page: {attribution.pagePath || '/press'}
            </p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Manage</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={STATUS_OPTIONS}
            />
            <Select
              label="Payment"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              options={PAYMENT_OPTIONS}
            />
          </div>
          <Textarea
            label="Internal notes"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
            variant="filled"
          />
          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={save} loading={busy}>
              Save changes
            </Button>
            {saved && <span className="text-sm text-green-600">Saved.</span>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(PressSubmissionDetailPage, 'manage_press');
