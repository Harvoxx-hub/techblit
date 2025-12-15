// Type definitions for Cloud Functions
const PostStatus = {
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

const UserRole = {
  SUPER_ADMIN: 'super_admin',
  EDITOR: 'editor',
  AUTHOR: 'author',
  REVIEWER: 'reviewer',
  VIEWER: 'viewer'
};

const CollectionNames = {
  POSTS: 'posts',
  USERS: 'users',
  MEDIA: 'media',
  REDIRECTS: 'redirects',
  AUDIT_LOGS: 'audit_logs',
  SETTINGS: 'settings',
  NOTIFICATIONS: 'notifications',
  INVITATIONS: 'invitations',
  PREVIEW_TOKENS: 'preview_tokens',
  GROK_STORIES: 'grok_stories',
  GROK_SETTINGS: 'grok_settings',
  CATEGORIES: 'categories',
  NEWSLETTER_SUBSCRIPTIONS: 'newsletter_subscriptions'
};

const GrokStoryStatus = {
  NEW: 'new',
  DRAFT_CREATED: 'draft_created',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
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

module.exports = {
  PostStatus,
  UserRole,
  CollectionNames,
  GrokStoryStatus,
  GrokCategory
};
