'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { brandColors } from '@/lib/colors';
import ThemeToggle from './ThemeToggle';
import SearchModal from './SearchModal';

interface NavigationProps {
  showBackButton?: boolean;
}

export default function Navigation({ showBackButton = false }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationLinks = [
    { href: '/', label: 'Home' },
    { href: '/blog', label: 'Blog' },
    { href: '/category/Startup', label: 'Startup' },
    { href: '/category/tech-news', label: 'Tech News' },
    { href: '/category/funding', label: 'Funding' },
    { href: '/category/insights', label: 'Insights' },
    { href: '/category/events', label: 'Events' },
  ];

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50' 
        : 'bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="hover:opacity-80 transition-opacity"
            >
              <Image
                src="/logo.png"
                alt="Techblit Logo"
                width={100}
                height={64}
                className="h-16 w-32 object-contain"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navigationLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
            </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Modal */}
            <SearchModal />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Subscribe Button */}
            <Link
              href="#newsletter"
              className="hidden sm:inline-flex items-center px-4 py-2 text-white font-semibold rounded-lg transition-colors"
              style={{ 
                backgroundColor: brandColors.secondary[500], // Use yellow/gold for CTA
                color: brandColors.primary[500] // Dark navy text
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.secondary[600];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.secondary[500];
              }}
            >
              Subscribe
            </Link>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="#newsletter"
                className="block px-3 py-2 font-semibold rounded-md transition-colors"
                style={{ 
                  backgroundColor: brandColors.secondary[500], // Yellow/gold background
                  color: brandColors.primary[500] // Dark navy text
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = brandColors.secondary[600];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = brandColors.secondary[500];
                }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Subscribe
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
