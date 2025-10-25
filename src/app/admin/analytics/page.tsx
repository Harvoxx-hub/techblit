'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AdminLayout from '@/components/admin/AdminLayout';
import { withAuth } from '@/contexts/AuthContext';
import { Post } from '@/types/admin';
import { 
  ChartBarIcon,
  EyeIcon,
  DocumentTextIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

function AnalyticsDashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const postsQuery = query(
          collection(db, 'posts'),
          orderBy('publishedAt', 'desc')
        );
        const postsSnapshot = await getDocs(postsQuery);
        const postsData = postsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Post));
        
        setPosts(postsData);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  // Mock analytics data - in a real app, this would come from Google Analytics or similar
  const mockAnalytics = {
    pageViews: 15420,
    uniqueVisitors: 8230,
    bounceRate: 42.5,
    avgSessionDuration: '2m 34s',
    topPages: [
      { path: '/', views: 3240, title: 'Homepage' },
      { path: '/getting-started-with-nextjs', views: 1890, title: 'Getting Started with Next.js' },
      { path: '/firebase-setup-guide', views: 1560, title: 'Firebase Setup Guide' },
      { path: '/about', views: 980, title: 'About' },
    ],
    trafficSources: [
      { source: 'Direct', percentage: 45.2, visitors: 3720 },
      { source: 'Google Search', percentage: 32.1, visitors: 2640 },
      { source: 'Social Media', percentage: 15.3, visitors: 1260 },
      { source: 'Referrals', percentage: 7.4, visitors: 610 },
    ],
    deviceBreakdown: [
      { device: 'Desktop', percentage: 58.3, visitors: 4800 },
      { device: 'Mobile', percentage: 35.7, visitors: 2940 },
      { device: 'Tablet', percentage: 6.0, visitors: 490 },
    ],
  };

  const publishedPosts = posts.filter(post => post.status === 'published');
  const recentPosts = publishedPosts.slice(0, 5);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track your site's performance and user engagement
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-md bg-blue-500">
                    <EyeIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Page Views
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {mockAnalytics.pageViews.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-md bg-green-500">
                    <UsersIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Unique Visitors
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {mockAnalytics.uniqueVisitors.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-md bg-yellow-500">
                    <ArrowTrendingDownIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Bounce Rate
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {mockAnalytics.bounceRate}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-md bg-purple-500">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avg. Session Duration
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {mockAnalytics.avgSessionDuration}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Pages */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Pages</h3>
            <div className="space-y-4">
              {mockAnalytics.topPages.map((page, index) => (
                <div key={page.path} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{page.title}</p>
                      <p className="text-xs text-gray-500">{page.path}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{page.views.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">views</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Traffic Sources</h3>
            <div className="space-y-4">
              {mockAnalytics.trafficSources.map((source) => (
                <div key={source.source}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{source.source}</span>
                    <span className="text-sm text-gray-500">{source.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${source.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {source.visitors.toLocaleString()} visitors
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Device Breakdown</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {mockAnalytics.deviceBreakdown.map((device) => (
              <div key={device.device} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{device.percentage}%</div>
                <div className="text-sm text-gray-500">{device.device}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {device.visitors.toLocaleString()} visitors
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Posts Performance */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Posts Performance</h3>
          {recentPosts.length === 0 ? (
            <div className="text-center py-8">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No published posts</h3>
              <p className="mt-1 text-sm text-gray-500">
                Publish some posts to see their performance metrics.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Post
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Published
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engagement
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentPosts.map((post) => (
                    <tr key={post.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{post.title}</div>
                        <div className="text-sm text-gray-500">{post.slug}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Math.floor(Math.random() * 1000) + 100} {/* Mock data */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Math.floor(Math.random() * 10) + 1}% {/* Mock data */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Integration Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Analytics Integration
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  This dashboard shows mock analytics data. To see real analytics, integrate with Google Analytics, 
                  Plausible, or another analytics service by updating your site settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(AnalyticsDashboard, 'view_analytics');
