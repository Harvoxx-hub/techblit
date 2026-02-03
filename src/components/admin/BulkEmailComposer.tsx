'use client';

import { useState, useRef } from 'react';
import apiService from '@/lib/apiService';
import { Button, Input, Textarea, Card, CardContent, Alert, Badge } from '@/components/ui';
import {
  PaperClipIcon,
  UserPlusIcon,
  EyeIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface Recipient {
  email: string;
  name: string;
}

export default function BulkEmailComposer() {
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [inputMethod, setInputMethod] = useState<'csv' | 'manual'>('csv');
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{
    subject: string;
    htmlContent: string;
    textContent: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setCsvFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText: string) => {
    try {
      const lines = csvText.split('\n').filter(line => line.trim());
      const parsedRecipients: Recipient[] = [];

      // Check if first line is a header
      let startIndex = 0;
      const firstLine = lines[0]?.toLowerCase();
      if (firstLine?.includes('email') && firstLine?.includes('name')) {
        startIndex = 1;
      }

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];
        if (!line?.trim()) continue;

        // Handle quoted fields (e.g., "Smith, John")
        const parts: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            parts.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        parts.push(current.trim());

        if (parts.length >= 2) {
          const email = parts[0].replace(/^"|"$/g, '').trim();
          const name = parts[1].replace(/^"|"$/g, '').trim();

          // Basic email validation
          if (email && name && email.includes('@')) {
            parsedRecipients.push({ email, name });
          } else {
            setError(`Invalid format on line ${i + 1}: email and name are required`);
            return;
          }
        } else {
          setError(`Invalid format on line ${i + 1}: expected email,name`);
          return;
        }
      }

      if (parsedRecipients.length === 0) {
        setError('No valid recipients found in CSV file');
        return;
      }

      if (parsedRecipients.length > 10000) {
        setError('Maximum 10,000 recipients allowed per campaign');
        return;
      }

      setRecipients(parsedRecipients);
      setError(null);
    } catch (err) {
      setError('Error parsing CSV file. Please check the format.');
      console.error('CSV parsing error:', err);
    }
  };

  const addManualRecipient = () => {
    setRecipients([...recipients, { email: '', name: '' }]);
  };

  const updateRecipient = (index: number, field: 'email' | 'name', value: string) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handlePreview = async () => {
    if (!subject || !htmlContent) {
      setError('Subject and HTML content are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result: any = await apiService.previewBulkEmail({
        subject,
        htmlContent,
        textContent: textContent || undefined,
        sampleName: 'John Doe',
      });

      setPreviewData(result.data || result);
      setShowPreview(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!subject || !htmlContent) {
      setError('Subject and HTML content are required');
      return;
    }

    if (recipients.length === 0) {
      setError('Please add at least one recipient');
      return;
    }

    // Validate manual recipients
    if (inputMethod === 'manual') {
      const invalidRecipients = recipients.filter(
        (r) => !r.email || !r.name || !r.email.includes('@')
      );
      if (invalidRecipients.length > 0) {
        setError('Please fill in all recipient email addresses and names');
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: any = {
        subject,
        htmlContent,
      };

      if (textContent) {
        payload.textContent = textContent;
      }

      if (inputMethod === 'csv' && csvFile) {
        const csvText = await csvFile.text();
        payload.csvContent = csvText;
      } else {
        payload.recipients = recipients;
      }

      const result: any = await apiService.createBulkEmailCampaign(payload);
      const campaignId = result.data?.campaignId || result.campaignId;

      setSuccess(
        `Campaign created successfully! Campaign ID: ${campaignId}. Emails are being sent asynchronously.`
      );

      // Reset form
      setSubject('');
      setHtmlContent('');
      setTextContent('');
      setRecipients([]);
      setCsvFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <Alert variant="success" className="flex items-center space-x-2">
          <CheckCircleIcon className="h-5 w-5" />
          <span>{success}</span>
        </Alert>
      )}

      {error && (
        <Alert variant="danger">
          <p>{error}</p>
        </Alert>
      )}

      {/* Email Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowPreview(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Email Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Subject:</p>
                  <p className="text-gray-900">{previewData.subject}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">HTML Content:</p>
                  <div
                    className="border border-gray-300 rounded p-4 bg-gray-50"
                    dangerouslySetInnerHTML={{ __html: previewData.htmlContent }}
                  />
                </div>
                {previewData.textContent && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Plain Text:</p>
                    <div className="border border-gray-300 rounded p-4 bg-gray-50 whitespace-pre-wrap">
                      {previewData.textContent}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="space-y-4">
              <Input
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Welcome to TechBlit!"
                isRequired
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HTML Content <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder="<h1>Hello {{name}}!</h1><p>Welcome from TechBlit Team</p>"
                  rows={12}
                  helperText="Use {{name}} to personalize the email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plain Text Content (Optional)
                </label>
                <Textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Hello {{name}}! Welcome from TechBlit Team"
                  rows={6}
                  helperText="Plain text version for email clients that don't support HTML"
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  disabled={loading || !subject || !htmlContent}
                  leftIcon={<EyeIcon className="h-5 w-5" />}
                >
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recipients */}
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Recipients
                </label>

                {/* Input Method Toggle */}
                <div className="flex space-x-2 mb-4">
                  <button
                    onClick={() => {
                      setInputMethod('csv');
                      setRecipients([]);
                      setCsvFile(null);
                    }}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium ${
                      inputMethod === 'csv'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <PaperClipIcon className="h-4 w-4 inline mr-2" />
                    CSV Upload
                  </button>
                  <button
                    onClick={() => {
                      setInputMethod('manual');
                      setCsvFile(null);
                    }}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium ${
                      inputMethod === 'manual'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <UserPlusIcon className="h-4 w-4 inline mr-2" />
                    Manual Entry
                  </button>
                </div>

                {/* CSV Upload */}
                {inputMethod === 'csv' && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Format: email,name (CSV file with header row optional)
                    </p>
                    {csvFile && (
                      <div className="mt-2">
                        <Badge variant="success">
                          {recipients.length} recipient{recipients.length !== 1 ? 's' : ''} loaded
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Entry */}
                {inputMethod === 'manual' && (
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addManualRecipient}
                      leftIcon={<UserPlusIcon className="h-4 w-4" />}
                    >
                      Add Recipient
                    </Button>

                    {recipients.length > 0 && (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {recipients.map((recipient, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2 p-2 border border-gray-200 rounded"
                          >
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <Input
                                placeholder="email@example.com"
                                value={recipient.email}
                                onChange={(e) =>
                                  updateRecipient(index, 'email', e.target.value)
                                }
                                size="sm"
                              />
                              <Input
                                placeholder="Name"
                                value={recipient.name}
                                onChange={(e) =>
                                  updateRecipient(index, 'name', e.target.value)
                                }
                                size="sm"
                              />
                            </div>
                            <button
                              onClick={() => removeRecipient(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {recipients.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Click "Add Recipient" to start adding recipients manually
                      </p>
                    )}
                  </div>
                )}

                {recipients.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">
                        Total Recipients: <span className="text-blue-600">{recipients.length}</span>
                      </p>
                    </div>
                    
                    {/* Rate Limit Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <div className="flex items-start space-x-2">
                        <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-blue-900 mb-1">
                            Rate Limit: 2 emails/second (Resend Free Plan)
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-blue-700">
                            <ClockIcon className="h-4 w-4" />
                            <span>
                              Estimated time: ~{Math.ceil(recipients.length / 2)} seconds
                              {recipients.length > 100 && ` (${Math.ceil(recipients.length / 2 / 60)} minutes)`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {recipients.length >= 10000 && (
                      <p className="text-xs text-yellow-600 mt-1">
                        Maximum limit reached (10,000)
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Send Button */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleSend}
            disabled={loading || !subject || !htmlContent || recipients.length === 0}
            loading={loading}
            leftIcon={<PaperAirplaneIcon className="h-5 w-5" />}
            className="w-full"
          >
            Send Campaign
          </Button>
        </div>
      </div>
    </div>
  );
}
