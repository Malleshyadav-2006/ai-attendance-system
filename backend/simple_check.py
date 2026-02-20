
try:
    import face_recognition
    print("face_recognition imported successfully")
except ImportError as e:
    print(f"face_recognition import failed: {e}")

try:
    import dlib
    print(f"dlib imported successfully: {dlib.__version__}")
except ImportError as e:
    print(f"dlib import failed: {e}")
