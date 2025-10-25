'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AdminLayout from '@/components/admin/AdminLayout';
import { withAuth } from '@/contexts/AuthContext';
import { SiteSettings } from '@/types/admin';
import { useSearchConsole } from '@/hooks/useSearchConsole';
import { 
  CogIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  ClockIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  PhotoIcon,
  DocumentTextIcon,
  EyeIcon,
  DocumentIcon,
  CloudIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { Input, Textarea, Button, Card, CardContent, Dropdown, Alert, Spinner, Checkbox } from '@/components/ui';

function SettingsManager() {
  const [settings, setSettings] = useState<SiteSettings>({
    siteTitle: 'TechBlit',
    siteDescription: 'A modern tech blog built with Next.js and Firebase',
    defaultOG: {
      title: 'TechBlit - Your Tech Blog',
      description: 'A modern tech blog built with Next.js and Firebase',
      image: '',
    },
    analyticsId: '',
    searchConsoleVerification: '',
    timezone: 'UTC',
    maintenanceMode: false,
    customRobotsTxt: '',
    searchConsoleProperty: '',
    indexingStatus: {
      lastChecked: new Date(),
      indexedPages: 0,
      crawlErrors: 0,
      sitemapStatus: 'pending',
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Use Search Console hook
  const { data: searchConsoleData, refreshIndexingStatus, submitSitemap } = useSearchConsole(settings.searchConsoleProperty);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'site'));
        if (settingsDoc.exists()) {
          const settingsData = settingsDoc.data() as SiteSettings;
          setSettings(settingsData);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      await setDoc(doc(db, 'settings', 'site'), {
        ...settings,
        updatedAt: new Date(),
      });
      setMessage('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof SiteSettings] as any),
          [child]: value,
        },
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Spinner size="lg" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-4">Loading Settings...</h1>
            <p className="text-gray-600">Please wait while we load your site settings.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure site settings and preferences
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              onClick={handleSave}
              loading={saving}
              variant="primary"
              leftIcon={<CheckCircleIcon />}
            >
              Save Settings
            </Button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <Alert variant={message.includes('successfully') ? 'success' : 'danger'}>
            {message}
          </Alert>
        )}

        {/* General Settings */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Site Title"
                type="text"
                value={settings.siteTitle}
                onChange={(e) => handleInputChange('siteTitle', e.target.value)}
                variant="filled"
                helperText="The name of your website"
                leftIcon={<GlobeAltIcon />}
              />
              
              <Dropdown
                label="Timezone"
                options={[
                  { value: 'UTC', label: 'UTC', description: 'Coordinated Universal Time' },
                  { value: 'America/New_York', label: 'Eastern Time', description: 'EST/EDT' },
                  { value: 'America/Chicago', label: 'Central Time', description: 'CST/CDT' },
                  { value: 'America/Denver', label: 'Mountain Time', description: 'MST/MDT' },
                  { value: 'America/Los_Angeles', label: 'Pacific Time', description: 'PST/PDT' },
                  { value: 'Europe/London', label: 'London', description: 'GMT/BST' },
                  { value: 'Europe/Paris', label: 'Paris', description: 'CET/CEST' },
                  { value: 'Asia/Tokyo', label: 'Tokyo', description: 'JST' },
                ]}
                value={settings.timezone}
                onChange={(value) => handleInputChange('timezone', value)}
                placeholder="Select timezone"
                searchable={true}
                clearable={false}
                leftIcon={<ClockIcon />}
              />
            </div>
            
            <div className="mt-6">
              <Textarea
                label="Site Description"
                value={settings.siteDescription}
                onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                variant="filled"
                rows={3}
                helperText="A brief description of your website for SEO"
                showCharacterCount
                maxLength={160}
              />
            </div>
          </CardContent>
        </Card>

        {/* SEO Settings */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Settings</h3>
            <div className="space-y-6">
              <Input
                label="Default Open Graph Title"
                type="text"
                value={settings.defaultOG.title}
                onChange={(e) => handleInputChange('defaultOG.title', e.target.value)}
                variant="filled"
                helperText="The title that appears when your site is shared on social media"
                leftIcon={<LinkIcon />}
                showCharacterCount
                maxLength={60}
              />
              
              <Textarea
                label="Default Open Graph Description"
                value={settings.defaultOG.description}
                onChange={(e) => handleInputChange('defaultOG.description', e.target.value)}
                variant="filled"
                rows={3}
                helperText="The description that appears when your site is shared on social media"
                showCharacterCount
                maxLength={160}
              />
              
              <Input
                label="Default Open Graph Image URL"
                type="url"
                value={settings.defaultOG.image}
                onChange={(e) => handleInputChange('defaultOG.image', e.target.value)}
                variant="filled"
                helperText="The image that appears when your site is shared on social media"
                leftIcon={<PhotoIcon />}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Analytics & Tracking */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Analytics & Tracking</h3>
            <div className="space-y-6">
              <Input
                label="Google Analytics ID"
                type="text"
                placeholder="G-XXXXXXXXXX"
                value={settings.analyticsId || ''}
                onChange={(e) => handleInputChange('analyticsId', e.target.value)}
                variant="filled"
                helperText="Your Google Analytics tracking ID (e.g., G-XXXXXXXXXX)"
                leftIcon={<ChartBarIcon />}
              />
              
              <Input
                label="Google Search Console Verification"
                type="text"
                placeholder="verification-code"
                value={settings.searchConsoleVerification || ''}
                onChange={(e) => handleInputChange('searchConsoleVerification', e.target.value)}
                variant="filled"
                helperText="Your Google Search Console verification code"
                leftIcon={<MagnifyingGlassIcon />}
              />

              <Input
                label="Search Console Property"
                type="text"
                placeholder="https://techblit.com"
                value={settings.searchConsoleProperty || ''}
                onChange={(e) => handleInputChange('searchConsoleProperty', e.target.value)}
                variant="filled"
                helperText="Your Search Console property URL for indexing status"
                leftIcon={<CloudIcon />}
              />
            </div>
          </CardContent>
        </Card>

        {/* SEO & Indexing Status */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">SEO & Indexing Status</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <DocumentIcon className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-900">Indexed Pages</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {searchConsoleData?.indexedPages || settings.indexingStatus?.indexedPages || 0}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <ExclamationCircleIcon className="h-8 w-8 text-red-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-900">Crawl Errors</p>
                      <p className="text-2xl font-bold text-red-600">
                        {searchConsoleData?.crawlErrors || settings.indexingStatus?.crawlErrors || 0}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-900">Sitemap Status</p>
                      <p className="text-sm font-bold text-green-600 capitalize">
                        {searchConsoleData?.sitemapStatus || settings.indexingStatus?.sitemapStatus || 'pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <Button
                  onClick={async () => {
                    try {
                      await refreshIndexingStatus();
                      setMessage('Indexing status refreshed successfully!');
                    } catch (error) {
                      setMessage('Failed to refresh indexing status');
                    }
                  }}
                  variant="secondary"
                  leftIcon={<MagnifyingGlassIcon />}
                >
                  Refresh Indexing Status
                </Button>
                
                <Button
                  onClick={async () => {
                    try {
                      const result = await submitSitemap();
                      if (result.success) {
                        setMessage(result.message);
                      } else {
                        setMessage(`Failed to submit sitemap: ${result.message}`);
                      }
                    } catch (error) {
                      setMessage('Failed to submit sitemap');
                    }
                  }}
                  variant="secondary"
                  leftIcon={<DocumentIcon />}
                >
                  Submit Sitemap
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Robots.txt Management */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Robots.txt Management</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Custom Robots.txt</h4>
                  <p className="text-sm text-gray-500">
                    Customize your robots.txt file to control search engine crawling
                  </p>
                </div>
                <Button
                  onClick={() => {
                    // Reset to default robots.txt
                    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techblit.com';
                    const defaultRobots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /preview/

Host: ${siteUrl}

Sitemap: ${siteUrl}/sitemap.xml`;
                    handleInputChange('customRobotsTxt', defaultRobots);
                  }}
                  variant="secondary"
                  size="sm"
                >
                  Reset to Default
                </Button>
              </div>
              
              <Textarea
                label="Robots.txt Content"
                value={settings.customRobotsTxt || ''}
                onChange={(e) => handleInputChange('customRobotsTxt', e.target.value)}
                variant="filled"
                rows={8}
                helperText="Enter your custom robots.txt content. Leave empty to use default."
                placeholder="User-agent: *&#10;Allow: /&#10;Disallow: /admin/&#10;&#10;Sitemap: https://techblit.com/sitemap.xml"
              />
              
              <div className="flex space-x-4">
                <Button
                  onClick={() => {
                    // Preview robots.txt
                    const previewWindow = window.open('', '_blank');
                    if (previewWindow) {
                      previewWindow.document.write(`
                        <html>
                          <head><title>Robots.txt Preview</title></head>
                          <body>
                            <h1>Robots.txt Preview</h1>
                            <pre style="background: #f5f5f5; padding: 20px; border-radius: 8px; white-space: pre-wrap;">${settings.customRobotsTxt || 'No custom robots.txt set'}</pre>
                          </body>
                        </html>
                      `);
                    }
                  }}
                  variant="secondary"
                  leftIcon={<EyeIcon />}
                >
                  Preview
                </Button>
                
                <Button
                  onClick={() => {
                    // Test robots.txt
                    window.open('/robots.txt', '_blank');
                  }}
                  variant="secondary"
                  leftIcon={<DocumentIcon />}
                >
                  View Live
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Mode */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Maintenance Mode</h3>
            <div className="space-y-4">
              <Checkbox
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)}
                label="Enable maintenance mode"
                helperText="When enabled, the site will show a maintenance page to all visitors except administrators."
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-red-800">Reset All Settings</h4>
              <p className="text-sm text-red-700">
                This will reset all settings to their default values. This action cannot be undone.
              </p>
              <Button
                onClick={() => {
                  if (confirm('Are you sure you want to reset all settings? This cannot be undone.')) {
                    setSettings({
                      siteTitle: 'TechBlit',
                      siteDescription: 'A modern tech blog built with Next.js and Firebase',
                      defaultOG: {
                        title: 'TechBlit - Your Tech Blog',
                        description: 'A modern tech blog built with Next.js and Firebase',
                        image: '',
                      },
                      analyticsId: '',
                      searchConsoleVerification: '',
                      timezone: 'UTC',
                      maintenanceMode: false,
                      customRobotsTxt: '',
                      searchConsoleProperty: '',
                      indexingStatus: {
                        lastChecked: new Date(),
                        indexedPages: 0,
                        crawlErrors: 0,
                        sitemapStatus: 'pending',
                      },
                    });
                  }
                }}
                variant="danger"
                size="sm"
                leftIcon={<ExclamationTriangleIcon />}
                className="mt-2"
              >
                Reset Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(SettingsManager, 'manage_settings');
