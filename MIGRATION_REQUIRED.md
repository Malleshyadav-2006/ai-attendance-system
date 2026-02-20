# 🚨 URGENT: Database Migration Required

## Current Status
Your attendance system is working, **BUT** photos and locations are **NOT being saved** because the database is missing three columns.

## What You Need to Do (2 minutes)

### Step 1: Open Supabase SQL Editor
Click this link (or copy to browser):
```
https://app.supabase.com/project/mngcihfesryyvisygklt/sql/new
```

### Step 2: Run This SQL
Copy and paste this into the SQL editor, then click "RUN":

```sql
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS captured_image TEXT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
```

### Step 3: Verify
You should see: ✅ **Success. No rows returned**

## After Migration

✅ **Photos will show** in Admin Panel (40x40 thumbnails)  
✅ **Locations will show** as "View Map" links  
✅ **Auto-capture** continues to work (already fixed)

---

## Why Can't This Be Automated?

Supabase requires either:
1. Manual SQL execution in their dashboard (recommended✅)
2. Database password for direct psycopg2 connection
3. Management API token (requires admin setup)

The first option is the quickest and safest!
