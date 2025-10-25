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
  PUBLIC_POSTS: 'publicPosts'
};

module.exports = {
  PostStatus,
  UserRole,
  CollectionNames
};
