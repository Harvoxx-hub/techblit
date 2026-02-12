'use client';

import { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  InformationCircleIcon,
  EyeIcon,
  DocumentTextIcon,
  LinkIcon,
  TagIcon
} from '@heroicons/react/24/outline';

interface SEOSuggestionsProps {
  title: string;
  metaTitle: string;
  metaDescription: string;
  content: string;
  slug: string;
  tags: string[];
  category: string;
  canonical?: string;
}

interface Suggestion {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  icon: React.ReactNode;
}

export default function SEOSuggestions({
  title,
  metaTitle,
  metaDescription,
  content,
  slug,
  tags,
  category,
  canonical
}: SEOSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    const newSuggestions: Suggestion[] = [];

    // Title suggestions
    if (!title) {
      newSuggestions.push({
        type: 'error',
        message: 'Post title is required',
        icon: <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      });
    } else if (title.length < 10) {
      newSuggestions.push({
        type: 'warning',
        message: 'Title is too short (minimum 10 characters)',
        icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      });
    } else if (title.length > 60) {
      newSuggestions.push({
        type: 'warning',
        message: 'Title is too long (maximum 60 characters)',
        icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      });
    } else {
      newSuggestions.push({
        type: 'success',
        message: 'Title length is optimal',
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />
      });
    }

    // Meta title suggestions
    if (!metaTitle) {
      newSuggestions.push({
        type: 'warning',
        message: 'Meta title is empty - will use post title',
        icon: <InformationCircleIcon className="h-5 w-5 text-blue-500" />
      });
    } else if (metaTitle.length < 30) {
      newSuggestions.push({
        type: 'warning',
        message: 'Meta title is too short (minimum 30 characters)',
        icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      });
    } else if (metaTitle.length > 60) {
      newSuggestions.push({
        type: 'warning',
        message: 'Meta title is too long (maximum 60 characters)',
        icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      });
    } else {
      newSuggestions.push({
        type: 'success',
        message: 'Meta title length is optimal',
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />
      });
    }

    // Meta description suggestions
    if (!metaDescription) {
      newSuggestions.push({
        type: 'warning',
        message: 'Meta description is empty',
        icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      });
    } else if (metaDescription.length < 120) {
      newSuggestions.push({
        type: 'warning',
        message: 'Meta description is too short (minimum 120 characters)',
        icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      });
    } else if (metaDescription.length > 160) {
      newSuggestions.push({
        type: 'warning',
        message: 'Meta description is too long (maximum 160 characters)',
        icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      });
    } else {
      newSuggestions.push({
        type: 'success',
        message: 'Meta description length is optimal',
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />
      });
    }

    // Content suggestions
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    if (wordCount < 300) {
      newSuggestions.push({
        type: 'warning',
        message: `Content is too short (${wordCount} words, minimum 300 recommended)`,
        icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      });
    } else if (wordCount > 2000) {
      newSuggestions.push({
        type: 'info',
        message: `Content is quite long (${wordCount} words) - consider breaking into sections`,
        icon: <InformationCircleIcon className="h-5 w-5 text-blue-500" />
      });
    } else {
      newSuggestions.push({
        type: 'success',
        message: `Content length is good (${wordCount} words)`,
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />
      });
    }

    // Slug suggestions
    if (!slug) {
      newSuggestions.push({
        type: 'error',
        message: 'URL slug is required',
        icon: <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      });
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      newSuggestions.push({
        type: 'warning',
        message: 'URL slug should only contain lowercase letters, numbers, and hyphens',
        icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      });
    } else {
      newSuggestions.push({
        type: 'success',
        message: 'URL slug format is correct',
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />
      });
    }

    // Tags suggestions
    if (tags.length === 0) {
      newSuggestions.push({
        type: 'warning',
        message: 'No tags added - consider adding relevant tags',
        icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      });
    } else if (tags.length > 10) {
      newSuggestions.push({
        type: 'info',
        message: 'Many tags added - consider focusing on the most relevant ones',
        icon: <InformationCircleIcon className="h-5 w-5 text-blue-500" />
      });
    } else {
      newSuggestions.push({
        type: 'success',
        message: `Good tag count (${tags.length} tags)`,
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />
      });
    }

    // Category suggestions
    if (!category) {
      newSuggestions.push({
        type: 'warning',
        message: 'No category selected - consider adding a category',
        icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      });
    } else {
      newSuggestions.push({
        type: 'success',
        message: `Category selected: ${category}`,
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />
      });
    }

    // Image suggestions
    const imageCount = (content.match(/<img/g) || []).length;
    if (imageCount === 0) {
      newSuggestions.push({
        type: 'info',
        message: 'Consider adding images to make your post more engaging',
        icon: <InformationCircleIcon className="h-5 w-5 text-blue-500" />
      });
    } else {
      newSuggestions.push({
        type: 'success',
        message: `Images included (${imageCount})`,
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />
      });
    }

    // Alt text suggestions
    const imagesWithoutAlt = (content.match(/<img(?!.*alt=)[^>]*>/g) || []).length;
    if (imagesWithoutAlt > 0) {
      newSuggestions.push({
        type: 'warning',
        message: `${imagesWithoutAlt} image(s) missing alt text - important for accessibility`,
        icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      });
    }

    // Heading structure suggestions
    const h1Count = (content.match(/<h1/g) || []).length;
    const h2Count = (content.match(/<h2/g) || []).length;
    if (h1Count === 0 && h2Count === 0) {
      newSuggestions.push({
        type: 'warning',
        message: 'No headings found - consider adding H2/H3 headings for better structure',
        icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      });
    } else {
      newSuggestions.push({
        type: 'success',
        message: 'Good heading structure',
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />
      });
    }

    // Canonical URL suggestions
    if (canonical) {
      try {
        const canonicalUrl = new URL(canonical);
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.techblit.com';
        
        if (canonicalUrl.hostname === new URL(siteUrl).hostname) {
          newSuggestions.push({
            type: 'success',
            message: 'Canonical URL is properly set',
            icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />
          });
        } else {
          newSuggestions.push({
            type: 'warning',
            message: 'Canonical URL points to external domain - ensure this is intentional',
            icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
          });
        }
      } catch (error) {
        newSuggestions.push({
          type: 'error',
          message: 'Canonical URL is invalid - please check the format',
          icon: <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
        });
      }
    } else {
      newSuggestions.push({
        type: 'info',
        message: 'No canonical URL set - will use default post URL',
        icon: <InformationCircleIcon className="h-5 w-5 text-blue-500" />
      });
    }

    setSuggestions(newSuggestions);
  }, [title, metaTitle, metaDescription, content, slug, tags, category, canonical]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeCount = (type: string) => suggestions.filter(s => s.type === type).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <EyeIcon className="h-5 w-5 mr-2" />
          SEO Suggestions
        </h3>
        <div className="flex gap-2 text-sm">
          <span className="text-green-600">{getTypeCount('success')} ✓</span>
          <span className="text-yellow-600">{getTypeCount('warning')} ⚠</span>
          <span className="text-red-600">{getTypeCount('error')} ✗</span>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${getTypeColor(suggestion.type)}`}
          >
            <div className="flex items-start">
              {suggestion.icon}
              <p className="ml-2 text-sm">{suggestion.message}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500 pt-2 border-t">
        <p>💡 <strong>Tip:</strong> Address warnings and errors to improve your post's SEO and accessibility.</p>
      </div>
    </div>
  );
}
