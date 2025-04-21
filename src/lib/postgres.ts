// This file should be used ONLY in server-side code (API routes or getServerSideProps)
// It contains Node.js specific modules that won't work in the browser

// Safeguard to prevent this from being imported on the client side
if (typeof window !== 'undefined') {
  throw new Error(
    'This module is only intended for server-side use. ' +
    'Please use apiClient.ts for client-side database operations.'
  );
}

import { Pool } from 'pg';

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE || 'timecapsule',
  ssl: process.env.POSTGRES_SSL === 'true' ? {
    rejectUnauthorized: false,
  } : undefined,
});

export { pool };

// Helper function to run queries
export async function query(text: string, params: any[] = []) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  
  console.log('Executed query', { text, duration, rows: result.rowCount });
  return result;
}