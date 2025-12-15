'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import apiService from '@/lib/apiService';
import AdminLayout from '@/components/admin/AdminLayout';
import { withAuth } from '@/contexts/AuthContext';
import { Post, User } from '@/types/admin';
import { 
  Card, 
  CardContent, 
  StatsCard, 
  DataTable, 
  DataTableRow, 
  EmptyState, 
  Badge, 
  Spinner,
  Alert,
  Button
} from '@/components/ui';
import { 
  DocumentTextIcon, 
  EyeIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    inReviewPosts: 0,
    totalUsers: 0,
  });
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch posts via API
        const posts = await apiService.getPosts({ limit: 100 });
        
        const stats = {
          totalPosts: posts.length,
          publishedPosts: posts.filter((p: any) => p.status === 'published').length,
          draftPosts: posts.filter((p: any) => p.status === 'draft').length,
          inReviewPosts: posts.filter((p: any) => p.status === 'in_review').length,
          totalUsers: 0, // Will be fetched separately
        };

        // Get recent posts (first 5)
        const recentPostsData = posts.slice(0, 5).map((data: any) => ({
          id: data.id,
          ...data,
          author: data.author || { name: 'Unknown Author', uid: 'unknown' },
          title: data.title || 'Untitled Post',
          slug: data.slug || data.id,
          excerpt: data.excerpt || 'No excerpt available',
          status: data.status || 'draft',
          updatedAt: data.updatedAt || new Date(),
        } as Post));

        // Fetch users via API
        const users = await apiService.getUsers({ limit: 100 });
        stats.totalUsers = users.length;

        // Get recent users (first 5)
        const recentUsersData = users.slice(0, 5).map((data: any) => ({
          uid: data.uid || data.id,
          ...data,
        } as User));

        setStats(stats);
        setRecentPosts(recentPostsData);
        setRecentUsers(recentUsersData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);


  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome to the TechBlit admin dashboard. Here's an overview of your content and users.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title="Total Posts"
            value={stats.totalPosts}
            icon={<DocumentTextIcon />}
          />
          <StatsCard
            title="Published"
            value={stats.publishedPosts}
            icon={<CheckCircleIcon />}
          />
          <StatsCard
            title="Drafts"
            value={stats.draftPosts}
            icon={<ClockIcon />}
          />
          <StatsCard
            title="In Review"
            value={stats.inReviewPosts}
            icon={<ExclamationTriangleIcon />}
          />
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<UsersIcon />}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Posts */}
          <Card>
            <CardContent>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Posts
              </h3>
              {recentPosts.length === 0 ? (
                <EmptyState
                  icon={<DocumentTextIcon />}
                  title="No posts yet"
                  description="Start by creating your first blog post"
                  action={<Button href="/admin/posts/new">Create Post</Button>}
                />
              ) : (
                <>
                  <DataTable>
                    {recentPosts.map((post) => (
                      <DataTableRow key={post.id}>
                        <Link 
                          href={`/admin/posts/${post.slug}/edit`}
                          className="block hover:bg-gray-50 transition-colors duration-150"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`h-2 w-2 rounded-full ${
                                post.status === 'published' ? 'bg-green-400' :
                                post.status === 'draft' ? 'bg-yellow-400' :
                                post.status === 'in_review' ? 'bg-orange-400' :
                                'bg-gray-400'
                              }`} />
                              <div>
                                <p className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors duration-150">
                                  {post.title}
                                </p>
                                <p className="text-sm text-gray-500">
                                  by {post.author?.name || 'Unknown Author'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={
                                post.status === 'published' ? 'success' :
                                post.status === 'draft' ? 'warning' :
                                post.status === 'in_review' ? 'info' :
                                'default'
                              }>
                                {post.status}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {post.updatedAt ? (() => {
                                  const date = post.updatedAt;
                                  if (date && typeof date === 'object' && 'toDate' in date) {
                                    return new Date((date as any).toDate()).toLocaleDateString();
                                  } else if (date instanceof Date) {
                                    return date.toLocaleDateString();
                                  } else if (typeof date === 'string') {
                                    return new Date(date).toLocaleDateString();
                                  }
                                  return 'No date';
                                })() : 'No date'}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </DataTableRow>
                    ))}
                  </DataTable>
                  <div className="mt-6">
                    <Button variant="outline" className="w-full" href="/admin/posts">
                      View all posts
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card>
            <CardContent>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Users
              </h3>
              {recentUsers.length === 0 ? (
                <EmptyState
                  icon={<UsersIcon />}
                  title="No users yet"
                  description="Users will appear here once they register"
                />
              ) : (
                <>
                  <DataTable>
                    {recentUsers.map((user) => (
                      <DataTableRow key={user.uid}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {user.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              user.role === 'super_admin' ? 'danger' :
                              user.role === 'editor' ? 'info' :
                              user.role === 'author' ? 'warning' :
                              'default'
                            }>
                              {user.role}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(user.lastSeen).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </DataTableRow>
                    ))}
                  </DataTable>
                  <div className="mt-6">
                    <Button variant="outline" className="w-full" href="/admin/users">
                      View all users
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardContent>
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button
                variant="outline"
                className="h-auto p-6 flex flex-col items-center space-y-2"
                href="/admin/posts/new"
              >
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                <div className="text-center">
                  <h3 className="text-sm font-medium">Create Post</h3>
                  <p className="text-xs text-gray-500">Start writing a new blog post</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-6 flex flex-col items-center space-y-2"
                href="/admin/media"
              >
                <EyeIcon className="h-6 w-6 text-green-600" />
                <div className="text-center">
                  <h3 className="text-sm font-medium">Media Library</h3>
                  <p className="text-xs text-gray-500">Manage images and media files</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-6 flex flex-col items-center space-y-2"
                href="/admin/users"
              >
                <UsersIcon className="h-6 w-6 text-purple-600" />
                <div className="text-center">
                  <h3 className="text-sm font-medium">Manage Users</h3>
                  <p className="text-xs text-gray-500">Add or edit user accounts</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-6 flex flex-col items-center space-y-2"
                href="/admin/settings"
              >
                <ChartBarIcon className="h-6 w-6 text-gray-600" />
                <div className="text-center">
                  <h3 className="text-sm font-medium">Settings</h3>
                  <p className="text-xs text-gray-500">Configure site settings</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default withAuth(AdminDashboard);
