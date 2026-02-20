
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    # Fallback/Error if env vars missing
    print("Warning: SUPABASE_URL or SUPABASE_KEY not set")
    
supabase: Client = create_client(url, key)
