
import sys
import os
import unittest
import numpy as np
import cv2

# Add project root to path (parent of 'tests' folder, which is where we are, or allow running from root)
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.join(current_dir, '..')
sys.path.append(project_root)

from backend.face_auth import FaceAuthSystem

class TestFaceAuth(unittest.TestCase):
    def setUp(self):
        self.auth = FaceAuthSystem()
        # Create a dummy image for testing
        self.test_image_path = "test_face_auth_dummy.jpg"
        img = np.zeros((100, 100, 3), dtype=np.uint8)
        # Add some color to make histogram interesting
        cv2.rectangle(img, (10, 10), (50, 50), (255, 0, 0), -1) # Blue box
        cv2.rectangle(img, (60, 60), (90, 90), (0, 255, 0), -1) # Green box
        cv2.imwrite(self.test_image_path, img)

    def tearDown(self):
        if os.path.exists(self.test_image_path):
            os.remove(self.test_image_path)

    def test_extract_encoding(self):
        print("\nTesting encoding extraction...")
        encodings = self.auth.extract_face_encodings(self.test_image_path)
        self.assertTrue(len(encodings) > 0, "Should return at least one encoding (fallback or real)")
        self.assertEqual(len(encodings[0]), 128, "Encoding should be 128-dimensional")
        print("Encoding extraction successful.")

    def test_match_face(self):
        print("\nTesting face matching...")
        encodings = self.auth.extract_face_encodings(self.test_image_path)
        if not encodings:
            self.fail("Could not extract encoding for matching test")
        
        encoding = encodings[0]
        # Match against itself
        is_match, distance = self.auth.match_face(encoding, encoding)
        self.assertTrue(is_match, "Should match itself")
        self.assertLess(distance, 0.1, "Distance to itself should be very small")
        print(f"Self-match successful. Distance: {distance}")

        # Match against random noise
        random_encoding = np.random.rand(128)
        # Normalize random encoding to match histogram nature if fallback is active
        random_encoding = random_encoding / np.linalg.norm(random_encoding)
        
        is_match, distance = self.auth.match_face(encoding, random_encoding.tolist())
        self.assertFalse(is_match, "Should not match random noise")
        print(f"Non-match successful. Distance: {distance}")

if __name__ == '__main__':
    unittest.main()
