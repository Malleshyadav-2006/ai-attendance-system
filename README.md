# AI Smart Attendance System

A full-stack biometric attendance system with anti-spoofing capabilities.

## Tech Stack
- **Frontend**: Next.js (React), Tailwind CSS
- **Backend**: FastAPI (Python), OpenCV, Face Recognition, MediaPipe
- **Database**: Supabase (PostgreSQL)

## Prerequisites
- Node.js & npm
- Python 3.9+
- Pip

## Setup

1. **Clone/Download** the repository.
2. **Backend Setup**:
   ```bash
   cd backend
   pip install -r requirements.txt
   # Ensure .env has database credentials
   ```
3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   ```

## How to Run

### Option 1: Automatic Launcher (Windows)
Double-click `start_app.bat` to launch both servers.

### Option 2: Manual Start
**Terminal 1 (Backend)**:
```bash
cd backend
python -m uvicorn main:app --reload
```
*Server runs on http://localhost:8000*

**Terminal 2 (Frontend)**:
```bash
cd frontend
npm run dev
```
*App runs on http://localhost:3000*

## Features
- **Registration**: Capture face for new users.
- **Mark Attendance**: Liveness check + Face matching.
- **Voice Feedback**: Audio confirmation.
- **Multi-Face**: Detects multiple people at once.
- **Geo-Fencing**: Logs location.
- **Analytics**: Admin dashboard charts.
