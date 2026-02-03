// Admin Dashboard Data Models and Types

export type UserRole = 'super_admin' | 'editor' | 'author' | 'reviewer' | 'viewer';
export type PostStatus = 'draft' | 'in_review' | 'scheduled' | 'published' | 'archived';
export type PostVisibility = 'public' | 'private' | 'members-only';
export type RedirectType = 301 | 302;

// Grok Trends Types
export type GrokStoryStatus = 'new' | 'draft_created' | 'published' | 'archived';

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

export type GrokCategory = typeof GROK_CATEGORIES[number];

export interface GrokStory {
  id: string;
  title: string;
  summary: string;
  category: GrokCategory;
  x_post_ids: string[];
  primary_link: string;
  engagement_score: number;
  author_handles?: string[];
  media_urls?: string[];
  first_seen_at: Date | { toDate: () => Date };
  fetched_at: Date | { toDate: () => Date };
  status: GrokStoryStatus;
  
  // Review fields
  reviewedBy?: string;
  reviewedAt?: Date | { toDate: () => Date };
  reviewNotes?: string;
  
  // Draft fields
  draft_body?: string;
  draft_title?: string;
  draft_excerpt?: string;
  draft_meta_title?: string;
  draft_meta_description?: string;
  suggested_tags?: string[];
  draftGeneratedAt?: Date | { toDate: () => Date };
  
  // Published fields
  published_post_id?: string;
  publishedAt?: Date | { toDate: () => Date };
  publishedBy?: string;
}

export const getGrokStatusBadgeVariant = (status: GrokStoryStatus): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
  switch (status) {
    case 'new': return 'info';
    case 'draft_created': return 'warning';
    case 'published': return 'success';
    case 'archived': return 'default';
    default: return 'default';
  }
};

export const getGrokStatusLabel = (status: GrokStoryStatus): string => {
  switch (status) {
    case 'new': return 'New';
    case 'draft_created': return 'Draft Created';
    case 'published': return 'Published';
    case 'archived': return 'Archived';
    default: return 'Unknown';
  }
};

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  lastSeen: Date;
  permissions: string[];
  isActive: boolean;
}

export interface Post {
  id?: string;
  // Basic Content
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  contentMarkdown?: string;
  
  // SEO & Meta
  metaTitle: string;
  metaDescription: string;
  canonical: string;
  tags: string[];
  category: string;
  
  // Author & Status
  author: {
    uid: string;
    name: string;
  };
  status: PostStatus;
  
  // Scheduling
  scheduledAt?: Date;
  publishedAt?: Date;
  updatedAt: Date;
  
  // Media
  featuredImage?: {
    storagePath: string;
    url: string;
    width: number;
    height: number;
    alt: string;
  } | {
    original: { url: string; path: string; width: number; height: number; size: number; };
    thumbnail: { url: string; path: string; width: number; height: number; size: number; };
    ogImage: { url: string; path: string; width: number; height: number; size: number; };
  };
  
  // Migration & Redirects
  oldUrl?: string;
  externalRedirectTo?: string;
  
  // SEO Controls
  seo: {
    noindex?: boolean;
    nofollow?: boolean;
  };
  
  // Social Media
  social: {
    ogTitle?: string;
    ogDescription?: string;
    twitterCard?: 'summary' | 'summary_large_image';
  };
  
  // Social Media Image (auto-generated)
  socialMediaImage?: {
    url: string;
    public_id?: string;
    width?: number;
    height?: number;
    generatedAt?: Date;
  };
  
  // Visibility
  visibility: PostVisibility;
  
  // Audit Trail
  history: Array<{
    action: string;
    by: string;
    at: Date;
    note?: string;
  }>;
  
  // Content Tracking
  canonicalSource?: string;
}

export interface Media {
  id: string;
  fileName: string;
  storagePath: string;
  url: string;
  uploadedBy: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
  sizes: {
    thumbnail?: string;
    medium?: string;
    large?: string;
  };
  createdAt: Date;
  fileSize: number;
  mimeType: string;
}

export interface Redirect {
  id: string;
  from: string;
  to: string;
  type: RedirectType;
  active: boolean;
  createdBy: string;
  createdAt: Date;
  notes?: string;
}

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  defaultOG: {
    title: string;
    description: string;
    image: string;
  };
  analyticsId?: string;
  searchConsoleVerification?: string;
  timezone: string;
  maintenanceMode: boolean;
  customRobotsTxt?: string;
  searchConsoleProperty?: string;
  indexingStatus?: {
    lastChecked: Date;
    indexedPages: number;
    crawlErrors: number;
    sitemapStatus: 'submitted' | 'pending' | 'error';
  };
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: Date;
  diff?: any;
  ipAddress?: string;
  userAgent?: string;
}

// Permission definitions
export const PERMISSIONS = {
  // Content permissions
  CREATE_POST: 'create_post',
  EDIT_OWN_POST: 'edit_own_post',
  EDIT_ANY_POST: 'edit_any_post',
  DELETE_POST: 'delete_post',
  PUBLISH_POST: 'publish_post',
  
  // Media permissions
  UPLOAD_MEDIA: 'upload_media',
  MANAGE_MEDIA: 'manage_media',
  DELETE_MEDIA: 'delete_media',
  
  // User permissions
  MANAGE_USERS: 'manage_users',
  INVITE_USERS: 'invite_users',
  
  // System permissions
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_REDIRECTS: 'manage_redirects',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  
  // Analytics permissions
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_DATA: 'export_data',
} as const;

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: Object.values(PERMISSIONS),
  editor: [
    PERMISSIONS.CREATE_POST,
    PERMISSIONS.EDIT_ANY_POST,
    PERMISSIONS.PUBLISH_POST,
    PERMISSIONS.UPLOAD_MEDIA,
    PERMISSIONS.MANAGE_MEDIA,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  author: [
    PERMISSIONS.CREATE_POST,
    PERMISSIONS.EDIT_OWN_POST,
    PERMISSIONS.UPLOAD_MEDIA,
  ],
  reviewer: [
    PERMISSIONS.EDIT_ANY_POST,
    PERMISSIONS.PUBLISH_POST,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  viewer: [
    PERMISSIONS.VIEW_ANALYTICS,
  ],
};

// Helper functions
export const hasPermission = (userRole: UserRole, permission: string): boolean => {
  return ROLE_PERMISSIONS[userRole].includes(permission);
};

export const canEditPost = (userRole: UserRole, postAuthorUid: string, currentUserUid: string): boolean => {
  if (hasPermission(userRole, PERMISSIONS.EDIT_ANY_POST)) {
    return true;
  }
  if (hasPermission(userRole, PERMISSIONS.EDIT_OWN_POST) && postAuthorUid === currentUserUid) {
    return true;
  }
  return false;
};

export const canPublishPost = (userRole: UserRole): boolean => {
  return hasPermission(userRole, PERMISSIONS.PUBLISH_POST);
};

export const canManageUsers = (userRole: UserRole): boolean => {
  return hasPermission(userRole, PERMISSIONS.MANAGE_USERS);
};

export const canManageSettings = (userRole: UserRole): boolean => {
  return hasPermission(userRole, PERMISSIONS.MANAGE_SETTINGS);
};

export const canManageRedirects = (userRole: UserRole): boolean => {
  return hasPermission(userRole, PERMISSIONS.MANAGE_REDIRECTS);
};

// Status helpers
export const getStatusColor = (status: PostStatus): string => {
  switch (status) {
    case 'draft': return 'gray';
    case 'in_review': return 'yellow';
    case 'scheduled': return 'blue';
    case 'published': return 'green';
    case 'archived': return 'red';
    default: return 'gray';
  }
};

export const getStatusLabel = (status: PostStatus): string => {
  switch (status) {
    case 'draft': return 'Draft';
    case 'in_review': return 'In Review';
    case 'scheduled': return 'Scheduled';
    case 'published': return 'Published';
    case 'archived': return 'Archived';
    default: return 'Unknown';
  }
};

export const getStatusBadgeClasses = (status: PostStatus): string => {
  switch (status) {
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'in_review': return 'bg-yellow-100 text-yellow-800';
    case 'scheduled': return 'bg-blue-100 text-blue-800';
    case 'published': return 'bg-green-100 text-green-800';
    case 'archived': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusIconClasses = (status: PostStatus): string => {
  switch (status) {
    case 'draft': return 'bg-gray-500';
    case 'in_review': return 'bg-yellow-500';
    case 'scheduled': return 'bg-blue-500';
    case 'published': return 'bg-green-500';
    case 'archived': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

// Form validation schemas
export const postValidationSchema = {
  title: {
    required: true,
    minLength: 1,
    maxLength: 200,
  },
  slug: {
    required: true,
    pattern: /^[a-z0-9-]+$/,
    minLength: 1,
    maxLength: 100,
  },
  excerpt: {
    required: true,
    minLength: 1,
    maxLength: 500,
  },
  contentHtml: {
    required: true,
    minLength: 1,
  },
  metaTitle: {
    maxLength: 60,
  },
  metaDescription: {
    maxLength: 160,
  },
};

export const userValidationSchema = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 100,
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  role: {
    required: true,
    enum: ['super_admin', 'editor', 'author', 'reviewer', 'viewer'],
  },
};
