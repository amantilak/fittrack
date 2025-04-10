-- Add missing fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS strava_token text,
ADD COLUMN IF NOT EXISTS fitness_level text NOT NULL DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS fitness_goals text,
ADD COLUMN IF NOT EXISTS weight double precision,
ADD COLUMN IF NOT EXISTS height double precision;