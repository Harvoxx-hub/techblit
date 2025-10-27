'use client';

import { useState, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || 'YIZ3TZ073A';
const ALGOLIA_API_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '3416d2344394220af7857d4fa1aa6e3b';
const ALGOLIA_INDEX_NAME = 'techblit_posts';
const ALGOLIA_URL = `https://${ALGOLIA_APP_ID}-dsn.algolia.net`;

interface SearchResult {
  objectID: string;
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
  author?: string;
  publishedAt?: number;
  featuredImage?: string;
  tags?: string[];
}

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Search function
  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);

    if (!searchQuery.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(`${ALGOLIA_URL}/1/indexes/${ALGOLIA_INDEX_NAME}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Algolia-Application-Id': ALGOLIA_APP_ID,
          'X-Algolia-API-Key': ALGOLIA_API_KEY,
        },
        body: JSON.stringify({
          query: searchQuery,
          hitsPerPage: 10,
          attributesToRetrieve: ['objectID', 'title', 'slug', 'excerpt', 'category', 'author', 'publishedAt', 'featuredImage', 'tags'],
        }),
      });

      const data = await response.json();
      setResults((data.hits || []) as SearchResult[]);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const handleResultClick = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  return (
    <>
      {/* Search Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        aria-label="Search"
        title="Search"
      >
        <MagnifyingGlassIcon className="h-5 w-5" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal */}
          <div className="relative min-h-screen flex items-start justify-center p-4 pt-20">
            <div
              ref={modalRef}
              className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800"
            >
              {/* Search Input */}
              <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center flex-1">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search articles..."
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500"
                  />
                  {query && (
                    <button
                      onClick={() => {
                        setQuery('');
                        setResults([]);
                      }}
                      className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                      aria-label="Clear search"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-400" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="ml-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Close search"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                </button>
              </div>

              {/* Search Results */}
              <div className="max-h-96 overflow-y-auto">
                {isSearching && (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Searching...</p>
                  </div>
                )}

                {!isSearching && query && results.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-gray-600 dark:text-gray-400">No results found for "{query}"</p>
                  </div>
                )}

                {!isSearching && results.length > 0 && (
                  <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {results.map((result) => (
                      <Link
                        key={result.objectID}
                        href={`/${result.slug}`}
                        onClick={handleResultClick}
                        className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                      >
                        <div className="flex items-start">
                          {/* Image */}
                          {result.featuredImage && (
                            <div className="flex-shrink-0 mr-4">
                              <img
                                src={result.featuredImage}
                                alt={result.title}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            </div>
                          )}
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                                {result.title}
                              </h3>
                            </div>
                            
                            {result.excerpt && (
                              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {result.excerpt}
                              </p>
                            )}
                            
                            <div className="mt-2 flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-500">
                              {result.category && (
                                <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                  {result.category}
                                </span>
                              )}
                              {result.author && (
                                <span>{result.author}</span>
                              )}
                              {result.publishedAt && (
                                <span>{formatDate(result.publishedAt)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {!query && !isSearching && (
                  <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                    <p>Start typing to search for articles...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

