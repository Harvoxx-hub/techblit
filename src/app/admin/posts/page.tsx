'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import apiService from '@/lib/apiService';
import AdminLayout from '@/components/admin/AdminLayout';
import { withAuth } from '@/contexts/AuthContext';
import { Post, PostStatus, getStatusColor, getStatusLabel, getStatusBadgeClasses, getStatusIconClasses } from '@/types/admin';
import { 
  DocumentTextIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { Input, Dropdown, Button, Card, CardContent, Badge } from '@/components/ui';
import { parseDate, formatDateShort } from '@/lib/dateUtils';

function PostsManager() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Use admin endpoint to get all posts with any status
        const postsData = await apiService.getAllPosts({ limit: 1000 });
        
        const formattedPosts: Post[] = postsData.map((post: any) => ({
          id: post.id,
          ...post,
          author: post.author || { name: 'Unknown Author', uid: 'unknown' },
          title: post.title || 'Untitled Post',
          slug: post.slug || post.id,
          excerpt: post.excerpt || 'No excerpt available',
          status: post.status || 'draft',
          updatedAt: parseDate(post.updatedAt) || new Date(),
          socialMediaImage: post.socialMediaImage || undefined,
        }));
        
        setPosts(formattedPosts);
        setFilteredPosts(formattedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    let filtered = posts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(post => post.status === statusFilter);
    }

    setFilteredPosts(filtered);
  }, [posts, searchTerm, statusFilter]);

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setDeleting(postId);
    try {
      await apiService.deletePost(postId);
      // Remove from local state
      setPosts(prev => prev.filter(post => post.id !== postId));
      setFilteredPosts(prev => prev.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownloadSocialImage = async (post: Post) => {
    if (!post.socialMediaImage?.url) {
      alert('No social media image available for this post.');
      return;
    }

    try {
      // Fetch the image
      const response = await fetch(post.socialMediaImage.url);
      const blob = await response.blob();
      
      // Create a temporary URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename from post title
      const filename = `${post.slug || post.id}-social-media.jpg`;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading social media image:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  const statusOptions: Array<{ value: PostStatus | 'all'; label: string }> = [
    { value: 'all', label: 'All Posts' },
    { value: 'draft', label: 'Drafts' },
    { value: 'in_review', label: 'In Review' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ];

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
            <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your blog posts and content
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              href="/admin/posts/new"
              variant="primary"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Search */}
              <Input
                label="Search"
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<MagnifyingGlassIcon />}
                variant="filled"
              />

              {/* Status Filter */}
              <Dropdown
                label="Status"
                options={statusOptions.map(option => ({
                  value: option.value,
                  label: option.label,
                  description: `Filter posts by ${option.label.toLowerCase()}`
                }))}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as PostStatus | 'all')}
                placeholder="Filter by status"
                clearable={true}
                leftIcon={<FunnelIcon />}
              />

              {/* Results Count */}
              <div className="flex items-end">
                <div className="text-sm text-gray-500">
                  Showing {filteredPosts.length} of {posts.length} posts
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredPosts.map((post) => (
              <li key={post.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-gray-100">
                          <DocumentTextIcon className="h-6 w-6 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {post.title}
                          </p>
                          <span className={`ml-2 flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(post.status)}`}>
                            {getStatusLabel(post.status)}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {post.excerpt || 'No excerpt available'}
                        </div>
                        <div className="mt-1 flex items-center text-xs text-gray-400">
                          <p>
                            by {post.author?.name || 'Unknown Author'} • {formatDateShort(post.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      <Link
                        href={`/${post.slug}`}
                        target="_blank"
                        className="text-gray-400 hover:text-gray-600"
                        title="View Post"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                      <Link
                        href={`/admin/posts/${post.slug}/edit`}
                        className="text-gray-400 hover:text-gray-600"
                        title="Edit Post"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      {post.socialMediaImage?.url && (
                        <button
                          className="text-gray-400 hover:text-blue-600"
                          title="Download Social Media Image"
                          onClick={() => handleDownloadSocialImage(post)}
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        className={`text-gray-400 hover:text-red-600 ${deleting === post.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Delete Post"
                        disabled={deleting === post.id}
                        onClick={() => handleDeletePost(post.id!)}
                      >
                        {deleting === post.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                        ) : (
                          <TrashIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No posts found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating a new post.'
                }
              </p>
              <div className="mt-6">
                <Link
                  href="/admin/posts/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Post
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {statusOptions.slice(1).map((status) => {
            const count = posts.filter(p => p.status === status.value).length;
            return (
              <div key={status.value} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`p-3 rounded-md ${getStatusIconClasses(status.value as PostStatus)}`}>
                        <DocumentTextIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {status.label}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {count}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(PostsManager, 'create_post');
