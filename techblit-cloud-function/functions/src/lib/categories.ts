/**
 * Global Categories List
 * Used by both admin and blog components
 */

export interface Category {
  id: string;
  label: string;
  slug: string;
}

// Main categories used throughout the application
export const CATEGORIES: Category[] = [
  { id: 'startups', label: 'Startups', slug: 'startups' },
  { id: 'tech-news', label: 'Tech News', slug: 'tech-news' },
  { id: 'funding', label: 'Funding', slug: 'funding' },
  { id: 'insights', label: 'Insights', slug: 'insights' },
  { id: 'events', label: 'Events', slug: 'events' },
  { id: 'fintech', label: 'Fintech', slug: 'fintech' },
  { id: 'ai-innovation', label: 'AI & Innovation', slug: 'ai-innovation' },
  { id: 'developer-tools', label: 'Developer Tools', slug: 'developer-tools' },
  { id: 'opinions', label: 'Opinions', slug: 'opinions' },
  { id: 'brand-press', label: 'Brand Press', slug: 'brand-press' }
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
