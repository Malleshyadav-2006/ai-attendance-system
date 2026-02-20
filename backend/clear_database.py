import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# Initialize Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase = create_client(supabase_url, supabase_key)

def clear_test_data():
    """Clear all test data from users and attendance tables"""
    try:
        # Delete all attendance records
        print("Deleting attendance records...")
        supabase.table("attendance").delete().neq("id", "").execute()
        print("✅ Attendance records cleared")
        
        # Delete all users
        print("Deleting user records...")
        supabase.table("users").delete().neq("id", "").execute()
        print("✅ User records cleared")
        
        print("\n🎉 Database cleaned successfully!")
        print("You can now start fresh with production data.")
        
    except Exception as e:
        print(f"❌ Error clearing database: {e}")

if __name__ == "__main__":
    confirm = input("⚠️  This will DELETE ALL data from users and attendance tables. Continue? (yes/no): ")
    if confirm.lower() == "yes":
        clear_test_data()
    else:
        print("Cancelled.")
