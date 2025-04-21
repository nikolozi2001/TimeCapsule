// This file serves as a provider layer for capsule data services using our API client 
import { apiClient } from './apiClient';
import { Capsule, CapsuleFormData } from '@/types';

// Create a new capsule
export const createCapsule = async (
  userId: string,
  creatorName: string | null,
  data: CapsuleFormData
): Promise<string> => {
  return apiClient.createCapsule(userId, creatorName, data);
};

// Get all capsules for a user
export const getUserCapsules = async (userId: string): Promise<Capsule[]> => {
  return apiClient.getUserCapsules(userId);
};

// Get a specific capsule by ID
export const getCapsuleById = async (capsuleId: string): Promise<Capsule | null> => {
  // We need the user ID for authentication, but it should be available in the context
  // where this is called. For now, we'll handle this by expecting it to be passed from the component.
  try {
    // Get user ID from local storage or context
    const userId = window.localStorage.getItem('uid');
    if (!userId) {
      console.error('No user ID available for authentication');
      return null;
    }
    
    return apiClient.getCapsuleById(capsuleId, userId);
  } catch (error) {
    console.error('Error in getCapsuleById:', error);
    return null;
  }
};

// Open a capsule (mark as opened)
export const openCapsule = async (capsuleId: string): Promise<boolean> => {
  try {
    const userId = window.localStorage.getItem('uid');
    if (!userId) {
      console.error('No user ID available for authentication');
      return false;
    }
    
    return apiClient.openCapsule(capsuleId, userId);
  } catch (error) {
    console.error('Error opening capsule:', error);
    return false;
  }
};

// Delete a capsule
export const deleteCapsule = async (capsuleId: string): Promise<boolean> => {
  try {
    const userId = window.localStorage.getItem('uid');
    if (!userId) {
      console.error('No user ID available for authentication');
      return false;
    }
    
    return apiClient.deleteCapsule(capsuleId, userId);
  } catch (error) {
    console.error('Error deleting capsule:', error);
    return false;
  }
};

// Check capsule status
export const checkCapsuleStatus = async (
  capsule: Capsule,
  userLocation?: { latitude: number; longitude: number }
): Promise<{ canOpen: boolean; message: string }> => {
  try {
    const userId = window.localStorage.getItem('uid');
    if (!userId) {
      return { canOpen: false, message: 'Authentication required' };
    }
    
    return apiClient.checkCapsuleStatus(capsule, userLocation, userId);
  } catch (error) {
    console.error('Error checking capsule status:', error);
    return { canOpen: false, message: 'Error checking status' };
  }
};