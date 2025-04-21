// This file serves as the authentication provider for the application
import { User } from '@/types';
import { authClient } from './authClient';

// Export functions directly from the auth client
export const {
  signIn,
  signUp,
  signOut,
  signInWithGoogle,
  getCurrentUser,
  updateProfile,
  onAuthStateChanged
} = authClient;