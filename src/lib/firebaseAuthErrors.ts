import { FirebaseError } from 'firebase/app';

/**
 * Translates Firebase Auth error codes to user-friendly messages
 */
export function getFirebaseAuthErrorMessage(error: unknown): string {
  // Check if it's a Firebase error with a code
  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseError = error as FirebaseError;
    const errorCode = firebaseError.code;

    switch (errorCode) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password. Please check your credentials and try again.';
      
      case 'auth/invalid-email':
        return 'Invalid email address. Please check your email and try again.';
      
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Please try again later.';
      
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.';
      
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please sign in instead.';
      
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      
      case 'auth/operation-not-allowed':
        return 'This sign-in method is not enabled. Please contact support.';
      
      case 'auth/requires-recent-login':
        return 'Please sign out and sign in again to complete this action.';
      
      case 'auth/invalid-verification-code':
        return 'Invalid verification code. Please try again.';
      
      case 'auth/invalid-verification-id':
        return 'Verification session expired. Please try again.';
      
      case 'auth/missing-email':
        return 'Email address is required.';
      
      case 'auth/missing-password':
        return 'Password is required.';
      
      default:
        // For unknown errors, try to extract a meaningful message
        if (firebaseError.message) {
          return firebaseError.message;
        }
        return 'An error occurred during authentication. Please try again.';
    }
  }

  // Fallback for non-Firebase errors
  if (error instanceof Error) {
    return error.message || 'An unexpected error occurred. Please try again.';
  }

  return 'An unexpected error occurred. Please try again.';
}

