'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiService from '@/lib/apiService';
import AdminLayout from '@/components/admin/AdminLayout';
import { withAuth } from '@/contexts/AuthContext';
import { Button, Input, Badge, Spinner } from '@/components/ui';
import { formatDateTime } from '@/lib/dateUtils';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

type Row = {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  storyType?: string;
  quotedPrice?: number | null;
  status: string;
  paymentStatus?: string;
  attribution?: { utm_source?: string; utm_campaign?: string; referrer?: string | null };
  created_at?: unknown;
};

const STATUS_TABS = ['all', 'new', 'in_review', 'payment_sent', 'paid', 'published', 'declined'] as const;

const statusBadge = (s: string): 'success' | 'danger' | 'warning' | 'default' => {
  if (s === 'paid' || s === 'published') return 'success';
  if (s === 'declined') return 'danger';
  if (s === 'new') return 'warning';
  return 'default';
};

const money = (n?: number | null) => (typeof n === 'number' ? `₦${n.toLocaleString('en-NG')}` : '—');

const source = (a?: Row['attribution']) => {
  if (!a) return '—';
  if (a.utm_source || a.utm_campaign) return `${a.utm_source || '—'} / ${a.utm_campaign || '—'}`;
  return a.referrer || 'direct';
};

function PressQueuePage() {
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>('all');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = (await apiService.listPressSubmissions({
          status,
          search: debounced || undefined,
          limit: 200,
        })) as Row[];
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [status, debounced]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brand Press</h1>
          <p className="mt-1 text-sm text-gray-500">
            Story submissions from <span className="font-mono text-xs">/press</span>. Review, then send a
            Paystack link and advance the status.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-4 flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((s) => (
              <Button
                key={s}
                type="button"
                variant={status === s ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatus(s)}
              >
                {s === 'all' ? 'All' : s.replace('_', ' ')}
              </Button>
            ))}
          </div>
          <div className="flex-1 max-w-md">
            <Input
              label="Search"
              placeholder="Name, email, company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
              variant="filled"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="bg-white shadow overflow-x-auto sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Submitted', 'Name', 'Company', 'Type', 'Quoted', 'Source', 'Status', ''].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {r.created_at ? formatDateTime(r.created_at) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {r.name}
                      <span className="block text-xs text-gray-400">{r.email}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.company || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{r.storyType || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{money(r.quotedPrice)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{source(r.attribution)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={statusBadge(r.status)}>{r.status.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-sm whitespace-nowrap">
                      <Link
                        href={`/admin/press/${r.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <p className="text-center py-12 text-gray-500">No submissions in this view.</p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default withAuth(PressQueuePage, 'manage_press');
