import { useState } from 'react';
import { invitationApi } from '@/lib/api/invitationClient';
import { 
  InviteUserRequest, 
  InviteUserResponse, 
  ResendInvitationResponse, 
  InvitationStatsResponse 
} from '@/lib/api/types';

interface UseInvitationReturn {
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  inviteUser: (data: InviteUserRequest, token: string) => Promise<InviteUserResponse>;
  resendInvitation: (uid: string, token: string) => Promise<ResendInvitationResponse>;
  getStats: (token: string) => Promise<InvitationStatsResponse>;
  
  // Utilities
  clearError: () => void;
}

export function useInvitation(): UseInvitationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const inviteUser = async (data: InviteUserRequest, token: string): Promise<InviteUserResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await invitationApi.inviteUser(data, token);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to invite user';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resendInvitation = async (uid: string, token: string): Promise<ResendInvitationResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await invitationApi.resendInvitation(uid, token);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend invitation';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getStats = async (token: string): Promise<InvitationStatsResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await invitationApi.getInvitationStats(token);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get invitation stats';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    inviteUser,
    resendInvitation,
    getStats,
    clearError,
  };
}
