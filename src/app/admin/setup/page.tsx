'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserRole } from '@/types/admin';

export default function UserSetup() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const demoUsers = [
    {
      email: 'admin@techblit.com',
      password: 'admin123',
      name: 'Super Admin',
      role: 'super_admin' as UserRole,
    },
    {
      email: 'editor@techblit.com',
      password: 'editor123',
      name: 'Editor User',
      role: 'editor' as UserRole,
    },
    {
      email: 'author@techblit.com',
      password: 'author123',
      name: 'Author User',
      role: 'author' as UserRole,
    },
  ];

  const createDemoUsers = async () => {
    setLoading(true);
    setMessage('');

    try {
      for (const userData of demoUsers) {
        try {
          // Create user in Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            userData.email,
            userData.password
          );

          // Create user document in Firestore
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            name: userData.name,
            email: userData.email,
            role: userData.role,
            createdAt: new Date(),
            lastSeen: new Date(),
            permissions: [],
            isActive: true,
          });

          console.log(`Created user: ${userData.email}`);
        } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
            console.log(`User ${userData.email} already exists, skipping...`);
          } else {
            console.error(`Error creating user ${userData.email}:`, error);
          }
        }
      }

      setMessage('✅ Demo users created successfully! You can now log in.');
    } catch (error: any) {
      console.error('Error creating demo users:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Setup Demo Users
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create demo user accounts for testing the admin dashboard
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Demo Users</h3>
          <div className="space-y-3">
            {demoUsers.map((user) => (
              <div key={user.email} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  <div className="text-xs text-gray-400 capitalize">{user.role.replace('_', ' ')}</div>
                </div>
                <div className="text-sm text-gray-500">{user.password}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <button
            onClick={createDemoUsers}
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Users...
              </>
            ) : (
              'Create Demo Users'
            )}
          </button>
        </div>

        {message && (
          <div className={`rounded-md p-4 ${
            message.startsWith('✅') 
              ? 'bg-green-50 text-green-800' 
              : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="text-center">
          <a
            href="/admin/login"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            ← Back to Login
          </a>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            ⚠️ Firebase Setup Required
          </h3>
          <div className="text-sm text-yellow-700">
            <p className="mb-2">Before creating users, make sure:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Firebase Authentication is enabled</li>
              <li>Email/Password provider is enabled</li>
              <li>Firestore security rules are updated</li>
            </ul>
            <p className="mt-2">
              Run: <code className="bg-yellow-100 px-1 rounded">./setup-firebase-auth.sh</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
