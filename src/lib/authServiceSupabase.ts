import { supabase } from './supabase';
import { User } from '@/types';

// Sign up a new user
export const signUp = async (email: string, password: string): Promise<User> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  
  // Return user data in the same format as your app expects
  return {
    uid: data.user?.id || '',
    email: data.user?.email || '',
    displayName: null,
    photoURL: null
  };
};

// Sign in an existing user
export const signIn = async (email: string, password: string): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  
  return {
    uid: data.user?.id || '',
    email: data.user?.email || '',
    displayName: data.user?.user_metadata?.name || null,
    photoURL: data.user?.user_metadata?.avatar_url || null
  };
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`
    }
  });
  
  if (error) throw error;
  
  // Note: this will actually return before the OAuth flow completes
  // You'll need to handle the redirect in your application
  return {
    uid: '',
    email: '',
    displayName: null,
    photoURL: null
  };
};

// Sign out
export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  const { data, error } = await supabase.auth.getUser();
  
  if (error || !data.user) return null;
  
  return {
    uid: data.user.id,
    email: data.user.email || '',
    displayName: data.user.user_metadata?.name || null,
    photoURL: data.user.user_metadata?.avatar_url || null
  };
};

// Update user profile
export const updateProfile = async (
  userId: string,
  displayName: string,
  photoURL?: string
): Promise<void> => {
  const { error } = await supabase.auth.updateUser({
    data: {
      name: displayName,
      avatar_url: photoURL
    }
  });
  
  if (error) throw error;
};

// Listen to auth state changes
export const onAuthStateChanged = (
  callback: (user: User | null) => void
): (() => void) => {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (session && session.user) {
      const user: User = {
        uid: session.user.id,
        email: session.user.email || '',
        displayName: session.user.user_metadata?.name || null,
        photoURL: session.user.user_metadata?.avatar_url || null
      };
      callback(user);
    } else {
      callback(null);
    }
  });
  
  // Return the unsubscribe function
  return () => {
    data.subscription.unsubscribe();
  };
};