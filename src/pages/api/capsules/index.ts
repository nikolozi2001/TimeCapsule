import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/postgres';
import { Capsule } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check for proper authentication
  // This is a simplified version - you should implement proper auth middleware
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = req.headers.authorization;

  try {
    if (req.method === 'GET') {
      // Get user's capsules
      const result = await query(
        `SELECT * FROM capsules WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      
      const capsules: Capsule[] = result.rows.map(row => ({
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
      }));
      
      return res.status(200).json(capsules);
    } else if (req.method === 'POST') {
      // Create a new capsule
      const { creatorName, data } = req.body;
      
      const result = await query(
        `INSERT INTO capsules 
          (id, user_id, creator_name, title, content, location, unlock_method, unlock_time) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING id`,
        [
          req.body.id,
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
      
      return res.status(201).json({ id: result.rows[0].id });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}