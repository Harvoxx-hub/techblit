'use client';

import { useEffect, useState } from 'react';
import { getAnalyticsInstance } from '@/lib/firebase';

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    // Only initialize analytics on the client side after hydration
    const analyticsInstance = getAnalyticsInstance();
    setAnalytics(analyticsInstance);
  }, []);

  return analytics;
};
