'use client'

import { useState } from 'react'
import { subscribeToNewsletter } from '@/lib/newsletter'

interface FooterNewsletterProps {
  id?: string
}

const FooterNewsletter = ({ id = 'footer-newsletter' }: FooterNewsletterProps) => {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setStatus('error')
      setMessage('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)
    setStatus('idle')

    try {
      const result = await subscribeToNewsletter(email, 'homepage')
      setStatus(result.success ? 'success' : 'error')
      setMessage(result.message)
      if (result.success) setEmail('')
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      id={id}
      className="py-10 lg:py-12 bg-brand-navy"
      aria-labelledby="footer-newsletter-heading"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2
          id="footer-newsletter-heading"
          className="text-2xl lg:text-3xl font-bold text-white mb-2"
        >
          Stay informed, not overwhelmed
        </h2>
        <p className="text-gray-400 mb-6 max-w-lg mx-auto">
          Get the latest African tech news, startup stories, and funding updates delivered weekly.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            disabled={isSubmitting}
            aria-label="Email address for newsletter"
            className="flex-1 px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
          />
          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="px-6 py-3 font-bold rounded-lg bg-brand-gold text-brand-navy hover:bg-brand-gold/90 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>

        {status === 'success' && (
          <p className="mt-4 text-sm text-green-400">{message}</p>
        )}
        {status === 'error' && (
          <p className="mt-4 text-sm text-red-400">{message}</p>
        )}
      </div>
    </section>
  )
}

export default FooterNewsletter
