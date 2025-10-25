'use client';

import { useState } from 'react';
import { EyeIcon, DocumentTextIcon, DevicePhoneMobileIcon, ComputerDesktopIcon, DeviceTabletIcon, LinkIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { usePreviewToken } from '@/hooks/usePreviewToken';

interface PreviewProps {
  title: string;
  content: string;
  metaDescription: string;
  slug: string;
  author?: string | { uid: string; name: string };
  createdAt?: Date;
  featuredImage?: string;
  postId?: string; // Add postId for generating preview links
  status?: string; // Add status to determine if preview link should be available
}

type PreviewMode = 'desktop' | 'tablet' | 'mobile';

export default function Preview({
  title,
  content,
  metaDescription,
  slug,
  author,
  createdAt,
  featuredImage,
  postId,
  status
}: PreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [previewLink, setPreviewLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  
  const { generatePreviewToken, loading: tokenLoading, error: tokenError } = usePreviewToken();

  const getAuthorName = () => {
    if (!author) return 'Unknown Author';
    return typeof author === 'string' ? author : author.name;
  };

  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'mobile': return 'w-80';
      case 'tablet': return 'w-96';
      case 'desktop': return 'w-full';
      default: return 'w-full';
    }
  };

  const getPreviewHeight = () => {
    switch (previewMode) {
      case 'mobile': return 'h-[600px]';
      case 'tablet': return 'h-[700px]';
      case 'desktop': return 'h-[800px]';
      default: return 'h-[800px]';
    }
  };

  const handleGeneratePreviewLink = async () => {
    if (!postId) return;
    
    const tokenData = await generatePreviewToken(postId, 24); // 24 hours
    if (tokenData) {
      setPreviewLink(tokenData.previewUrl);
    }
  };

  const handleCopyLink = async () => {
    if (!previewLink) return;
    
    try {
      await navigator.clipboard.writeText(previewLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const canGeneratePreviewLink = postId && status && ['draft', 'in_review', 'scheduled'].includes(status);

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        leftIcon={<EyeIcon />}
      >
        Preview
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <style jsx global>{`
        .preview-content {
          color: #000000 !important;
        }
        .preview-content h1 {
          color: #000000 !important;
          font-size: 2rem !important;
          font-weight: 700 !important;
          margin: 1.5rem 0 1rem 0 !important;
          line-height: 1.2 !important;
        }
        .preview-content h2 {
          color: #000000 !important;
          font-size: 1.5rem !important;
          font-weight: 600 !important;
          margin: 1.25rem 0 0.75rem 0 !important;
          line-height: 1.3 !important;
        }
        .preview-content h3 {
          color: #000000 !important;
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          margin: 1rem 0 0.5rem 0 !important;
          line-height: 1.4 !important;
        }
        .preview-content h4 {
          color: #000000 !important;
          font-size: 1.125rem !important;
          font-weight: 600 !important;
          margin: 0.875rem 0 0.5rem 0 !important;
          line-height: 1.4 !important;
        }
        .preview-content h5 {
          color: #000000 !important;
          font-size: 1rem !important;
          font-weight: 600 !important;
          margin: 0.75rem 0 0.5rem 0 !important;
          line-height: 1.5 !important;
        }
        .preview-content h6 {
          color: #000000 !important;
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          margin: 0.75rem 0 0.5rem 0 !important;
          line-height: 1.5 !important;
        }
        .preview-content p {
          color: #000000 !important;
        }
        .preview-content li {
          color: #000000 !important;
        }
        .preview-content strong {
          color: #000000 !important;
        }
        .preview-content em {
          color: #000000 !important;
        }
        .preview-content blockquote {
          color: #000000 !important;
        }
        .preview-content code {
          color: #000000 !important;
        }
        .preview-content td,
        .preview-content th {
          color: #000000 !important;
        }
      `}</style>
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <EyeIcon className="h-6 w-6 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Device Mode Toggle */}
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 ${previewMode === 'desktop' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                title="Desktop"
              >
                <ComputerDesktopIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPreviewMode('tablet')}
                className={`p-2 ${previewMode === 'tablet' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                title="Tablet"
              >
                <DeviceTabletIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 ${previewMode === 'mobile' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                title="Mobile"
              >
                <DevicePhoneMobileIcon className="h-4 w-4" />
              </button>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>

        {/* Preview Link Generation */}
        {canGeneratePreviewLink && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Share Preview Link</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Generate a time-limited preview link to share this draft with others
                </p>
                
                {previewLink ? (
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 p-2 bg-white border border-gray-300 rounded text-sm font-mono text-gray-600 truncate">
                      {previewLink}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      leftIcon={<ClipboardDocumentIcon />}
                    >
                      {linkCopied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    {tokenError && (
                      <p className="text-xs text-red-600 mb-2">{tokenError}</p>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleGeneratePreviewLink}
                      loading={tokenLoading}
                      leftIcon={<LinkIcon />}
                    >
                      Generate Preview Link
                    </Button>
                    <span className="text-xs text-gray-500">
                      (Expires in 24 hours)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Preview Content */}
        <div className="flex-1 overflow-auto">
          <div className={`mx-auto ${getPreviewWidth()} ${getPreviewHeight()} overflow-auto border border-gray-300 bg-white`}>
            {/* Mock Browser Header */}
            <div className="bg-gray-100 border-b border-gray-300 p-2 flex items-center">
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white rounded px-3 py-1 text-sm text-gray-600">
                  https://techblit.com/{slug}
                </div>
              </div>
            </div>

            {/* Article Content */}
            <article className="p-6">
              {/* Featured Image */}
              {featuredImage && (
                <div className="mb-6">
                  <img
                    src={featuredImage}
                    alt={title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {title || 'Untitled Post'}
              </h1>

              {/* Meta Information */}
              <div className="flex items-center text-sm text-gray-500 mb-6">
                <DocumentTextIcon className="h-4 w-4 mr-1" />
                <span className="mr-4">by {getAuthorName()}</span>
                <span>{createdAt ? createdAt.toLocaleDateString() : 'Today'}</span>
              </div>

              {/* Content */}
              <div 
                className="prose prose-lg max-w-none preview-content"
                dangerouslySetInnerHTML={{ __html: content || '<p>No content yet...</p>' }}
              />

              {/* Meta Description Preview */}
              {metaDescription && (
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Search Preview:</h3>
                  <div className="text-sm">
                    <div className="text-blue-600 hover:underline cursor-pointer">
                      {title || 'Untitled Post'}
                    </div>
                    <div className="text-green-600 text-xs">
                      https://techblit.com/{slug}
                    </div>
                    <div className="text-gray-600 mt-1">
                      {metaDescription}
                    </div>
                  </div>
                </div>
              )}
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
