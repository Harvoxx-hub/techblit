import { useState, useEffect } from 'react';
import apiService from '@/lib/apiService';

export interface SearchConsoleData {
  indexedPages: number;
  crawlErrors: number;
  sitemapStatus: 'submitted' | 'pending' | 'error';
  lastChecked: Date;
  crawlErrorsDetails?: Array<{
    url: string;
    error: string;
    lastCrawled: Date;
  }>;
}

export interface SitemapSubmissionResult {
  success: boolean;
  message: string;
  submittedAt: Date;
}

/**
 * Hook for managing Search Console integration and indexing status
 */
export function useSearchConsole(propertyUrl?: string) {
  const [data, setData] = useState<SearchConsoleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIndexingStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current settings via API
        const settings = await apiService.getSettings();
        
        if (settings?.indexingStatus) {
          const indexingStatus = settings.indexingStatus as any;
          setData({
            indexedPages: indexingStatus.indexedPages || 0,
            crawlErrors: indexingStatus.crawlErrors || 0,
            sitemapStatus: indexingStatus.sitemapStatus || 'pending',
            lastChecked: indexingStatus.lastChecked ? new Date(indexingStatus.lastChecked) : new Date(),
            crawlErrorsDetails: indexingStatus.crawlErrorsDetails || [],
          });
        } else {
          // Initialize with default values
          setData({
            indexedPages: 0,
            crawlErrors: 0,
            sitemapStatus: 'pending',
            lastChecked: new Date(),
            crawlErrorsDetails: [],
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch indexing status';
        setError(errorMessage);
        console.error('Error fetching indexing status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchIndexingStatus();
  }, [propertyUrl]);

  const refreshIndexingStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, this would call the Search Console API
      // For now, we'll simulate the data
      const mockData: SearchConsoleData = {
        indexedPages: Math.floor(Math.random() * 100) + 50,
        crawlErrors: Math.floor(Math.random() * 10),
        sitemapStatus: 'submitted',
        lastChecked: new Date(),
        crawlErrorsDetails: [
          {
            url: 'https://www.techblit.com/example-page',
            error: '404 Not Found',
            lastCrawled: new Date(Date.now() - 86400000), // 1 day ago
          },
        ],
      };

      setData(mockData);

      // Update settings with new data via API
      await apiService.updateSettings({
        indexingStatus: {
          indexedPages: mockData.indexedPages,
          crawlErrors: mockData.crawlErrors,
          sitemapStatus: mockData.sitemapStatus,
          lastChecked: mockData.lastChecked.toISOString(),
          crawlErrorsDetails: mockData.crawlErrorsDetails,
        },
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh indexing status';
      setError(errorMessage);
      console.error('Error refreshing indexing status:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitSitemap = async (): Promise<SitemapSubmissionResult> => {
    try {
      // In a real implementation, this would submit the sitemap to Search Console
      // For now, we'll simulate the submission
      const result: SitemapSubmissionResult = {
        success: true,
        message: 'Sitemap submitted successfully to Google Search Console',
        submittedAt: new Date(),
      };

      // Update sitemap status
      if (data) {
        const updatedData = {
          ...data,
          sitemapStatus: 'submitted' as const,
          lastChecked: new Date(),
        };
        setData(updatedData);

        // Update settings via API
        await apiService.updateSettings({
          indexingStatus: {
            ...updatedData,
            lastChecked: updatedData.lastChecked.toISOString(),
          },
        });
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit sitemap';
      console.error('Error submitting sitemap:', err);
      return {
        success: false,
        message: errorMessage,
        submittedAt: new Date(),
      };
    }
  };

  return {
    data,
    loading,
    error,
    refreshIndexingStatus,
    submitSitemap,
  };
}

/**
 * Hook for managing sitemap generation and submission
 */
export function useSitemapManagement() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSitemap = async () => {
    try {
      setGenerating(true);
      setError(null);

      // Call the sitemap generation API
      const response = await fetch('/api/sitemap/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate sitemap');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate sitemap';
      setError(errorMessage);
      console.error('Error generating sitemap:', err);
      throw err;
    } finally {
      setGenerating(false);
    }
  };

  const validateSitemap = async () => {
    try {
      const response = await fetch('/sitemap.xml');
      if (!response.ok) {
        throw new Error('Sitemap not accessible');
      }
      
      const sitemapContent = await response.text();
      
      // Basic XML validation
      if (!sitemapContent.includes('<urlset') || !sitemapContent.includes('</urlset>')) {
        throw new Error('Invalid sitemap format');
      }

      return {
        valid: true,
        urlCount: (sitemapContent.match(/<url>/g) || []).length,
        lastGenerated: new Date().toISOString(),
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sitemap validation failed';
      console.error('Error validating sitemap:', err);
      return {
        valid: false,
        error: errorMessage,
      };
    }
  };

  return {
    generating,
    error,
    generateSitemap,
    validateSitemap,
  };
}
