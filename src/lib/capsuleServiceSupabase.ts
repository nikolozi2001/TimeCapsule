import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { Capsule, CapsuleFormData, CapsuleStatus } from '@/types';
import { isNearLocation } from './geolocation';

// Create a new capsule
export const createCapsule = async (
  userId: string,
  creatorName: string | null,
  data: CapsuleFormData
): Promise<string> => {
  try {
    let mediaUrl = '';
    let mediaType = undefined;

    // Upload media if provided
    if (data.mediaFile) {
      const { url, type } = await uploadMedia(data.mediaFile);
      mediaUrl = url;
      mediaType = type as 'image' | 'video' | 'audio';
    }

    const capsuleData = {
      id: uuidv4(), // Generate UUID for the capsule
      title: data.title,
      content: data.content,
      location: {
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        name: data.location.name || ''
      },
      created_at: new Date().toISOString(),
      unlock_date: data.unlockDate.toISOString(),
      user_id: userId,
      creator_name: creatorName || 'Anonymous',
      media_url: mediaUrl,
      media_type: mediaType,
      is_public: data.isPublic,
      is_opened: false
    };

    const { data: insertedCapsule, error } = await supabase
      .from('capsules')
      .insert(capsuleData)
      .select()
      .single();

    if (error) throw error;
    
    return insertedCapsule.id;
  } catch (error) {
    console.error('Error creating capsule:', error);
    throw error;
  }
};

// Upload media and return URL and type
const uploadMedia = async (file: File): Promise<{ url: string; type: string }> => {
  const fileType = file.type.split('/')[0]; // 'image', 'video', etc.
  const fileExtension = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  const filePath = `capsule-media/${fileName}`;
  
  // Upload to Supabase Storage
  const { error: uploadError } = await supabase
    .storage
    .from('capsule-media')
    .upload(filePath, file);
  
  if (uploadError) {
    throw uploadError;
  }
  
  // Get the public URL
  const { data } = supabase
    .storage
    .from('capsule-media')
    .getPublicUrl(filePath);
  
  return {
    url: data.publicUrl,
    type: fileType
  };
};

// Get all capsules created by a user
export const getUserCapsules = async (userId: string): Promise<Capsule[]> => {
  try {
    const { data, error } = await supabase
      .from('capsules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      location: item.location,
      createdAt: new Date(item.created_at).getTime(),
      unlockDate: new Date(item.unlock_date).getTime(),
      userId: item.user_id,
      creatorName: item.creator_name,
      mediaUrl: item.media_url || undefined,
      mediaType: item.media_type || undefined,
      isPublic: item.is_public || false,
      isOpened: item.is_opened || false
    }));
  } catch (error) {
    console.error('Error getting user capsules:', error);
    throw error;
  }
};

// Get a single capsule by ID
export const getCapsuleById = async (capsuleId: string): Promise<Capsule | null> => {
  try {
    const { data, error } = await supabase
      .from('capsules')
      .select('*')
      .eq('id', capsuleId)
      .single();
    
    if (error) return null;
    
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      location: data.location,
      createdAt: new Date(data.created_at).getTime(),
      unlockDate: new Date(data.unlock_date).getTime(),
      userId: data.user_id,
      creatorName: data.creator_name,
      mediaUrl: data.media_url || undefined,
      mediaType: data.media_type || undefined,
      isPublic: data.is_public || false,
      isOpened: data.is_opened || false
    };
  } catch (error) {
    console.error('Error getting capsule:', error);
    throw error;
  }
};

// Mark a capsule as opened
export const openCapsule = async (capsuleId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('capsules')
      .update({ is_opened: true })
      .eq('id', capsuleId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error opening capsule:', error);
    throw error;
  }
};

// Delete a capsule and its media
export const deleteCapsule = async (capsule: Capsule): Promise<void> => {
  try {
    // Delete media from storage if it exists
    if (capsule.mediaUrl) {
      // Extract file path from the URL
      const urlParts = capsule.mediaUrl.split('/');
      const filePath = urlParts[urlParts.length - 1];
      
      const { error: storageError } = await supabase
        .storage
        .from('capsule-media')
        .remove([`capsule-media/${filePath}`]);
      
      if (storageError) {
        console.warn('Could not delete media, it may have already been removed:', storageError);
      }
    }
    
    // Delete the capsule record
    const { error } = await supabase
      .from('capsules')
      .delete()
      .eq('id', capsule.id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting capsule:', error);
    throw error;
  }
};

// Check if a capsule can be unlocked based on user location and date
export const checkCapsuleStatus = (
  capsule: Capsule,
  userLat: number,
  userLng: number
): CapsuleStatus => {
  const now = Date.now();
  const isTimeUnlocked = now >= capsule.unlockDate;
  
  if (capsule.isOpened) {
    return 'unlocked';
  }

  if (!isTimeUnlocked) {
    return 'locked';
  }

  const isLocationMatched = isNearLocation(
    userLat,
    userLng,
    capsule.location.latitude,
    capsule.location.longitude
  );

  return isLocationMatched ? 'unlockable' : 'locked';
};