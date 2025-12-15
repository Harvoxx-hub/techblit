'use client';

import { useState, useEffect, useRef } from 'react';
import apiService from '@/lib/apiService';
import AdminLayout from '@/components/admin/AdminLayout';
import { withAuth, useAuth } from '@/contexts/AuthContext';
import { Media } from '@/types/admin';
import { 
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { Input, Button, Card, CardContent, Alert, Spinner } from '@/components/ui';

function MediaLibrary() {
  const { user } = useAuth();
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMedia, setFilteredMedia] = useState<Media[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const mediaData = await apiService.getMedia();
        setMedia(mediaData as Media[]);
        setFilteredMedia(mediaData as Media[]);
      } catch (error) {
        console.error('Error fetching media:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, []);

  useEffect(() => {
    let filtered = media;

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.alt.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMedia(filtered);
  }, [media, searchTerm]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Upload via API
        await apiService.uploadMedia(file);
      }
      
      // Refresh media list
      const mediaData = await apiService.getMedia();
      setMedia(mediaData as Media[]);
      setFilteredMedia(mediaData as Media[]);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaId: string, storagePath: string) => {
    if (!confirm('Are you sure you want to delete this media file?')) {
      return;
    }

    try {
      // Delete via API (handles storage and database)
      await apiService.deleteMedia(mediaId);
      
      // Update local state
      setMedia(prev => prev.filter(item => item.id !== mediaId));
      setFilteredMedia(prev => prev.filter(item => item.id !== mediaId));
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Failed to delete media file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage images and media files
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                  Upload Media
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="max-w-md">
            <Input
              label="Search Media"
              type="text"
              placeholder="Search by filename or alt text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<MagnifyingGlassIcon />}
              variant="filled"
            />
          </div>
        </div>

        {/* Media Grid */}
        <div className="bg-white shadow rounded-lg p-6">
          {filteredMedia.length === 0 ? (
            <div className="text-center py-12">
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No media files</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? 'No media files match your search.'
                  : 'Get started by uploading some images.'
                }
              </p>
              <div className="mt-6">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Upload Media
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredMedia.map((item) => (
                <div key={item.id} className="group relative">
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={item.url}
                      alt={item.alt}
                      className="w-full h-full object-cover group-hover:opacity-75"
                    />
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(item.fileSize)} • {item.mimeType}
                    </p>
                    {item.alt && (
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        Alt: {item.alt}
                      </p>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDeleteMedia(item.id, item.storagePath)}
                      className="bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Media Statistics</h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{media.length}</div>
              <div className="text-sm text-gray-500">Total Files</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {formatFileSize(media.reduce((sum, item) => sum + item.fileSize, 0))}
              </div>
              <div className="text-sm text-gray-500">Total Size</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {media.filter(item => item.mimeType.startsWith('image/')).length}
              </div>
              <div className="text-sm text-gray-500">Images</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(MediaLibrary, 'upload_media');
