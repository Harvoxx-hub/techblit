'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '@/lib/apiService';
import AdminLayout from '@/components/admin/AdminLayout';
import { withAuth, useAuth } from '@/contexts/AuthContext';
import { 
  GrokStory, 
  GrokStoryStatus, 
  GROK_CATEGORIES,
  GrokCategory,
  getGrokStatusBadgeVariant,
  getGrokStatusLabel
} from '@/types/admin';
import {
  Card,
  CardContent,
  StatsCard,
  Badge,
  Button,
  Spinner,
  EmptyState,
  Modal
} from '@/components/ui';
import {
  SparklesIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  FunnelIcon,
  LinkIcon,
  ClockIcon,
  FireIcon,
  NewspaperIcon,
  ChevronDownIcon,
  BoltIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  CpuChipIcon,
  ScaleIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Breaking News': BoltIcon,
  'Trending Stories': FireIcon,
  'Company News': BuildingOfficeIcon,
  'Product Launches & Reviews': RocketLaunchIcon,
  'Funding & Investments': CurrencyDollarIcon,
  'Regulatory & Policy Changes': ScaleIcon,
  'Security & Hacking': ShieldCheckIcon,
  'Emerging Technologies': CpuChipIcon
};

interface StoryStats {
  total: number;
  new: number;
  draft_created: number;
  published: number;
  archived: number;
}

// Custom Dropdown Component
interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; icon?: React.ComponentType<{ className?: string }> }[];
  placeholder?: string;
  className?: string;
}

function CustomDropdown({ value, onChange, options, placeholder = "Select...", className }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);
  const IconComponent = selectedOption?.icon;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full bg-white border border-gray-300 rounded-lg pl-3 pr-10 py-2.5 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-gray-400 transition-colors shadow-sm"
      >
        <span className="flex items-center gap-2">
          {IconComponent && <IconComponent className="h-4 w-4 text-gray-500" />}
          <span className="block truncate text-sm text-gray-700">
            {selectedOption?.label || placeholder}
          </span>
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronDownIcon 
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none animate-in fade-in-0 zoom-in-95 duration-100">
          {options.map((option) => {
            const OptionIcon = option.icon;
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`relative w-full text-left px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-purple-50 text-purple-900' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  {OptionIcon && (
                    <OptionIcon className={`h-4 w-4 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`} />
                  )}
                  <span className={`block truncate ${isSelected ? 'font-medium' : ''}`}>
                    {option.label}
                  </span>
                </span>
                {isSelected && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <CheckCircleIcon className="h-4 w-4 text-purple-600" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Map Grok categories to Post categories
const mapGrokCategoryToPostCategory = (grokCategory: string): string => {
  const categoryMap: Record<string, string> = {
    'Breaking News': 'Tech News',
    'Trending Stories': 'Tech News',
    'Company News': 'Startup',
    'Product Launches & Reviews': 'Tech News',
    'Funding & Investments': 'Funding',
    'Regulatory & Policy Changes': 'Tech News',
    'Security & Hacking': 'Tech News',
    'Emerging Technologies': 'AI & Innovation'
  };
  return categoryMap[grokCategory] || 'Tech News';
};

// Generate tags from Grok story
const generateTagsFromStory = (story: GrokStory): string[] => {
  const tags: string[] = [];
  
  // Add suggested tags if available
  if (story.suggested_tags && story.suggested_tags.length > 0) {
    tags.push(...story.suggested_tags);
  }
  
  // Add category-based tags
  const categoryTags: Record<string, string[]> = {
    'Breaking News': ['breaking-news', 'nigeria', 'tech-news'],
    'Trending Stories': ['trending', 'nigeria', 'tech'],
    'Company News': ['startup', 'nigeria', 'company-news'],
    'Product Launches & Reviews': ['product-launch', 'review', 'nigeria'],
    'Funding & Investments': ['funding', 'investment', 'startup', 'nigeria'],
    'Regulatory & Policy Changes': ['regulation', 'policy', 'nigeria', 'fintech'],
    'Security & Hacking': ['security', 'cybersecurity', 'nigeria'],
    'Emerging Technologies': ['ai', 'innovation', 'nigeria', 'technology']
  };
  
  const categoryTagList = categoryTags[story.category] || ['nigeria', 'tech'];
  tags.push(...categoryTagList);
  
  // Add common Nigeria tech tags
  if (!tags.includes('nigeria')) tags.push('nigeria');
  if (!tags.includes('africa')) tags.push('africa');
  
  // Remove duplicates and limit to 10
  return Array.from(new Set(tags)).slice(0, 10);
};

// Generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// Helper: Construct Twitter/X URL from tweet ID
/**
 * Extract tweet ID from Twitter/X URL
 */
const extractTweetIdFromUrl = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  
  const cleanUrl = url.split('?')[0].split('#')[0].trim();
  
  const patterns = [
    /(?:twitter\.com|x\.com)\/(?:\w+\/)?status\/(\d+)/i,
    /(?:twitter\.com|x\.com)\/i\/web\/status\/(\d+)/i,
    /\/status\/(\d+)/i
  ];
  
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

/**
 * Detect placeholder/fake tweet IDs
 */
const isPlaceholderTweetId = (tweetId: string): boolean => {
  if (!tweetId || typeof tweetId !== 'string') return true;
  
  const cleanId = tweetId.trim();
  
  // Check for common placeholder patterns
  const placeholderPatterns = [
    /^1234567890+/,           // Starts with 1234567890...
    /^12345+$/,                // All 12345...
    /^(\d)\1{14,19}$/,         // All same digit
    /^123456789012345/,        // Common placeholder sequence
    /^(\d)\1{10,}$/,           // Repeated single digit
    /^123\d{12,17}$/,          // Starts with 123 followed by digits
    /^(\d{2})\1{7,9}$/,        // Repeated 2-digit pattern
    /^(\d{3})\1{4,6}$/,        // Repeated 3-digit pattern
    /^(\d{4})\1{3,4}$/,        // Repeated 4-digit pattern
    /^(\d{5})\1{2,3}$/         // Repeated 5-digit pattern
  ];
  
  for (const pattern of placeholderPatterns) {
    if (pattern.test(cleanId)) {
      return true;
    }
  }
  
  // Check for sequential ascending pattern
  if (cleanId.length >= 15) {
    let sequentialCount = 0;
    let maxSequential = 0;
    for (let i = 1; i < cleanId.length; i++) {
      const prev = parseInt(cleanId[i - 1]);
      const curr = parseInt(cleanId[i]);
      if (curr === (prev + 1) % 10 || (prev === 9 && curr === 0)) {
        sequentialCount++;
        maxSequential = Math.max(maxSequential, sequentialCount);
      } else {
        sequentialCount = 0;
      }
    }
    // If more than 10 sequential digits, likely a placeholder
    if (maxSequential >= 10) {
      return true;
    }
  }
  
  return false;
};

/**
 * Validate if a string is a valid Twitter tweet ID
 */
const isValidTweetId = (tweetId: string): boolean => {
  if (!tweetId || typeof tweetId !== 'string') return false;
  const cleanId = tweetId.trim();
  
  // Must be numeric and between 15-20 digits
  if (!/^\d{15,20}$/.test(cleanId)) {
    return false;
  }
  
  // Check for placeholder patterns
  if (isPlaceholderTweetId(cleanId)) {
    console.warn('Detected placeholder tweet ID:', cleanId);
    return false;
  }
  
  return true;
};

/**
 * Validate Twitter/X URL
 */
const isValidTwitterUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  const cleanUrl = url.trim().toLowerCase();
  
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    return false;
  }
  
  if (!cleanUrl.includes('twitter.com') && !cleanUrl.includes('x.com')) {
    return false;
  }
  
  // Reject placeholder/example URLs
  if (cleanUrl.includes('example.com') || 
      cleanUrl.includes('placeholder') ||
      cleanUrl.includes('test.com') ||
      cleanUrl.includes('dummy')) {
    return false;
  }
  
  const tweetId = extractTweetIdFromUrl(url);
  return tweetId !== null && isValidTweetId(tweetId);
};

/**
 * Construct Twitter/X URL from tweet ID
 */
const constructTwitterUrl = (tweetId: string): string => {
  if (!tweetId) return '';
  const cleanId = String(tweetId).trim();
  if (!isValidTweetId(cleanId)) {
    console.warn('Invalid tweet ID format:', cleanId);
    return '';
  }
  return `https://x.com/i/web/status/${cleanId}`;
};

/**
 * Get the primary link for a story with step-by-step validation
 * 1. Validate primary_link if it exists
 * 2. Extract tweet ID from primary_link if valid
 * 3. Validate tweet IDs from x_post_ids
 * 4. Construct URL from first valid x_post_id
 * 5. Return the best available link
 */
const getPrimaryLink = (story: GrokStory): string => {
  // Step 1: Validate primary_link if it exists
  if (story.primary_link) {
    const primaryLink = String(story.primary_link).trim();
    
    if (isValidTwitterUrl(primaryLink)) {
      const tweetId = extractTweetIdFromUrl(primaryLink);
      if (tweetId && isValidTweetId(tweetId)) {
        return primaryLink;
      }
    }
  }
  
  // Step 2: Try to construct from x_post_ids
  if (story.x_post_ids && Array.isArray(story.x_post_ids) && story.x_post_ids.length > 0) {
    for (const postId of story.x_post_ids) {
      if (isValidTweetId(postId)) {
        const constructedUrl = constructTwitterUrl(postId);
        if (constructedUrl) {
          return constructedUrl;
        }
      }
    }
  }
  
  // Step 3: No valid link found
  return '';
};

function GrokTrendsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stories, setStories] = useState<GrokStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [creatingDraft, setCreatingDraft] = useState<string | null>(null);
  const [publishingStory, setPublishingStory] = useState<string | null>(null);
  const [fetchingStories, setFetchingStories] = useState(false);
  const [showFetchModal, setShowFetchModal] = useState(false);
  const [fetchCategory, setFetchCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStory, setSelectedStory] = useState<GrokStory | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewStory, setPreviewStory] = useState<GrokStory | null>(null);
  const [stats, setStats] = useState<StoryStats>({
    total: 0,
    new: 0,
    draft_created: 0,
    published: 0,
    archived: 0
  });
  const [autoDraftConfig, setAutoDraftConfig] = useState({
    enabled: false,
    engagementThreshold: 5000,
    categories: [] as string[]
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [showAutoDraftSettings, setShowAutoDraftSettings] = useState(false);

  // Status filter options - Simplified workflow
  const statusOptions = [
    { value: 'all', label: 'All Stories', icon: FunnelIcon },
    { value: 'new', label: 'New Stories', icon: SparklesIcon },
    { value: 'draft_created', label: 'Draft Created', icon: PencilSquareIcon },
    { value: 'published', label: 'Published', icon: CheckCircleIcon },
    { value: 'archived', label: 'Archived', icon: DocumentTextIcon }
  ];

  // Category filter options
  const categoryOptions = [
    { value: 'all', label: 'All Categories', icon: FunnelIcon },
    ...GROK_CATEGORIES.map(cat => ({
      value: cat,
      label: cat,
      icon: CATEGORY_ICONS[cat] || DocumentTextIcon
    }))
  ];

  // Fetch stories on mount and filter change
  useEffect(() => {
    fetchStories();
    fetchAutoDraftConfig();
  }, [selectedStatus, selectedCategory]);

  const fetchAutoDraftConfig = async () => {
    try {
      const config = await apiService.getAutoDraftConfig() as any;
      if (config) {
        setAutoDraftConfig({
          enabled: config.enabled || false,
          engagementThreshold: config.engagementThreshold || 5000,
          categories: config.categories || []
        });
      }
    } catch (error: any) {
      // Handle 404 gracefully - config might not exist yet, use defaults
      const errorMessage = error?.message || String(error || '');
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        // Config doesn't exist yet, use defaults (already set in state)
        // Silently continue with default values
      } else {
        console.error('Error fetching auto-draft config:', error);
      }
    }
  };

  const handleSaveAutoDraftConfig = async () => {
    try {
      setSavingConfig(true);
      await apiService.updateAutoDraftConfig(autoDraftConfig);
      alert('Auto-draft configuration saved successfully!');
      setShowAutoDraftSettings(false);
    } catch (error: any) {
      console.error('Error saving auto-draft config:', error);
      alert(`Failed to save configuration: ${error.message || 'Please try again.'}`);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleManualFetch = async () => {
    try {
      setFetchingStories(true);
      
      const fetchData: any = {};
      if (fetchCategory && fetchCategory !== 'all') {
        fetchData.category = fetchCategory;
      }
      
      const result = await apiService.fetchGrokStories(fetchData) as any;
      
      // Extract result data
      let fetchResult = result;
      if (result && typeof result === 'object' && 'data' in result) {
        fetchResult = result.data;
      }
      
      const fetched = fetchResult?.fetched || 0;
      const stored = fetchResult?.stored || 0;
      const skipped = fetchResult?.skipped || 0;
      const draftsGenerated = fetchResult?.draftsGenerated || 0;
      
      // Show success message
      alert(
        `✅ Fetch completed!\n\n` +
        `Fetched: ${fetched} stories\n` +
        `Stored: ${stored} new stories\n` +
        `Skipped: ${skipped} duplicates\n` +
        `Drafts generated: ${draftsGenerated}`
      );
      
      // Close modal and reset category
      setShowFetchModal(false);
      setFetchCategory('');
      
      // Refresh stories list
      await fetchStories();
    } catch (error: any) {
      console.error('Error fetching stories from Grok:', error);
      alert(`Failed to fetch stories: ${error.message || 'Please try again.'}`);
    } finally {
      setFetchingStories(false);
    }
  };

  const fetchStories = async () => {
    try {
      setLoading(true);
      
      // Ensure user is authenticated
      if (!user) {
        console.error('User not authenticated');
        alert('Please log in to view Grok Trends');
        router.push('/admin/login');
        return;
      }
      
      // Fetch stories from API
      const response = await apiService.getGrokStories({
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        limit: 100
      });

      // Ensure we have an array - handle both direct array and wrapped responses
      let storiesData: GrokStory[] = [];
      if (Array.isArray(response)) {
        storiesData = response;
      } else if (response && typeof response === 'object') {
        // Try to extract array from various possible response structures
        const responseObj = response as Record<string, any>;
        if (Array.isArray(responseObj.data)) {
          storiesData = responseObj.data;
        } else if (Array.isArray(responseObj.stories)) {
          storiesData = responseObj.stories;
        } else if (responseObj.data && typeof responseObj.data === 'object' && Array.isArray(responseObj.data.stories)) {
          storiesData = responseObj.data.stories;
        } else {
          console.warn('Unexpected API response format:', response);
          storiesData = [];
        }
      } else {
        console.warn('Unexpected API response type:', typeof response, response);
        storiesData = [];
      }
      
      // Log for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(`Fetched ${storiesData.length} stories from API`);
      }

      setStories(storiesData);

      // Fetch stats from API
      const statsResponse = await apiService.getGrokStats() as any;
      
      // Handle stats response - ensure we extract the data correctly
      let statsResult = statsResponse;
      if (statsResponse && typeof statsResponse === 'object' && 'data' in statsResponse) {
        statsResult = statsResponse.data;
      }
      
      const statsData: StoryStats = {
        total: statsResult?.total || 0,
        new: statsResult?.new || 0,
        draft_created: statsResult?.draft_created || 0,
        published: statsResult?.published || 0,
        archived: statsResult?.archived || 0
      };

      setStats(statsData);
    } catch (error: any) {
      console.error('Error fetching stories:', error);
      // Set empty state on error
      setStories([]);
      setStats({
        total: 0,
        new: 0,
        draft_created: 0,
        published: 0,
        archived: 0
      });
      // Show user-friendly error message
      alert(`Failed to load stories: ${error.message || 'Please check your connection and try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (storyId: string, newStatus: GrokStoryStatus, notes?: string) => {
    try {
      setActionLoading(storyId);
      
      await apiService.updateGrokStoryStatus(storyId, newStatus);

      // Refresh stories
      await fetchStories();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update story status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateDraftPost = async (story: GrokStory) => {
    try {
      setCreatingDraft(story.id);
      
      // Call backend to generate AI-powered draft
      const draftData = await apiService.generateGrokDraft(story.id) as any;
      
      if (!draftData || !draftData.title || !draftData.content) {
        throw new Error('Failed to generate draft - missing required fields');
      }
      
      // Store draft data in sessionStorage for pre-filling the new post form
      const prefilledData = {
        title: draftData.title,
        slug: draftData.slug || generateSlug(draftData.title),
        excerpt: draftData.excerpt || story.summary.substring(0, 160),
        content: draftData.content,
        metaTitle: draftData.metaTitle || draftData.title.substring(0, 60),
        metaDescription: draftData.metaDescription || draftData.excerpt || story.summary.substring(0, 160),
        tags: draftData.tags || generateTagsFromStory(story),
        category: draftData.category || mapGrokCategoryToPostCategory(story.category),
        recommendedImages: draftData.recommendedImages || [], // Include recommended images
        // Store story reference for linking
        source: {
          type: 'grok_story',
          storyId: story.id,
          x_post_ids: story.x_post_ids,
          original_category: story.category,
          original_link: story.primary_link
        }
      };
      
      sessionStorage.setItem('grok_draft_data', JSON.stringify(prefilledData));
      
      // Update Grok story status to draft_created
      try {
        await apiService.updateGrokStoryStatus(story.id, 'draft_created');
      } catch (statusError) {
        console.warn('Failed to update story status:', statusError);
        // Continue anyway - draft was generated successfully
      }
      
      // Close modals
      setShowPreviewModal(false);
      setPreviewStory(null);
      setShowPublishModal(false);
      setSelectedStory(null);
      
      // Refresh stories
      await fetchStories();
      
      // Navigate to new post page with pre-filled data
      router.push('/admin/posts/new');
    } catch (error: any) {
      console.error('Error generating draft:', error);
      alert(`Failed to generate draft: ${error.message || 'Please try again.'}`);
    } finally {
      setCreatingDraft(null);
    }
  };

  const handlePublishStory = async (story: GrokStory) => {
    // Confirm before publishing
    const confirmed = window.confirm(
      `Publish "${story.title}" as a blog post?\n\n` +
      `This will create a published blog post immediately. You can edit it later if needed.`
    );
    
    if (!confirmed) return;
    
    try {
      setPublishingStory(story.id);
      
      // Prepare post data - use draft data if available, otherwise use story data
      const postData: any = {};
      
      if (story.draft_title || story.draft_body) {
        // Use draft data if available
        postData.title = story.draft_title || story.title;
        postData.contentHtml = story.draft_body;
        postData.excerpt = story.draft_excerpt || story.summary;
        postData.metaTitle = story.draft_meta_title;
        postData.metaDescription = story.draft_meta_description;
        postData.tags = story.suggested_tags || [];
      } else {
        // Use story data - but we need to generate draft first or use basic data
        postData.title = story.title;
        postData.contentHtml = `<p>${story.summary}</p>`;
        postData.excerpt = story.summary.substring(0, 160);
        postData.tags = generateTagsFromStory(story);
      }
      
      postData.category = mapGrokCategoryToPostCategory(story.category);
      
      // Call publish endpoint
      const result = await apiService.publishGrokStory(story.id, postData) as any;
      
      // Show success message
      alert(`✅ Story published successfully!\n\nPost: ${result.title || story.title}\nURL: /${result.slug || 'post-slug'}`);
      
      // Refresh stories to update status
      await fetchStories();
      
      // Close any open modals
      setShowPreviewModal(false);
      setPreviewStory(null);
      setShowPublishModal(false);
      setSelectedStory(null);
      
      // Optionally navigate to the published post
      if (result.postId) {
        const navigate = window.confirm('View the published post?');
        if (navigate) {
          router.push(`/admin/posts/${result.postId}/edit`);
        }
      }
    } catch (error: any) {
      console.error('Error publishing story:', error);
      alert(`Failed to publish story: ${error.message || 'Please try again.'}`);
    } finally {
      setPublishingStory(null);
    }
  };

  const handlePreviewStory = (story: GrokStory) => {
    setPreviewStory(story);
    setShowPreviewModal(true);
  };

  const handlePreviewAction = async (storyId: string, newStatus: GrokStoryStatus) => {
    await handleStatusUpdate(storyId, newStatus);
    // Update the preview story state
    if (previewStory && previewStory.id === storyId) {
      setPreviewStory({ ...previewStory, status: newStatus });
    }
  };

  const formatDate = (date: Date | { toDate: () => Date } | undefined) => {
    if (!date) return 'N/A';
    const d = typeof date === 'object' && 'toDate' in date ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryIcon = (category: string) => {
    const IconComponent = CATEGORY_ICONS[category] || DocumentTextIcon;
    return <IconComponent className="h-4 w-4" />;
  };

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
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <SparklesIcon className="h-7 w-7 text-purple-600" />
              Grok Trends
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              AI-powered Nigeria tech news curation from X (Twitter)
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <Button
              variant="outline"
              onClick={() => fetchStories()}
              disabled={loading}
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowFetchModal(true)}
              disabled={fetchingStories}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {fetchingStories ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Fetching...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Fetch from Grok
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatsCard 
            title="Total Stories" 
            value={stats.total} 
            icon={<DocumentTextIcon className="h-6 w-6" />} 
          />
          <StatsCard 
            title="New Stories" 
            value={stats.new} 
            icon={<SparklesIcon className="h-6 w-6" />} 
          />
          <StatsCard 
            title="Drafts Created" 
            value={stats.draft_created} 
            icon={<PencilSquareIcon className="h-6 w-6" />} 
          />
          <StatsCard 
            title="Published" 
            value={stats.published} 
            icon={<CheckCircleIcon className="h-6 w-6" />} 
          />
          <StatsCard 
            title="Archived" 
            value={stats.archived} 
            icon={<DocumentTextIcon className="h-6 w-6" />} 
          />
        </div>

        {/* Filters */}
        <Card className="overflow-visible">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Filter Label */}
              <div className="flex items-center gap-2 sm:border-r sm:pr-4 sm:border-gray-200">
                <FunnelIcon className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-semibold text-gray-700">Filters</span>
              </div>

              {/* Dropdowns Container */}
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                {/* Status Dropdown */}
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                    Status
                  </label>
                  <CustomDropdown
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    options={statusOptions}
                    placeholder="Filter by status"
                  />
                </div>

                {/* Category Dropdown */}
                <div className="flex-1 min-w-[220px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                    Category
                  </label>
                  <CustomDropdown
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    options={categoryOptions}
                    placeholder="Filter by category"
                  />
                </div>
              </div>

              {/* Results Count */}
              <div className="flex items-end sm:border-l sm:pl-4 sm:border-gray-200">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">
                    {stories.length} {stories.length === 1 ? 'story' : 'stories'}
                  </span>
                </div>
              </div>
            </div>

            {/* Active Filters Pills */}
            {(selectedStatus !== 'all' || selectedCategory !== 'all') && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2 items-center">
                <span className="text-xs text-gray-500">Active filters:</span>
                {selectedStatus !== 'all' && (
                  <button
                    onClick={() => setSelectedStatus('all')}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors"
                  >
                    {getGrokStatusLabel(selectedStatus as GrokStoryStatus)}
                    <XCircleIcon className="h-3.5 w-3.5" />
                  </button>
                )}
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors"
                  >
                    {selectedCategory}
                    <XCircleIcon className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedStatus('all');
                    setSelectedCategory('all');
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auto-Draft Settings */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BoltIcon className="h-5 w-5 text-purple-600" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Auto-Draft Generation</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Automatically generate drafts for high-engagement stories
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoDraftConfig.enabled}
                    onChange={(e) => setAutoDraftConfig({ ...autoDraftConfig, enabled: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {autoDraftConfig.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAutoDraftSettings(!showAutoDraftSettings)}
                >
                  Configure
                </Button>
              </div>
            </div>

            {showAutoDraftSettings && (
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Engagement Threshold
                  </label>
                  <input
                    type="number"
                    value={autoDraftConfig.engagementThreshold}
                    onChange={(e) => setAutoDraftConfig({ 
                      ...autoDraftConfig, 
                      engagementThreshold: parseInt(e.target.value) || 5000 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    placeholder="5000"
                    min="0"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Stories with engagement score above this threshold will have drafts auto-generated
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveAutoDraftConfig}
                    disabled={savingConfig}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {savingConfig ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Configuration'
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAutoDraftSettings(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stories List */}
        {stories.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                  <SparklesIcon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedStatus !== 'all' || selectedCategory !== 'all'
                    ? "No matching stories"
                    : "No stories yet"}
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                  {selectedStatus !== 'all' || selectedCategory !== 'all'
                    ? "No stories match your current filters. Try adjusting them or clear filters to see all stories."
                    : "No stories found. Stories are automatically fetched from X (Twitter) using Grok AI. Configure the server-side function to fetch real stories from X."}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {(selectedStatus !== 'all' || selectedCategory !== 'all') && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedStatus('all');
                        setSelectedCategory('all');
                      }}
                    >
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {stories.map((story) => (
              <Card key={story.id} className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Story Content */}
                    <div className="flex-1 min-w-0">
                      {/* Status & Category Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant={getGrokStatusBadgeVariant(story.status)}>
                          {getGrokStatusLabel(story.status)}
                        </Badge>
                        <Badge variant="default" className="flex items-center gap-1">
                          {getCategoryIcon(story.category)}
                          {story.category}
                        </Badge>
                      </div>

                      {/* Title - Clickable for Preview */}
                      <button
                        onClick={() => handlePreviewStory(story)}
                        className="text-left group"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors">
                          {story.title}
                        </h3>
                      </button>

                      {/* Summary */}
                      <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                        {story.summary}
                      </p>
                      
                      {/* Preview Link */}
                      <button
                        onClick={() => handlePreviewStory(story)}
                        className="mt-2 text-xs text-purple-600 hover:text-purple-800 font-medium inline-flex items-center gap-1"
                      >
                        <EyeIcon className="h-3.5 w-3.5" />
                        Read full story
                      </button>

                      {/* Meta Info */}
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FireIcon className="h-3.5 w-3.5" />
                          {story.engagement_score?.toLocaleString() || 0} engagement
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3.5 w-3.5" />
                          {formatDate(story.first_seen_at)}
                        </span>
                        {story.author_handles && story.author_handles.length > 0 && (
                          <span>
                            👤 {story.author_handles.slice(0, 2).join(', ')}
                            {story.author_handles.length > 2 && ` +${story.author_handles.length - 2}`}
                          </span>
                        )}
                        {getPrimaryLink(story) && (
                          <a
                            href={getPrimaryLink(story)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-purple-600 hover:text-purple-800 hover:underline"
                          >
                            <LinkIcon className="h-3.5 w-3.5" />
                            View on X
                          </a>
                        )}
                      </div>

                      {/* Draft Indicator */}
                      {story.status === 'draft_created' && (
                        <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-md border border-yellow-200">
                          <PencilSquareIcon className="h-3.5 w-3.5" />
                          Draft created
                        </div>
                      )}

                      {story.status === 'published' && (
                        <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md border border-green-200">
                          <CheckCircleIcon className="h-3.5 w-3.5" />
                          Published
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap lg:flex-col gap-2 lg:min-w-[160px]">
                      {/* Primary Action: Write Article - Available for new stories */}
                      {story.status === 'new' && (
                        <Button
                          size="sm"
                          onClick={() => handleCreateDraftPost(story)}
                          disabled={creatingDraft === story.id}
                          className="flex-1 lg:flex-none bg-purple-600 hover:bg-purple-700"
                        >
                          {creatingDraft === story.id ? (
                            <>
                              <Spinner size="sm" className="mr-2" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <PencilSquareIcon className="h-4 w-4 mr-1" />
                              Write Article
                            </>
                          )}
                        </Button>
                      )}

                      {/* Draft Created - Quick Publish or Edit */}
                      {story.status === 'draft_created' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handlePublishStory(story)}
                            disabled={publishingStory === story.id}
                            className="flex-1 lg:flex-none bg-green-600 hover:bg-green-700 text-white"
                          >
                            {publishingStory === story.id ? (
                              <>
                                <Spinner size="sm" className="mr-2" />
                                Publishing...
                              </>
                            ) : (
                              <>
                                <RocketLaunchIcon className="h-4 w-4 mr-1" />
                                Quick Publish
                              </>
                            )}
                          </Button>
                          {story.published_post_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/admin/posts/${story.published_post_id}/edit`)}
                              className="flex-1 lg:flex-none"
                            >
                              <PencilSquareIcon className="h-4 w-4 mr-1" />
                              Edit Draft
                            </Button>
                          )}
                        </>
                      )}

                      {/* Published - View post */}
                      {story.status === 'published' && story.published_post_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/posts/${story.published_post_id}/edit`)}
                          className="flex-1 lg:flex-none"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View Post
                        </Button>
                      )}

                      {/* Archive action for any status */}
                      {story.status !== 'archived' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(story.id, 'archived')}
                          disabled={actionLoading === story.id}
                          className="flex-1 lg:flex-none text-gray-600"
                        >
                          <DocumentTextIcon className="h-4 w-4 mr-1" />
                          Archive
                        </Button>
                      )}

                      {/* Restore archived */}
                      {story.status === 'archived' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(story.id, 'new')}
                          disabled={actionLoading === story.id}
                          className="flex-1 lg:flex-none"
                        >
                          <ArrowPathIcon className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      )}

                      {/* Always show preview button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreviewStory(story)}
                        className="flex-1 lg:flex-none"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Manual Fetch Modal */}
        <Modal
          isOpen={showFetchModal}
          onClose={() => {
            setShowFetchModal(false);
            setFetchCategory('');
          }}
          title="Fetch Stories from Grok"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Select a specific category to fetch, or leave as "All Categories" to fetch trending stories.
              </p>
              <CustomDropdown
                value={fetchCategory || 'all'}
                onChange={setFetchCategory}
                options={categoryOptions}
                placeholder="Select category (optional)"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This will call the Grok API to fetch new stories from X (Twitter). 
                Stories are automatically deduplicated, so existing stories won't be added again.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowFetchModal(false);
                  setFetchCategory('');
                }}
                disabled={fetchingStories}
              >
                Cancel
              </Button>
              <Button
                onClick={handleManualFetch}
                disabled={fetchingStories}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {fetchingStories ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    Fetch Stories
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Info Card */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent>
            <div className="flex gap-3">
              <SparklesIcon className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-purple-900">
                  About Grok Trends
                </h4>
                <p className="mt-1 text-sm text-purple-700">
                  Stories are automatically fetched from X (Twitter) using Grok AI. 
                  Use "Fetch from Grok" to manually trigger a fetch, or click "Write Article" on any story to create a draft blog post. 
                  The draft will be pre-filled with the story content, ready for you to edit and publish.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Publish Modal */}
        <Modal
          isOpen={showPublishModal}
          onClose={() => {
            setShowPublishModal(false);
            setSelectedStory(null);
          }}
          title="Create Blog Post"
        >
          {selectedStory && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {selectedStory.draft_title || selectedStory.title}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Summary
                </label>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {selectedStory.draft_excerpt || selectedStory.summary}
                </p>
              </div>

              {selectedStory.draft_body ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Generated Draft
                  </label>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                    {selectedStory.draft_body}
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    No draft has been generated yet. You can create a post manually or configure the Grok API to generate drafts.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPublishModal(false);
                    setSelectedStory(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleCreateDraftPost(selectedStory)}
                  disabled={creatingDraft === selectedStory.id}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {creatingDraft === selectedStory.id ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Creating Draft...
                    </>
                  ) : (
                    <>
                      <PencilSquareIcon className="h-4 w-4 mr-1" />
                      Create Draft Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Story Preview Modal */}
        {showPreviewModal && previewStory && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewStory(null);
                }}
              />
              
              {/* Modal Content */}
              <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant={getGrokStatusBadgeVariant(previewStory.status)}>
                          {getGrokStatusLabel(previewStory.status)}
                        </Badge>
                        <Badge variant="default" className="flex items-center gap-1">
                          {getCategoryIcon(previewStory.category)}
                          {previewStory.category}
                        </Badge>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {previewStory.title}
                      </h2>
                    </div>
                    <button
                      onClick={() => {
                        setShowPreviewModal(false);
                        setPreviewStory(null);
                      }}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <XCircleIcon className="h-6 w-6 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-200px)] px-6 py-4">
                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 pb-4 border-b border-gray-100">
                    <span className="flex items-center gap-1.5">
                      <FireIcon className="h-4 w-4 text-orange-500" />
                      <strong>{previewStory.engagement_score?.toLocaleString() || 0}</strong> engagement
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      {formatDate(previewStory.first_seen_at)}
                    </span>
                    {previewStory.author_handles && previewStory.author_handles.length > 0 && (
                      <span className="flex items-center gap-1.5">
                        <span className="text-base">👤</span>
                        {previewStory.author_handles.join(', ')}
                      </span>
                    )}
                  </div>

                  {/* Full Summary */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Story Summary
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 leading-relaxed">
                        {previewStory.summary}
                      </p>
                    </div>
                  </div>

                  {/* Source Link */}
                  {getPrimaryLink(previewStory) && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Original Source
                      </h3>
                      <a
                        href={getPrimaryLink(previewStory)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        View on X (Twitter)
                        <LinkIcon className="h-4 w-4" />
                      </a>
                    </div>
                  )}

                  {/* Draft Content (if available) */}
                  {previewStory.draft_body && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        Generated Draft
                      </h3>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {previewStory.draft_body}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* X Post IDs */}
                  {previewStory.x_post_ids && previewStory.x_post_ids.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Related Posts ({previewStory.x_post_ids.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {previewStory.x_post_ids.map((postId, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 text-xs font-mono rounded-full"
                          >
                            {postId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    {/* Secondary Actions */}
                    <div className="flex flex-wrap gap-2">
                      {/* Archive/Restore */}
                      {previewStory.status !== 'archived' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreviewAction(previewStory.id, 'archived')}
                          disabled={actionLoading === previewStory.id}
                          className="text-gray-600"
                        >
                          {actionLoading === previewStory.id ? (
                            <Spinner size="sm" className="mr-2" />
                          ) : (
                            <DocumentTextIcon className="h-4 w-4 mr-1" />
                          )}
                          Archive
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreviewAction(previewStory.id, 'new')}
                          disabled={actionLoading === previewStory.id}
                        >
                          <ArrowPathIcon className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      )}

                      {/* Quick Publish for draft_created */}
                      {previewStory.status === 'draft_created' && (
                        <Button
                          size="sm"
                          onClick={() => handlePublishStory(previewStory)}
                          disabled={publishingStory === previewStory.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {publishingStory === previewStory.id ? (
                            <>
                              <Spinner size="sm" className="mr-2" />
                              Publishing...
                            </>
                          ) : (
                            <>
                              <RocketLaunchIcon className="h-4 w-4 mr-1" />
                              Quick Publish
                            </>
                          )}
                        </Button>
                      )}

                      {/* View Post if draft or published */}
                      {(previewStory.status === 'draft_created' || previewStory.status === 'published') && previewStory.published_post_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/posts/${previewStory.published_post_id}/edit`)}
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          {previewStory.status === 'published' ? 'View Post' : 'Edit Draft'}
                        </Button>
                      )}
                    </div>

                    {/* Primary Action: Write Article */}
                    {previewStory.status === 'new' && (
                      <Button
                        onClick={() => handleCreateDraftPost(previewStory)}
                        disabled={creatingDraft === previewStory.id}
                        className="bg-purple-600 hover:bg-purple-700 sm:ml-auto"
                        size="sm"
                      >
                        {creatingDraft === previewStory.id ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            Creating Draft...
                          </>
                        ) : (
                          <>
                            <PencilSquareIcon className="h-4 w-4 mr-2" />
                            Write Article
                          </>
                        )}
                      </Button>
                    )}

                    {/* Edit Draft if already created */}
                    {previewStory.status === 'draft_created' && previewStory.published_post_id && (
                      <Button
                        onClick={() => router.push(`/admin/posts/${previewStory.published_post_id}/edit`)}
                        className="bg-purple-600 hover:bg-purple-700 sm:ml-auto"
                        size="sm"
                      >
                        <PencilSquareIcon className="h-4 w-4 mr-2" />
                        Continue Writing
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default withAuth(GrokTrendsPage, 'create_post');

