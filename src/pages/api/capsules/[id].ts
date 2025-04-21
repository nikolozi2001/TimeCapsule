import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/postgres';
import { Capsule } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check for proper authentication
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = req.headers.authorization;
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid capsule ID' });
  }

  try {
    if (req.method === 'GET') {
      // Get single capsule
      const result = await query(
        `SELECT * FROM capsules WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Capsule not found' });
      }
      
      // Check if user has permission (either owner or it's a public opened capsule)
      const row = result.rows[0];
      if (row.user_id !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const capsule: Capsule = {
        id: row.id,
        userId: row.user_id,
        creatorName: row.creator_name,
        title: row.title,
        content: row.content,
        location: typeof row.location === 'string' 
          ? JSON.parse(row.location) 
          : row.location,
        unlockMethod: row.unlock_method,
        unlockTime: row.unlock_time ? row.unlock_time.toISOString() : null,
        createdAt: row.created_at.toISOString(),
        openedAt: row.opened_at ? row.opened_at.toISOString() : null,
        status: row.status,
        mediaUrls: row.media_urls || []
      };
      
      return res.status(200).json(capsule);
      
    } else if (req.method === 'DELETE') {
      // Delete capsule
      const result = await query(
        `DELETE FROM capsules WHERE id = $1 AND user_id = $2 RETURNING id`,
        [id, userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Capsule not found or permission denied' });
      }
      
      return res.status(200).json({ success: true });
      
    } else if (req.method === 'PATCH' && req.body.action === 'open') {
      // Open a capsule
      const result = await query(
        `UPDATE capsules 
         SET status = 'opened', opened_at = NOW() 
         WHERE id = $1 AND user_id = $2 AND status = 'sealed' 
         RETURNING id`,
        [id, userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Capsule not found or already opened' });
      }
      
      return res.status(200).json({ success: true });
    } else if (req.method === 'POST' && req.body.action === 'check-status') {
      // Check capsule status
      const { userLocation } = req.body;
      const result = await query(
        `SELECT * FROM capsules WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Capsule not found' });
      }
      
      const row = result.rows[0];
      if (row.user_id !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      // Convert row to capsule
      const capsule: Capsule = {
        id: row.id,
        userId: row.user_id,
        creatorName: row.creator_name,
        title: row.title,
        content: row.content,
        location: typeof row.location === 'string' 
          ? JSON.parse(row.location) 
          : row.location,
        unlockMethod: row.unlock_method,
        unlockTime: row.unlock_time ? row.unlock_time.toISOString() : null,
        createdAt: row.created_at.toISOString(),
        openedAt: row.opened_at ? row.opened_at.toISOString() : null,
        status: row.status,
        mediaUrls: row.media_urls || []
      };
      
      // Check status logic based on capsule type
      let statusResponse = { canOpen: false, message: '' };
      
      if (capsule.status === 'opened') {
        statusResponse = { 
          canOpen: true, 
          message: 'This capsule has already been opened.' 
        };
      } else if (capsule.unlockMethod === 'time' && capsule.unlockTime) {
        const now = new Date();
        const unlockTime = new Date(capsule.unlockTime);
        
        if (now >= unlockTime) {
          statusResponse = { canOpen: true, message: 'This capsule is ready to be opened!' };
        } else {
          const timeLeft = getTimeLeft(now, unlockTime);
          statusResponse = {
            canOpen: false,
            message: `This capsule will be unlockable in ${timeLeft}.`
          };
        }
      } else if (capsule.unlockMethod === 'location' && userLocation) {
        const isNear = isNearLocation(
          userLocation, 
          {
            latitude: capsule.location.latitude,
            longitude: capsule.location.longitude
          }, 
          0.1 // 100 meters radius
        );
        
        if (isNear) {
          statusResponse = { canOpen: true, message: 'You are near the capsule location. You can open it now!' };
        } else {
          statusResponse = {
            canOpen: false,
            message: 'You need to be closer to the capsule location to open it.'
          };
        }
      } else if (capsule.unlockMethod === 'immediate') {
        statusResponse = { canOpen: true, message: 'This capsule is ready to be opened!' };
      }
      
      return res.status(200).json(statusResponse);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper functions
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

function isNearLocation(
  location1: { latitude: number; longitude: number },
  location2: { latitude: number; longitude: number },
  radiusKm: number
): boolean {
  const R = 6371; // Earth's radius in km
  
  const dLat = deg2rad(location2.latitude - location1.latitude);
  const dLon = deg2rad(location2.longitude - location1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(location1.latitude)) * 
    Math.cos(deg2rad(location2.latitude)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance <= radiusKm;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}