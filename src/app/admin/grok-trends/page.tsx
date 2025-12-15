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
  PlusIcon,
  BoltIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  CpuChipIcon,
  ScaleIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

// Dummy data for seeding
const DUMMY_STORIES: Omit<GrokStory, 'id'>[] = [
  {
    title: "Flutterwave Launches New Payment Gateway for SMEs in Nigeria",
    summary: "Flutterwave has unveiled a new payment solution targeting small and medium enterprises across Nigeria, promising lower transaction fees and faster settlement times. The move is expected to boost digital payments adoption among smaller businesses.",
    category: "Company News",
    x_post_ids: ["1876543210987654321"],
    primary_link: "https://x.com/flaborone/status/1876543210987654321",
    engagement_score: 4520,
    author_handles: ["@Aborode", "@techcabal"],
    first_seen_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
    fetched_at: new Date(),
    status: "new"
  },
  {
    title: "Moniepoint Raises $110M Series C to Expand Across Africa",
    summary: "Nigerian fintech giant Moniepoint has secured $110 million in Series C funding led by Development Partners International. The funding will fuel expansion into new African markets and enhance their business banking platform.",
    category: "Funding & Investments",
    x_post_ids: ["1876543210987654322"],
    primary_link: "https://x.com/moaborode/status/1876543210987654322",
    engagement_score: 8930,
    author_handles: ["@moniepoint", "@techcrunch"],
    first_seen_at: new Date(Date.now() - 5 * 60 * 60 * 1000),
    fetched_at: new Date(),
    status: "new"
  },
  {
    title: "Breaking: Major Outage Hits Nigerian Banking Apps",
    summary: "Several major Nigerian banking applications are experiencing widespread outages affecting millions of customers. Banks including GTBank, Access Bank, and Zenith Bank have acknowledged the issues and are working on restoration.",
    category: "Breaking News",
    x_post_ids: ["1876543210987654323"],
    primary_link: "https://x.com/bankservices/status/1876543210987654323",
    engagement_score: 15420,
    author_handles: ["@naborode", "@paborode"],
    first_seen_at: new Date(Date.now() - 30 * 60 * 1000),
    fetched_at: new Date(),
    status: "new"
  },
  {
    title: "CBN Announces New Crypto Regulations for Nigerian Fintechs",
    summary: "The Central Bank of Nigeria has released new regulatory guidelines for cryptocurrency operations within licensed fintech companies. The framework provides clarity on licensing requirements and compliance standards.",
    category: "Regulatory & Policy Changes",
    x_post_ids: ["1876543210987654324"],
    primary_link: "https://x.com/cbnregulations/status/1876543210987654324",
    engagement_score: 6780,
    author_handles: ["@caborode", "@naborode"],
    first_seen_at: new Date(Date.now() - 12 * 60 * 60 * 1000),
    fetched_at: new Date(),
    status: "draft_created",
    draft_body: "The Central Bank of Nigeria (CBN) has taken a significant step in regulating the cryptocurrency space with new guidelines for fintech companies...",
    draft_title: "CBN's New Crypto Framework: What Nigerian Fintechs Need to Know",
    published_post_id: "sample-draft-123"
  },
  {
    title: "Andela Expands AI Training Programs to Lagos Tech Hub",
    summary: "Andela announces expansion of its AI and machine learning training programs to its Lagos tech hub, aiming to train 5,000 developers in cutting-edge AI technologies over the next two years.",
    category: "Emerging Technologies",
    x_post_ids: ["1876543210987654325"],
    primary_link: "https://x.com/andela/status/1876543210987654325",
    engagement_score: 3240,
    author_handles: ["@andela", "@lagostechhub"],
    first_seen_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
    fetched_at: new Date(),
    status: "new"
  },
  {
    title: "Paystack Introduces Instant Settlements for Nigerian Merchants",
    summary: "Paystack has launched instant settlement feature allowing Nigerian merchants to receive payments within minutes instead of the standard T+1 settlement. The feature is available to verified business accounts.",
    category: "Product Launches & Reviews",
    x_post_ids: ["1876543210987654326"],
    primary_link: "https://x.com/paystack/status/1876543210987654326",
    engagement_score: 5670,
    author_handles: ["@paystack"],
    first_seen_at: new Date(Date.now() - 8 * 60 * 60 * 1000),
    fetched_at: new Date(),
    status: "new"
  },
  {
    title: "Data Breach Alert: Nigerian E-commerce Platform Compromised",
    summary: "A major Nigerian e-commerce platform has suffered a data breach potentially affecting millions of customers. Users are advised to change passwords and monitor their accounts for suspicious activity.",
    category: "Security & Hacking",
    x_post_ids: ["1876543210987654327"],
    primary_link: "https://x.com/securityalert/status/1876543210987654327",
    engagement_score: 12100,
    author_handles: ["@cybersecng", "@techsecurityng"],
    first_seen_at: new Date(Date.now() - 4 * 60 * 60 * 1000),
    fetched_at: new Date(),
    status: "new"
  },
  {
    title: "Opay Dominates Nigerian Mobile Money Market with 60% Share",
    summary: "New report shows Opay now controls 60% of Nigeria's mobile money market, processing over ₦5 trillion monthly. The company attributes growth to agent network expansion and competitive pricing.",
    category: "Trending Stories",
    x_post_ids: ["1876543210987654328"],
    primary_link: "https://x.com/opay/status/1876543210987654328",
    engagement_score: 7890,
    author_handles: ["@opay_ng", "@fintechng"],
    first_seen_at: new Date(Date.now() - 18 * 60 * 60 * 1000),
    fetched_at: new Date(),
    status: "published",
    published_post_id: "sample-post-123"
  }
];

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

function GrokTrendsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stories, setStories] = useState<GrokStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [creatingDraft, setCreatingDraft] = useState<string | null>(null);
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

  // Seed dummy data function
  const seedDummyData = async () => {
    try {
      setSeeding(true);
      
      // Seed stories via API
      for (const story of DUMMY_STORIES) {
        await apiService.createGrokStory(story);
      }
      
      await fetchStories();
      alert(`Successfully added ${DUMMY_STORIES.length} sample stories!`);
    } catch (error) {
      console.error('Error seeding data:', error);
      alert('Failed to seed dummy data. Check console for details.');
    } finally {
      setSeeding(false);
    }
  };

  // Fetch stories on mount and filter change
  useEffect(() => {
    fetchStories();
  }, [selectedStatus, selectedCategory]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      
      // Fetch stories from API
      const storiesData = await apiService.getGrokStories({
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        limit: 100
      });

      setStories(storiesData as GrokStory[]);

      // Fetch stats from API
      const statsResult = await apiService.getGrokStats() as any;
      const statsData: StoryStats = {
        total: statsResult?.total || 0,
        new: statsResult?.new || 0,
        draft_created: statsResult?.draft_created || 0,
        published: statsResult?.published || 0,
        archived: statsResult?.archived || 0
      };

      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stories:', error);
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
      
      // Generate post data from Grok story
      const title = story.draft_title || story.title;
      const slug = generateSlug(title);
      const excerpt = story.draft_excerpt || story.summary;
      
      // Generate content HTML - use draft_body if available, otherwise create structured content
      let contentHtml = '';
      if (story.draft_body) {
        contentHtml = story.draft_body;
      } else {
        // Create structured content from summary
        const paragraphs = story.summary.split(/\.\s+/).filter(p => p.trim().length > 0);
        contentHtml = paragraphs.map(p => `<p>${p.trim()}.</p>`).join('\n');
        
        // Add source link section
        if (story.primary_link) {
          contentHtml += `\n\n<div class="mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-purple-500">`;
          contentHtml += `<p class="text-sm text-gray-600 mb-2"><strong>Source:</strong></p>`;
          contentHtml += `<p class="text-sm"><a href="${story.primary_link}" target="_blank" rel="noopener noreferrer" class="text-purple-600 hover:text-purple-800 underline">View original post on X (Twitter)</a></p>`;
          if (story.author_handles && story.author_handles.length > 0) {
            contentHtml += `<p class="text-xs text-gray-500 mt-2">From: ${story.author_handles.join(', ')}</p>`;
          }
          contentHtml += `</div>`;
        }
      }
      
      const category = mapGrokCategoryToPostCategory(story.category);
      const tags = generateTagsFromStory(story);
      const metaTitle = title.length > 60 ? title.substring(0, 57) + '...' : title;
      const metaDescription = excerpt.length > 160 ? excerpt.substring(0, 157) + '...' : excerpt;

      // Create the post document
      const postData = {
        title,
        slug,
        excerpt,
        contentHtml,
        metaTitle,
        metaDescription,
        canonical: '',
        tags,
        category,
        status: 'draft',
        visibility: 'public',
        author: {
          name: user?.name || 'Unknown User',
          uid: user?.uid || '',
        },
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        publishedAt: null,
        scheduledAt: null,
        seo: {
          noindex: false,
          nofollow: false,
        },
        social: {
          ogTitle: title,
          ogDescription: excerpt,
          twitterCard: 'summary_large_image' as const,
        },
        history: [{
          action: 'created_from_grok',
          by: user?.uid || '',
          at: new Date().toISOString(),
          note: `Created from Grok story: ${story.title}`,
        }],
        // Link to Grok story
        source: {
          type: 'grok_story',
          storyId: story.id,
          x_post_ids: story.x_post_ids,
          original_category: story.category,
          original_link: story.primary_link
        }
      };

      const result = await apiService.createPost({
        title,
        content: contentHtml,
        excerpt,
        tags,
        categories: category ? [category] : [],
        status: 'draft',
        featuredImage: (story as any).featured_image ? {
          url: (story as any).featured_image,
          alt: title
        } : undefined
      }) as any;
      const postId = result.id;

      // Update Grok story status to draft_created
      await apiService.updateGrokStoryStatus(story.id, 'draft_created');

      // Close modals
      setShowPreviewModal(false);
      setPreviewStory(null);
      setShowPublishModal(false);
      setSelectedStory(null);

      // Refresh stories
      await fetchStories();

      // Redirect to edit page
      router.push(`/admin/posts/${postId}/edit`);
    } catch (error) {
      console.error('Error creating draft post:', error);
      alert('Failed to create draft post. Please try again.');
    } finally {
      setCreatingDraft(null);
    }
  };

  const handlePublishStory = (story: GrokStory) => {
    setSelectedStory(story);
    setShowPublishModal(true);
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
            {stats.total === 0 && (
              <Button
                variant="outline"
                onClick={seedDummyData}
                disabled={seeding}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                {seeding ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  <PlusIcon className="h-4 w-4 mr-2" />
                )}
                {seeding ? 'Adding...' : 'Add Sample Data'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => fetchStories()}
              disabled={loading}
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
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
                    : "Get started by adding sample data to see how Grok Trends works, or configure the server-side function to fetch real stories from X."}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {selectedStatus !== 'all' || selectedCategory !== 'all' ? (
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
                  ) : (
                    <Button
                      onClick={seedDummyData}
                      disabled={seeding}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {seeding ? (
                        <Spinner size="sm" className="mr-2" />
                      ) : (
                        <PlusIcon className="h-4 w-4 mr-2" />
                      )}
                      {seeding ? 'Adding Stories...' : 'Add Sample Stories'}
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
                        {story.primary_link && (
                          <a
                            href={story.primary_link}
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

                      {/* Draft Created - Link to edit */}
                      {story.status === 'draft_created' && story.published_post_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          href={`/admin/posts/${story.published_post_id}/edit`}
                          className="flex-1 lg:flex-none"
                        >
                          <PencilSquareIcon className="h-4 w-4 mr-1" />
                          Edit Draft
                        </Button>
                      )}

                      {/* Published - View post */}
                      {story.status === 'published' && story.published_post_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          href={`/admin/posts/${story.published_post_id}/edit`}
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
                  Click "Write Article" on any story to create a draft blog post. 
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
                  {previewStory.primary_link && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Original Source
                      </h3>
                      <a
                        href={previewStory.primary_link}
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

                      {/* View Post if draft or published */}
                      {(previewStory.status === 'draft_created' || previewStory.status === 'published') && previewStory.published_post_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          href={`/admin/posts/${previewStory.published_post_id}/edit`}
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
                        href={`/admin/posts/${previewStory.published_post_id}/edit`}
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

