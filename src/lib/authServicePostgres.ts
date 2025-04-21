// This file should be used ONLY in server-side code (API routes or getServerSideProps)
// It contains Node.js specific modules that won't work in the browser

// Safeguard to prevent this from being imported on the client side
if (typeof window !== 'undefined') {
  throw new Error(
    'This module is only intended for server-side use. ' +
    'Please use authClient.ts for client-side authentication.'
  );
}

import { query } from './postgres';
import { User } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

// Initialize authentication tables
export async function initializeAuthTables() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        photo_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Auth tables initialized successfully');
  } catch (error) {
    console.error('Error initializing auth tables:', error);
    throw error;
  }
}

// Hash password using PBKDF2
function hashPassword(password: string, salt?: string): { hash: string, salt: string } {
  const saltToUse = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, saltToUse, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: saltToUse };
}

// Auth state listeners
const listeners: Map<string, (user: User | null) => void> = new Map();
let currentUser: User | null = null;

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<User> {
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const user = result.rows[0];
    const passwordParts = user.password_hash.split(':');
    const storedHash = passwordParts[0];
    const salt = passwordParts[1];
    
    const { hash } = hashPassword(password, salt);
    
    if (hash !== storedHash) {
      throw new Error('Invalid password');
    }
    
    const userData: User = {
      uid: user.id,
      email: user.email,
      displayName: user.display_name,
      photoURL: user.photo_url
    };
    
    currentUser = userData;
    notifyListeners(userData);
    
    return userData;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}

// Sign up with email and password
export async function signUp(email: string, password: string): Promise<User> {
  try {
    // Check if user already exists
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      throw new Error('Email already in use');
    }
    
    const userId = uuidv4();
    const { hash, salt } = hashPassword(password);
    const passwordHash = `${hash}:${salt}`;
    
    const result = await query(
      'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [userId, email, passwordHash]
    );
    
    const newUser = result.rows[0];
    const userData: User = {
      uid: newUser.id,
      email: newUser.email,
      displayName: newUser.display_name,
      photoURL: newUser.photo_url
    };
    
    currentUser = userData;
    notifyListeners(userData);
    
    return userData;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
}

// Sign out
export async function signOut(): Promise<void> {
  currentUser = null;
  notifyListeners(null);
}

// Sign in with Google (mock implementation - would require OAuth integration)
export async function signInWithGoogle(): Promise<User> {
  throw new Error('Google sign-in requires OAuth implementation');
}

// Get the current user
export async function getCurrentUser(): Promise<User | null> {
  return currentUser;
}

// Update user profile
export async function updateProfile(userId: string, displayName: string, photoURL?: string): Promise<void> {
  try {
    await query(
      'UPDATE users SET display_name = $1, photo_url = $2 WHERE id = $3',
      [displayName, photoURL || null, userId]
    );
    
    if (currentUser && currentUser.uid === userId) {
      currentUser = {
        ...currentUser,
        displayName,
        photoURL: photoURL || null
      };
      
      notifyListeners(currentUser);
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

// Auth state change listener
export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
  const listenerId = uuidv4();
  listeners.set(listenerId, callback);
  
  // Immediately call with current state
  callback(currentUser);
  
  // Return unsubscribe function
  return () => {
    listeners.delete(listenerId);
  };
}

// Helper to notify all listeners of auth state changes
function notifyListeners(user: User | null): void {
  listeners.forEach(callback => {
    try {
      callback(user);
    } catch (error) {
      console.error('Error in auth state change listener:', error);
    }
  });
}