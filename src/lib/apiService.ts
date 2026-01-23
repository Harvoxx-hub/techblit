/**
 * API Service Class
 * 
 * Centralized service for all API calls to replace direct Firebase SDK usage.
 * All Firebase operations should go through this service.
 */

import { Post, Redirect, User, SiteSettings } from '@/types/admin';

const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL ||
                      'https://techblit-cloud-function-production.up.railway.app';
const API_BASE = `${FUNCTIONS_URL}/api/v1`;

class ApiService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  /**
   * Get authentication token from Firebase Auth
   * Forces token refresh to ensure it's valid
   */
  async getAuthToken(forceRefresh: boolean = false): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        // Force refresh if requested or if token is expired
        return await user.getIdToken(forceRefresh);
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
      // If token refresh fails, try to get a fresh token
      if (!forceRefresh) {
        try {
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
          const user = auth.currentUser;
          if (user) {
            return await user.getIdToken(true); // Force refresh
          }
        } catch (retryError) {
          console.error('Error retrying auth token:', retryError);
        }
      }
    }
    return null;
  }

  /**
   * Make API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<T> {
    // Get fresh token (force refresh on retry)
    const token = this.authToken || await this.getAuthToken(retryCount > 0);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', {
        method: options.method || 'GET',
        url,
        hasToken: !!token
      });
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
        // Use 'omit' since we're using Bearer tokens in headers, not cookies
        // This simplifies CORS and avoids credential-related CORS issues
        credentials: 'omit',
        mode: 'cors',
      });
    } catch (fetchError: any) {
      // Handle network errors (CORS, connectivity, etc.)
      console.error('Network error fetching:', {
        url,
        baseUrl: this.baseUrl,
        endpoint,
        error: fetchError.message,
        name: fetchError.name,
        stack: fetchError.stack
      });
      
      // Provide helpful error message
      let errorMessage = 'Network error: Failed to connect to API';
      if (fetchError.message?.includes('CORS') || fetchError.name === 'TypeError') {
        errorMessage = `CORS/Network error: Unable to reach API at ${url}. Check if the function is deployed and CORS is configured.`;
      } else if (fetchError.message?.includes('Failed to fetch')) {
        errorMessage = `Failed to fetch from ${url}. Check your internet connection and ensure the API server is running.`;
      } else {
        errorMessage = `Network error: ${fetchError.message || 'Unknown error'}`;
      }
      
      throw new Error(errorMessage);
    }

    if (!response.ok) {
      // If unauthorized and we haven't retried, try refreshing token
      if (response.status === 401 && retryCount === 0) {
        // Clear cached token and retry with fresh token (force refresh)
        this.authToken = null;
        const freshToken = await this.getAuthToken(true);
        if (freshToken) {
          return this.request<T>(endpoint, options, retryCount + 1);
        }
      }
      
      let errorData: any = {};
      let errorText: string = '';
      
      try {
        // Try to get response as text first to see what we're dealing with
        errorText = await response.text();
        
        // Try to parse as JSON
        if (errorText) {
          try {
            errorData = JSON.parse(errorText);
          } catch (parseError) {
            // If not JSON, use the text as error message
            errorData = { error: errorText || `HTTP error! status: ${response.status}` };
          }
        } else {
          errorData = { error: `HTTP error! status: ${response.status}` };
        }
      } catch (error) {
        // Fallback if we can't read the response
        errorData = { error: `HTTP error! status: ${response.status}` };
        errorText = `Failed to read error response: ${error}`;
      }
      
      // Handle nested error structure: { success: false, error: { message, code, ... } }
      const errorMessage = 
        errorData?.error?.message || 
        (typeof errorData?.error === 'string' ? errorData.error : null) ||
        errorData?.message || 
        errorText ||
        `API call failed with status ${response.status}`;
      
      // Log full error details for debugging
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        endpoint,
        errorData: errorData && Object.keys(errorData).length > 0 ? errorData : 'No error data',
        errorText: errorText || 'No error text',
        errorMessage
      });
      
      // If still unauthorized after retry, suggest re-login
      if (response.status === 401) {
        throw new Error(`${errorMessage}. Please try logging out and logging back in.`);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data || data;
  }

  // ============================================================================
  // POSTS API
  // ============================================================================

  async getPosts(params?: {
    limit?: number;
    offset?: number;
    category?: string;
    tag?: string;
  }): Promise<Post[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.tag) queryParams.append('tag', params.tag);
    
    const query = queryParams.toString();
    return this.request<Post[]>(`/posts${query ? `?${query}` : ''}`);
  }

  async getAllPosts(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    category?: string;
    tag?: string;
  }): Promise<Post[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.category) queryParams.append('category', params.category);
      if (params?.tag) queryParams.append('tag', params.tag);
      
      const query = queryParams.toString();
      return await this.request<Post[]>(`/posts/admin/all${query ? `?${query}` : ''}`);
    } catch (error: any) {
      // Fallback to regular getPosts if admin endpoint doesn't exist yet (not deployed)
      if (error?.message?.includes('not found') || error?.message?.includes('404')) {
        console.warn('Admin endpoint not available, falling back to public endpoint (may only show published posts)');
        return this.getPosts({
          limit: params?.limit,
          offset: params?.offset,
          category: params?.category,
          tag: params?.tag
        });
      }
      throw error;
    }
  }

  async getPostBySlug(slug: string): Promise<Post | null> {
    return this.request<Post | null>(`/posts/${slug}`);
  }

  async getPostById(id: string): Promise<Post | null> {
    return this.request<Post | null>(`/posts/admin/${id}`);
  }

  async getPostBySlugAdmin(slug: string): Promise<Post | null> {
    return this.request<Post | null>(`/posts/admin/slug/${slug}`);
  }

  async createPost(data: {
    title: string;
    content: string;
    excerpt: string;
    tags?: string[];
    categories?: string[];
    status?: string;
    featuredImage?: any;
    scheduledAt?: Date;
  }): Promise<{ id: string }> {
    return this.request<{ id: string }>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePost(id: string, data: any) {
    return this.request(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePost(id: string) {
    return this.request(`/posts/${id}`, {
      method: 'DELETE',
    });
  }

  async incrementViewCount(slug: string) {
    return this.request(`/posts/${slug}/view`, {
      method: 'PATCH',
    });
  }

  // ============================================================================
  // USERS API
  // ============================================================================

  async getUsers(params?: { limit?: number; offset?: number; role?: string }): Promise<User[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.role) queryParams.append('role', params.role);
    
    const query = queryParams.toString();
    return this.request<User[]>(`/users${query ? `?${query}` : ''}`);
  }

  async getUserProfile(): Promise<User> {
    return this.request<User>('/users/profile');
  }

  async updateUserProfile(data: { name?: string; bio?: string; avatar?: string }): Promise<User> {
    return this.request<User>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateUserRole(userId: string, role: string): Promise<void> {
    return this.request<void>(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async deleteUser(userId: string): Promise<void> {
    return this.request<void>(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // MEDIA API
  // ============================================================================

  async getMedia(params?: { limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const query = queryParams.toString();
    return this.request(`/media${query ? `?${query}` : ''}`);
  }

  async uploadMedia(
    file: File,
    options?: {
      folder?: 'posts' | 'authors' | 'categories' | 'ui' | 'media';
      alt?: string;
    }
  ): Promise<{
    id: string;
    public_id: string;
    image_id: string;
    url: string;
    width: number;
    height: number;
    format: string;
    filename: string;
    size: number;
  }>;
  
  async uploadMedia(metadata: {
    url: string;
    filename: string;
    size?: number;
    type?: string;
    alt?: string;
    public_id?: string;
    image_id?: string;
  }): Promise<any>;
  
  async uploadMedia(
    fileOrMetadata: File | {
      url: string;
      filename: string;
      size?: number;
      type?: string;
      alt?: string;
      public_id?: string;
      image_id?: string;
    },
    options?: {
      folder?: 'posts' | 'authors' | 'categories' | 'ui' | 'media';
      alt?: string;
    }
  ) {
    // If it's a File, upload to Cloudinary via backend
    if (fileOrMetadata instanceof File) {
      const formData = new FormData();
      formData.append('file', fileOrMetadata);
      
      // Add folder if specified
      if (options?.folder) {
        formData.append('folder', options.folder);
      }
      
      // Add alt text if specified
      if (options?.alt) {
        formData.append('alt', options.alt);
      }
      
      // For file uploads, we need multipart form data
      const token = this.authToken || await this.getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      // Don't set Content-Type - browser will set it with boundary for multipart/form-data
      
      const response = await fetch(`${this.baseUrl}/media/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      if (!response.ok) {
        let errorMessage = `Upload failed: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Ignore JSON parse errors
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      // Return the data in a consistent format
      if (result.success && result.data) {
        return result.data;
      }
      
      return result;
    } else {
      // Register existing media metadata (supports both legacy URLs and public_ids)
      return this.request('/media', {
        method: 'POST',
        body: JSON.stringify(fileOrMetadata),
      });
    }
  }

  async deleteMedia(id: string) {
    return this.request(`/media/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // SETTINGS API
  // ============================================================================

  async getSettings(): Promise<SiteSettings> {
    return this.request<SiteSettings>('/settings');
  }

  async updateSettings(data: any) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ============================================================================
  // REDIRECTS API
  // ============================================================================

  async getRedirects(): Promise<Redirect[]> {
    return this.request<Redirect[]>('/redirects');
  }

  async createRedirect(data: { from: string; to: string; type?: number; permanent?: boolean }): Promise<{ id: string }> {
    return this.request<{ id: string }>('/redirects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRedirect(id: string, data: { from?: string; to?: string; type?: number; permanent?: boolean; active?: boolean }): Promise<void> {
    return this.request<void>(`/redirects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRedirect(id: string): Promise<void> {
    return this.request<void>(`/redirects/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // CATEGORIES API
  // ============================================================================

  async getCategories() {
    return this.request('/categories');
  }

  async getPostsByCategory(slug: string, params?: { limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const query = queryParams.toString();
    return this.request(`/categories/${slug}/posts${query ? `?${query}` : ''}`);
  }

  // ============================================================================
  // NEWSLETTER API
  // ============================================================================

  async subscribeToNewsletter(data: { email: string; name?: string }) {
    return this.request('/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async unsubscribeFromNewsletter(data: { email: string }) {
    return this.request('/newsletter/unsubscribe', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getNewsletterStats(): Promise<{ active?: number; recent?: number }> {
    return this.request<{ active?: number; recent?: number }>('/newsletter/stats');
  }

  // ============================================================================
  // ANALYTICS API
  // ============================================================================

  async getAnalytics() {
    return this.request('/analytics');
  }

  // ============================================================================
  // GROK TRENDS API
  // ============================================================================

  async getGrokStories(params?: { status?: string; category?: string; limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const query = queryParams.toString();
    return this.request(`/grok-trends/stories${query ? `?${query}` : ''}`);
  }

  async updateGrokStoryStatus(id: string, status: string) {
    return this.request(`/grok-trends/stories/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getGrokStats() {
    return this.request('/grok-trends/stats');
  }

  async fetchGrokStories(data?: { category?: string }) {
    return this.request('/grok-trends/fetch', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async createGrokStory(data: any) {
    return this.request('/grok-trends/stories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateGrokDraft(storyId: string) {
    return this.request(`/grok-trends/stories/${storyId}/generate-draft`, {
      method: 'POST',
    });
  }

  async publishGrokStory(storyId: string, postData?: {
    title?: string;
    content?: string;
    contentHtml?: string;
    excerpt?: string;
    tags?: string[];
    category?: string;
    metaTitle?: string;
    metaDescription?: string;
    canonical?: string;
    featuredImage?: any;
  }) {
    return this.request(`/grok-trends/stories/${storyId}/publish`, {
      method: 'POST',
      body: JSON.stringify(postData || {}),
    });
  }

  async fetchGrokStoriesWithAutoDraft(data?: { 
    category?: string; 
    autoGenerateDrafts?: boolean; 
    engagementThreshold?: number;
  }) {
    return this.request('/grok-trends/fetch', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async getAutoDraftConfig() {
    return this.request('/grok-trends/config/auto-draft');
  }

  async updateAutoDraftConfig(config: {
    enabled: boolean;
    engagementThreshold?: number;
    categories?: string[];
  }) {
    return this.request('/grok-trends/config/auto-draft', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // ============================================================================
  // AUDIT LOGS API
  // ============================================================================

  async getAuditLogs(params?: {
    limit?: number;
    offset?: number;
    action?: string;
    target?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });
    
    const query = queryParams.toString();
    return this.request(`/audit-logs${query ? `?${query}` : ''}`);
  }

  async getAuditLogStats() {
    return this.request('/audit-logs/stats');
  }

  async getAuditLogFilters() {
    return this.request('/audit-logs/filters');
  }

  async getAuditLogById(id: string) {
    return this.request(`/audit-logs/${id}`);
  }

  // ============================================================================
  // NOTIFICATIONS API
  // ============================================================================

  async getNotifications(params?: { limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return this.request(`/notifications${query ? `?${query}` : ''}`);
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  // ============================================================================
  // PREVIEW TOKENS API
  // ============================================================================

  async generatePreviewToken(data: { postId: string; expiresInHours?: number }) {
    return this.request('/preview-tokens', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async validatePreviewToken(token: string, postId: string) {
    return this.request(`/preview-tokens/validate?token=${token}&postId=${postId}`);
  }

  async getPreviewTokenStats() {
    return this.request('/preview-tokens/stats');
  }

  // ============================================================================
  // INVITATIONS API
  // ============================================================================

  async inviteUser(data: { email: string; name: string; role: string }) {
    return this.request('/invitations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resendInvitation(uid: string) {
    return this.request(`/invitations/${uid}/resend`, {
      method: 'POST',
    });
  }

  async getInvitationStats() {
    return this.request('/invitations/stats');
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;

