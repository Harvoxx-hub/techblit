'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AdminLayout from '@/components/admin/AdminLayout';
import { withAuth, useAuth } from '@/contexts/AuthContext';
import { Redirect, RedirectType } from '@/types/admin';
import { 
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Input, Textarea, Dropdown, Checkbox, Button, Card, CardContent } from '@/components/ui';

function RedirectManager() {
  const { user } = useAuth();
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    type: 301 as RedirectType,
    active: true,
    notes: '',
  });

  useEffect(() => {
    const fetchRedirects = async () => {
      try {
        const redirectsSnapshot = await getDocs(collection(db, 'redirects'));
        const redirectsData = redirectsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Redirect));
        
        setRedirects(redirectsData);
      } catch (error) {
        console.error('Error fetching redirects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRedirects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.from || !formData.to) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingId) {
        // Update existing redirect
        await updateDoc(doc(db, 'redirects', editingId), {
          ...formData,
          updatedAt: new Date(),
        });
        
        setRedirects(prev => prev.map(redirect => 
          redirect.id === editingId 
            ? { ...redirect, ...formData }
            : redirect
        ));
      } else {
        // Add new redirect
        const newRedirect = {
          ...formData,
          createdBy: user?.uid || 'unknown',
          createdAt: new Date(),
        };
        
        const docRef = await addDoc(collection(db, 'redirects'), newRedirect);
        setRedirects(prev => [...prev, { id: docRef.id, ...newRedirect }]);
      }
      
      // Reset form
      setFormData({
        from: '',
        to: '',
        type: 301,
        active: true,
        notes: '',
      });
      setShowAddForm(false);
      setEditingId(null);
    } catch (error) {
      console.error('Error saving redirect:', error);
      alert('Failed to save redirect');
    }
  };

  const handleEdit = (redirect: Redirect) => {
    setFormData({
      from: redirect.from,
      to: redirect.to,
      type: redirect.type,
      active: redirect.active,
      notes: redirect.notes || '',
    });
    setEditingId(redirect.id);
    setShowAddForm(true);
  };

  const handleDelete = async (redirectId: string) => {
    if (!confirm('Are you sure you want to delete this redirect?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'redirects', redirectId));
      setRedirects(prev => prev.filter(redirect => redirect.id !== redirectId));
    } catch (error) {
      console.error('Error deleting redirect:', error);
      alert('Failed to delete redirect');
    }
  };

  const handleToggleActive = async (redirectId: string, currentActive: boolean) => {
    try {
      await updateDoc(doc(db, 'redirects', redirectId), {
        active: !currentActive,
        updatedAt: new Date(),
      });
      
      setRedirects(prev => prev.map(redirect => 
        redirect.id === redirectId 
          ? { ...redirect, active: !currentActive }
          : redirect
      ));
    } catch (error) {
      console.error('Error updating redirect:', error);
      alert('Failed to update redirect');
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Redirects</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage URL redirects and routing
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              onClick={() => {
                setShowAddForm(true);
                setEditingId(null);
                setFormData({
                  from: '',
                  to: '',
                  type: 301,
                  active: true,
                  notes: '',
                });
              }}
              variant="primary"
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              Add Redirect
            </Button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingId ? 'Edit Redirect' : 'Add New Redirect'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="From URL"
                    placeholder="/old-url"
                    value={formData.from}
                    onChange={(e) => setFormData(prev => ({ ...prev, from: e.target.value }))}
                    isRequired
                    helperText="The URL path to redirect from"
                  />
                  <Input
                    label="To URL"
                    placeholder="/new-url or https://example.com"
                    value={formData.to}
                    onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                    isRequired
                    helperText="The destination URL to redirect to"
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Dropdown
                    label="Redirect Type"
                    value={formData.type.toString()}
                    onChange={(value) => setFormData(prev => ({ ...prev, type: parseInt(value) as RedirectType }))}
                    options={[
                      { value: '301', label: '301 - Permanent Redirect', description: 'Search engines will update their indexes' },
                      { value: '302', label: '302 - Temporary Redirect', description: 'Temporary redirect, search engines keep original URL' }
                    ]}
                    helperText="Choose the appropriate redirect type"
                  />
                  <div className="flex items-center pt-6">
                    <Checkbox
                      label="Active"
                      checked={formData.active}
                      onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    />
                  </div>
                </div>
                
                <Textarea
                  label="Notes"
                  placeholder="Optional notes about this redirect..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  helperText="Add any additional context or notes about this redirect"
                />
                
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingId(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                  >
                    {editingId ? 'Update Redirect' : 'Add Redirect'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Redirects Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {redirects.length === 0 ? (
            <div className="text-center py-12">
              <ArrowPathIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No redirects</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first redirect.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {redirects.map((redirect) => (
                <li key={redirect.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`h-2 w-2 rounded-full ${redirect.active ? 'bg-green-400' : 'bg-gray-400'}`} />
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {redirect.from}
                            </p>
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {redirect.type}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <ArrowPathIcon className="h-4 w-4 mr-1" />
                            <p>{redirect.to}</p>
                          </div>
                          {redirect.notes && (
                            <div className="mt-1 text-xs text-gray-400">
                              {redirect.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(redirect.id, redirect.active)}
                          className={redirect.active ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}
                          title={redirect.active ? 'Deactivate' : 'Activate'}
                        >
                          {redirect.active ? (
                            <CheckCircleIcon className="h-5 w-5" />
                          ) : (
                            <XCircleIcon className="h-5 w-5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(redirect)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(redirect.id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-md bg-blue-500">
                    <ArrowPathIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Redirects
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {redirects.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-md bg-green-500">
                    <CheckCircleIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Redirects
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {redirects.filter(r => r.active).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-md bg-gray-500">
                    <XCircleIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Inactive Redirects
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {redirects.filter(r => !r.active).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(RedirectManager, 'manage_redirects');
