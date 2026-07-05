'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import ThemeToggle from './ThemeToggle'
import SearchModal from './SearchModal'
import { CATEGORIES } from '@/lib/categories'

interface NavigationProps {
  showBackButton?: boolean
}

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/series/101', label: '101' },
]

const CATEGORY_LINKS = CATEGORIES.slice(0, 6).map((cat) => ({
  href: `/category/${cat.slug}`,
  label: cat.label,
}))

export default function Navigation({ showBackButton: _showBackButton = false }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const allLinks = [...NAV_LINKS, ...CATEGORY_LINKS]

  return (
    <header className="sticky top-0 z-50">
      <nav
        className={`transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 dark:bg-gray-950/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-800/50'
            : 'bg-white dark:bg-gray-950 shadow-sm border-b border-gray-200 dark:border-gray-800'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 lg:h-16">
            <div className="flex items-center">
              <Link href="/" className="hover:opacity-80 transition-opacity" aria-label="TechBlit home">
                <Image
                  src="/favicon.png"
                  alt="TechBlit logo"
                  width={48}
                  height={48}
                  className="h-10 w-10 lg:h-12 lg:w-12 object-contain"
                  priority
                />
              </Link>
            </div>

            <div className="hidden lg:flex items-center space-x-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-brand-gold font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <SearchModal />
              <ThemeToggle />
              <Link
                href="#footer-newsletter"
                className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-bold rounded-lg bg-brand-gold text-brand-navy hover:bg-brand-gold/90 transition-colors"
              >
                Subscribe
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Category strip — Daily News style */}
          <div className="hidden lg:flex items-center gap-1 pb-2 overflow-x-auto scrollbar-hide border-t border-gray-100 dark:border-gray-800 pt-2">
            {CATEGORY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-brand-navy dark:hover:text-brand-gold hover:bg-brand-gold/10 rounded transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <div className="px-4 pt-2 pb-4 space-y-1 max-h-[70vh] overflow-y-auto">
              {allLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-brand-gold hover:bg-gray-50 dark:hover:bg-gray-900 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="#footer-newsletter"
                className="block px-3 py-2 font-bold rounded-md bg-brand-gold text-brand-navy text-center mt-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Subscribe
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
