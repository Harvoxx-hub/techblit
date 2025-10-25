'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { withAuth } from '@/contexts/AuthContext';
import { 
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ChartBarIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { Button, Input, Select, Card, CardContent, Alert, Spinner } from '@/components/ui';
import { useAuditLogs, useAuditLogStats, useAuditLogFilters } from '@/hooks/useAuditLogs';

function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [actorFilter, setActorFilter] = useState('all');
  const [targetFilter, setTargetFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(50);

  // Fetch audit logs with filters
  const { logs, loading, error, pagination } = useAuditLogs({
    limit: pageSize,
    offset: currentPage * pageSize,
    action: actionFilter !== 'all' ? actionFilter : undefined,
    actor: actorFilter !== 'all' ? actorFilter : undefined,
    target: targetFilter !== 'all' ? targetFilter : undefined,
    orderBy: 'timestamp',
    orderDirection: 'desc'
  });

  // Fetch statistics
  const { stats, loading: statsLoading } = useAuditLogStats();

  // Fetch filter options
  const { filters, loading: filtersLoading } = useAuditLogFilters();

  // Filter logs by search term (client-side filtering for better UX)
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.actor.toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower) ||
      log.target.toLowerCase().includes(searchLower) ||
      (log.metadata?.title && log.metadata.title.toLowerCase().includes(searchLower))
    );
  });

  const handleViewDetails = (log: any) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const formatTimestamp = (timestamp: Date | any) => {
    try {
      // Handle Firestore timestamp objects
      let date: Date;
      
      if (timestamp && typeof timestamp === 'object') {
        if (timestamp.seconds) {
          // Firestore timestamp
          date = new Date(timestamp.seconds * 1000);
        } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
          // Firestore timestamp with toDate method
          date = timestamp.toDate();
        } else if (timestamp instanceof Date) {
          date = timestamp;
        } else {
          // Try to parse as regular date
          date = new Date(timestamp);
        }
      } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else {
        date = new Date();
      }

      // Validate the date
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      }).format(date);
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp);
      return 'Invalid date';
    }
  };

  const getActionColor = (action: string) => {
    const colors: { [key: string]: string } = {
      'post_created': 'bg-blue-100 text-blue-800',
      'post_published': 'bg-green-100 text-green-800',
      'post_updated': 'bg-yellow-100 text-yellow-800',
      'post_deleted': 'bg-red-100 text-red-800',
      'user_created': 'bg-purple-100 text-purple-800',
      'user_updated': 'bg-indigo-100 text-indigo-800',
      'user_deleted': 'bg-red-100 text-red-800',
      'login': 'bg-green-100 text-green-800',
      'logout': 'bg-gray-100 text-gray-800',
      'permission_granted': 'bg-emerald-100 text-emerald-800',
      'permission_revoked': 'bg-orange-100 text-orange-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('post')) return <DocumentTextIcon className="h-4 w-4" />;
    if (action.includes('user')) return <UserIcon className="h-4 w-4" />;
    if (action.includes('login') || action.includes('logout')) return <ClockIcon className="h-4 w-4" />;
    return <ClipboardDocumentListIcon className="h-4 w-4" />;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor system activity and track changes
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Logs
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.total.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Last 24 Hours
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.recent24h.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Top Action
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.topActions[0]?.action || 'N/A'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserIcon className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Users
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.topActors.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Input
                  label="Search"
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<MagnifyingGlassIcon />}
                  variant="filled"
                />
              </div>

              <div>
                <Select
                  label="Action"
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Actions' },
                    ...(filters?.actions.map(action => ({
                      value: action,
                      label: action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    })) || [])
                  ]}
                />
              </div>

              <div>
                <Select
                  label="Actor"
                  value={actorFilter}
                  onChange={(e) => setActorFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Users' },
                    ...(filters?.actors.map(actor => ({
                      value: actor,
                      label: actor
                    })) || [])
                  ]}
                />
              </div>

              <div>
                <Select
                  label="Target"
                  value={targetFilter}
                  onChange={(e) => setTargetFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Targets' },
                    ...(filters?.targets.map(target => ({
                      value: target,
                      label: target
                    })) || [])
                  ]}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Alert variant="danger">
            <p>{error}</p>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        )}

        {/* Logs Table */}
        {!loading && !error && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Target
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 mr-3">
                              {getActionIcon(log.action)}
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                              {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.actor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="max-w-xs truncate" title={log.target}>
                            {log.target}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(log)}
                            leftIcon={<EyeIcon />}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.total > pageSize && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                      leftIcon={<ChevronLeftIcon />}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pagination.hasMore}
                      rightIcon={<ChevronRightIcon />}
                    >
                      Next
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">{currentPage * pageSize + 1}</span>
                        {' '}to{' '}
                        <span className="font-medium">
                          {Math.min((currentPage + 1) * pageSize, pagination.total)}
                        </span>
                        {' '}of{' '}
                        <span className="font-medium">{pagination.total}</span>
                        {' '}results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <Button
                          variant="outline"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 0}
                          leftIcon={<ChevronLeftIcon />}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={!pagination.hasMore}
                          rightIcon={<ChevronRightIcon />}
                        >
                          Next
                        </Button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && filteredLogs.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search criteria or filters.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Details Modal */}
      {showModal && selectedLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Audit Log Details</h3>
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Action</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.action}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Actor</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.actor}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.target}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                  <p className="mt-1 text-sm text-gray-900">{formatTimestamp(selectedLog.timestamp)}</p>
                </div>
                
                {selectedLog.ipAddress && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">IP Address</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLog.ipAddress}</p>
                  </div>
                )}
                
                {selectedLog.userAgent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User Agent</label>
                    <p className="mt-1 text-sm text-gray-900 break-all">{selectedLog.userAgent}</p>
                  </div>
                )}
                
                {selectedLog.metadata && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Metadata</label>
                    <pre className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded overflow-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default withAuth(AuditLogs, 'view_audit_logs');