'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import apiService from '@/lib/apiService';
import AdminLayout from '@/components/admin/AdminLayout';
import { withAuth } from '@/contexts/AuthContext';
import { Button, Alert, Modal, Textarea, Input } from '@/components/ui';

function FounderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const row = await apiService.getFounderApplicationById(id);
      setData(row as Record<string, unknown>);
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

  const approve = async () => {
    if (!confirm('Approve and publish this profile?')) return;
    setBusy(true);
    try {
      const res = await apiService.approveFounderApplication(id);
      alert(`Approved. Profile: ${res.profileUrl || ''}`);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Approve failed');
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!rejectReason.trim()) return;
    setBusy(true);
    try {
      await apiService.rejectFounderApplication(id, rejectReason.trim());
      setRejectOpen(false);
      setRejectReason('');
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Reject failed');
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
        <Link href="/admin/founders" className="text-blue-600 mt-4 inline-block">
          ← Back to queue
        </Link>
      </AdminLayout>
    );
  }

  const status = data.status as string;
  const slug = data.slug as string | undefined;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/admin/founders" className="text-sm text-blue-600 hover:underline">
            ← Back to queue
          </Link>
          <div className="flex flex-wrap gap-2">
            {status === 'pending' && (
              <>
                <Button variant="primary" onClick={approve} loading={busy}>
                  Approve
                </Button>
                <Button variant="danger" onClick={() => setRejectOpen(true)} disabled={busy}>
                  Reject
                </Button>
              </>
            )}
            {status === 'approved' && slug && (
              <Button
                variant="outline"
                onClick={() => window.open(`/founders/${slug}`, '_blank')}
              >
                View live profile
              </Button>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {(data.startup_name as string) || 'Application'}
          </h1>
          <p className="text-sm text-gray-500">Status: {status}</p>

          <div className="flex gap-6 flex-wrap">
            {Boolean(data.profile_photo_url) && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Profile photo</p>
                <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100">
                  <Image
                    src={data.profile_photo_url as string}
                    alt=""
                    width={128}
                    height={128}
                    className="object-cover"
                  />
                </div>
              </div>
            )}
            {Boolean(data.startup_logo_url) && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Startup logo</p>
                <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100 border">
                  <Image
                    src={data.startup_logo_url as string}
                    alt=""
                    width={128}
                    height={128}
                    className="object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Full name</dt>
              <dd className="font-medium">{String(data.full_name)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium">{String(data.email)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd>{data.phone ? String(data.phone) : '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Region / State</dt>
              <dd>
                {String(data.region)} / {String(data.state)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Industry</dt>
              <dd>{Array.isArray(data.industry) ? data.industry.join(', ') : '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Stage</dt>
              <dd>{String(data.stage)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Year founded</dt>
              <dd>{String(data.year_founded)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Funding</dt>
              <dd className="capitalize">
                {String(data.is_funded)}
                {data.is_funded === 'yes' && data.funding_stage
                  ? ` (${String(data.funding_stage)})`
                  : ''}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-gray-500">One-liner</dt>
              <dd>{String(data.one_liner)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-gray-500">What are you building?</dt>
              <dd className="whitespace-pre-wrap">{String(data.what_building)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-gray-500">Problem</dt>
              <dd className="whitespace-pre-wrap">{String(data.problem_solving)}</dd>
            </div>
            {Boolean(data.linkedin_url) && (
              <div className="sm:col-span-2">
                <dt className="text-gray-500">LinkedIn</dt>
                <dd>
                  <a href={String(data.linkedin_url)} className="text-blue-600 break-all">
                    {String(data.linkedin_url)}
                  </a>
                </dd>
              </div>
            )}
            {Boolean(data.twitter_handle) && (
              <div>
                <dt className="text-gray-500">X / Twitter</dt>
                <dd>{String(data.twitter_handle)}</dd>
              </div>
            )}
            {Boolean(data.startup_website) && (
              <div className="sm:col-span-2">
                <dt className="text-gray-500">Website</dt>
                <dd>
                  <a href={String(data.startup_website)} className="text-blue-600 break-all">
                    {String(data.startup_website)}
                  </a>
                </dd>
              </div>
            )}
            {status === 'rejected' && Boolean(data.rejection_reason) && (
              <div className="sm:col-span-2">
                <dt className="text-gray-500">Rejection reason</dt>
                <dd className="text-red-800 whitespace-pre-wrap">
                  {String(data.rejection_reason)}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <Modal isOpen={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject application">
        <div className="space-y-4">
          <Textarea
            label="Reason (required)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            variant="filled"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={reject} loading={busy} disabled={!rejectReason.trim()}>
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}

export default withAuth(FounderDetailPage, 'manage_founders');
