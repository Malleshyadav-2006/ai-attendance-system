#!/usr/bin/env python3
"""
Add missing columns to the attendance table using psycopg2
This connects directly to the Postgres database
"""
import os
from dotenv import load_dotenv

load_dotenv()

try:
    import psycopg2
except ImportError:
    print("❌ psycopg2 not installed. Installing...")
    os.system("pip install psycopg2-binary")
    import psycopg2

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL:
    print("❌ Error: SUPABASE_URL not set")
    exit(1)

# Extract project reference
project_ref = SUPABASE_URL.split("//")[1].split(".")[0]

# Supabase connection string format
# You'll need the database password which is typically set during project creation
print("⚠️  To connect directly to Postgres, we need the database password.")
print(f"📝 Get connection details from: https://app.supabase.com/project/{project_ref}/settings/database")
print("\nAlternatively, run this SQL manually in Supabase SQL Editor:")
print(f"🔗 https://app.supabase.com/project/{project_ref}/sql/new\n")

sql = """ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS captured_image TEXT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;"""

print("="*70)
print(sql)
print("="*70)

print("\n✅ After running the SQL, restart your backend with:")
print("   uvicorn main:app --reload --port 8000")
