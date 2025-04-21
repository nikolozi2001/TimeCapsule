export interface Capsule {
  id: string;
  title: string;
  content: string;
  location: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  createdAt: number; // timestamp
  unlockDate: number; // timestamp
  userId: string;
  creatorName?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  isPublic: boolean;
  isOpened: boolean;
}

export interface CapsuleFormData {
  title: string;
  content: string;
  location: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  unlockDate: Date;
  mediaFile?: File | null;
  isPublic: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: number;
}

export type CapsuleStatus = 'locked' | 'unlockable' | 'unlocked';