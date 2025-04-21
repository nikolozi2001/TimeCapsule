-- TimeCapsule PostgreSQL Schema

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Capsules table for time capsule data
CREATE TABLE IF NOT EXISTS capsules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creator_name TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  location JSONB NOT NULL,
  unlock_method TEXT NOT NULL,
  unlock_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  status TEXT DEFAULT 'sealed',
  media_urls TEXT[],
  
  -- Add index for user lookups
  CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Create index for faster access
CREATE INDEX IF NOT EXISTS idx_capsules_user_id ON capsules(user_id);
CREATE INDEX IF NOT EXISTS idx_capsules_status ON capsules(status);