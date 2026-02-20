
import sys
import os
import traceback

# Add backend to path
sys.path.append(os.path.abspath("backend"))

try:
    print("Attempting to import main...")
    from backend import main
    print("Import successful!")
    
    import uvicorn
    print("Starting uvicorn on port 8000...")
    uvicorn.run(main.app, host="0.0.0.0", port=8000, log_level="info")
    
except Exception:
    traceback.print_exc()
except SystemExit as e:
    print(f"SystemExit caught: {e}")
    traceback.print_exc()
