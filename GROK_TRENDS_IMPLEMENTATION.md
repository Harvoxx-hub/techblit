# Grok Trends Implementation Guide

**Feature:** Admin dashboard tab for AI-powered Nigeria Tech news curation  
**Based on:** Current TechBlit architecture analysis

---

## Architecture Overview

After studying your current integration, here's how we'll implement Grok Trends:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT (techblit)                                │
├─────────────────────────────────────────────────────────────────────────┤
│  src/app/admin/grok-trends/page.tsx     ← New admin page               │
│  src/components/admin/AdminLayout.tsx   ← Add nav item                 │
│  src/types/admin.ts                     ← Add GrokStory type           │
│  src/lib/api.ts                         ← Add API endpoints            │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    SERVER (techblit-cloud-function)                      │
├─────────────────────────────────────────────────────────────────────────┤
│  functions/src/handlers/grokTrends.js   ← New handler                  │
│  functions/src/types/constants.js       ← Add collection + status      │
│  functions/index.js                     ← Register endpoints           │
│  Firestore: grok_stories collection     ← New collection               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Server-Side Implementation

### 1.1 Update Constants (`functions/src/types/constants.js`)

```javascript
const GrokStoryStatus = {
  NEW: 'new',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PUBLISHED: 'published'
};

const GrokCategory = {
  BREAKING_NEWS: 'Breaking News',
  TRENDING: 'Trending Stories',
  COMPANY_NEWS: 'Company News',
  PRODUCT_LAUNCHES: 'Product Launches & Reviews',
  FUNDING: 'Funding & Investments',
  REGULATORY: 'Regulatory & Policy Changes',
  SECURITY: 'Security & Hacking',
  EMERGING_TECH: 'Emerging Technologies'
};

const CollectionNames = {
  // ... existing collections
  GROK_STORIES: 'grok_stories',
  GROK_SETTINGS: 'grok_settings'
};
```

### 1.2 Create Grok Handler (`functions/src/handlers/grokTrends.js`)

```javascript
// Grok Trends handlers
const { db } = require('../config/firebase');
const { CollectionNames, GrokStoryStatus, GrokCategory } = require('../types/constants');
const { createAuditLog, formatErrorResponse, formatSuccessResponse } = require('../utils/helpers');

/**
 * Get all Grok stories with optional filtering
 */
async function getGrokStories(req, res) {
  try {
    const { status, category, limit = 50, offset = 0 } = req.query;
    
    let query = db.collection(CollectionNames.GROK_STORIES)
      .orderBy('first_seen_at', 'desc')
      .limit(parseInt(limit));
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    if (category) {
      query = query.where('category', '==', category);
    }
    
    const snapshot = await query.get();
    const stories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(formatSuccessResponse(stories, 'Stories retrieved successfully'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Error retrieving stories', 500, { error: error.message }));
  }
}

/**
 * Update story status (approve/reject)
 */
async function updateStoryStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!Object.values(GrokStoryStatus).includes(status)) {
      return res.status(400).json(formatErrorResponse('Invalid status', 400));
    }
    
    const storyRef = db.collection(CollectionNames.GROK_STORIES).doc(id);
    const storyDoc = await storyRef.get();
    
    if (!storyDoc.exists) {
      return res.status(404).json(formatErrorResponse('Story not found', 404));
    }
    
    await storyRef.update({
      status,
      reviewedBy: req.user.uid,
      reviewedAt: new Date(),
      reviewNotes: notes || null
    });
    
    // Create audit log
    const auditLog = createAuditLog('grok_story_status_updated', req.user.uid, id, {
      oldStatus: storyDoc.data().status,
      newStatus: status
    });
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    
    res.json(formatSuccessResponse(null, 'Story status updated'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Error updating story', 500, { error: error.message }));
  }
}

/**
 * Generate blog draft from story
 */
async function generateDraft(req, res) {
  try {
    const { id } = req.params;
    
    const storyRef = db.collection(CollectionNames.GROK_STORIES).doc(id);
    const storyDoc = await storyRef.get();
    
    if (!storyDoc.exists) {
      return res.status(404).json(formatErrorResponse('Story not found', 404));
    }
    
    const story = storyDoc.data();
    
    // Call Grok API to generate draft
    const draftPrompt = `Write a 200-400 word blog post based on this tech news story.

Title: ${story.title}
Summary: ${story.summary}
Category: ${story.category}

Requirements:
- Professional, neutral tone
- Include context for Nigeria tech ecosystem readers
- Add relevant hashtags for social media
- Output as JSON with fields: title, content, excerpt, tags

Output ONLY valid JSON.`;

    const grokResponse = await callGrokAPI(draftPrompt);
    const draft = JSON.parse(grokResponse);
    
    // Update story with draft
    await storyRef.update({
      draft_body: draft.content,
      draft_title: draft.title || story.title,
      draft_excerpt: draft.excerpt,
      suggested_tags: draft.tags || [],
      draftGeneratedAt: new Date()
    });
    
    res.json(formatSuccessResponse(draft, 'Draft generated successfully'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Error generating draft', 500, { error: error.message }));
  }
}

/**
 * Publish story as blog post
 */
async function publishStory(req, res) {
  try {
    const { id } = req.params;
    const { title, content, excerpt, tags, category } = req.body;
    
    const storyRef = db.collection(CollectionNames.GROK_STORIES).doc(id);
    const storyDoc = await storyRef.get();
    
    if (!storyDoc.exists) {
      return res.status(404).json(formatErrorResponse('Story not found', 404));
    }
    
    const story = storyDoc.data();
    
    // Create blog post
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const postData = {
      title,
      slug,
      contentHtml: content,
      excerpt,
      tags: tags || [],
      category: category || 'Tech News',
      status: 'published',
      author: {
        uid: req.user.uid,
        name: req.userData.name
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date(),
      source: {
        type: 'grok_story',
        storyId: id,
        x_post_ids: story.x_post_ids,
        original_category: story.category
      }
    };
    
    const postRef = await db.collection(CollectionNames.POSTS).add(postData);
    
    // Update story status
    await storyRef.update({
      status: GrokStoryStatus.PUBLISHED,
      published_post_id: postRef.id,
      publishedAt: new Date(),
      publishedBy: req.user.uid
    });
    
    // Create audit log
    const auditLog = createAuditLog('grok_story_published', req.user.uid, id, {
      postId: postRef.id,
      title
    });
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    
    res.json(formatSuccessResponse({ postId: postRef.id, slug }, 'Story published as blog post'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Error publishing story', 500, { error: error.message }));
  }
}

/**
 * Get Grok trends statistics
 */
async function getGrokStats(req, res) {
  try {
    const snapshot = await db.collection(CollectionNames.GROK_STORIES).get();
    
    const stats = {
      total: 0,
      new: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
      published: 0,
      byCategory: {}
    };
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      stats.total++;
      stats[data.status]++;
      
      if (!stats.byCategory[data.category]) {
        stats.byCategory[data.category] = 0;
      }
      stats.byCategory[data.category]++;
    });
    
    res.json(formatSuccessResponse(stats, 'Stats retrieved successfully'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Error retrieving stats', 500, { error: error.message }));
  }
}

/**
 * Manual trigger to fetch stories from Grok
 */
async function fetchGrokStories(req, res) {
  try {
    const { category } = req.body;
    
    // Get the appropriate prompt based on category
    const prompts = getGrokPrompts();
    const prompt = category ? prompts[category] : prompts['Trending Stories'];
    
    // Call Grok API
    const response = await callGrokAPI(prompt);
    const data = JSON.parse(response);
    
    // Deduplicate and store stories
    const stored = [];
    for (const story of data.stories || []) {
      // Check for duplicates by x_post_ids
      const existingQuery = await db.collection(CollectionNames.GROK_STORIES)
        .where('x_post_ids', 'array-contains-any', story.x_post_ids.slice(0, 10))
        .limit(1)
        .get();
      
      if (existingQuery.empty) {
        const storyData = {
          ...story,
          category: data.category || category || 'Trending Stories',
          status: GrokStoryStatus.NEW,
          fetched_at: new Date(),
          first_seen_at: story.first_seen_at ? new Date(story.first_seen_at) : new Date()
        };
        
        const docRef = await db.collection(CollectionNames.GROK_STORIES).add(storyData);
        stored.push({ id: docRef.id, title: story.title });
      }
    }
    
    res.json(formatSuccessResponse({
      fetched: data.stories?.length || 0,
      stored: stored.length,
      stories: stored
    }, 'Stories fetched successfully'));
  } catch (error) {
    res.status(500).json(formatErrorResponse('Error fetching stories', 500, { error: error.message }));
  }
}

// Helper: Call Grok API
async function callGrokAPI(prompt) {
  const XAI_API_KEY = process.env.XAI_API_KEY;
  
  if (!XAI_API_KEY) {
    throw new Error('XAI_API_KEY not configured');
  }
  
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${XAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'grok-3',
      messages: [
        {
          role: 'system',
          content: 'You are a tech news analyst focused on Nigeria. Output ONLY valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3
    })
  });
  
  if (!response.ok) {
    throw new Error(`Grok API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// Helper: Get prompts for each category
function getGrokPrompts() {
  return {
    'Breaking News': `Search X for breaking Nigeria tech news in the last 90 minutes. Keywords: (outage OR downtime OR breach OR hack) AND (Nigeria OR Nigerian OR Lagos OR fintech OR agritech). Return maximum 8 stories. Output ONLY valid JSON: { "category": "Breaking News", "stories": [{ "title": "string", "summary": "string", "x_post_ids": ["string"], "primary_link": "string", "engagement_score": number, "first_seen_at": "ISO8601" }] }`,
    
    'Trending Stories': `Find top 10 trending Nigeria tech topics in the last 24 hours. Focus: Nigerian fintech, agritech, edtech, healthtech, AI, startups. Output ONLY valid JSON: { "category": "Trending Stories", "stories": [...] }`,
    
    'Company News': `Search X for Nigerian tech company updates in last 48h: (Flutterwave OR Paystack OR Moniepoint OR Interswitch OR Jumia OR Andela) AND (earnings OR acquisition OR partnership OR funding). Max 10 stories. Output ONLY valid JSON.`,
    
    'Funding & Investments': `Search X for Nigerian startup funding news in last 7 days: ("raised" OR "Series" OR seed OR acquired) AND (Nigeria OR fintech OR startup). Max 10 stories. Output ONLY valid JSON.`,
    
    'Emerging Technologies': `Find cutting-edge Nigeria tech breakthroughs in last 96h: (AI OR blockchain OR 5G OR agritech) AND (Nigeria OR Lagos OR startup). Max 10 stories. Output ONLY valid JSON.`
  };
}

module.exports = {
  getGrokStories,
  updateStoryStatus,
  generateDraft,
  publishStory,
  getGrokStats,
  fetchGrokStories
};
```

### 1.3 Register Endpoints in `functions/index.js`

```javascript
// Add import at top
const grokTrendsHandlers = require('./src/handlers/grokTrends');

// =============================================================================
// GROK TRENDS API ENDPOINTS
// =============================================================================

/**
 * Admin API - Get Grok stories
 */
exports.getGrokStories = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, () => {
        adminMiddleware(req, res, () => {
          grokTrendsHandlers.getGrokStories(req, res);
        });
      });
    });
  });
});

/**
 * Admin API - Update story status
 */
exports.updateGrokStoryStatus = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, () => {
        adminMiddleware(req, res, () => {
          grokTrendsHandlers.updateStoryStatus(req, res);
        });
      });
    });
  });
});

/**
 * Admin API - Generate draft from story
 */
exports.generateGrokDraft = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, () => {
        adminMiddleware(req, res, () => {
          grokTrendsHandlers.generateDraft(req, res);
        });
      });
    });
  });
});

/**
 * Admin API - Publish story as blog post
 */
exports.publishGrokStory = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, () => {
        adminMiddleware(req, res, () => {
          grokTrendsHandlers.publishStory(req, res);
        });
      });
    });
  });
});

/**
 * Admin API - Get Grok stats
 */
exports.getGrokStats = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, () => {
        adminMiddleware(req, res, () => {
          grokTrendsHandlers.getGrokStats(req, res);
        });
      });
    });
  });
});

/**
 * Admin API - Manual fetch from Grok
 */
exports.fetchGrokStories = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  loggingMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      authMiddleware(req, res, () => {
        adminMiddleware(req, res, () => {
          grokTrendsHandlers.fetchGrokStories(req, res);
        });
      });
    });
  });
});

/**
 * Scheduled - Auto-fetch trending stories every hour
 */
exports.scheduledGrokFetch = onSchedule({
  schedule: 'every 1 hours',
  region: 'us-central1',
  timeZone: 'Africa/Lagos'
}, async (event) => {
  const logger = require("firebase-functions/logger");
  try {
    logger.info('Starting scheduled Grok fetch');
    // Fetch trending stories
    await grokTrendsHandlers.scheduledFetch();
    logger.info('Scheduled Grok fetch completed');
  } catch (error) {
    logger.error('Error in scheduled Grok fetch:', error);
  }
});
```

---

## Part 2: Client-Side Implementation

### 2.1 Add Types (`src/types/admin.ts`)

```typescript
// Add to existing types

export type GrokStoryStatus = 'new' | 'under_review' | 'approved' | 'rejected' | 'published';

export interface GrokStory {
  id: string;
  title: string;
  summary: string;
  category: string;
  x_post_ids: string[];
  primary_link: string;
  engagement_score: number;
  author_handles?: string[];
  media_urls?: string[];
  first_seen_at: Date;
  fetched_at: Date;
  status: GrokStoryStatus;
  
  // Review fields
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  
  // Draft fields
  draft_body?: string;
  draft_title?: string;
  draft_excerpt?: string;
  suggested_tags?: string[];
  draftGeneratedAt?: Date;
  
  // Published fields
  published_post_id?: string;
  publishedAt?: Date;
  publishedBy?: string;
}

export const GROK_CATEGORIES = [
  'Breaking News',
  'Trending Stories',
  'Company News',
  'Product Launches & Reviews',
  'Funding & Investments',
  'Regulatory & Policy Changes',
  'Security & Hacking',
  'Emerging Technologies'
] as const;

export const getGrokStatusColor = (status: GrokStoryStatus): string => {
  switch (status) {
    case 'new': return 'blue';
    case 'under_review': return 'yellow';
    case 'approved': return 'green';
    case 'rejected': return 'red';
    case 'published': return 'purple';
    default: return 'gray';
  }
};
```

### 2.2 Update Admin Navigation (`src/components/admin/AdminLayout.tsx`)

```typescript
// Add import
import { SparklesIcon } from '@heroicons/react/24/outline';

// Add to navigation array (after Analytics)
{ name: 'Grok Trends', href: '/admin/grok-trends', icon: SparklesIcon, permission: 'create_post' },
```

### 2.3 Create Admin Page (`src/app/admin/grok-trends/page.tsx`)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AdminLayout from '@/components/admin/AdminLayout';
import { withAuth, useAuth } from '@/contexts/AuthContext';
import { GrokStory, GrokStoryStatus, GROK_CATEGORIES, getGrokStatusColor } from '@/types/admin';
import {
  Card,
  CardContent,
  StatsCard,
  Badge,
  Button,
  Spinner,
  EmptyState
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
  LinkIcon
} from '@heroicons/react/24/outline';

function GrokTrendsPage() {
  const { user, token } = useAuth();
  const [stories, setStories] = useState<GrokStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStory, setSelectedStory] = useState<GrokStory | null>(null);
  const [generatingDraft, setGeneratingDraft] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
    published: 0
  });

  useEffect(() => {
    fetchStories();
  }, [selectedStatus, selectedCategory]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      let q = query(
        collection(db, 'grok_stories'),
        orderBy('first_seen_at', 'desc')
      );

      if (selectedStatus !== 'all') {
        q = query(q, where('status', '==', selectedStatus));
      }

      if (selectedCategory !== 'all') {
        q = query(q, where('category', '==', selectedCategory));
      }

      const snapshot = await getDocs(q);
      const storiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GrokStory[];

      setStories(storiesData);

      // Calculate stats
      const allSnapshot = await getDocs(collection(db, 'grok_stories'));
      const statsData = {
        total: 0,
        new: 0,
        under_review: 0,
        approved: 0,
        rejected: 0,
        published: 0
      };

      allSnapshot.docs.forEach(doc => {
        const data = doc.data();
        statsData.total++;
        if (data.status in statsData) {
          statsData[data.status as keyof typeof statsData]++;
        }
      });

      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchNew = async (category?: string) => {
    try {
      setFetching(true);
      const response = await fetch('/api/grok/fetch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Fetched ${data.stored} new stories!`);
        fetchStories();
      }
    } catch (error) {
      console.error('Error fetching new stories:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleStatusUpdate = async (storyId: string, newStatus: GrokStoryStatus, notes?: string) => {
    try {
      const storyRef = doc(db, 'grok_stories', storyId);
      await updateDoc(storyRef, {
        status: newStatus,
        reviewedBy: user?.uid,
        reviewedAt: new Date(),
        reviewNotes: notes || null
      });

      fetchStories();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleGenerateDraft = async (storyId: string) => {
    try {
      setGeneratingDraft(storyId);
      const response = await fetch(`/api/grok/draft/${storyId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchStories();
      }
    } catch (error) {
      console.error('Error generating draft:', error);
    } finally {
      setGeneratingDraft(null);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <div className="mt-4 sm:mt-0">
            <Button
              onClick={() => handleFetchNew()}
              disabled={fetching}
              className="flex items-center gap-2"
            >
              <ArrowPathIcon className={`h-4 w-4 ${fetching ? 'animate-spin' : ''}`} />
              {fetching ? 'Fetching...' : 'Fetch New Stories'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatsCard title="Total" value={stats.total} icon={<DocumentTextIcon />} />
          <StatsCard title="New" value={stats.new} icon={<SparklesIcon />} />
          <StatsCard title="In Review" value={stats.under_review} icon={<EyeIcon />} />
          <StatsCard title="Approved" value={stats.approved} icon={<CheckCircleIcon />} />
          <StatsCard title="Rejected" value={stats.rejected} icon={<XCircleIcon />} />
          <StatsCard title="Published" value={stats.published} icon={<PencilSquareIcon />} />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-md border-gray-300 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="published">Published</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-md border-gray-300 text-sm"
              >
                <option value="all">All Categories</option>
                {GROK_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Stories List */}
        {stories.length === 0 ? (
          <EmptyState
            icon={<SparklesIcon />}
            title="No stories found"
            description="Click 'Fetch New Stories' to get the latest tech news from X"
            action={
              <Button onClick={() => handleFetchNew()}>
                Fetch Stories
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {stories.map((story) => (
              <Card key={story.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Story Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <Badge variant={
                          story.status === 'new' ? 'info' :
                          story.status === 'approved' ? 'success' :
                          story.status === 'rejected' ? 'danger' :
                          story.status === 'published' ? 'default' :
                          'warning'
                        }>
                          {story.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="default">{story.category}</Badge>
                      </div>

                      <h3 className="mt-2 text-lg font-semibold text-gray-900">
                        {story.title}
                      </h3>

                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {story.summary}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span>📊 {story.engagement_score?.toLocaleString() || 0} engagement</span>
                        <span>🕐 {formatDate(story.first_seen_at)}</span>
                        {story.author_handles?.length > 0 && (
                          <span>👤 {story.author_handles.slice(0, 2).join(', ')}</span>
                        )}
                        {story.primary_link && (
                          <a
                            href={story.primary_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <LinkIcon className="h-3 w-3" />
                            View on X
                          </a>
                        )}
                      </div>

                      {story.draft_body && (
                        <div className="mt-3 p-3 bg-green-50 rounded-md border border-green-200">
                          <p className="text-xs font-medium text-green-800">✓ Draft Generated</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap lg:flex-col gap-2">
                      {story.status === 'new' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(story.id, 'under_review')}
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => handleStatusUpdate(story.id, 'rejected')}
                          >
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}

                      {story.status === 'under_review' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(story.id, 'approved')}
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => handleStatusUpdate(story.id, 'rejected')}
                          >
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}

                      {story.status === 'approved' && (
                        <>
                          {!story.draft_body ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateDraft(story.id)}
                              disabled={generatingDraft === story.id}
                            >
                              <SparklesIcon className={`h-4 w-4 mr-1 ${generatingDraft === story.id ? 'animate-pulse' : ''}`} />
                              {generatingDraft === story.id ? 'Generating...' : 'Generate Draft'}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => setSelectedStory(story)}
                            >
                              <PencilSquareIcon className="h-4 w-4 mr-1" />
                              Edit & Publish
                            </Button>
                          )}
                        </>
                      )}

                      {story.status === 'published' && story.published_post_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          href={`/admin/posts/${story.published_post_id}/edit`}
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View Post
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Category Quick Fetch */}
        <Card>
          <CardContent>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Fetch by Category</h3>
            <div className="flex flex-wrap gap-2">
              {GROK_CATEGORIES.map(category => (
                <Button
                  key={category}
                  size="sm"
                  variant="outline"
                  onClick={() => handleFetchNew(category)}
                  disabled={fetching}
                >
                  {category}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default withAuth(GrokTrendsPage, 'create_post');
```

---

## Part 3: Environment Setup

### 3.1 Cloud Function Environment Variables

Add to Firebase functions config:

```bash
firebase functions:config:set grok.api_key="xai-your-api-key-here"
```

Or in `.env` for local development:

```env
XAI_API_KEY=xai-your-api-key-here
GROK_MODEL=grok-3
```

### 3.2 Firestore Security Rules

Add to `firestore.rules`:

```
match /grok_stories/{storyId} {
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['super_admin', 'editor', 'author'];
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['super_admin', 'editor'];
}

match /grok_settings/{settingId} {
  allow read, write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
}
```

---

## Part 4: Implementation Checklist

### Server (techblit-cloud-function)
- [ ] Update `functions/src/types/constants.js` with new enums
- [ ] Create `functions/src/handlers/grokTrends.js`
- [ ] Update `functions/index.js` with new endpoints
- [ ] Add XAI_API_KEY to environment
- [ ] Deploy cloud functions

### Client (techblit)
- [ ] Update `src/types/admin.ts` with GrokStory types
- [ ] Update `src/components/admin/AdminLayout.tsx` navigation
- [ ] Create `src/app/admin/grok-trends/page.tsx`
- [ ] Create API routes if needed (`src/app/api/grok/...`)
- [ ] Test locally
- [ ] Deploy to Vercel

### Firestore
- [ ] Create `grok_stories` collection
- [ ] Create `grok_settings` collection (optional)
- [ ] Update security rules

---

## Quick Start Commands

```bash
# 1. Deploy cloud functions
cd techblit-cloud-function/functions
npm install
firebase deploy --only functions

# 2. Build and test client
cd techblit
npm run dev

# 3. Visit admin
open http://localhost:3000/admin/grok-trends
```

---

*Ready to implement? Let me know and I'll create the actual files!*


