'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  getIdToken
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { User, UserRole, hasPermission } from '@/types/admin';
import apiService from '@/lib/apiService';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isAuthor: boolean;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Set auth token for API service
          const token = await firebaseUser.getIdToken();
          apiService.setAuthToken(token);
          
          // Fetch user data from API
          try {
            const userData = await apiService.getUserProfile() as any;
            setUser({
              uid: firebaseUser.uid,
              name: userData.name,
              email: userData.email,
              role: userData.role,
              avatar: userData.avatar,
              createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
              lastSeen: userData.lastSeen ? new Date(userData.lastSeen) : new Date(),
              permissions: userData.permissions || [],
              isActive: userData.isActive !== false,
            });
          } catch (apiError: any) {
            // If user profile doesn't exist (404), create it
            if (apiError.message?.includes('404') || apiError.message?.includes('not found')) {
              const newUser: User = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || 'Unknown User',
                email: firebaseUser.email || '',
                role: 'viewer',
                createdAt: new Date(),
                lastSeen: new Date(),
                permissions: [],
                isActive: true,
              };
              
              // Note: User creation should be handled by backend on first login
              // For now, set user with default values
              setUser(newUser);
            } else {
              console.error('Error fetching user data:', apiError);
              setUser(null);
            }
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          setUser(null);
        }
      } else {
        apiService.setAuthToken(null);
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // User document creation is handled by backend on first login
      // No need to create it here via API
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const checkPermission = (permission: string): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  const getToken = async (): Promise<string | null> => {
    if (!firebaseUser) return null;
    try {
      return await getIdToken(firebaseUser);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    logout,
    hasPermission: checkPermission,
    isAdmin: user?.role === 'super_admin',
    isEditor: user?.role === 'editor' || user?.role === 'super_admin',
    isAuthor: ['author', 'editor', 'super_admin'].includes(user?.role || ''),
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission?: string
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading, hasPermission } = useAuth();
    const router = useRouter();
    const [shouldRedirect, setShouldRedirect] = useState(false);

    useEffect(() => {
      if (!loading && !user) {
        // Redirect to login page with current path as redirect parameter
        const currentPath = window.location.pathname;
        router.push(`/admin/login?redirect=${encodeURIComponent(currentPath)}`);
        setShouldRedirect(true);
      }
    }, [loading, user, router]);

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!user || shouldRedirect) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Redirecting...</h1>
            <p className="text-gray-600">Please wait while we redirect you to the login page.</p>
          </div>
        </div>
      );
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Insufficient Permissions</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
