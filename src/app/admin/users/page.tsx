'use client';

import { useState, useEffect } from 'react';
import apiService from '@/lib/apiService';
import AdminLayout from '@/components/admin/AdminLayout';
import { withAuth, useAuth } from '@/contexts/AuthContext';
import { User, UserRole } from '@/types/admin';
import { useInvitation } from '@/hooks/useInvitation';
import { 
  UsersIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { Input, Dropdown, Button, Card, CardContent, DataTable, DataTableRow, Badge, Alert, Spinner, Modal, Textarea } from '@/components/ui';

function UserManager() {
  const { firebaseUser } = useAuth();
  const { inviteUser: inviteUserApi, loading: inviteLoading, error: inviteError } = useInvitation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    name: '',
    role: 'viewer' as UserRole,
    message: '',
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await apiService.getUsers({ limit: 100 });
        const formattedUsers = usersData.map((user: any) => ({
          uid: user.uid || user.id,
          ...user
        } as User));
        
        setUsers(formattedUsers);
        setFilteredUsers(formattedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'super_admin', label: 'Super Admin', description: 'Full system access' },
    { value: 'editor', label: 'Editor', description: 'Can edit and publish content' },
    { value: 'author', label: 'Author', description: 'Can create and edit own content' },
    { value: 'reviewer', label: 'Reviewer', description: 'Can review and publish content' },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
  ];

  const inviteRoleOptions = [
    { value: 'super_admin', label: 'Super Admin', description: 'Full system access' },
    { value: 'editor', label: 'Editor', description: 'Can edit and publish content' },
    { value: 'author', label: 'Author', description: 'Can create and edit own content' },
    { value: 'reviewer', label: 'Reviewer', description: 'Can review and publish content' },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
  ];

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'red';
      case 'editor': return 'blue';
      case 'author': return 'green';
      case 'reviewer': return 'yellow';
      case 'viewer': return 'gray';
      default: return 'gray';
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await apiService.updateUserRole(userId, newRole);
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.uid === userId ? { ...user, role: newRole } : user
      ));
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteUser(userId);
      setUsers(prev => prev.filter(user => user.uid !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteFormData.email || !inviteFormData.name) {
      alert('Please fill in all required fields');
      return;
    }

    if (!firebaseUser) {
      alert('You must be logged in to invite users');
      return;
    }

    try {
      // Check if user already exists
      const existingUser = users.find(user => user.email === inviteFormData.email);
      if (existingUser) {
        alert('A user with this email already exists');
        return;
      }

      // Get auth token
      const token = await firebaseUser.getIdToken();

      // Call the invite API endpoint
      await inviteUserApi(
        {
          email: inviteFormData.email,
          name: inviteFormData.name,
          role: inviteFormData.role,
        },
        token
      );

      // Reset form and close modal
      setInviteFormData({
        email: '',
        name: '',
        role: 'viewer',
        message: '',
      });
      setShowInviteModal(false);
      
      alert('Invitation sent successfully!');
      
      // Refresh users list
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({ 
        uid: doc.id, 
        ...doc.data() 
      } as User));
      setUsers(usersData);
    } catch (error) {
      console.error('Error sending invitation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invitation';
      alert(errorMessage || 'Failed to send invitation');
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
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage user accounts and permissions
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              onClick={() => setShowInviteModal(true)}
              variant="primary"
              leftIcon={<UserPlusIcon className="h-4 w-4" />}
            >
              Invite User
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Search */}
            <Input
              label="Search"
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<MagnifyingGlassIcon />}
              variant="filled"
            />

            {/* Role Filter */}
            <Dropdown
              label="Role"
              options={roleOptions}
              value={roleFilter}
              onChange={(value) => setRoleFilter(value as UserRole | 'all')}
              placeholder="Filter by role..."
            />

            {/* Results Count */}
            <div className="flex items-end">
              <div className="text-sm text-gray-500">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <li key={user.uid}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {user.name}
                          </p>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getRoleColor(user.role)}-100 text-${getRoleColor(user.role)}-800`}>
                            {user.role.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <p>{user.email}</p>
                        </div>
                        <div className="mt-1 flex items-center text-xs text-gray-400">
                          <p>
                            Last seen: {new Date(user.lastSeen).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Dropdown
                        options={inviteRoleOptions}
                        value={user.role}
                        onChange={(value) => handleRoleChange(user.uid, value as UserRole)}
                        className="min-w-[140px]"
                        size="sm"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.uid)}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete User"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || roleFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No users have been added yet.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Role Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {roleOptions.slice(1).map((role) => {
            const count = users.filter(u => u.role === role.value).length;
            return (
              <div key={role.value} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`p-3 rounded-md bg-${getRoleColor(role.value as UserRole)}-500`}>
                        <UsersIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {role.label}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {count}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Invite User Modal */}
        <Modal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          title="Invite New User"
        >
          <form onSubmit={handleInviteUser} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Email Address"
                type="email"
                placeholder="user@example.com"
                value={inviteFormData.email}
                onChange={(e) => setInviteFormData(prev => ({ ...prev, email: e.target.value }))}
                isRequired
                helperText="The email address to send the invitation to"
              />
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={inviteFormData.name}
                onChange={(e) => setInviteFormData(prev => ({ ...prev, name: e.target.value }))}
                isRequired
                helperText="The full name of the person being invited"
              />
            </div>
            
            <Dropdown
              label="Role"
              value={inviteFormData.role}
              onChange={(value) => setInviteFormData(prev => ({ ...prev, role: value as UserRole }))}
              options={inviteRoleOptions}
              helperText="Select the role for the new user"
            />
            
            <Textarea
              label="Personal Message (Optional)"
              placeholder="Welcome to our team! We're excited to have you join us..."
              value={inviteFormData.message}
              onChange={(e) => setInviteFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
              helperText="Add a personal message to include in the invitation email"
            />
            
            {inviteError && (
              <Alert variant="danger" className="mt-2">
                {inviteError}
              </Alert>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInviteModal(false)}
                disabled={inviteLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={inviteLoading}
              >
                Send Invitation
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}

export default withAuth(UserManager, 'manage_users');
