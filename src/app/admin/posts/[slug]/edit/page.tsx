'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AdminLayout from '@/components/admin/AdminLayout';
import { withAuth, useAuth } from '@/contexts/AuthContext';

import { Post, PostStatus, PERMISSIONS, hasPermission } from '@/types/admin';
import { 
  DocumentTextIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  BookmarkIcon,
  PaperAirplaneIcon,
  CalendarIcon,
  TagIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import { 
  Button, 
  Input, 
  Textarea, 
  Card, 
  CardContent, 
  Select, 
  Alert, 
  Spinner,
  TagInput
} from '@/components/ui';
import RichTextEditor from '@/components/editor/RichTextEditor';
import SEOSuggestions from '@/components/editor/SEOSuggestions';
import CanonicalUrlManager from '@/components/editor/CanonicalUrlManager';
import Scheduling from '@/components/editor/Scheduling';
import Preview from '@/components/editor/Preview';
import FeaturedImageUpload from '@/components/editor/FeaturedImageUpload';
import { uploadFeaturedImage } from '@/lib/imageUpload';
import { sanitizeWordPressUrls } from '@/lib/imageUrlUtils';

function EditPostEditor() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Wrapper function to upload featured images with multiple versions
  const handleImageUpload = async (file: File) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }
    return await uploadFeaturedImage(file);
  };
  
  // Wrapper function for RichTextEditor (returns string URL)
  const handleRichTextImageUpload = async (file: File): Promise<string> => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }
    const processedImage = await uploadFeaturedImage(file);
    return processedImage.original.url;
  };
  
  const [post, setPost] = useState<Partial<Post>>({
    title: '',
    slug: '',
    excerpt: '',
    contentHtml: '',
    metaTitle: '',
    metaDescription: '',
    canonical: '',
    tags: [],
    category: '',
    status: 'draft',
    scheduledAt: undefined,
    featuredImage: undefined,
  });
  const [status, setStatus] = useState<PostStatus>('draft');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const slug = params.slug as string;
        if (!slug) {
          setError('Post not found');
          return;
        }

        // Query posts by slug
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, where('slug', '==', slug));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError('Post not found');
          return;
        }

        const postDoc = querySnapshot.docs[0];
        const postData = { id: postDoc.id, ...postDoc.data() } as Post;
        
        // Check permissions
        const canEditAnyPost = hasPermission(user?.role || 'viewer', PERMISSIONS.EDIT_ANY_POST);
        const canEditOwnPost = hasPermission(user?.role || 'viewer', PERMISSIONS.EDIT_OWN_POST);
        const isOwnPost = postData.author?.uid === user?.uid;
        
        if (!canEditAnyPost && !(canEditOwnPost && isOwnPost)) {
          setError('You do not have permission to edit this post');
          return;
        }
        
        setPost(postData);
        setStatus(postData.status || 'draft');
      } catch (error) {
        console.error('Error fetching post:', error);
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [params.slug, user]);

  const handleSave = async (action: 'save' | 'publish' | 'schedule' | 'in_review') => {
    if (!post.title || !post.contentHtml) {
      alert('Please fill in the title and content');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const now = new Date();
      let finalStatus = action === 'publish' ? 'published' : 
                       action === 'schedule' ? 'scheduled' : 
                       action === 'in_review' ? 'in_review' : 'draft';
      
      if (action === 'publish' && post.scheduledAt && post.scheduledAt > now) {
        finalStatus = 'scheduled';
      }

      // Sanitize WordPress URLs from content before saving
      const sanitizedContentHtml = post.contentHtml ? sanitizeWordPressUrls(post.contentHtml) : '';
      
      const postData = {
        ...post,
        contentHtml: sanitizedContentHtml,
        status: finalStatus,
        author: {
          name: user?.name || 'Unknown User',
          uid: user?.uid || '',
        },
        updatedAt: serverTimestamp(),
        publishedAt: finalStatus === 'published' ? serverTimestamp() : post.publishedAt,
        scheduledAt: post.scheduledAt ? post.scheduledAt : null,
        history: [
          ...(post.history || []),
          {
            action: finalStatus === 'published' ? 'published' : 
                    finalStatus === 'scheduled' ? 'scheduled' : 
                    finalStatus === 'in_review' ? 'review_requested' : 'updated',
            by: user?.uid || '',
            at: now.toISOString(),
            note: finalStatus === 'published' ? 'Post published' : 
                  finalStatus === 'scheduled' ? `Post scheduled for ${post.scheduledAt?.toLocaleString()}` :
                  finalStatus === 'in_review' ? 'Post submitted for review' :
                  'Post updated',
          }
        ],
      };

      // Filter out undefined values
      const filteredPostData = Object.fromEntries(
        Object.entries(postData).filter(([_, value]) => value !== undefined)
      );

      await updateDoc(doc(db, 'posts', post.id!), filteredPostData);
      router.push('/admin/posts');
    } catch (error) {
      console.error('Error saving post:', error);
      setError('Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setPost(prev => ({
      ...prev,
      title: value,
      slug: prev.slug || generateSlug(value),
      metaTitle: prev.metaTitle || value,
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/admin/posts')}>
              Back to Posts
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/admin/posts')}
                leftIcon={<ArrowLeftIcon />}
                className="mr-4"
              >
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Post</h1>
                <p className="text-gray-600">Update your blog post</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => handleSave('save')}
                leftIcon={<BookmarkIcon />}
                loading={saving}
              >
                Save Draft
              </Button>
              
              {status === 'draft' && (
                <Button
                  variant="secondary"
                  onClick={() => handleSave('in_review')}
                  leftIcon={<EyeIcon />}
                  loading={saving}
                >
                  Request Review
                </Button>
              )}
              
              {status !== 'published' && (
                <Button
                  variant="primary"
                  onClick={() => handleSave('publish')}
                  leftIcon={<PaperAirplaneIcon />}
                  loading={saving}
                >
                  Publish
                </Button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="danger" className="mb-6">
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <Input
                    label="Title"
                    value={post.title || ''}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Enter post title"
                    variant="filled"
                    helperText="The main title of your post"
                  />
                  
                  <Input
                    label="Slug"
                    value={post.slug || ''}
                    onChange={(e) => setPost(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="post-slug"
                    variant="filled"
                    helperText="URL-friendly version of the title"
                  />
                  
                  <Textarea
                    label="Excerpt"
                    value={post.excerpt || ''}
                    onChange={(e) => setPost(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Brief description of your post"
                    variant="filled"
                    rows={3}
                    helperText="A short summary of your post"
                    showCharacterCount
                    maxLength={160}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card>
              <CardContent className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  onImageUpload={handleRichTextImageUpload}
                />
              </CardContent>
            </Card>

            {/* Tags & Categories */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tags & Categories</h3>
                
                <div className="space-y-4">
                  <TagInput
                    label="Tags"
                    value={post.tags || []}
                    onChange={(tags) => setPost(prev => ({ ...prev, tags }))}
                    placeholder="Add tags..."
                    helperText="Press Enter or comma to add tags"
                    icon={<TagIcon />}
                    variant="filled"
                  />

                  <Select
                    label="Category"
                    value={post.category || ''}
                    onChange={(e) => setPost(prev => ({ ...prev, category: e.target.value }))}
                    helperText="Choose the category for this post"
                    options={[
                      { value: '', label: 'Select a category...' },
                      { value: 'Startup', label: 'Startup' },
                      { value: 'Tech News', label: 'Tech News' },
                      { value: 'Funding', label: 'Funding' },
                      { value: 'Insights', label: 'Insights' },
                      { value: 'Events', label: 'Events' },
                      { value: 'Fintech', label: 'Fintech' },
                      { value: 'AI & Innovation', label: 'AI & Innovation' },
                      { value: 'Developer Tools', label: 'Developer Tools' },
                      { value: 'Opinions', label: 'Opinions' },
                      { value: 'Brand Press', label: 'Brand Press' }
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* SEO Settings */}
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

            {/* Canonical URL Management */}
            <CanonicalUrlManager
              value={post.canonical || ''}
              onChange={(canonical) => setPost(prev => ({ ...prev, canonical }))}
              slug={post.slug || ''}
            />

            {/* Featured Image */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Featured Image</h3>
                <FeaturedImageUpload
                  value={post.featuredImage}
                  onChange={(image) => setPost(prev => ({ ...prev, featuredImage: image || undefined }))}
                  onUpload={handleImageUpload}
                  required={false}
                />
              </CardContent>
            </Card>

            {/* Scheduling */}
            <Scheduling
              scheduledAt={post.scheduledAt}
              onScheduleChange={(date) => setPost(prev => ({ ...prev, scheduledAt: date || undefined }))}
            />

            {/* Preview */}
            <Preview
              title={post.title || ''}
              content={post.contentHtml || ''}
              metaDescription={post.metaDescription || ''}
              slug={post.slug || ''}
              author={post.author}
              featuredImage={(post.featuredImage as any)?.url}
              postId={post.id}
              status={status}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(EditPostEditor);
