'use client';

import { useEffect, useState } from 'react';

interface AuthorStats {
  name?: string;
  totalArticles?: number;
  totalViews?: number;
  categories?: string[];
  firstPublished?: string;
  lastPublished?: string;
}

interface AuthorHeroProps {
  authorName: string;
  authorBio: string;
  avatarLetter: string;
  stats: AuthorStats;
  articleCount: number;
}

export default function AuthorHero({
  authorName,
  authorBio,
  avatarLetter,
  stats,
  articleCount,
}: AuthorHeroProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Get author's tenure
  const getTenure = () => {
    if (!stats.firstPublished) return null;
    const first = new Date(stats.firstPublished);
    const now = new Date();
    const months = Math.floor((now.getTime() - first.getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (months < 1) return 'New contributor';
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} writing`;
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''} writing`;
  };

  const tenure = getTenure();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 dark:from-teal-600 dark:via-cyan-600 dark:to-blue-600">
      {/* Animated geometric background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 right-10 w-72 h-72 border-8 border-white rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 border-8 border-white rotate-45" style={{ animation: 'spin 30s linear infinite' }}></div>
        <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-white/20 backdrop-blur-sm" style={{ animation: 'float 6s ease-in-out infinite' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Author Info */}
          <div
            className={`transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}
          >
            {/* Eyebrow */}
            {tenure && (
              <div className="inline-block mb-4 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-sm font-bold tracking-widest uppercase text-white">
                  {tenure}
                </span>
              </div>
            )}

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 text-white leading-[0.9] tracking-tight">
              {authorName}
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              {authorBio}
            </p>

            {/* Category badges */}
            {stats.categories && stats.categories.length > 0 && (
              <div className="mb-8">
                <p className="text-sm font-bold uppercase tracking-wide text-white/70 mb-3">
                  Expertise:
                </p>
                <div className="flex flex-wrap gap-2">
                  {stats.categories.slice(0, 5).map((category, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-full text-white font-bold text-sm hover:bg-white/30 transition-colors"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      {category}
                    </span>
                  ))}
                  {stats.categories.length > 5 && (
                    <span className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/70 font-bold text-sm">
                      +{stats.categories.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Avatar & Stats */}
          <div
            className={`transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
            }`}
          >
            {/* Large Avatar */}
            <div className="flex justify-center md:justify-end mb-8">
              <div className="relative">
                {/* Outer ring */}
                <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl scale-110"></div>

                {/* Avatar */}
                <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-white/90 backdrop-blur-sm border-8 border-white/40 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                  <span className="text-8xl md:text-9xl font-black text-teal-600">
                    {avatarLetter}
                  </span>
                </div>

                {/* Floating accent */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-400 rounded-full border-4 border-white flex items-center justify-center transform rotate-12">
                  <span className="text-2xl">✍️</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/20 backdrop-blur-md border-2 border-white/40 p-6 rounded-2xl hover:bg-white/30 transition-all duration-300 hover:scale-105">
                <div className="text-5xl font-black text-white mb-2">
                  {articleCount}
                </div>
                <div className="text-sm font-bold tracking-wide uppercase text-white/80">
                  Article{articleCount !== 1 ? 's' : ''}
                </div>
              </div>

              {stats.totalViews && stats.totalViews > 0 && (
                <div className="bg-white/20 backdrop-blur-md border-2 border-white/40 p-6 rounded-2xl hover:bg-white/30 transition-all duration-300 hover:scale-105">
                  <div className="text-5xl font-black text-white mb-2">
                    {stats.totalViews > 1000 ? `${Math.floor(stats.totalViews / 1000)}k` : stats.totalViews}
                  </div>
                  <div className="text-sm font-bold tracking-wide uppercase text-white/80">
                    Views
                  </div>
                </div>
              )}

              {stats.categories && (
                <div className="bg-white/20 backdrop-blur-md border-2 border-white/40 p-6 rounded-2xl hover:bg-white/30 transition-all duration-300 hover:scale-105">
                  <div className="text-5xl font-black text-white mb-2">
                    {stats.categories.length}
                  </div>
                  <div className="text-sm font-bold tracking-wide uppercase text-white/80">
                    Topic{stats.categories.length !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Diagonal cut-off at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-white dark:bg-[#0a0a0a] transform -skew-y-2 origin-top-left"></div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
      `}</style>
    </section>
  );
}
