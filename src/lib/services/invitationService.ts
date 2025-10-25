// External API service for invitation cloud functions
const INVITATION_API_BASE = 'https://inviteuser-4alcog3g7q-uc.a.run.app';

export interface InviteUserRequest {
  email: string;
  name: string;
  role: 'author' | 'editor' | 'reviewer' | 'viewer' | 'super_admin';
}

export interface InviteUserResponse {
  success: boolean;
  message: string;
  data: {
    uid: string;
    email: string;
    name: string;
    role: string;
    invitedAt: string;
    emailSent: boolean;
  };
}

export interface ResendInvitationResponse {
  success: boolean;
  message: string;
  data?: {
    emailSent: boolean;
    resentAt: string;
  };
}

export interface InvitationStatsResponse {
  success: boolean;
  data: {
    totalInvited: number;
    pendingActivation: number;
    activated: number;
    byRole: Record<string, number>;
  };
}

/**
 * Invite a new user via cloud function
 */
export async function inviteUser(
  inviteData: InviteUserRequest,
  token: string
): Promise<InviteUserResponse> {
  const response = await fetch(INVITATION_API_BASE, {
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
 * Resend invitation email for a user
 */
export async function resendInvitation(
  uid: string, 
  token: string
): Promise<ResendInvitationResponse> {
  const response = await fetch(
    `https://resendinvitation-4alcog3g7q-uc.a.run.app/${uid}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Get invitation statistics
 */
export async function getInvitationStats(
  token: string
): Promise<InvitationStatsResponse> {
  const response = await fetch(
    'https://getinvitationstats-4alcog3g7q-uc.a.run.app',
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}
