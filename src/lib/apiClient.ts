import { Capsule, CapsuleFormData } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Helper to make authenticated fetch requests
async function authFetch(url: string, options: RequestInit = {}, userId: string) {
  const headers = {
    ...(options.headers || {}),
    'Content-Type': 'application/json',
    'Authorization': userId
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An error occurred' }));
    throw new Error(error.error || 'An error occurred');
  }
  
  return response.json();
}

// Capsule service functions for browser environment
export const apiClient = {
  // Create a new capsule
  createCapsule: async (
    userId: string,
    creatorName: string | null,
    data: CapsuleFormData
  ): Promise<string> => {
    const id = uuidv4();
    const response = await authFetch('/api/capsules', {
      method: 'POST',
      body: JSON.stringify({
        id,
        creatorName,
        data
      })
    }, userId);
    
    return response.id;
  },

  // Get user's capsules
  getUserCapsules: async (userId: string): Promise<Capsule[]> => {
    return authFetch('/api/capsules', {
      method: 'GET'
    }, userId);
  },

  // Get a specific capsule by ID
  getCapsuleById: async (capsuleId: string, userId: string): Promise<Capsule | null> => {
    return authFetch(`/api/capsules/${capsuleId}`, {
      method: 'GET'
    }, userId);
  },

  // Open a capsule (mark as opened)
  openCapsule: async (capsuleId: string, userId: string): Promise<boolean> => {
    const response = await authFetch(`/api/capsules/${capsuleId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'open' })
    }, userId);
    
    return response.success;
  },

  // Delete a capsule
  deleteCapsule: async (capsuleId: string, userId: string): Promise<boolean> => {
    const response = await authFetch(`/api/capsules/${capsuleId}`, {
      method: 'DELETE'
    }, userId);
    
    return response.success;
  },

  // Check capsule status
  checkCapsuleStatus: async (
    capsule: Capsule,
    userLocation?: { latitude: number; longitude: number },
    userId?: string
  ): Promise<{ canOpen: boolean; message: string }> => {
    if (!userId) {
      return { canOpen: false, message: 'Authentication required' };
    }
    
    return authFetch(`/api/capsules/${capsule.id}`, {
      method: 'POST',
      body: JSON.stringify({
        action: 'check-status',
        userLocation
      })
    }, userId);
  }
};