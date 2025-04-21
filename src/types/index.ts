export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

export type CapsuleStatus = 'sealed' | 'opened';

export interface Capsule {
  id: string;
  userId: string;
  creatorName: string | null;
  title: string;
  content: string;
  location: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  unlockMethod: 'immediate' | 'time' | 'location';
  unlockTime: string | null; // ISO string
  createdAt: string; // ISO string
  openedAt: string | null; // ISO string
  status: CapsuleStatus;
  mediaUrls: string[];
}

export interface CapsuleFormData {
  title: string;
  content: string;
  location: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  unlockMethod: 'immediate' | 'time' | 'location';
  unlockTime?: string | null; // ISO string for time-based capsules
  mediaFile?: File | null;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: number;
}