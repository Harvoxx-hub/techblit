'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SideBannerProps {
  title?: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  position?: 'left' | 'right';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function SideBanner({
  title,
  description,
  imageUrl,
  linkUrl,
  linkText = 'Learn More',
  position = 'left',
  size = 'medium',
  className = ''
}: SideBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  // Size configurations
  const sizeClasses = {
    small: 'w-48 h-64',
    medium: 'w-56 h-80',
    large: 'w-64 h-96'
  };

  const bannerContent = (
    <div className={`${sizeClasses[size]} rounded-lg overflow-hidden shadow-lg ${className}`}>
      {/* Background */}
      {imageUrl ? (
        <div 
          className="relative w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        </div>
      ) : (
        <div className="relative w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600"></div>
      )}

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-4">
        <div>
          {title && (
            <h3 className="text-white font-bold text-sm mb-2 line-clamp-2">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-white/90 text-xs line-clamp-3 mb-3">
              {description}
            </p>
          )}
        </div>

        {linkUrl && (
          <Link
            href={linkUrl}
            className="inline-flex items-center justify-center px-4 py-2 bg-white text-gray-900 text-xs font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            {linkText}
          </Link>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-2 right-2 p-1 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-colors"
        aria-label="Close banner"
      >
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  return bannerContent;
}

