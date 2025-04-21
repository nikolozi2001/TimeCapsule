import { query } from './postgres';
import { v4 as uuidv4 } from 'uuid';
import { Capsule, CapsuleFormData, CapsuleStatus } from '@/types';
import { isNearLocation } from './geolocation';

const CAPSULES_TABLE = 'capsules';

// Create database tables if they don't exist
export async function initializeDatabase() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS ${CAPSULES_TABLE} (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        creator_name TEXT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        location JSONB NOT NULL,
        unlock_method TEXT NOT NULL,
        unlock_time TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        opened_at TIMESTAMPTZ,
        status TEXT DEFAULT 'sealed',
        media_urls TEXT[]
      );
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Create a new capsule
export const createCapsule = async (
  userId: string,
  creatorName: string | null,
  data: CapsuleFormData
): Promise<string> => {
  try {
    const id = uuidv4();
    
    const result = await query(
      `INSERT INTO ${CAPSULES_TABLE} 
        (id, user_id, creator_name, title, content, location, unlock_method, unlock_time) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id`,
      [
        id,
        userId,
        creatorName,
        data.title,
        data.content,
        JSON.stringify({
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          name: data.location.name || null,
        }),
        data.unlockMethod,
        data.unlockMethod === 'time' && data.unlockTime ? new Date(data.unlockTime) : null,
      ]
    );
    
    return result.rows[0].id;
  } catch (error) {
    console.error('Error creating capsule:', error);
    throw error;
  }
};

// Get all capsules for a user
export const getUserCapsules = async (userId: string): Promise<Capsule[]> => {
  try {
    const result = await query(
      `SELECT * FROM ${CAPSULES_TABLE} WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    
    return result.rows.map(mapRowToCapsule);
  } catch (error) {
    console.error('Error getting user capsules:', error);
    throw error;
  }
};

// Get a specific capsule by ID
export const getCapsuleById = async (capsuleId: string): Promise<Capsule | null> => {
  try {
    const result = await query(
      `SELECT * FROM ${CAPSULES_TABLE} WHERE id = $1`,
      [capsuleId]
    );
    
    if (result.rows.length === 0) return null;
    
    return mapRowToCapsule(result.rows[0]);
  } catch (error) {
    console.error('Error getting capsule by ID:', error);
    throw error;
  }
};

// Open a capsule (mark as opened)
export const openCapsule = async (capsuleId: string): Promise<boolean> => {
  try {
    const result = await query(
      `UPDATE ${CAPSULES_TABLE} 
       SET status = $1, opened_at = NOW() 
       WHERE id = $2 AND status = 'sealed' 
       RETURNING id`,
      ['opened', capsuleId]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error opening capsule:', error);
    throw error;
  }
};

// Delete a capsule
export const deleteCapsule = async (capsuleId: string): Promise<boolean> => {
  try {
    const result = await query(
      `DELETE FROM ${CAPSULES_TABLE} WHERE id = $1 RETURNING id`,
      [capsuleId]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error deleting capsule:', error);
    throw error;
  }
};

// Check capsule status based on unlock method
export const checkCapsuleStatus = async (
  capsule: Capsule,
  userLocation?: { latitude: number; longitude: number }
): Promise<{ canOpen: boolean; message: string }> => {
  if (capsule.status === 'opened') {
    return { 
      canOpen: true, 
      message: 'This capsule has already been opened.' 
    };
  }
  
  // Time-based capsule
  if (capsule.unlockMethod === 'time' && capsule.unlockTime) {
    const now = new Date();
    const unlockTime = new Date(capsule.unlockTime);
    
    if (now >= unlockTime) {
      return { canOpen: true, message: 'This capsule is ready to be opened!' };
    } else {
      const timeLeft = getTimeLeft(now, unlockTime);
      return {
        canOpen: false,
        message: `This capsule will be unlockable in ${timeLeft}.`
      };
    }
  }
  
  // Location-based capsule
  if (capsule.unlockMethod === 'location') {
    if (!userLocation) {
      return {
        canOpen: false,
        message: 'Please enable location services to open this capsule.'
      };
    }
    
    const capsuleLocation = {
      latitude: capsule.location.latitude,
      longitude: capsule.location.longitude
    };
    
    if (isNearLocation(userLocation, capsuleLocation, 0.1)) { // 0.1 km (100m) radius
      return { canOpen: true, message: 'You are near the capsule location. You can open it now!' };
    } else {
      return {
        canOpen: false,
        message: 'You need to be closer to the capsule location to open it.'
      };
    }
  }
  
  // Default case - immediate access
  return { canOpen: true, message: 'This capsule is ready to be opened!' };
};

// Helper function to format time left
function getTimeLeft(currentDate: Date, targetDate: Date): string {
  const millisecondsLeft = targetDate.getTime() - currentDate.getTime();
  const daysLeft = Math.floor(millisecondsLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((millisecondsLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (daysLeft > 0) {
    return `${daysLeft} days and ${hoursLeft} hours`;
  } else {
    const minutesLeft = Math.floor((millisecondsLeft % (1000 * 60 * 60)) / (1000 * 60));
    return `${hoursLeft} hours and ${minutesLeft} minutes`;
  }
}

// Map database row to Capsule object
function mapRowToCapsule(row: any): Capsule {
  return {
    id: row.id,
    userId: row.user_id,
    creatorName: row.creator_name,
    title: row.title,
    content: row.content,
    location: typeof row.location === 'string' ? JSON.parse(row.location) : row.location,
    unlockMethod: row.unlock_method,
    unlockTime: row.unlock_time ? row.unlock_time.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    openedAt: row.opened_at ? row.opened_at.toISOString() : null,
    status: row.status as CapsuleStatus,
    mediaUrls: row.media_urls || []
  };
}