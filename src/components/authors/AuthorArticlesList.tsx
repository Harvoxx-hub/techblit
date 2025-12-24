'use client';

import BlogCard from '@/components/ui/BlogCard';
import { useState } from 'react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  contentHtml?: string;
  excerpt: string;
  author: {
    uid: string;
    name: string;
  };
  category?: string;
  createdAt: any;
  publishedAt: any;
  featuredImage?: {
    url?: string;
    original?: { url: string };
  };
  readTime?: string;
  status?: string;
}

interface AuthorArticlesListProps {
  articles: BlogPost[];
}

export default function AuthorArticlesList({ articles }: AuthorArticlesListProps) {
  const [filter, setFilter] = useState<string>('all');

  // Get unique categories
  const categories = Array.from(
    new Set(articles.map(post => post.category).filter(Boolean))
  ).sort();

  // Filter articles
  const filteredArticles = filter === 'all'
    ? articles
    : articles.filter(post => post.category === filter);

  return (
    <div>
      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="mb-12">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`
                px-6 py-3 rounded-full font-bold text-sm transition-all duration-300
                ${filter === 'all'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              All ({articles.length})
            </button>

            {categories.map((category) => {
              const count = articles.filter(post => post.category === category).length;
              return (
                <button
                  key={category}
                  onClick={() => setFilter(category as string)}
                  className={`
                    px-6 py-3 rounded-full font-bold text-sm transition-all duration-300
                    ${filter === category
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {category} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Articles Grid with staggered animation */}
      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.map((post, index) => (
            <div
              key={post.id}
              className="animate-fadeInUp"
              style={{
                animationDelay: `${index * 0.1}s`,
                animationFillMode: 'both',
              }}
            >
              <BlogCard post={post} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No articles in this category yet
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Check back soon for more content!
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
