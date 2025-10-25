import { useState } from 'react';

interface PreviewTokenData {
  token: string;
  expiresAt: Date;
  previewUrl: string;
  expiresInHours: number;
}

interface UsePreviewTokenResult {
  generatePreviewToken: (postId: string, expiresInHours?: number) => Promise<PreviewTokenData | null>;
  loading: boolean;
  error: string | null;
}

export function usePreviewToken(): UsePreviewTokenResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePreviewToken = async (
    postId: string, 
    expiresInHours: number = 24
  ): Promise<PreviewTokenData | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/generatePreviewToken`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getAuthToken()}`,
          },
          body: JSON.stringify({
            postId,
            expiresInHours,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate preview token');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate preview token');
      }

      return {
        token: data.data.token,
        expiresAt: new Date(data.data.expiresAt),
        previewUrl: data.data.previewUrl,
        expiresInHours: data.data.expiresInHours,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate preview token';
      setError(errorMessage);
      console.error('Error generating preview token:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    generatePreviewToken,
    loading,
    error,
  };
}

// Helper function to get auth token
async function getAuthToken(): Promise<string> {
  try {
    const { getAuth } = await import('firebase/auth');
    const { auth } = await import('@/lib/firebase');
    
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }
    
    return await auth.currentUser.getIdToken();
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw new Error('Failed to get authentication token');
  }
}
