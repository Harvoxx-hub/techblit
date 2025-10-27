// Admin Dashboard Data Models and Types

export type UserRole = 'super_admin' | 'editor' | 'author' | 'reviewer' | 'viewer';
export type PostStatus = 'draft' | 'in_review' | 'scheduled' | 'published' | 'archived';
export type PostVisibility = 'public' | 'private' | 'members-only';
export type RedirectType = 301 | 302;

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
