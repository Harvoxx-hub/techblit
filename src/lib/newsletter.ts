import apiService from '@/lib/apiService';

export type NewsletterStatus = 'pending' | 'subscribed' | 'unsubscribed';

export interface NewsletterSubscription {
  id?: string;
  email: string;
  status: NewsletterStatus;
  subscribedAt?: any;
  confirmedAt?: any;
  /** Consent evidence, recorded server-side at signup. */
  consent?: {
    source: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    requestedAt: any;
  };
}

export interface NewsletterResult {
  success: boolean;
  message: string;
}

/**
 * Starts double opt-in. A success here means a confirmation email is on its
 * way — the address is not on the sending list until the reader clicks it.
 *
 * The source identifies which signup widget was used; IP and user agent are
 * captured server-side, where the client can't forge them.
 */
export async function subscribeToNewsletter(
  email: string,
  source: string = 'homepage'
): Promise<NewsletterResult & { id?: string }> {
  try {
    const result = (await apiService.subscribeToNewsletter({ email, source })) as { id?: string };

    return {
      success: true,
      message: 'Almost there — check your inbox to confirm your subscription.',
      id: result?.id,
    };
  } catch (error: any) {
    console.error('Error subscribing to newsletter:', error);

    if (error.message?.includes('already subscribed') || error.message?.includes('409')) {
      return {
        success: false,
        message: 'This email is already subscribed to our newsletter.',
      };
    }

    if (error.message?.includes('valid email')) {
      return {
        success: false,
        message: 'Please enter a valid email address.',
      };
    }

    return {
      success: false,
      message: 'Failed to subscribe. Please try again later.',
    };
  }
}

/**
 * Completes double opt-in using the token from the confirmation email.
 */
export async function confirmNewsletterSubscription(token: string): Promise<NewsletterResult> {
  try {
    const result = await apiService.confirmNewsletterSubscription({ token });

    return {
      success: true,
      message: result?.alreadyConfirmed
        ? "You're already confirmed — you're on the list."
        : "You're subscribed. Welcome to TechBlit.",
    };
  } catch (error: any) {
    console.error('Error confirming newsletter subscription:', error);

    if (error.message?.includes('expired')) {
      return {
        success: false,
        message: 'This confirmation link has expired. Please subscribe again to get a fresh one.',
      };
    }

    return {
      success: false,
      message: 'This confirmation link is not valid. Please subscribe again.',
    };
  }
}

/**
 * Unsubscribes using the token from an email footer. The backend answers 200
 * even for unknown tokens, so an unrecognised link reads as "already off the
 * list" rather than an error.
 */
export async function unsubscribeFromNewsletter(token: string): Promise<NewsletterResult> {
  try {
    const result = await apiService.unsubscribeFromNewsletter({ token });

    if (result?.status === 'not_found' || result?.status === 'invalid') {
      return {
        success: false,
        message: "This unsubscribe link isn't valid. If you're still receiving emails, reply to any of them and we'll remove you.",
      };
    }

    return {
      success: true,
      message: "You've been unsubscribed. You won't receive the TechBlit newsletter again.",
    };
  } catch (error: any) {
    console.error('Error unsubscribing from newsletter:', error);
    return {
      success: false,
      message: 'Failed to unsubscribe. Please try again later.',
    };
  }
}

export async function getNewsletterStats(): Promise<{
  totalSubscribers: number;
  pendingSubscribers: number;
  recentSubscribers: number;
  growthRate: number;
}> {
  try {
    const stats = await apiService.getNewsletterStats();

    // "Total" means confirmed subscribers — pending addresses have not
    // completed opt-in and are never mailed, so counting them would overstate
    // the reach of the list.
    const totalSubscribers = stats.active || 0;
    const pendingSubscribers = stats.pending || 0;
    const recentSubscribers = stats.recent || 0;
    const growthRate = totalSubscribers > 0 ? (recentSubscribers / totalSubscribers) * 100 : 0;

    return {
      totalSubscribers,
      pendingSubscribers,
      recentSubscribers,
      growthRate: Math.round(growthRate * 100) / 100,
    };
  } catch (error) {
    console.error('Error getting newsletter stats:', error);
    return {
      totalSubscribers: 0,
      pendingSubscribers: 0,
      recentSubscribers: 0,
      growthRate: 0,
    };
  }
}
