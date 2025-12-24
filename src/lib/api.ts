/**
 * API Configuration for Cloud Functions
 * 
 * This file centralizes all Cloud Functions API endpoints.
 * Update FUNCTIONS_URL with your deployed Cloud Functions URL.
 */

// Get the base URL for Cloud Functions
const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL ||
                      'https://techblit-cloud-function-production.up.railway.app';

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
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
  
  // Admin API - Post Migration
  migrateAllPublishedPosts: `${FUNCTIONS_URL}/migrateAllPublishedPosts`,
  
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
  triggerScheduledPosts: `${FUNCTIONS_URL}/triggerScheduledPosts`,
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

