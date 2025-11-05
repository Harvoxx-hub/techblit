'use client';

import { useState } from 'react';
import Link from 'next/link';

interface EventBannerProps {
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  className?: string;
}

export default function EventBanner({
  title,
  description,
  imageUrl,
  linkUrl,
  linkText = 'Learn More',
  startDate,
  endDate,
  location,
  className = ''
}: EventBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const content = (
    <div className={`relative overflow-hidden rounded-xl min-h-[200px] ${className}`}>
      {/* Background Image or Gradient */}
      {imageUrl ? (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/80"></div>
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600"></div>
      )}

      {/* Content */}
      <div className="relative px-6 py-8 md:px-12 md:py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left: Event Info */}
          <div className="flex-1">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm mb-3">
              <span className="text-xs font-semibold text-white uppercase tracking-wide">Upcoming Event</span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {title}
            </h2>
            
            {description && (
              <p className="text-white/90 text-sm md:text-base mb-4 max-w-2xl">
                {description}
              </p>
            )}

            {/* Event Details */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
              {startDate && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{startDate}{endDate && ` - ${endDate}`}</span>
                </div>
              )}
              
              {location && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: CTA Button */}
          {linkUrl && (
            <div className="flex items-center gap-3">
              <Link
                href={linkUrl}
                className="inline-flex items-center px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                {linkText}
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors"
        aria-label="Close banner"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  return content;
}

