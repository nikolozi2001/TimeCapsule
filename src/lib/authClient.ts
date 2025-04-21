import { User } from '@/types';

// Safe storage for browser environments
const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
};

// In-memory auth state (for client-side state management)
let currentUser: User | null = null;
const listeners = new Set<(user: User | null) => void>();

// Initialize state from localStorage if we're in browser
if (typeof window !== 'undefined') {
  const savedUser = safeStorage.getItem('timecapsule_user');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
    } catch (e) {
      safeStorage.removeItem('timecapsule_user');
    }
  }
}

/**
 * Client-side authentication service that communicates with our API endpoints
 */
export const authClient = {
  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string): Promise<User> => {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'signin', email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Sign in failed');
    }
    
    const user = await response.json();
    
    // Update client-side state
    currentUser = user;
    notifyListeners();
    
    // Store in localStorage for persistence
    safeStorage.setItem('timecapsule_user', JSON.stringify(user));
    safeStorage.setItem('uid', user.uid); // Also store uid for API auth
    
    return user;
  },
  
  /**
   * Sign up with email and password
   */
  signUp: async (email: string, password: string): Promise<User> => {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'signup', email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Sign up failed');
    }
    
    const user = await response.json();
    
    // Update client-side state
    currentUser = user;
    notifyListeners();
    
    // Store in localStorage for persistence
    safeStorage.setItem('timecapsule_user', JSON.stringify(user));
    safeStorage.setItem('uid', user.uid); // Also store uid for API auth
    
    return user;
  },
  
  /**
   * Sign out
   */
  signOut: async (): Promise<void> => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'signout' })
    });
    
    // Update client-side state
    currentUser = null;
    notifyListeners();
    
    // Clear from localStorage
    safeStorage.removeItem('timecapsule_user');
    safeStorage.removeItem('uid');
  },
  
  /**
   * Get the current authenticated user
   */
  getCurrentUser: async (): Promise<User | null> => {
    // For client-side, we use localStorage to maintain state between page reloads
    if (!currentUser && typeof window !== 'undefined') {
      const storedUser = safeStorage.getItem('timecapsule_user');
      if (storedUser) {
        try {
          currentUser = JSON.parse(storedUser);
          notifyListeners();
        } catch (e) {
          safeStorage.removeItem('timecapsule_user');
        }
      }
    }
    
    return currentUser;
  },
  
  /**
   * Update user profile
   */
  updateProfile: async (userId: string, displayName: string, photoURL?: string): Promise<void> => {
    const response = await fetch('/api/auth', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'update-profile',
        userId,
        displayName,
        photoURL
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Update profile failed');
    }
    
    // Update client-side state if it's the current user
    if (currentUser && currentUser.uid === userId) {
      currentUser = {
        ...currentUser,
        displayName,
        photoURL: photoURL || null
      };
      notifyListeners();
      
      // Update in localStorage
      safeStorage.setItem('timecapsule_user', JSON.stringify(currentUser));
    }
  },
  
  /**
   * Mock implementation for Google sign-in
   * For a real implementation, you would use OAuth on the backend
   */
  signInWithGoogle: async (): Promise<User> => {
    throw new Error('Google Sign-In requires OAuth implementation');
  },
  
  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged: (callback: (user: User | null) => void): (() => void) => {
    listeners.add(callback);
    
    // Call immediately with current user state
    callback(currentUser);
    
    // Return unsubscribe function
    return () => {
      listeners.delete(callback);
    };
  }
};

// Helper to notify all listeners of auth state changes
function notifyListeners(): void {
  listeners.forEach(callback => {
    try {
      callback(currentUser);
    } catch (error) {
      console.error('Error in auth state change listener:', error);
    }
  });
}