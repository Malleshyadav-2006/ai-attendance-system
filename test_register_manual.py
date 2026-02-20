
import requests
import cv2
import numpy as np

# Create a dummy image
img = np.zeros((100, 100, 3), dtype=np.uint8)
cv2.rectangle(img, (10, 10), (50, 50), (255, 0, 0), -1)
cv2.imwrite("test_reg.jpg", img)

url = "http://localhost:8001/register"
files = {'image': open('test_reg.jpg', 'rb')}
data = {
    'name': 'Test User',
    'email': 'test@example.com',
    'phone': '1234567890'
}

try:
    print(f"Sending POST request to {url}...")
    response = requests.post(url, files=files, data=data)
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {response.json()}")
    except:
        print(f"Response (text): {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
