import { NextApiRequest, NextApiResponse } from 'next';
import * as authServicePostgres from '@/lib/authServicePostgres';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Handle sign up
    if (req.method === 'POST' && req.body.action === 'signup') {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      const user = await authServicePostgres.signUp(email, password);
      return res.status(200).json(user);
    }
    
    // Handle sign in
    if (req.method === 'POST' && req.body.action === 'signin') {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      const user = await authServicePostgres.signIn(email, password);
      return res.status(200).json(user);
    }
    
    // Handle sign out
    if (req.method === 'POST' && req.body.action === 'signout') {
      await authServicePostgres.signOut();
      return res.status(200).json({ success: true });
    }
    
    // Handle update profile
    if (req.method === 'PUT' && req.body.action === 'update-profile') {
      const { userId, displayName, photoURL } = req.body;
      
      if (!userId || !displayName) {
        return res.status(400).json({ error: 'User ID and display name are required' });
      }
      
      await authServicePostgres.updateProfile(userId, displayName, photoURL);
      return res.status(200).json({ success: true });
    }
    
    // Handle get current user - this requires server-side sessions
    // For now, we'll return an error as this should be managed client-side
    if (req.method === 'GET') {
      return res.status(400).json({ error: 'Current user state should be managed client-side' });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API auth error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}