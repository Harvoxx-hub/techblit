import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
    // Check if email already exists
    const subscriptionsRef = collection(db, 'newsletter_subscriptions');
    const q = query(
      subscriptionsRef,
      where('email', '==', email.toLowerCase()),
      where('status', '==', 'active')
    );
    
    const existingSubscriptions = await getDocs(q);
    
    if (!existingSubscriptions.empty) {
      return {
        success: false,
        message: 'This email is already subscribed to our newsletter.'
      };
    }

    // Prepare subscription data, filtering out undefined values
    const subscriptionData: any = {
      email: email.toLowerCase(),
      subscribedAt: serverTimestamp(),
      status: 'active',
      source,
    };

    // Only add optional fields if they have values
    if (ipAddress && ipAddress !== 'unknown') {
      subscriptionData.ipAddress = ipAddress;
    }
    if (userAgent && userAgent !== 'unknown') {
      subscriptionData.userAgent = userAgent;
    }

    // Add new subscription
    const docRef = await addDoc(subscriptionsRef, subscriptionData);

    return {
      success: true,
      message: 'Successfully subscribed to Techblit newsletter!',
      id: docRef.id
    };
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return {
      success: false,
      message: 'Failed to subscribe. Please try again later.'
    };
  }
}

export async function unsubscribeFromNewsletter(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const subscriptionsRef = collection(db, 'newsletter_subscriptions');
    const q = query(
      subscriptionsRef,
      where('email', '==', email.toLowerCase()),
      where('status', '==', 'active')
    );
    
    const existingSubscriptions = await getDocs(q);
    
    if (existingSubscriptions.empty) {
      return {
        success: false,
        message: 'Email not found in our subscription list.'
      };
    }

    // Update status to unsubscribed
    const updatePromises = existingSubscriptions.docs.map(doc => 
      updateDoc(doc.ref, { status: 'unsubscribed' })
    );
    
    await Promise.all(updatePromises);

    return {
      success: true,
      message: 'Successfully unsubscribed from Techblit newsletter.'
    };
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
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
    const subscriptionsRef = collection(db, 'newsletter_subscriptions');
    
    // Get total active subscribers
    const activeQuery = query(subscriptionsRef, where('status', '==', 'active'));
    const activeSnapshot = await getDocs(activeQuery);
    
    // Get subscribers from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentQuery = query(
      subscriptionsRef,
      where('status', '==', 'active'),
      where('subscribedAt', '>=', thirtyDaysAgo)
    );
    const recentSnapshot = await getDocs(recentQuery);
    
    const totalSubscribers = activeSnapshot.size;
    const recentSubscribers = recentSnapshot.size;
    
    // Calculate growth rate (simplified)
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
