'use client'

import { useState } from 'react'
import { subscribeToNewsletter } from '@/lib/newsletter'

const InlineNewsletter = () => {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setStatus('error')
      return
    }

    setIsSubmitting(true)
    setStatus('idle')

    try {
      const result = await subscribeToNewsletter(email, 'homepage-inline')
      setStatus(result.success ? 'success' : 'error')
      if (result.success) setEmail('')
    } catch {
      setStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-800">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <div className="shrink-0">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-gold">
              Newsletter
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              African tech news in your inbox
            </p>
          </div>
          <div className="flex flex-1 gap-2 max-w-xl">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isSubmitting}
              aria-label="Email address for newsletter"
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
            />
            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="px-4 py-2 text-sm font-bold rounded-lg bg-brand-gold text-brand-navy hover:bg-brand-gold/90 disabled:opacity-50 transition-colors shrink-0"
            >
              {isSubmitting ? '...' : 'Subscribe'}
            </button>
          </div>
          {status === 'success' && (
            <p className="text-xs text-green-600 dark:text-green-400">Subscribed!</p>
          )}
          {status === 'error' && (
            <p className="text-xs text-red-600 dark:text-red-400">Please try again.</p>
          )}
        </form>
      </div>
    </div>
  )
}

export default InlineNewsletter
