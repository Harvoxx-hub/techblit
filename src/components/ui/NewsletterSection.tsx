'use client';

import { useState } from 'react';
import { EnvelopeIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button, Input, Alert } from '@/components/ui';
import { subscribeToNewsletter } from '@/lib/newsletter';

interface NewsletterSectionProps {
  className?: string;
}

export default function NewsletterSection({ className = '' }: NewsletterSectionProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');

    try {
      const result = await subscribeToNewsletter(email, 'homepage');
      
      if (result.success) {
        setStatus('success');
        setMessage(result.message);
        setEmail('');
      } else {
        setStatus('error');
        setMessage(result.message);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={`py-16 bg-gray-50 dark:bg-gray-900 ${className}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-3 py-1 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 mb-6">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Newsletter</span>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Stay Updated with Techblit
          </h2>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Get the latest startup news, funding updates, and tech insights delivered to your inbox weekly.
          </p>
        </div>

        {/* Newsletter Form */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 pr-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-600 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-600/20 transition-all duration-200 bg-white dark:bg-gray-800"
                  disabled={isSubmitting}
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting || !email}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-lg border-2 border-yellow-500 hover:border-yellow-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Subscribing...
                  </div>
                ) : (
                  'Subscribe'
                )}
              </Button>
            </div>

            {/* Status Messages */}
            {status === 'success' && (
              <Alert variant="success" className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200">
                <CheckCircleIcon className="w-5 h-5" />
                {message}
              </Alert>
            )}

            {status === 'error' && (

<Alert variant="danger" className="bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
                <ExclamationTriangleIcon className="w-5 h-5" />
                {message}
              </Alert>
            )}
          </form>

          {/* Trust Indicators */}
          <div className="mt-8 text-center">
            <div className="flex flex-wrap justify-center items-center gap-6 text-gray-500 dark:text-gray-400 text-sm">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                No spam, ever
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Unsubscribe anytime
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                Weekly digest
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12 text-center">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">10K+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Subscribers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">Weekly</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Updates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">Free</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Forever</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
