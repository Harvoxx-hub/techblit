import { useState, useEffect } from 'react';

interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: Date;
  diff?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

interface AuditLogFilters {
  limit?: number;
  offset?: number;
  action?: string;
  actor?: string;
  target?: string;
  startDate?: string;
  endDate?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

interface AuditLogStats {
  total: number;
  recent24h: number;
  topActions: Array<{ action: string; count: number }>;
  topActors: Array<{ actor: string; count: number }>;
  lastUpdated: Date;
}

interface AuditLogFiltersData {
  actions: string[];
  actors: string[];
  targets: string[];
}

/**
 * Hook for fetching audit logs with filtering and pagination
 */
export function useAuditLogs(filters: AuditLogFilters = {}) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false
  });

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        const queryParams = new URLSearchParams();
        
        if (filters.limit) queryParams.set('limit', filters.limit.toString());
        if (filters.offset) queryParams.set('offset', filters.offset.toString());
        if (filters.action) queryParams.set('action', filters.action);
        if (filters.actor) queryParams.set('actor', filters.actor);
        if (filters.target) queryParams.set('target', filters.target);
        if (filters.startDate) queryParams.set('startDate', filters.startDate);
        if (filters.endDate) queryParams.set('endDate', filters.endDate);
        if (filters.orderBy) queryParams.set('orderBy', filters.orderBy);
        if (filters.orderDirection) queryParams.set('orderDirection', filters.orderDirection);

        const response = await fetch(
          `https://getauditlogs-4alcog3g7q-uc.a.run.app?${queryParams.toString()}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await getAuthToken()}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch audit logs');
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch audit logs');
        }

        setLogs(data.data.logs);
        setPagination(data.data.pagination);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch audit logs';
        setError(errorMessage);
        console.error('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [filters.limit, filters.offset, filters.action, filters.actor, filters.target, filters.startDate, filters.endDate, filters.orderBy, filters.orderDirection]);

  return { logs, loading, error, pagination };
}

/**
 * Hook for fetching audit log statistics
 */
export function useAuditLogStats() {
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          'https://getauditlogstats-4alcog3g7q-uc.a.run.app',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await getAuthToken()}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch audit log stats');
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch audit log stats');
        }

        setStats(data.data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch audit log stats';
        setError(errorMessage);
        console.error('Error fetching audit log stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}

/**
 * Hook for fetching audit log filter options
 */
export function useAuditLogFilters() {
  const [filters, setFilters] = useState<AuditLogFiltersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if we're in development or if the service is available
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        if (isDevelopment) {
          // Return mock data in development
          setFilters({
            actions: ['create', 'update', 'delete', 'login', 'logout'],
            actors: ['admin', 'user'],
            targets: ['post', 'user', 'settings']
          });
          return;
        }

        const response = await fetch(
          'https://getauditlogfilters-4alcog3g7q-uc.a.run.app',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await getAuthToken()}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch audit log filters');
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch audit log filters');
        }

        setFilters(data.data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch audit log filters';
        setError(errorMessage);
        console.error('Error fetching audit log filters:', err);
        
        // Set fallback data on error
        setFilters({
          actions: ['create', 'update', 'delete', 'login', 'logout'],
          actors: ['admin', 'user'],
          targets: ['post', 'user', 'settings']
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFilters();
  }, []);

  return { filters, loading, error };
}

/**
 * Hook for fetching a single audit log by ID
 */
export function useAuditLog(logId: string) {
  const [log, setLog] = useState<AuditLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuditLog = async () => {
      if (!logId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `https://getauditlogbyid-4alcog3g7q-uc.a.run.app/${logId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await getAuthToken()}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch audit log');
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch audit log');
        }

        setLog(data.data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch audit log';
        setError(errorMessage);
        console.error('Error fetching audit log:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLog();
  }, [logId]);

  return { log, loading, error };
}

// Helper function to get auth token
async function getAuthToken(): Promise<string> {
  try {
    const { getAuth } = await import('firebase/auth');
    const { auth } = await import('@/lib/firebase');
    
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }
    
    return await auth.currentUser.getIdToken();
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw new Error('Failed to get authentication token');
  }
}
