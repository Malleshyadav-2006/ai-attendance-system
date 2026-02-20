
import sys
try:
    print("Attempting to import dlib...")
    import dlib
    print(f"dlib imported. Version: {dlib.__version__}")
    
    print("Attempting to import face_recognition...")
    import face_recognition
    print("face_recognition imported.")
    
    print("Attempting to load face_recognition_models...")
    import face_recognition_models
    print("face_recognition_models imported.")
    
    print("ALL IMPORTS SUCCESSFUL")
except Exception as e:
    print(f"CRITICAL ERROR: {e}")
    import traceback
    traceback.print_exc()
