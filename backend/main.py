from fastapi import FastAPI, UploadFile, File, HTTPException, Body, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
import os
import uuid
import shutil
import numpy as np
import cv2
from datetime import datetime
from face_auth import FaceAuthSystem
from database import supabase
from utils.notifications import send_email, send_sms
from utils.geo import is_within_radius

app = FastAPI(title="AI Smart Attendance")

# --- CONFIGURATION ---
# Default Classroom Location (Example: University Center)
# Replace with actual coordinates of your classroom/office
CLASSROOM_COORDS = {
    "lat": 12.9716, # Example: Bangalore
    "lng": 77.5946
}
MAX_DISTANCE_METERS = 200  # Allow 200m radius

# Set to True to enforce location checking (will reject if too far)
# Set to False to only log warnings (recommended for testing)
ENFORCE_GEOFENCING = False


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(500)
async def internal_exception_handler(request, exc):
    import traceback
    traceback_str = traceback.format_exc()
    print(f"🔥 CRITICAL 500 ERROR: {traceback_str}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "traceback": traceback_str},
    )



face_auth = FaceAuthSystem()

@app.get("/")
def read_root():
    return {"status": "online", "message": "AI Smart Attendance System API"}

@app.post("/register")
async def register(
    name: str = Form(...),
    email: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    image: UploadFile = File(...)
):
    print(f"📝 Register request received for: {name}")
    
    # Save temp file
    temp_filename = f"temp_{uuid.uuid4()}_{image.filename}"
    try:
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        print(f"✅ Image saved to {temp_filename}")
        
        # Check Liveness (Anti-Spoofing)
        print("Running liveness check...")
        is_live, liveness_score = face_auth.check_liveness(temp_filename)
        print(f"Liveness result: {is_live}, score: {liveness_score}")
        
        if not is_live:
             print("❌ Liveness check failed.")
             raise HTTPException(status_code=403, detail="Liveness check failed. Please ensure a real person is registering.")
             
        print(f"Extraction started for {name}")
        # Get face encoding
        encodings = face_auth.extract_face_encodings(temp_filename)
        print(f"Extraction finished. Found: {len(encodings) if encodings else 0}")
        
        if not encodings:
            print("❌ No face detected.")
            raise HTTPException(status_code=400, detail="No face detected")
        if len(encodings) > 1:
            print("❌ Multiple faces detected.")
            raise HTTPException(status_code=400, detail="Multiple faces detected. Please ensure only one person is in the frame for registration.")
            
        encoding = encodings[0]
        
        # Store in Supabase
        # Convert numpy array to list for JSON storage
        encoding_list = encoding.tolist()
        
        data = {
            "name": name,
            "email": email,
            "phone": phone,
            "face_encoding": encoding_list
        }
        
        print("Inserting user into Supabase...")
        response = supabase.table("users").insert(data).execute()
        print(f"Supabase response: {response}")
        
        if not response.data:
             print("❌ Failed to save user to database (no data returned).")
             raise HTTPException(status_code=500, detail="Failed to save user to database")
             
        print("✅ User registered successfully.")
        return {"status": "success", "user_id": response.data[0]['id'], "message": "User registered successfully"}

    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"🔥 CRITICAL ERROR in /register: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
            except Exception as e:
                print(f"Warning: Failed to delete temp file {temp_filename}: {e}")

@app.post("/mark_attendance")
async def mark_attendance(
    file: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None)
):
    print("📝 Mark Attendance request received.")
    image = file
    
    # 1. Read image
    try:
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img_cv is None:
             print("❌ Invalid image format received.")
             raise HTTPException(status_code=400, detail="Invalid image format")
        
        temp_filename = f"temp_attend_{uuid.uuid4()}_{image.filename}"
        
        # Save temp file for face_auth (if it relies on paths)
        with open(temp_filename, "wb") as f:
            f.write(contents)
        
        print(f"📸 Processing attendance image: {temp_filename}")
        print(f"📍 Location: lat={latitude}, lng={longitude}")

        # 1. Check Liveness
        print("Checking liveness...")
        is_live, liveness_score = face_auth.check_liveness(temp_filename)
        print(f"👁️ Liveness: is_live={is_live}, score={liveness_score}")
        
        if not is_live:
             print("❌ Liveness check failed.")
             raise HTTPException(status_code=403, detail="Liveness check failed. Please open eyes and look at camera.")

        # 1.5 Geofencing Check
        if latitude is not None and longitude is not None:
            is_valid, dist = is_within_radius(float(latitude), float(longitude), CLASSROOM_COORDS['lat'], CLASSROOM_COORDS['lng'], MAX_DISTANCE_METERS)
            print(f"🌍 Geo Check: User at ({latitude}, {longitude}), Dist={dist:.2f}m. Validity={is_valid}")
            
            if not is_valid:
                if ENFORCE_GEOFENCING:
                    print("❌ Geofencing violation enforced.")
                    raise HTTPException(status_code=403, detail=f"You are too far from class! ({dist:.0f}m away)")
                else:
                    print(f"⚠️ WARNING: User is {dist:.0f}m away from classroom (enforcement disabled)")
        else:
            print("⚠️ Location missing in request. Skipping Geo Check.")

        # 2. Match Face(s)
        print("Extracting face encodings...")
        encodings = face_auth.extract_face_encodings(temp_filename)
        print(f"👤 Found {len(encodings) if encodings else 0} faces")
        
        if not encodings:
            print("❌ No face detected.")
            raise HTTPException(status_code=404, detail="No face detected")
            
        # Fetch all users
        print("Fetching users from Supabase...")
        response = supabase.table("users").select("*").execute()
        users = response.data
        print(f"Fetched {len(users)} users from database.")
        
        results = []
        
        for encoding in encodings:
            match_user = None
            best_score = 0.0
            
            for user in users:
                stored_encoding = user.get('face_encoding')
                if not stored_encoding: continue
                
                # Handle cases where stored_encoding might be None or invalid format
                if not isinstance(stored_encoding, list):
                    continue

                is_match, distance = face_auth.match_face(encoding, stored_encoding)
                if is_match:
                    score = (1.0 - distance) * 100
                    if score > best_score:
                        best_score = score
                        match_user = user
            
            if match_user:
                print(f"✅ Match found: {match_user['name']} with score {best_score}")
                # Log attendance
                import base64
                
                # Convert image for storage (resize to save space?)
                # For now, just re-encode the original buffer or the cv2 image
                _, buffer = cv2.imencode('.jpg', img_cv)
                img_base64 = base64.b64encode(buffer).decode('utf-8')
                
                att_data = {
                    "user_id": match_user['id'],
                    "timestamp": datetime.utcnow().isoformat(),
                    "liveness_score": liveness_score,
                    "confidence": best_score,
                    "captured_image": img_base64 # storing base64 directly
                }
                # Add location if exists
                if latitude is not None and longitude is not None:
                    att_data["latitude"] = latitude
                    att_data["longitude"] = longitude

                try:
                    print(f"Inserting attendance record for {match_user['name']}...")
                    supabase.table("attendance").insert(att_data).execute()
                    
                    # Send Notifications
                    user_email = match_user.get('email')
                    user_phone = match_user.get('phone')
                    
                    if user_email:
                        # process in background if possible, or just catch errors
                        try:
                            # send_email(user_email, "Attendance Marked", f"Hello {match_user['name']}, your attendance has been marked at {att_data['timestamp']}.")
                            pass 
                        except: pass
                    
                    # if user_phone:
                    #     send_sms(user_phone, f"Attendance marked for {match_user['name']} at {att_data['timestamp']}")
                    
                    print(f"[\033[92mNOTIFICATION\033[0m] Attendance notification processed for {match_user['name']}")
                    
                    results.append({
                        "status": "success",
                        "person": match_user['name'],
                        "user_id": match_user['id'],
                        "liveness": "verified",
                        "confidence": best_score,
                         "location": {"lat": latitude, "lng": longitude} if latitude else None
                    })
                    
                except Exception as e:
                     print(f"🔥 DB Insert Error: {e}")
                     # Retry without image if column missing
                     if "captured_image" in att_data:
                         print("Retrying without captured_image...")
                         del att_data["captured_image"]
                         try:
                             supabase.table("attendance").insert(att_data).execute()
                             results.append({
                                "status": "success",
                                "person": match_user['name'],
                                "user_id": match_user['id'],
                                "liveness": "verified",
                                "confidence": best_score,
                                "message": "Attendance marked (Image save failed)",
                                "location": {"lat": latitude, "lng": longitude} if latitude else None
                            })
                         except Exception as retry_e:
                             print(f"Retry failed: {retry_e}")
                             results.append({"status": "error", "message": f"DB Error for {match_user['name']}"})
                     else:
                        results.append({"status": "error", "message": f"DB Error for {match_user['name']}"})
            else:
                print("❌ No match found for face.")
                results.append({"status": "failed", "message": "Unknown face"})

        return {
            "status": "processed",
            "results": results,
            "total_faces": len(encodings),
            "marked_count": len([r for r in results if r['status'] == 'success'])
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"🔥 CRITICAL ERROR in /mark_attendance: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
            except: pass

@app.get("/attendance/history")
async def get_history():
    # Join with users table
    response = supabase.table("attendance").select("*, users(name)").order("timestamp", desc=True).execute()
    return {"status": "success", "records": response.data}


# --- STUDENT PORTAL ENDPOINTS ---

@app.post("/login")
async def student_login(image: UploadFile = File(...)):
    """
    Face-based login. Returns user_id if face matches a registered user.
    """
    print("📝 Student Login request received.")
    temp_filename = f"login_{uuid.uuid4()}_{image.filename}"
    try:
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        print(f"✅ Login image saved to {temp_filename}")

        # 1. Extract Face
        print("Extracting face for login...")
        encodings = face_auth.extract_face_encodings(temp_filename)
        if not encodings:
            print("❌ No face detected.")
            raise HTTPException(status_code=401, detail="No face detected")
        
        login_encoding = encodings[0]

        # 2. Fetch all users to compare
        print("Fetching users for comparison...")
        response = supabase.table("users").select("*").execute()
        users = response.data

        match_user = None
        best_score = 0.0

        for user in users:
            stored_encoding = user.get('face_encoding')
            if not stored_encoding: continue

            # Match
            is_match, distance = face_auth.match_face(login_encoding, stored_encoding)
            
            if is_match:
                score = (1.0 - distance) * 100
                if score > best_score:
                    best_score = score
                    match_user = user
        
        if match_user:
            print(f"✅ Login Successful for: {match_user['name']}")
            return {
                "status": "success",
                "message": "Login successful",
                "user_id": match_user['id'],
                "name": match_user['name']
            }
        else:
            print("❌ Face not recognized.")
            raise HTTPException(status_code=401, detail="Face not recognized")

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"🔥 Login Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Login processing failed")
    finally:
        if os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
            except: pass

@app.get("/student/{user_id}")
async def get_student_profile(user_id: str):
    """
    Get generic student profile details.
    """
    try:
        response = supabase.table("users").select("*").eq("id", user_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Student not found")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/student/{user_id}/attendance")
async def get_student_attendance(user_id: str):
    """
    Get attendance history for a specific student.
    """
    try:
        # Order by newest first
        response = supabase.table("attendance").select("*").eq("user_id", user_id).order("timestamp", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- ADMIN AUTHENTICATION ---
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
admin_sessions = set()

@app.post("/admin/login")
async def admin_login(username: str = Form(...), password: str = Form(...)):
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        token = str(uuid.uuid4())
        admin_sessions.add(token)
        return {"status": "success", "token": token}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/admin/verify")
async def admin_verify(token: str = Form(...)):
    if token in admin_sessions:
        return {"status": "success", "valid": True}
    return {"status": "success", "valid": False}

@app.post("/admin/logout")
async def admin_logout(token: str = Form(...)):
    admin_sessions.discard(token)
    return {"status": "success"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
