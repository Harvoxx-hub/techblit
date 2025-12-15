'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '@/lib/apiService';
import AdminLayout from '@/components/admin/AdminLayout';
import { withAuth, useAuth } from '@/contexts/AuthContext';
import { Post, PostStatus } from '@/types/admin';
import { 
  DocumentTextIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  TagIcon,
  FolderIcon,
  LinkIcon,
  DocumentIcon,
  EyeSlashIcon,
  CalendarIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { Input, Textarea, Button, Card, CardContent, Dropdown, TagInput } from '@/components/ui';
import RichTextEditor from '@/components/editor/RichTextEditor';
import SEOSuggestions from '@/components/editor/SEOSuggestions';
import CanonicalUrlManager from '@/components/editor/CanonicalUrlManager';
import Scheduling from '@/components/editor/Scheduling';
import Preview from '@/components/editor/Preview';
import FeaturedImageUpload from '@/components/editor/FeaturedImageUpload';
import { uploadFeaturedImage } from '@/lib/imageUpload';
import { useAutoSave, useAutoSaveIndicator } from '@/hooks/useAutoSave';
import { CATEGORY_OPTIONS } from '@/lib/categories';
import { sanitizeWordPressUrls } from '@/lib/imageUrlUtils';

function NewPostEditor() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Wrapper function to upload featured images with multiple versions
  // For RichTextEditor, we need to return just the URL string
  const handleImageUpload = async (file: File) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }
    const processed = await uploadFeaturedImage(file);
    return processed.original.url;
  };
  // Prefilled tags and categories
  const prefilledTags = [
    'Startup', 'fintech', 'funding', 'AI', 'innovation', 'technology', 
    'africa', 'nigeria', 'kenya', 'south africa', 'mobile', 'web', 
    'developer tools', 'blockchain', 'cryptocurrency', 'payments', 
    'banking', 'e-commerce', 'SaaS', 'B2B', 'B2C', 'venture capital',
    'angel investors', 'series A', 'seed funding', 'IPO', 'acquisition',
    'machine learning', 'artificial intelligence', 'data science',
    'cybersecurity', 'cloud computing', 'DevOps', 'API', 'mobile apps'
  ];

  // Categories are now fetched from centralized list

  const [post, setPost] = useState<Partial<Post>>({
    title: '',
    slug: '',
    excerpt: '',
    contentHtml: '',
    metaTitle: '',
    metaDescription: '',
    canonical: '',
    tags: ['Startup', 'technology', 'africa'], // Prefilled tags
    category: 'Startup', // Single category string
    status: 'draft',
    visibility: 'public',
    scheduledAt: undefined,
    featuredImage: undefined,
    seo: {
      noindex: false,
      nofollow: false,
    },
    social: {
      ogTitle: '',
      ogDescription: '',
      twitterCard: 'summary_large_image',
    },
  });

  // Auto-save functionality
  const autoSaveState = useAutoSave(postId, post, {
    interval: 30000, // 30 seconds
    enabled: !!postId && (post.title?.length || 0) > 0, // Only auto-save if we have a post ID and title
    onSave: async (data) => {
      if (!postId) return;
      await apiService.updatePost(postId, {
        ...data,
        lastAutoSaved: new Date().toISOString()
      });
    },
    onError: (error) => {
      console.error('Auto-save failed:', error);
    }
  });

  const autoSaveIndicator = useAutoSaveIndicator(autoSaveState);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setPost(prev => ({
      ...prev,
      title,
      slug: prev?.slug || generateSlug(title),
      metaTitle: prev?.metaTitle || title,
      social: {
        ...prev?.social,
        ogTitle: prev?.social?.ogTitle || title,
      },
    }));
  };

  const handleSave = async (status: PostStatus | 'in_review') => {
    // Clear previous errors
    setErrors({});
    
    // Validate required fields
    const newErrors: Record<string, string> = {};
    
    if (!post.title) newErrors.title = 'Title is required';
    if (!post.slug) newErrors.slug = 'Slug is required';
    if (!post.excerpt) newErrors.excerpt = 'Excerpt is required';
    if (!post.contentHtml) newErrors.content = 'Content is required';
    
    // Check for featured image in both possible structures
    const hasFeaturedImage = post.featuredImage && (
      ('original' in post.featuredImage && post.featuredImage.original?.url) ||
      ('url' in post.featuredImage && post.featuredImage.url)
    );
    if (!hasFeaturedImage) newErrors.featuredImage = 'Featured image is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      
      // Determine final status based on scheduling
      let finalStatus = status;
      if (status === 'published' && post.scheduledAt && post.scheduledAt > now) {
        finalStatus = 'scheduled';
      }

      // Sanitize WordPress URLs from content before saving
      const sanitizedContentHtml = post.contentHtml ? sanitizeWordPressUrls(post.contentHtml) : '';
      
      const postData = {
        title: post.title,
        content: post.contentHtml || '',
        contentHtml: sanitizedContentHtml,
        excerpt: post.excerpt,
        tags: post.tags || [],
        categories: post.category ? [post.category] : [],
        status: finalStatus,
        featuredImage: post.featuredImage,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        canonical: post.canonical,
        scheduledAt: post.scheduledAt ? post.scheduledAt.toISOString() : undefined,
      };

      const result = await apiService.createPost(postData);
      setPostId(result.id);
      
      // If this is a draft save, stay on the page for auto-save
      if (finalStatus === 'draft') {
        // Don't redirect, let auto-save continue working
        return;
      }
      
      router.push('/admin/posts');
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Failed to save post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Post</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create a new blog post
            </p>
            {postId && (
              <div className="mt-2">
                <span className={`text-xs ${autoSaveIndicator.color}`}>
                  {autoSaveIndicator.text}
                </span>
              </div>
            )}
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Preview
              title={post.title || ''}
              content={post.contentHtml || ''}
              metaDescription={post.metaDescription || ''}
              slug={post.slug || ''}
              author={post.author}
              featuredImage={
                post.featuredImage && 'original' in post.featuredImage 
                  ? post.featuredImage.original?.url 
                  : (post.featuredImage && 'url' in post.featuredImage ? post.featuredImage.url : undefined)
              }
              postId={postId || undefined}
              status={post.status}
            />
            <Button
              onClick={() => handleSave('draft')}
              loading={loading}
              variant="outline"
              leftIcon={<ClockIcon />}
            >
              Save Draft
            </Button>
            <Button
              onClick={() => handleSave('in_review')}
              loading={loading}
              variant="secondary"
              leftIcon={<EyeIcon />}
            >
              Request Review
            </Button>
            <Button
              onClick={() => handleSave('published')}
              loading={loading}
              variant="primary"
              leftIcon={<CheckCircleIcon />}
            >
              {post.scheduledAt && post.scheduledAt > new Date() ? 'Schedule' : 'Publish'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <Card>
              <CardContent className="p-6">
                <Input
                  label="Title"
                  type="text"
                  placeholder="Enter post title..."
                  value={post.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  leftIcon={<DocumentTextIcon />}
                  variant="filled"
                  size="lg"
                  isRequired
                  showCharacterCount
                  maxLength={100}
                />
              </CardContent>
            </Card>

            {/* Slug */}
            <Card>
              <CardContent className="p-6">
                <Input
                  label="Slug"
                  type="text"
                  placeholder="post-url-slug"
                  value={post.slug}
                  onChange={(e) => setPost(prev => ({ ...prev, slug: e.target.value }))}
                  leftIcon={<LinkIcon />}
                  variant="filled"
                  size="lg"
                  isRequired
                  helperText={`URL: /${post.slug}`}
                />
              </CardContent>
            </Card>

            {/* Excerpt */}
            <Card>
              <CardContent className="p-6">
                  <Textarea
                    label="Excerpt"
                    placeholder="Brief description of the post..."
                    value={post.excerpt}
                    onChange={(e) => setPost(prev => ({ ...prev, excerpt: e.target.value }))}
                    variant="filled"
                    size="lg"
                    isRequired
                    showCharacterCount
                    maxLength={300}
                    rows={3}
                  />
              </CardContent>
            </Card>

            {/* Content */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Content
                    </label>
                    <div className="text-sm text-gray-500">
                      Rich text editor with full formatting support
                    </div>
                  </div>
        <RichTextEditor
          content={post.contentHtml || ''}
          onChange={(content) => setPost(prev => ({ ...prev, contentHtml: content }))}
          placeholder="Start writing your post..."
          showToolbar={true}
          showCharacterCount={true}
          maxLength={10000}
          onImageUpload={handleImageUpload}
        />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* SEO Settings */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Settings</h3>
                
                <div className="space-y-4">
                  <Input
                    label="Meta Title"
                    type="text"
                    placeholder="SEO title..."
                    value={post.metaTitle}
                    onChange={(e) => setPost(prev => ({ ...prev, metaTitle: e.target.value }))}
                    leftIcon={<DocumentTextIcon />}
                    variant="filled"
                    showCharacterCount
                    maxLength={60}
                    helperText="Recommended: 50-60 characters"
                  />

                  <Textarea
                    label="Meta Description"
                    placeholder="SEO description..."
                    value={post.metaDescription}
                    onChange={(e) => setPost(prev => ({ ...prev, metaDescription: e.target.value }))}
                    variant="filled"
                    showCharacterCount
                    maxLength={160}
                    rows={3}
                    helperText="Recommended: 150-160 characters"
                  />

                  <Input
                    label="Canonical URL"
                    type="url"
                    placeholder="https://techblit.com/..."
                    value={post.canonical}
                    onChange={(e) => setPost(prev => ({ ...prev, canonical: e.target.value }))}
                    leftIcon={<LinkIcon />}
                    variant="filled"
                  />

                  <FeaturedImageUpload
                    value={post.featuredImage}
                    onChange={(image) => setPost(prev => ({ ...prev, featuredImage: image || undefined }))}
                    onUpload={handleImageUpload}
                    required
                    error={errors.featuredImage}
                  />
                </div>
              </CardContent>
            </Card>

            {/* SEO Suggestions */}
            <Card>
              <CardContent className="p-6">
                <SEOSuggestions
                  title={post.title || ''}
                  metaTitle={post.metaTitle || ''}
                  metaDescription={post.metaDescription || ''}
                  content={post.contentHtml || ''}
                  slug={post.slug || ''}
                  tags={post.tags || []}
                  category={post.category || ''}
                  canonical={post.canonical}
                />
              </CardContent>
            </Card>

            {/* Canonical URL Management */}
            <CanonicalUrlManager
              value={post.canonical || ''}
              onChange={(canonical) => setPost(prev => ({ ...prev, canonical }))}
              slug={post.slug || ''}
            />

            {/* Scheduling */}
            <Card>
              <CardContent className="p-6">
                <Scheduling
                  scheduledAt={post.scheduledAt}
                  onScheduleChange={(date) => setPost(prev => ({ ...prev, scheduledAt: date || undefined }))}
                />
              </CardContent>
            </Card>

            {/* Tags & Categories */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tags & Categories</h3>
                
                <div className="space-y-4">
                  <div>
                    <TagInput
                      label="Tags"
                      value={post.tags || []}
                      onChange={(tags) => setPost(prev => ({ ...prev, tags }))}
                      placeholder="Add tags..."
                      helperText="Press Enter or comma to add tags"
                      icon={<TagIcon />}
                      variant="filled"
                    />
                    
                    {/* Suggested Tags */}
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-2">Suggested tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {prefilledTags.slice(0, 12).map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              const currentTags = post.tags || [];
                              if (!currentTags.includes(tag)) {
                                setPost(prev => ({ 
                                  ...prev, 
                                  tags: [...currentTags, tag] 
                                }));
                              }
                            }}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Dropdown
                      label="Category"
                      value={post.category || ''}
                      onChange={(value) => setPost(prev => ({ 
                        ...prev, 
                        category: value || '' 
                      }))}
                      options={CATEGORY_OPTIONS}
                      placeholder="Select a category..."
                      leftIcon={<FolderIcon />}
                      variant="filled"
                      helperText="Choose the category for this post"
                      clearable
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Post Settings */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Post Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="visibility" className="block text-sm font-medium text-gray-700">
                    Visibility
                  </label>
                  <select
                    id="visibility"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={post.visibility}
                    onChange={(e) => setPost(prev => ({ ...prev, visibility: e.target.value as any }))}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="members-only">Members Only</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    id="noindex"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={post.seo?.noindex || false}
                    onChange={(e) => setPost(prev => ({ 
                      ...prev, 
                      seo: { ...prev?.seo, noindex: e.target.checked } 
                    }))}
                  />
                  <label htmlFor="noindex" className="ml-2 block text-sm text-gray-900">
                    No Index (hide from search engines)
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(NewPostEditor, 'create_post');
