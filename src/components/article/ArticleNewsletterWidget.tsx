'use client'

import { useState } from 'react'
import { subscribeToNewsletter } from '@/lib/newsletter'

const ArticleNewsletterWidget = () => {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setStatus('error')
      setMessage('Enter a valid email')
      return
    }

    setIsSubmitting(true)
    setStatus('idle')

    try {
      const result = await subscribeToNewsletter(email, 'article')
      setStatus(result.success ? 'success' : 'error')
      setMessage(result.message)
      if (result.success) setEmail('')
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg bg-brand-navy p-4 sm:p-5">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-2">
        Newsletter
      </h3>
      <p className="text-sm text-gray-300 mb-4 leading-relaxed">
        African tech news in your inbox — weekly, no spam.
      </p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          disabled={isSubmitting}
          aria-label="Email for newsletter"
          className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-600 bg-gray-900 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
        />
        <button
          type="submit"
          disabled={isSubmitting || !email}
          className="w-full px-4 py-2.5 text-sm font-bold rounded-lg bg-brand-gold text-brand-navy hover:bg-yellow-400 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Subscribing…' : 'Subscribe'}
        </button>
      </form>
      {status === 'success' && (
        <p className="mt-2 text-xs text-green-400">{message}</p>
      )}
      {status === 'error' && (
        <p className="mt-2 text-xs text-red-400">{message}</p>
      )}
    </div>
  )
}

export default ArticleNewsletterWidget
