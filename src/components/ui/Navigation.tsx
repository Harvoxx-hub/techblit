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

type NavLink = {
  href: string
  label: string
  ariaLabel?: string
  external?: boolean
}

import { ATN_PLAYLIST_URL } from '@/lib/atn'

const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  {
    href: ATN_PLAYLIST_URL,
    label: 'ATN',
    ariaLabel: 'Africa Tech Network on YouTube',
    external: true,
  },
]

const CATEGORY_LINKS = CATEGORIES.slice(0, 6).map((cat) => ({
  href: `/category/${cat.slug}`,
  label: cat.label,
}))

const NavAnchor = ({
  link,
  className,
  onClick,
}: {
  link: NavLink
  className: string
  onClick?: () => void
}) => {
  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={link.ariaLabel}
        title={link.ariaLabel}
        onClick={onClick}
      >
        {link.label}
      </a>
    )
  }

  return (
    <Link
      href={link.href}
      className={className}
      aria-label={link.ariaLabel}
      title={link.ariaLabel}
      onClick={onClick}
    >
      {link.label}
    </Link>
  )
}

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
    <header
      id="header"
      className={`sticky top-0 z-50 transition-shadow duration-300 ${
        isScrolled ? 'shadow-md' : 'shadow-sm'
      }`}
    >
      {/* Row 1 — utility bar (Daily News: tagline | sign in | subscribe) */}
      <div className="bg-brand-navy text-white border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 items-center min-h-[36px] py-2 text-xs sm:text-sm">
            <p className="col-span-1 italic text-gray-300 truncate pr-2 hidden sm:block">
              Igniting Africa&apos;s Tech Conversation
            </p>
            <p className="col-span-1 text-center text-brand-gold/80 font-medium italic sm:hidden truncate">
              All voices matter
            </p>
            <div className="hidden sm:block" aria-hidden="true" />
            <div className="col-span-2 sm:col-span-1 flex items-center justify-end gap-4 sm:gap-6">
              <Link
                href="/about"
                className="text-gray-300 hover:text-white transition-colors font-medium whitespace-nowrap"
              >
                Sign In
              </Link>
              <Link
                href="#footer-newsletter"
                className="font-bold text-brand-gold hover:text-brand-gold/80 transition-colors whitespace-nowrap"
              >
                Subscribe Now
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 — logo bar (Daily News: menu | centered logo | actions) */}
      <nav className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center min-h-[64px] lg:min-h-[80px] gap-2">
            {/* Left */}
            <div className="flex items-center gap-2 justify-start">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-brand-navy dark:hover:text-brand-gold transition-colors"
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
              <div className="hidden lg:flex items-center gap-5">
                {NAV_LINKS.map((link) => (
                  <NavAnchor
                    key={link.href}
                    link={link}
                    className="text-sm text-gray-600 dark:text-gray-300 hover:text-brand-gold font-medium transition-colors"
                  />
                ))}
              </div>
            </div>

            {/* Center — actual TechBlit logo */}
            <Link
              href="/"
              className="flex flex-col items-center justify-center group py-2"
              aria-label="TechBlit home"
            >
              <Image
                src="/favicon.png"
                alt=""
                width={56}
                height={56}
                className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 object-contain group-hover:scale-105 transition-transform duration-300"
                priority
              />
              <span className="mt-1 text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-brand-navy dark:text-white group-hover:text-brand-gold dark:group-hover:text-brand-gold transition-colors">
                TechBlit
              </span>
            </Link>

            {/* Right */}
            <div className="flex items-center justify-end gap-1 sm:gap-2">
              <SearchModal />
              <ThemeToggle />
              <Link
                href="#footer-newsletter"
                className="hidden md:inline-flex items-center px-4 py-2 text-sm font-bold rounded-md bg-brand-gold text-brand-navy hover:bg-brand-gold/90 transition-colors ml-1"
              >
                Subscribe
              </Link>
            </div>
          </div>

          {/* Mobile category strip */}
          <div className="lg:hidden flex gap-2 overflow-x-auto scrollbar-hide pb-3 pt-2 -mx-4 px-4 sm:-mx-6 sm:px-6 border-t border-gray-100 dark:border-gray-800">
            {CATEGORY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 px-3 py-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400 hover:text-brand-navy dark:hover:text-brand-gold bg-gray-50 dark:bg-gray-900 rounded-full transition-colors whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Row 3 — category strip (desktop) */}
          <div className="hidden lg:flex items-center justify-center gap-1 pb-3 overflow-x-auto scrollbar-hide border-t border-gray-100 dark:border-gray-800 pt-3">
            {CATEGORY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400 hover:text-brand-navy dark:hover:text-brand-gold hover:bg-brand-gold/10 rounded transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <div className="px-4 pt-2 pb-4 space-y-1 max-h-[70vh] overflow-y-auto">
              <p className="px-3 py-2 text-xs italic text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 mb-2">
                Igniting Africa&apos;s Tech Conversation
              </p>
              {allLinks.map((link) => (
                <NavAnchor
                  key={link.href}
                  link={link}
                  className="block px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-brand-gold hover:bg-gray-50 dark:hover:bg-gray-900 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              ))}
              <Link
                href="#footer-newsletter"
                className="block px-3 py-2 font-bold rounded-md bg-brand-gold text-brand-navy text-center mt-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Subscribe Now
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
