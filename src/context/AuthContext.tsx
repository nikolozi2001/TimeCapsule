import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { 
  signIn, 
  signUp, 
  signOut, 
  signInWithGoogle,
  updateProfile,
  onAuthStateChanged 
} from '@/lib/authProvider';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      setUser(user);
      
      // Store user ID in localStorage for API authentication
      if (user) {
        localStorage.setItem('uid', user.uid);
      } else {
        localStorage.removeItem('uid');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string) => {
    try {
      await signUp(email, password);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signIn(email, password);
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut();
      localStorage.removeItem('uid'); // Also clear from localStorage
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error with Google login:', error);
      throw error;
    }
  };

  const updateUserProfile = async (displayName: string) => {
    try {
      if (user) {
        await updateProfile(user.uid, displayName);
        // Force refresh the user data on next state change
      } else {
        throw new Error('No user logged in');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    loginWithGoogle,
    updateUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}