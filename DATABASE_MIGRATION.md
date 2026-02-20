# Database Migration Required

## Problem
The attendance table is missing three columns needed for photos and location tracking:
- `captured_image` (stores base64-encoded photos)
- `latitude` (stores GPS latitude)
- `longitude` (stores GPS longitude)

## Solution
Run this SQL in your **Supabase SQL Editor**:

```sql
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS captured_image TEXT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
```

## Steps:
1. Go to [Supabase Dashboard](https://app.supabase.com/project/mngcihfesryyvisygklt/sql/new)
2. Paste the SQL above
3. Click "Run"
4. Restart your backend server: `uvicorn main:app --reload --port 8000`

After this, photos and locations will appear in the Admin Panel!
