'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiService from '@/lib/apiService';
import AdminLayout from '@/components/admin/AdminLayout';
import { withAuth } from '@/contexts/AuthContext';
import { Button, Input, Badge, Spinner } from '@/components/ui';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

type Row = {
  id: string;
  full_name: string;
  startup_name: string;
  region: string;
  industry?: string[];
  stage: string;
  status: string;
  created_at?: unknown;
};

function FoundersQueuePage() {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
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
        const data = (await apiService.listFounderApplications({
          status,
          search: debounced || undefined,
          limit: 100,
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
          <h1 className="text-2xl font-bold text-gray-900">Founder&apos;s Repository</h1>
          <p className="mt-1 text-sm text-gray-500">Review applications and manage live profiles.</p>
        </div>

        <div className="bg-white shadow rounded-lg p-4 flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="flex flex-wrap gap-2">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
              <Button
                key={s}
                type="button"
                variant={status === s ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatus(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>
          <div className="flex-1 max-w-md">
            <Input
              label="Search"
              placeholder="Name, startup, email…"
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
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Applicant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Startup
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Region
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Industry
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{r.full_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{r.startup_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.region}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {(r.industry || []).slice(0, 2).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.stage}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          r.status === 'approved'
                            ? 'success'
                            : r.status === 'rejected'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <Link
                        href={`/admin/founders/${r.id}`}
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
              <p className="text-center py-12 text-gray-500">No applications in this view.</p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default withAuth(FoundersQueuePage, 'manage_founders');
