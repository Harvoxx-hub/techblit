/**
 * Global Categories List
 * Used by both admin and blog components
 */

export interface Category {
  id: string;
  label: string;
  slug: string;
  description?: string;
}

// Main categories used throughout the application
export const CATEGORIES: Category[] = [
  { id: 'startups', label: 'Startups', slug: 'startups', description: 'Tech startup news, companies, and stories' },
  { id: 'tech-news', label: 'Tech News', slug: 'tech-news', description: 'Latest technology news and updates' },
  { id: 'funding', label: 'Funding', slug: 'funding', description: 'Startup funding, investments, and deals' },
  { id: 'insights', label: 'Insights', slug: 'insights', description: 'Deep insights and analysis' },
  { id: 'events', label: 'Events', slug: 'events', description: 'Tech events, conferences, and meetups' },
  { id: 'fintech', label: 'Fintech', slug: 'fintech', description: 'Financial technology and payments' },
  { id: 'ai-innovation', label: 'AI & Innovation', slug: 'ai-innovation', description: 'Artificial intelligence and innovation' },
  { id: 'developer-tools', label: 'Developer Tools', slug: 'developer-tools', description: 'Developer tools and resources' },
  { id: 'opinions', label: 'Opinions', slug: 'opinions', description: 'Opinions and editorials' },
  { id: 'brand-press', label: 'Brand Press', slug: 'brand-press', description: 'Brand announcements and press releases' }
];

// For admin dropdowns (legacy format)
export const CATEGORY_OPTIONS = CATEGORIES.map(cat => ({
  value: cat.label,
  label: cat.label
}));

// For navigation (subset)
export const NAVIGATION_CATEGORIES = CATEGORIES.slice(0, 5); // First 5 categories

// Utility functions
export const getCategoryByLabel = (label: string): Category | undefined => {
  return CATEGORIES.find(cat => cat.label === label);
};

export const getCategoryBySlug = (slug: string): Category | undefined => {
  return CATEGORIES.find(cat => cat.slug === slug);
};

export const getCategoryById = (id: string): Category | undefined => {
  return CATEGORIES.find(cat => cat.id === id);
};

// Category gradient mapping
export const getCategoryGradient = (categorySlug?: string): string => {
  switch (categorySlug?.toLowerCase()) {
    case 'startups': return 'from-blue-500 to-purple-600';
    case 'tech-news': return 'from-green-500 to-blue-600';
    case 'funding': return 'from-yellow-500 to-orange-600';
    case 'insights': return 'from-purple-500 to-pink-600';
    case 'events': return 'from-red-500 to-pink-600';
    case 'fintech': return 'from-indigo-500 to-blue-600';
    case 'ai-innovation': return 'from-cyan-500 to-blue-600';
    case 'developer-tools': return 'from-emerald-500 to-teal-600';
    case 'opinions': return 'from-orange-500 to-red-600';
    case 'brand-press': return 'from-blue-600 to-indigo-700';
    default: return 'from-gray-500 to-gray-600';
  }
};
