#!/usr/bin/env python3
"""
Add missing columns to the attendance table in Supabase
"""
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY not set in .env file")
    exit(1)

supabase = create_client(url, key)

sql = """
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS captured_image TEXT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
"""

try:
    result = supabase.rpc('exec_sql', {'query': sql}).execute()
    print("✅ Successfully added columns to attendance table!")
    print(f"Result: {result}")
except Exception as e:
    print(f"❌ Error: {e}")
    print("\n⚠️ Please run this SQL manually in Supabase SQL Editor:")
    print(sql)
