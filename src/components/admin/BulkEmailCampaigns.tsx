'use client';

import { useState, useEffect } from 'react';
import apiService from '@/lib/apiService';
import { Card, CardContent, Badge, Button, Dropdown, Spinner, Alert } from '@/components/ui';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  EyeIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { formatDateShort } from '@/lib/dateUtils';

interface Campaign {
  campaignId: string;
  subject: string;
  recipientCount: number;
  status: 'queued' | 'sending' | 'completed' | 'failed';
  progress: number;
  sent: number;
  failed: number;
  createdBy: {
    uid: string;
    name: string;
    email?: string;
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export default function BulkEmailCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'queued' | 'sending' | 'completed' | 'failed'>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [pollingCampaigns, setPollingCampaigns] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCampaigns();
  }, [statusFilter]);

  // Poll for active campaigns
  useEffect(() => {
    const activeCampaigns = campaigns.filter(
      (c) => c.status === 'queued' || c.status === 'sending'
    );
    
    if (activeCampaigns.length === 0) {
      setPollingCampaigns(new Set());
      return;
    }

    const campaignIds = new Set(activeCampaigns.map((c) => c.campaignId));
    setPollingCampaigns(campaignIds);

    const interval = setInterval(() => {
      activeCampaigns.forEach((campaign) => {
        fetchCampaignStatus(campaign.campaignId);
      });
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [campaigns]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { limit: 50 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const result = await apiService.getBulkEmailCampaigns(params);
      const campaignsData = result.data?.campaigns || result.campaigns || result;
      setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch campaigns');
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignStatus = async (campaignId: string) => {
    try {
      const result = await apiService.getBulkEmailCampaign(campaignId);
      const campaignData = result.data || result;
      
      setCampaigns((prev) =>
        prev.map((c) =>
          c.campaignId === campaignId
            ? { ...c, ...campaignData }
            : c
        )
      );
    } catch (err) {
      console.error('Error fetching campaign status:', err);
    }
  };

  const getStatusBadge = (status: Campaign['status']) => {
    const variants = {
      queued: { variant: 'info' as const, icon: ClockIcon, label: 'Queued' },
      sending: { variant: 'warning' as const, icon: ArrowPathIcon, label: 'Sending' },
      completed: { variant: 'success' as const, icon: CheckCircleIcon, label: 'Completed' },
      failed: { variant: 'danger' as const, icon: XCircleIcon, label: 'Failed' },
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <config.icon className="h-4 w-4" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const handleViewDetails = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    // Fetch latest status
    await fetchCampaignStatus(campaign.campaignId);
  };

  if (loading && campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <Dropdown
            label="Filter by Status"
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as any)}
            options={[
              { value: 'all', label: 'All Campaigns' },
              { value: 'queued', label: 'Queued' },
              { value: 'sending', label: 'Sending' },
              { value: 'completed', label: 'Completed' },
              { value: 'failed', label: 'Failed' },
            ]}
            variant="outline"
            size="sm"
          />
        </div>
        <Button variant="outline" onClick={fetchCampaigns} leftIcon={<ArrowPathIcon className="h-5 w-5" />}>
          Refresh
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="danger">
          <p>{error}</p>
        </Alert>
      )}

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-gray-500">No campaigns found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.campaignId}>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{campaign.subject}</h3>
                      {getStatusBadge(campaign.status)}
                      {pollingCampaigns.has(campaign.campaignId) && (
                        <Spinner size="sm" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-500">Recipients</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {campaign.recipientCount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Sent</p>
                        <p className="text-lg font-semibold text-green-600">
                          {campaign.sent?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Failed</p>
                        <p className="text-lg font-semibold text-red-600">
                          {campaign.failed?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Progress</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {campaign.progress || 0}%
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {(campaign.status === 'sending' || campaign.status === 'queued') && (
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${campaign.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                      <span>Created by {campaign.createdBy?.name || 'Unknown'}</span>
                      <span>•</span>
                      <span>{formatDateShort(new Date(campaign.createdAt))}</span>
                      {campaign.completedAt && (
                        <>
                          <span>•</span>
                          <span>Completed {formatDateShort(new Date(campaign.completedAt))}</span>
                        </>
                      )}
                    </div>

                    {campaign.error && (
                      <Alert variant="danger" className="mt-4">
                        <p className="text-sm">{campaign.error}</p>
                      </Alert>
                    )}
                  </div>

                  <div className="ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(campaign)}
                      leftIcon={<EyeIcon className="h-4 w-4" />}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setSelectedCampaign(null)}
            />
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Campaign Details</h3>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Subject</p>
                  <p className="text-gray-900">{selectedCampaign.subject}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedCampaign.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Progress</p>
                    <p className="text-gray-900">{selectedCampaign.progress || 0}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Recipients</p>
                    <p className="text-gray-900">{selectedCampaign.recipientCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Sent</p>
                    <p className="text-green-600">{selectedCampaign.sent?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Failed</p>
                    <p className="text-red-600">{selectedCampaign.failed?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Campaign ID</p>
                    <p className="text-gray-900 font-mono text-xs">{selectedCampaign.campaignId}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Created</p>
                  <p className="text-gray-900">
                    {formatDateShort(new Date(selectedCampaign.createdAt))}
                  </p>
                </div>

                {selectedCampaign.startedAt && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Started</p>
                    <p className="text-gray-900">
                      {formatDateShort(new Date(selectedCampaign.startedAt))}
                    </p>
                  </div>
                )}

                {selectedCampaign.completedAt && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Completed</p>
                    <p className="text-gray-900">
                      {formatDateShort(new Date(selectedCampaign.completedAt))}
                    </p>
                  </div>
                )}

                {selectedCampaign.error && (
                  <Alert variant="danger">
                    <p className="text-sm">{selectedCampaign.error}</p>
                  </Alert>
                )}

                {(selectedCampaign.status === 'sending' || selectedCampaign.status === 'queued') && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Progress</p>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${selectedCampaign.progress || 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
