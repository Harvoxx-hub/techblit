import apiService from '@/lib/apiService';

export interface NewsletterSubscription {
  id?: string;
  email: string;
  subscribedAt: any;
  status: 'active' | 'unsubscribed';
  source: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function subscribeToNewsletter(
  email: string,
  source: string = 'homepage',
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; message: string; id?: string }> {
  try {
    const result = await apiService.subscribeToNewsletter({ email }) as { id?: string };
    
    return {
      success: true,
      message: 'Successfully subscribed to Techblit newsletter!',
      id: result?.id
    };
  } catch (error: any) {
    console.error('Error subscribing to newsletter:', error);
    
    // Handle specific error cases
    if (error.message?.includes('already subscribed') || error.message?.includes('409')) {
      return {
        success: false,
        message: 'This email is already subscribed to our newsletter.'
      };
    }
    
    return {
      success: false,
      message: 'Failed to subscribe. Please try again later.'
    };
  }
}

export async function unsubscribeFromNewsletter(email: string): Promise<{ success: boolean; message: string }> {
  try {
    await apiService.unsubscribeFromNewsletter({ email });
    
    return {
      success: true,
      message: 'Successfully unsubscribed from Techblit newsletter.'
    };
  } catch (error: any) {
    console.error('Error unsubscribing from newsletter:', error);
    
    if (error.message?.includes('not found') || error.message?.includes('404')) {
      return {
        success: false,
        message: 'Email not found in our subscription list.'
      };
    }
    
    return {
      success: false,
      message: 'Failed to unsubscribe. Please try again later.'
    };
  }
}

export async function getNewsletterStats(): Promise<{
  totalSubscribers: number;
  recentSubscribers: number;
  growthRate: number;
}> {
  try {
    const stats = await apiService.getNewsletterStats();
    
    const totalSubscribers = stats.active || 0;
    const recentSubscribers = stats.recent || 0;
    const growthRate = totalSubscribers > 0 ? (recentSubscribers / totalSubscribers) * 100 : 0;
    
    return {
      totalSubscribers,
      recentSubscribers,
      growthRate: Math.round(growthRate * 100) / 100
    };
  } catch (error) {
    console.error('Error getting newsletter stats:', error);
    return {
      totalSubscribers: 0,
      recentSubscribers: 0,
      growthRate: 0
    };
  }
}
