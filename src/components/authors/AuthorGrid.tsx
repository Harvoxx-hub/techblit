'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Author {
  name: string;
  uid: string;
  articleCount: number;
  slug: string;
  totalViews?: number;
  categories?: string[];
}

interface AuthorGridProps {
  authors: Author[];
}

// Color palette for author cards - vibrant and varied
const colorPalettes = [
  { bg: 'from-orange-500 to-amber-500', text: 'text-orange-900', accent: 'bg-orange-100 dark:bg-orange-900/30' },
  { bg: 'from-teal-500 to-cyan-500', text: 'text-teal-900', accent: 'bg-teal-100 dark:bg-teal-900/30' },
  { bg: 'from-purple-500 to-pink-500', text: 'text-purple-900', accent: 'bg-purple-100 dark:bg-purple-900/30' },
  { bg: 'from-blue-500 to-indigo-500', text: 'text-blue-900', accent: 'bg-blue-100 dark:bg-blue-900/30' },
  { bg: 'from-rose-500 to-red-500', text: 'text-rose-900', accent: 'bg-rose-100 dark:bg-rose-900/30' },
  { bg: 'from-emerald-500 to-green-500', text: 'text-emerald-900', accent: 'bg-emerald-100 dark:bg-emerald-900/30' },
];

export default function AuthorGrid({ authors }: AuthorGridProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {authors.map((author, index) => {
        const palette = colorPalettes[index % colorPalettes.length];
        const isHovered = hoveredIndex === index;

        return (
          <Link
            key={author.uid}
            href={`/authors/${author.slug}`}
            className="group block"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              animationDelay: `${index * 0.1}s`,
            }}
          >
            <div
              className={`
                relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900
                border-2 border-gray-200 dark:border-gray-800
                transition-all duration-500 h-full
                ${isHovered ? 'scale-105 shadow-2xl border-transparent' : 'scale-100 shadow-sm'}
              `}
            >
              {/* Gradient Header with Avatar */}
              <div className={`relative bg-gradient-to-br ${palette.bg} p-8 pb-12`}>
                {/* Decorative pattern overlay */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-24 h-24 border-4 border-white rounded-full transform translate-x-8 -translate-y-8"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 border-4 border-white transform rotate-45 -translate-x-4 translate-y-4"></div>
                </div>

                {/* Avatar with initial */}
                <div className="relative">
                  <div
                    className={`
                      w-20 h-20 rounded-2xl bg-white/90 backdrop-blur-sm
                      flex items-center justify-center
                      transform transition-transform duration-500 rotate-3
                      ${isHovered ? 'rotate-12 scale-110' : 'rotate-3 scale-100'}
                    `}
                  >
                    <span className={`text-4xl font-black ${palette.text}`}>
                      {author.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Floating stat badge */}
                <div className="absolute top-4 right-4">
                  <div className="bg-white/20 backdrop-blur-md border-2 border-white/40 px-3 py-1 rounded-full">
                    <span className="text-white font-bold text-sm">
                      {author.articleCount} {author.articleCount === 1 ? 'post' : 'posts'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 pt-8">
                {/* Name */}
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 leading-tight">
                  {author.name}
                </h3>

                {/* Role */}
                <p className="text-sm font-bold tracking-wide uppercase text-gray-500 dark:text-gray-400 mb-4">
                  Contributor
                </p>

                {/* Stats row */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {author.totalViews && author.totalViews > 0 && (
                    <div className={`${palette.accent} ${palette.text} dark:text-white px-3 py-1 rounded-lg text-xs font-bold`}>
                      {author.totalViews.toLocaleString()} views
                    </div>
                  )}
                  {author.categories && author.categories.length > 0 && (
                    <div className={`${palette.accent} ${palette.text} dark:text-white px-3 py-1 rounded-lg text-xs font-bold`}>
                      {author.categories.length} {author.categories.length === 1 ? 'topic' : 'topics'}
                    </div>
                  )}
                </div>

                {/* Categories */}
                {author.categories && author.categories.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                      Covers:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {author.categories.slice(0, 3).map((category, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-medium"
                        >
                          {category}
                        </span>
                      ))}
                      {author.categories.length > 3 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 px-2 py-1 font-medium">
                          +{author.categories.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* View Profile CTA */}
                <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold mt-6">
                  <span>View Profile</span>
                  <svg
                    className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'translate-x-2' : 'translate-x-0'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>

              {/* Bottom accent bar */}
              <div className={`h-2 bg-gradient-to-r ${palette.bg} transform origin-left transition-transform duration-500 ${isHovered ? 'scale-x-100' : 'scale-x-0'}`}></div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
