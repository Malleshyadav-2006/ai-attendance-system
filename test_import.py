
import sys
import os

# Add backend to path
sys.path.append(os.path.abspath("backend"))

try:
    print("Attempting to import main...")
    from backend import main
    print("Import successful!")
except Exception as e:
    print(f"Import failed: {e}")
    import traceback
    traceback.print_exc()
