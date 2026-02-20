try:
    import face_recognition
    import dlib
    print(f"Face Recognition Version: {face_recognition.__version__}")
    print(f"Dlib Version: {dlib.__version__}")
except ImportError as e:
    print(f"Import Error: {e}")
