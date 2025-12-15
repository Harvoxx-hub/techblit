/**
 * API Service Class
 * 
 * Centralized service for all API calls to replace direct Firebase SDK usage.
 * All Firebase operations should go through this service.
 */

const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
                      'https://us-central1-techblit.cloudfunctions.net';
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
   */
  async getAuthToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        return await user.getIdToken();
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return null;
  }

  /**
   * Make API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.authToken || await this.getAuthToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: `HTTP error! status: ${response.status}` 
      }));
      throw new Error(error.error || error.message || `API call failed with status ${response.status}`);
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
  }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.tag) queryParams.append('tag', params.tag);
    
    const query = queryParams.toString();
    return this.request(`/posts${query ? `?${query}` : ''}`);
  }

  async getPostBySlug(slug: string) {
    return this.request(`/posts/${slug}`);
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
  }) {
    return this.request('/posts', {
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

  async getUsers(params?: { limit?: number; offset?: number; role?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.role) queryParams.append('role', params.role);
    
    const query = queryParams.toString();
    return this.request(`/users${query ? `?${query}` : ''}`);
  }

  async getUserProfile() {
    return this.request('/users/profile');
  }

  async updateUserProfile(data: { name?: string; bio?: string; avatar?: string }) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateUserRole(userId: string, role: string) {
    return this.request(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async deleteUser(userId: string) {
    return this.request(`/users/${userId}`, {
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

  async uploadMedia(file: File | {
    url: string;
    filename: string;
    size?: number;
    type?: string;
    alt?: string;
  }) {
    // If it's a File, we need to use FormData for actual file upload
    // Otherwise, just register the metadata
    if (file instanceof File) {
      const formData = new FormData();
      formData.append('file', file);
      
      // For file uploads, we need multipart form data
      const token = this.authToken || await this.getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${this.baseUrl}/media/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
      
      return response.json();
    } else {
      // Register existing media URL
      return this.request('/media', {
        method: 'POST',
        body: JSON.stringify(file),
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

  async getSettings() {
    return this.request('/settings');
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

  async getRedirects() {
    return this.request('/redirects');
  }

  async createRedirect(data: { from: string; to: string; type?: number; permanent?: boolean }) {
    return this.request('/redirects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRedirect(id: string, data: { from?: string; to?: string; type?: number; permanent?: boolean }) {
    return this.request(`/redirects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRedirect(id: string) {
    return this.request(`/redirects/${id}`, {
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

  async getNewsletterStats() {
    return this.request('/newsletter/stats');
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

