/**
 * API Configuration for Cloud Functions (Express-based)
 * 
 * This file centralizes all Cloud Functions API endpoints.
 * All endpoints are now organized under /api/v1/ by resource.
 * Update FUNCTIONS_URL with your deployed Cloud Functions URL.
 */

// Get the base URL for Cloud Functions
const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
                      'https://us-central1-techblit.cloudfunctions.net';

// Base API URL
const API_BASE = `${FUNCTIONS_URL}/api/v1`;

/**
 * API Endpoints - Organized by resource
 */
export const API_ENDPOINTS = {
  // ============================================================================
  // POSTS API
  // ============================================================================
  posts: {
    // Public endpoints
    list: `${API_BASE}/posts`,                    // GET - Get published posts
    getBySlug: (slug: string) => `${API_BASE}/posts/${slug}`,  // GET - Get post by slug
    incrementView: (slug: string) => `${API_BASE}/posts/${slug}/view`,  // PATCH - Increment view count
    
    // Admin endpoints
    create: `${API_BASE}/posts`,                  // POST - Create new post
    update: (id: string) => `${API_BASE}/posts/${id}`,  // PUT - Update post
  },

  // ============================================================================
  // USERS API
  // ============================================================================
  users: {
    // Admin endpoints
    list: `${API_BASE}/users`,                    // GET - Get all users
    updateRole: (id: string) => `${API_BASE}/users/${id}/role`,  // PUT - Update user role
    
    // Authenticated endpoints
    getProfile: `${API_BASE}/users/profile`,     // GET - Get current user profile
    updateProfile: `${API_BASE}/users/profile`,  // PUT - Update current user profile
  },

  // ============================================================================
  // INVITATIONS API
  // ============================================================================
  invitations: {
    invite: `${API_BASE}/invitations`,            // POST - Invite new user
    resend: (uid: string) => `${API_BASE}/invitations/${uid}/resend`,  // POST - Resend invitation
    stats: `${API_BASE}/invitations/stats`,      // GET - Get invitation statistics
  },

  // ============================================================================
  // AUDIT LOGS API
  // ============================================================================
  auditLogs: {
    list: `${API_BASE}/audit-logs`,              // GET - Get audit logs
    stats: `${API_BASE}/audit-logs/stats`,       // GET - Get audit log statistics
    filters: `${API_BASE}/audit-logs/filters`,   // GET - Get available filters
    getById: (id: string) => `${API_BASE}/audit-logs/${id}`,  // GET - Get audit log by ID
  },

  // ============================================================================
  // GROK TRENDS API
  // ============================================================================
  grokTrends: {
    stories: `${API_BASE}/grok-trends/stories`,   // GET - Get Grok stories
    updateStatus: (id: string) => `${API_BASE}/grok-trends/stories/${id}/status`,  // PATCH - Update story status
    stats: `${API_BASE}/grok-trends/stats`,      // GET - Get Grok statistics
    fetch: `${API_BASE}/grok-trends/fetch`,      // POST - Manually fetch stories
  },

  // ============================================================================
  // NOTIFICATIONS API
  // ============================================================================
  notifications: {
    list: `${API_BASE}/notifications`,            // GET - Get user notifications
    markRead: (id: string) => `${API_BASE}/notifications/${id}/read`,  // PATCH - Mark notification as read
  },

  // ============================================================================
  // PREVIEW TOKENS API
  // ============================================================================
  previewTokens: {
    generate: `${API_BASE}/preview-tokens`,       // POST - Generate preview token
    validate: `${API_BASE}/preview-tokens/validate`,  // GET - Validate preview token
    stats: `${API_BASE}/preview-tokens/stats`,    // GET - Get preview token statistics
  },

  // ============================================================================
  // UTILITY API
  // ============================================================================
  utility: {
    health: `${FUNCTIONS_URL}/health`,            // GET - Health check
    sitemap: `${API_BASE}/sitemap`,              // GET - Generate sitemap
  },
};

/**
 * Legacy API endpoints (for backward compatibility during migration)
 * These will be deprecated once migration is complete
 */
export const LEGACY_API_ENDPOINTS = {
  // Public API
  getPosts: `${FUNCTIONS_URL}/getPosts`,
  getPost: `${FUNCTIONS_URL}/getPost`,
  incrementViewCount: `${FUNCTIONS_URL}/incrementViewCount`,
  
  // Admin API - Posts
  createPost: `${FUNCTIONS_URL}/createPost`,
  updatePost: `${FUNCTIONS_URL}/updatePost`,
  
  // Admin API - Users
  getUsers: `${FUNCTIONS_URL}/getUsers`,
  updateUserRole: `${FUNCTIONS_URL}/updateUserRole`,
  getUserProfile: `${FUNCTIONS_URL}/getUserProfile`,
  updateUserProfile: `${FUNCTIONS_URL}/updateUserProfile`,
  
  // Admin API - Invitations
  inviteUser: `${FUNCTIONS_URL}/inviteUser`,
  resendInvitation: `${FUNCTIONS_URL}/resendInvitation`,
  getInvitationStats: `${FUNCTIONS_URL}/getInvitationStats`,
  
  // Admin API - Preview Tokens
  generatePreviewToken: `${FUNCTIONS_URL}/generatePreviewToken`,
  validatePreviewToken: `${FUNCTIONS_URL}/validatePreviewToken`,
  getPreviewTokenStats: `${FUNCTIONS_URL}/getPreviewTokenStats`,
  
  // Admin API - Audit Logs
  getAuditLogs: `${FUNCTIONS_URL}/getAuditLogs`,
  getAuditLogStats: `${FUNCTIONS_URL}/getAuditLogStats`,
  getAuditLogFilters: `${FUNCTIONS_URL}/getAuditLogFilters`,
  getAuditLogById: `${FUNCTIONS_URL}/getAuditLogById`,
  
  // Admin API - Grok Trends
  getGrokStories: `${FUNCTIONS_URL}/getGrokStories`,
  updateGrokStoryStatus: `${FUNCTIONS_URL}/updateGrokStoryStatus`,
  getGrokStats: `${FUNCTIONS_URL}/getGrokStats`,
  fetchGrokStories: `${FUNCTIONS_URL}/fetchGrokStories`,
  
  // Notification API
  getNotifications: `${FUNCTIONS_URL}/getNotifications`,
  markNotificationRead: `${FUNCTIONS_URL}/markNotificationRead`,
  
  // Utility
  healthCheck: `${FUNCTIONS_URL}/healthCheck`,
  generateSitemap: `${FUNCTIONS_URL}/generateSitemap`,
};

/**
 * Helper function to make authenticated API calls
 */
export async function apiCall(
  endpoint: string, 
  options: RequestInit = {}, 
  authToken?: string
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API call failed with status ${response.status}`);
  }
  
  return response.json();
}

