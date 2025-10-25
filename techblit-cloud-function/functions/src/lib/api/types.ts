// Types for invitation API
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

// Error response type
export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
}
