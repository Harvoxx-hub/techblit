'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { withAuth } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';
import BulkEmailComposer from '@/components/admin/BulkEmailComposer';
import BulkEmailCampaigns from '@/components/admin/BulkEmailCampaigns';
import { EnvelopeIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

function BulkEmailsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'compose' | 'campaigns'>('compose');

  // Only super admins can access this page
  if (user?.role !== 'super_admin') {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You must be a super admin to access bulk emails.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bulk Emails</h1>
            <p className="mt-2 text-sm text-gray-600">
              Send personalized bulk emails to multiple recipients
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('compose')}
              className={`
                flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === 'compose'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <EnvelopeIcon className="h-5 w-5" />
              <span>Compose</span>
            </button>
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`
                flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === 'campaigns'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <ListBulletIcon className="h-5 w-5" />
              <span>Campaigns</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'compose' && <BulkEmailComposer />}
          {activeTab === 'campaigns' && <BulkEmailCampaigns />}
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(BulkEmailsPage);
