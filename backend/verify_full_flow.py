
import requests
import cv2
import numpy as np
import os
import time

BASE_URL = "http://127.0.0.1:8000"

def create_color_image(filename, color):
    # Create 100x100 image with solid color (BGR)
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    img[:] = color
    cv2.imwrite(filename, img)
    print(f"Created {filename} with color {color}")

def register(name, filename):
    print(f"Registering {name}...")
    with open(filename, 'rb') as f:
        response = requests.post(f"{BASE_URL}/register", 
                                 data={'name': name, 'email': f'{name}@test.com'},
                                 files={'image': f})
    print(f"Register Response: {response.status_code} - {response.text}")
    return response.json().get('user_id')

def mark_attendance(filename):
    print(f"Marking attendance with {filename}...")
    with open(filename, 'rb') as f:
        # Pass dummy location
        response = requests.post(f"{BASE_URL}/mark_attendance",
                                 data={'latitude': 1.0, 'longitude': 1.0},
                                 files={'file': f})
    
    print(f"Attendance Response: {response.status_code}")
    try:
        data = response.json()
        print(f"Result: {data}")
        return data
    except:
        print("Failed to parse JSON")
        return None

def main():
    # 1. Create Test Images (Red vs Blue)
    # Red in BGR is (0, 0, 255)
    # Blue in BGR is (255, 0, 0)
    create_color_image("red_face.jpg", (0, 0, 255))
    create_color_image("blue_face.jpg", (255, 0, 0))
    
    try:
        # 2. Register Users
        red_id = register("Red User", "red_face.jpg")
        blue_id = register("Blue User", "blue_face.jpg")
        
        if not red_id or not blue_id:
            print("Registration failed. Aborting.")
            return

        print("-" * 30)
        
        # 3. Test Attendance (Positive Matches)
        print("TEST 1: Red should match Red")
        res_red = mark_attendance("red_face.jpg")
        if res_red and res_red['results'][0]['status'] == 'success' and res_red['results'][0]['person'] == 'Red User':
             print("✅ PASS: Red matched Red")
        else:
             print("❌ FAIL: Red did not match Red")

        print("-" * 30)

        print("TEST 2: Blue should match Blue")
        res_blue = mark_attendance("blue_face.jpg")
        if res_blue and res_blue['results'][0]['status'] == 'success' and res_blue['results'][0]['person'] == 'Blue User':
             print("✅ PASS: Blue matched Blue")
        else:
             print("❌ FAIL: Blue did not match Blue")
             
        print("-" * 30)
        
        # 4. Test Mix (Negative Match? or Cross Match?)
        # Since histograms are distinct, they should NOT match.
        # But wait, tolerance might be loose? 
        # Actually in `mark_attendance`, it loops through ALL users and finds the BEST score.
        # So Red Image should have much better score with Red User than Blue User.
        
    finally:
        # Cleanup
        if os.path.exists("red_face.jpg"): os.remove("red_face.jpg")
        if os.path.exists("blue_face.jpg"): os.remove("blue_face.jpg")

if __name__ == "__main__":
    main()
