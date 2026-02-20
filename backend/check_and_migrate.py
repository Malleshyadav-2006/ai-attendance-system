#!/usr/bin/env python3
"""
Add missing columns to the attendance table using Supabase REST API
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL or SUPABASE_KEY not set in .env file")
    exit(1)

# Extract project ID from URL
project_ref = SUPABASE_URL.split("//")[1].split(".")[0]

sql = """
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS captured_image TEXT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
"""

print("🔧 Attempting to add columns to attendance table...")
print(f"Project: {project_ref}")
print(f"\nSQL to execute:\n{sql}")

# Try using PostgREST endpoint
db_url = f"{SUPABASE_URL}/rest/v1/"
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
}

print("\n⚠️  Note: Direct SQL execution via REST API is not possible.")
print("📝 Please run the following SQL manually in Supabase SQL Editor:")
print(f"\n🔗 https://app.supabase.com/project/{project_ref}/sql/new\n")
print("="*60)
print(sql)
print("="*60)

# Let's verify if the table exists and check current columns
print("\n🔍 Checking current attendance table structure...")
try:
    response = requests.get(
        f"{db_url}attendance?limit=1",
        headers=headers
    )
    if response.status_code == 200:
        data = response.json()
        if data:
            print(f"✅ Attendance table exists. Sample record keys: {list(data[0].keys())}")
            
            has_image = 'captured_image' in data[0]
            has_lat = 'latitude' in data[0]
            has_lng = 'longitude' in data[0]
            
            if has_image and has_lat and has_lng:
                print("✅ All columns already exist!")
            else:
                missing = []
                if not has_image: missing.append('captured_image')
                if not has_lat: missing.append('latitude')
                if not has_lng: missing.append('longitude')
                print(f"❌ Missing columns: {', '.join(missing)}")
                print(f"\n👉 Please run the SQL above in Supabase SQL Editor")
        else:
            print("⚠️  No records found in attendance table")
    else:
        print(f"❌ Error checking table: {response.status_code}")
except Exception as e:
    print(f"❌ Error: {e}")
