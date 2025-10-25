'use client';

import { useState } from 'react';
import { LinkIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Input, Button, Card, CardContent } from '@/components/ui';

interface CanonicalUrlManagerProps {
  value?: string;
  onChange: (canonical: string) => void;
  slug: string;
  siteUrl?: string;
}

export default function CanonicalUrlManager({
  value = '',
  onChange,
  slug,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techblit.com'
}: CanonicalUrlManagerProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
  } | null>(null);

  const defaultCanonical = `${siteUrl}/${slug}`;

  const validateUrl = (url: string) => {
    if (!url) {
      setValidationResult({
        isValid: true,
        message: 'No canonical URL set - will use default post URL',
        type: 'info'
      });
      return;
    }

    try {
      const canonicalUrl = new URL(url);
      const siteUrlObj = new URL(siteUrl);
      
      if (canonicalUrl.hostname === siteUrlObj.hostname) {
        setValidationResult({
          isValid: true,
          message: 'Canonical URL is properly set',
          type: 'success'
        });
      } else {
        setValidationResult({
          isValid: false,
          message: 'Canonical URL points to external domain - ensure this is intentional',
          type: 'warning'
        });
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        message: 'Canonical URL is invalid - please check the format',
        type: 'error'
      });
    }
  };

  const handleUrlChange = (newUrl: string) => {
    onChange(newUrl);
    validateUrl(newUrl);
  };

  const handleValidate = async () => {
    setIsValidating(true);
    
    // Simulate URL validation (in a real app, you might ping the URL)
    setTimeout(() => {
      validateUrl(value);
      setIsValidating(false);
    }, 1000);
  };

  const handleResetToDefault = () => {
    handleUrlChange(defaultCanonical);
  };

  const getValidationIcon = () => {
    if (!validationResult) return null;
    
    switch (validationResult.type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getValidationColor = () => {
    if (!validationResult) return '';
    
    switch (validationResult.type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <LinkIcon className="h-5 w-5 mr-2" />
          Canonical URL Management
        </h3>
        
        <div className="space-y-4">
          <div>
            <Input
              label="Canonical URL"
              type="url"
              value={value}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder={defaultCanonical}
              variant="filled"
              helperText="The canonical URL for this post. Leave empty to use the default post URL."
              leftIcon={<LinkIcon />}
            />
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleValidate}
              loading={isValidating}
              variant="secondary"
              size="sm"
            >
              Validate URL
            </Button>
            
            <Button
              onClick={handleResetToDefault}
              variant="secondary"
              size="sm"
            >
              Reset to Default
            </Button>
          </div>

          {validationResult && (
            <div className={`p-3 rounded-lg border ${getValidationColor()}`}>
              <div className="flex items-start">
                {getValidationIcon()}
                <p className="ml-2 text-sm">{validationResult.message}</p>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium mb-2">About Canonical URLs:</h4>
            <ul className="space-y-1 text-xs">
              <li>• Canonical URLs help search engines understand which version of a page is the "official" one</li>
              <li>• Use when you have duplicate content or want to consolidate page authority</li>
              <li>• Default: <code className="bg-gray-200 px-1 rounded">{defaultCanonical}</code></li>
              <li>• External canonical URLs should be used carefully and only when necessary</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
