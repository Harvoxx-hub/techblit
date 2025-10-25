// Client-side API client for invitations
import { 
  InviteUserRequest, 
  InviteUserResponse, 
  ResendInvitationResponse, 
  InvitationStatsResponse 
} from './types';

/**
 * Client-side API client for invitation operations
 * Uses internal Next.js API routes for better error handling and validation
 */
export class InvitationApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Invite a new user
   */
  async inviteUser(
    inviteData: InviteUserRequest,
    token: string
  ): Promise<InviteUserResponse> {
    const response = await fetch(`${this.baseUrl}/invitations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inviteData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Resend invitation for a user
   */
  async resendInvitation(
    uid: string,
    token: string
  ): Promise<ResendInvitationResponse> {
    const response = await fetch(`${this.baseUrl}/invitations/${uid}/resend`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get invitation statistics
   */
  async getInvitationStats(token: string): Promise<InvitationStatsResponse> {
    const response = await fetch(`${this.baseUrl}/invitations/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

// Export a default instance
export const invitationApi = new InvitationApiClient();
