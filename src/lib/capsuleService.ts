import { db, storage } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Capsule, CapsuleFormData, CapsuleStatus } from '@/types';
import { isNearLocation } from './geolocation';

const CAPSULES_COLLECTION = 'capsules';

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
      title: data.title,
      content: data.content,
      location: {
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        name: data.location.name || ''
      },
      createdAt: serverTimestamp(),
      unlockDate: Timestamp.fromDate(data.unlockDate),
      userId,
      creatorName: creatorName || 'Anonymous',
      mediaUrl,
      mediaType,
      isPublic: data.isPublic,
      isOpened: false
    };

    const docRef = await addDoc(collection(db, CAPSULES_COLLECTION), capsuleData);
    return docRef.id;
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
  const storageRef = ref(storage, `capsule-media/${fileName}`);
  
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  
  return {
    url: downloadURL,
    type: fileType
  };
};

// Get all capsules created by a user
export const getUserCapsules = async (userId: string): Promise<Capsule[]> => {
  try {
    const q = query(
      collection(db, CAPSULES_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const capsules: Capsule[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      capsules.push({
        id: doc.id,
        title: data.title,
        content: data.content,
        location: data.location,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        unlockDate: data.unlockDate?.toMillis() || Date.now(),
        userId: data.userId,
        creatorName: data.creatorName,
        mediaUrl: data.mediaUrl || undefined,
        mediaType: data.mediaType || undefined,
        isPublic: data.isPublic || false,
        isOpened: data.isOpened || false
      });
    });
    
    return capsules;
  } catch (error) {
    console.error('Error getting user capsules:', error);
    throw error;
  }
};

// Get a single capsule by ID
export const getCapsuleById = async (capsuleId: string): Promise<Capsule | null> => {
  try {
    const capsuleDoc = await getDoc(doc(db, CAPSULES_COLLECTION, capsuleId));
    
    if (!capsuleDoc.exists()) {
      return null;
    }
    
    const data = capsuleDoc.data();
    return {
      id: capsuleDoc.id,
      title: data.title,
      content: data.content,
      location: data.location,
      createdAt: data.createdAt?.toMillis() || Date.now(),
      unlockDate: data.unlockDate?.toMillis() || Date.now(),
      userId: data.userId,
      creatorName: data.creatorName,
      mediaUrl: data.mediaUrl || undefined,
      mediaType: data.mediaType || undefined,
      isPublic: data.isPublic || false,
      isOpened: data.isOpened || false
    };
  } catch (error) {
    console.error('Error getting capsule:', error);
    throw error;
  }
};

// Mark a capsule as opened
export const openCapsule = async (capsuleId: string): Promise<void> => {
  try {
    const capsuleRef = doc(db, CAPSULES_COLLECTION, capsuleId);
    await updateDoc(capsuleRef, {
      isOpened: true
    });
  } catch (error) {
    console.error('Error opening capsule:', error);
    throw error;
  }
};

// Delete a capsule and its media
export const deleteCapsule = async (capsule: Capsule): Promise<void> => {
  try {
    const capsuleRef = doc(db, CAPSULES_COLLECTION, capsule.id);
    
    // Delete the media if it exists
    if (capsule.mediaUrl) {
      const storageRef = ref(storage, capsule.mediaUrl);
      await deleteObject(storageRef).catch(err => {
        console.warn('Could not delete media, it may have already been removed:', err);
      });
    }
    
    // Delete the document
    await deleteDoc(capsuleRef);
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