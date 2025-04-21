-- TimeCapsule PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create capsules table
CREATE TABLE IF NOT EXISTS capsules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  location JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  unlock_date TIMESTAMP WITH TIME ZONE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_name TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  is_public BOOLEAN DEFAULT false,
  is_opened BOOLEAN DEFAULT false
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_capsules_user_id ON capsules (user_id);
CREATE INDEX IF NOT EXISTS idx_capsules_is_public ON capsules (is_public);
CREATE INDEX IF NOT EXISTS idx_capsules_unlock_date ON capsules (unlock_date);

-- Row Level Security (RLS) policies
ALTER TABLE capsules ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own capsules
CREATE POLICY "Users can read own capsules" ON capsules
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can read public capsules
CREATE POLICY "Anyone can read public capsules" ON capsules
  FOR SELECT
  USING (is_public = true);

-- Policy: Users can insert their own capsules
CREATE POLICY "Users can insert own capsules" ON capsules
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own capsules
CREATE POLICY "Users can update own capsules" ON capsules
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own capsules
CREATE POLICY "Users can delete own capsules" ON capsules
  FOR DELETE
  USING (auth.uid() = user_id);