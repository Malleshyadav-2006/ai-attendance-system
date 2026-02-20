-- Add missing columns to attendance table
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS captured_image TEXT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
