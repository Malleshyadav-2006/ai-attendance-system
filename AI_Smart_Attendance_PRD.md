# Product Requirements Document (PRD)
## AI Smart Attendance with Anti-Spoofing

---

## 1. Executive Summary

### 1.1 Product Overview
AI Smart Attendance with Anti-Spoofing is a web-based biometric attendance system designed for educational institutions. The system uses facial recognition combined with active liveness detection to prevent spoofing attacks, ensuring authentic attendance marking.

### 1.2 Problem Statement
Traditional attendance systems are vulnerable to fraud through photo/video spoofing, buddy punching, and proxy attendance. Manual attendance processes are time-consuming and prone to errors.

### 1.3 Solution
A real-time facial recognition system with active liveness detection that requires users to perform specific actions (blinking, head movements) to verify they are physically present, not using photos or videos.

### 1.4 Target Audience
- **Primary:** Educational institutions (colleges, universities)
- **Secondary:** Corporate offices, training centers
- **End Users:** Students, faculty, administrators

---

## 2. Product Goals & Success Metrics

### 2.1 Primary Goals
1. Achieve 95%+ accuracy in facial recognition
2. Prevent 99%+ of spoofing attempts
3. Reduce attendance marking time to <10 seconds per student
4. Support 500+ registered users per instance

### 2.2 Success Metrics
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Recognition Accuracy | ≥95% | True positive rate |
| Spoof Detection Rate | ≥99% | False acceptance rate |
| Average Marking Time | <10 sec | Time from detection to logging |
| System Uptime | ≥99.5% | Monthly availability |
| User Registration Time | <30 sec | End-to-end registration flow |

---

## 3. Scope & Features

### 3.1 In-Scope Features (MVP)

#### 3.1.1 User Registration
- **Description:** Capture and store user facial data for future recognition
- **User Story:** As a student, I want to register my face so the system can identify me for attendance
- **Acceptance Criteria:**
  - User provides name and captures face image
  - System generates 128-dimensional face encoding
  - Encoding stored in database with user metadata
  - Registration completes in <30 seconds
  - Feedback provided for poor quality images

#### 3.1.2 Active Liveness Detection
- **Description:** Anti-spoofing mechanism requiring user interaction
- **User Story:** As an administrator, I want to prevent students from marking attendance using photos or videos
- **Acceptance Criteria:**
  - System prompts user for specific action (blink 3 times OR turn head left)
  - Eye Aspect Ratio (EAR) calculation using MediaPipe Face Mesh
  - Detection of eye closure and reopening cycle
  - Liveness check completes in <5 seconds
  - Clear visual/audio feedback for user actions

#### 3.1.3 Face Recognition & Matching
- **Description:** Identify registered users from live video feed
- **User Story:** As a student, I want the system to automatically recognize my face and mark my attendance
- **Acceptance Criteria:**
  - Real-time face detection from webcam feed
  - Comparison against stored face encodings
  - Match threshold: >80% similarity score
  - Response time: <2 seconds
  - Handle multiple faces in frame (identify closest)

#### 3.1.4 Attendance Logging
- **Description:** Record successful attendance events with timestamp
- **User Story:** As an administrator, I want to track when each student marked attendance
- **Acceptance Criteria:**
  - Log user ID, name, timestamp, and liveness status
  - Prevent duplicate entries within same session (e.g., 1-hour window)
  - Store data persistently in database
  - Generate unique attendance ID for each record

#### 3.1.5 Admin Dashboard
- **Description:** View and manage attendance records
- **User Story:** As an administrator, I want to view attendance history and statistics
- **Acceptance Criteria:**
  - Display attendance logs in tabular format
  - Filter by date, user, or status
  - Export data to CSV
  - Show summary statistics (present/absent counts)
  - Responsive design for mobile/tablet viewing

### 3.2 Out-of-Scope (Future Enhancements)
- Multi-factor authentication (face + PIN)
- Mobile application (iOS/Android)
- Passive liveness detection (texture analysis, depth sensing)
- Integration with existing LMS (Canvas, Moodle)
- Facial mask detection
- Emotion/attention detection
- Multi-camera support
- Cloud deployment with scaling

---

## 4. Technical Architecture

### 4.1 Technology Stack

#### Backend
- **Framework:** FastAPI (Python 3.9+)
- **Rationale:** High performance, async support, automatic API documentation, easy ML integration

#### AI/ML Libraries
- **face_recognition:** Face encoding and matching (based on dlib)
- **MediaPipe:** Real-time face mesh detection for liveness
- **OpenCV:** Image processing and video capture
- **NumPy:** Numerical computations

#### Database
- **Primary Option:** SQLite
  - Pros: Zero configuration, file-based, sufficient for MVP
  - Cons: Limited concurrency
- **Alternative:** PostgreSQL (for production scaling)

#### Frontend
- **Primary Option:** React.js 18+ with TypeScript
  - Modern, component-based architecture
  - Rich ecosystem for webcam integration
- **Fallback Option:** Streamlit (rapid prototyping)

#### Styling & UI
- **Tailwind CSS:** Utility-first styling for rapid development
- **react-webcam:** Webcam access component

### 4.2 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Registration │  │  Attendance  │  │    Admin     │      │
│  │     Page     │  │     Mode     │  │  Dashboard   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│                    REST API (HTTPS)                         │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                      Backend Layer (FastAPI)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   /register  │  │/mark_        │  │/attendance/  │      │
│  │              │  │ attendance   │  │   history    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│                   FaceAuthSystem Class                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │  - check_liveness()                                │    │
│  │  - extract_face_encoding()                         │    │
│  │  - match_face()                                    │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                      Database Layer                         │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │   users Table    │  │ attendance Table │                │
│  │ - id             │  │ - id             │                │
│  │ - name           │  │ - user_id        │                │
│  │ - face_encoding  │  │ - timestamp      │                │
│  │ - created_at     │  │ - liveness_score │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Data Models

#### User Model
```python
{
  "id": "uuid",
  "name": "string",
  "face_encoding": "blob (128-d vector)",
  "registered_at": "datetime",
  "is_active": "boolean"
}
```

#### Attendance Model
```python
{
  "id": "uuid",
  "user_id": "foreign_key",
  "timestamp": "datetime",
  "liveness_verified": "boolean",
  "confidence_score": "float",
  "session_id": "string"
}
```

---

## 5. API Specifications

### 5.1 POST /register
**Description:** Register a new user with face data

**Request:**
```json
{
  "name": "string",
  "image": "base64_encoded_string OR multipart/form-data"
}
```

**Response (Success - 201):**
```json
{
  "status": "success",
  "user_id": "uuid",
  "message": "User registered successfully"
}
```

**Response (Failure - 400):**
```json
{
  "status": "error",
  "error_code": "NO_FACE_DETECTED",
  "message": "No face detected in image. Please ensure face is clearly visible."
}
```

**Error Codes:**
- `NO_FACE_DETECTED`: No face found in image
- `MULTIPLE_FACES`: More than one face detected
- `POOR_IMAGE_QUALITY`: Image too dark, blurry, or low resolution
- `DUPLICATE_USER`: Face already registered

### 5.2 POST /mark_attendance
**Description:** Mark attendance for a user after liveness verification

**Request:**
```json
{
  "image": "base64_encoded_string OR multipart/form-data",
  "session_id": "string (optional)"
}
```

**Response (Success - 200):**
```json
{
  "status": "success",
  "person": "string",
  "user_id": "uuid",
  "liveness": "verified",
  "confidence": 0.95,
  "timestamp": "ISO8601 datetime"
}
```

**Response (Spoof Detected - 403):**
```json
{
  "status": "failed",
  "error_code": "LIVENESS_FAILED",
  "message": "Liveness check failed. Please blink 3 times.",
  "liveness": "not_verified"
}
```

**Response (No Match - 404):**
```json
{
  "status": "failed",
  "error_code": "USER_NOT_RECOGNIZED",
  "message": "Face not recognized. Please register first."
}
```

### 5.3 GET /attendance/history
**Description:** Retrieve attendance logs with optional filters

**Query Parameters:**
- `user_id` (optional): Filter by specific user
- `start_date` (optional): Filter from date
- `end_date` (optional): Filter to date
- `limit` (optional): Number of records (default: 100)
- `offset` (optional): Pagination offset

**Response (200):**
```json
{
  "status": "success",
  "count": 150,
  "records": [
    {
      "id": "uuid",
      "user_name": "string",
      "timestamp": "ISO8601 datetime",
      "liveness_verified": true,
      "confidence": 0.95
    }
  ]
}
```

---

## 6. Liveness Detection Algorithm

### 6.1 Method: Active Liveness (Eye Aspect Ratio)

**Algorithm Flow:**
1. Detect face using MediaPipe Face Mesh
2. Identify 6 eye landmarks per eye (inner, outer, top-3, bottom-3)
3. Calculate Eye Aspect Ratio (EAR):
   ```
   EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
   ```
   Where p1-p6 are eye landmark coordinates
4. Track EAR over frames:
   - Open eye: EAR > 0.25
   - Closed eye: EAR < 0.20
5. Detect blink cycle: Open → Closed → Open
6. Require 3 complete blink cycles within 5 seconds
7. Return `True` if successful, `False` otherwise

**Alternative Method (Head Movement):**
- Track head pose angles (yaw, pitch, roll)
- Prompt: "Turn your head left"
- Verify yaw angle changes by >20 degrees

### 6.2 Parameters
- **EAR Threshold (Closed):** 0.20
- **EAR Threshold (Open):** 0.25
- **Blink Duration:** 0.1-0.4 seconds
- **Required Blinks:** 3
- **Time Window:** 5 seconds
- **Frame Rate:** 30 FPS

---

## 7. User Experience (UX) Requirements

### 7.1 Registration Flow
1. User lands on registration page
2. System requests webcam permission
3. Live video feed displayed with face outline overlay
4. User enters name in text field
5. User clicks "Capture" button
6. System provides feedback:
   - ✅ "Face detected. Processing..."
   - ❌ "No face detected. Please adjust position."
7. Success confirmation with user preview
8. Redirect to attendance page

### 7.2 Attendance Marking Flow
1. User navigates to attendance page
2. Webcam feed starts automatically
3. System displays instruction: "Please blink 3 times"
4. Visual indicator shows blink count (1/3, 2/3, 3/3)
5. Upon successful liveness:
   - Green border around video feed
   - Face recognition runs
6. Success state:
   - Display: "Welcome, [Name]! Attendance marked."
   - Show timestamp
   - Auto-reset after 3 seconds
7. Failure state:
   - Red border with error message
   - Retry button

### 7.3 Admin Dashboard
1. Login required (basic auth for MVP)
2. Summary cards:
   - Total students
   - Present today
   - Absent today
   - System uptime
3. Data table with columns:
   - Name | Date | Time | Status | Confidence
4. Filters: Date range picker, user search
5. Export button (CSV download)

---

## 8. Non-Functional Requirements

### 8.1 Performance
- **Response Time:** API endpoints respond in <2 seconds (95th percentile)
- **Throughput:** Support 50 concurrent users
- **Face Recognition:** Process frame in <500ms
- **Liveness Check:** Complete in <5 seconds

### 8.2 Security
- Input validation on all API endpoints
- SQL injection prevention (parameterized queries)
- XSS protection in frontend
- HTTPS required for production
- Webcam access permission gating
- Rate limiting: 10 requests/minute per IP

### 8.3 Reliability
- **Uptime:** 99.5% availability
- **Data Persistence:** No data loss on system crash
- **Error Handling:** Graceful degradation with user-friendly messages
- **Logging:** All attendance events and errors logged

### 8.4 Scalability
- Support 500 registered users (MVP)
- Handle 100 attendance markings per hour
- Database query optimization with indexing
- Future: Horizontal scaling with load balancer

### 8.5 Usability
- **Webcam Compatibility:** Support Chrome, Firefox, Safari, Edge
- **Mobile Responsive:** Dashboard viewable on tablets/phones
- **Accessibility:** WCAG 2.1 Level AA compliance
- **Browser Support:** Latest 2 versions of major browsers
- **Loading States:** Visual feedback for all async operations

### 8.6 Privacy & Compliance
- Face encodings stored, not raw images (GDPR consideration)
- User consent required before webcam access
- Data retention policy: 90 days
- Option to delete user data on request
- Encrypted database connections (production)

---

## 9. Development Phases

### Phase 1: Core AI Engine (Week 1-2)
**Deliverables:**
- `FaceAuthSystem` class with:
  - `extract_face_encoding()`
  - `check_liveness()` with EAR calculation
  - `match_face()` with threshold tuning
- Unit tests with sample images
- Benchmark report (accuracy, speed)

**Success Criteria:**
- 90%+ accuracy on test dataset
- Liveness detection rejects printed photos

### Phase 2: Backend API (Week 2-3)
**Deliverables:**
- FastAPI application with endpoints
- SQLAlchemy models and migrations
- Database seeding scripts
- API documentation (auto-generated)
- Postman collection for testing

**Success Criteria:**
- All endpoints functional and tested
- <2 second response times
- Proper error handling

### Phase 3: Frontend Development (Week 3-4)
**Deliverables:**
- React application with routing
- Webcam integration with react-webcam
- Registration and attendance pages
- Admin dashboard with filters
- Tailwind CSS styling

**Success Criteria:**
- Responsive design (mobile, tablet, desktop)
- Smooth webcam feed (30 FPS)
- Intuitive user flow

### Phase 4: Integration & Testing (Week 4-5)
**Deliverables:**
- End-to-end testing suite
- Performance benchmarks
- Bug fixes and optimizations
- Demo video and documentation
- Deployment guide

**Success Criteria:**
- All features working together
- <5% error rate in integration tests
- Ready for expo demonstration

---

## 10. Risk Assessment

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| Poor lighting affects recognition | High | High | Add lighting quality check, provide user guidance |
| Liveness bypass with sophisticated attacks | Medium | High | Document limitations, consider 3D depth sensors for future |
| Webcam compatibility issues | Medium | Medium | Test on multiple browsers, provide fallback UI |
| Database performance degradation | Low | Medium | Implement indexing, query optimization |
| User adoption resistance | Medium | Low | Provide training, highlight privacy protections |
| Expo demo failure | Low | High | Extensive rehearsal, backup laptop, offline mode |

---

## 11. Assumptions & Constraints

### Assumptions
- Users have webcam-enabled devices
- Adequate lighting in attendance environment
- Users willing to perform active liveness actions
- Network connectivity available (for cloud deployment)
- One person per attendance session

### Constraints
- Development timeline: 5 weeks
- Team size: 1-2 developers
- Budget: Zero (open-source tools only)
- Hardware: Standard webcams (720p minimum)
- Browser requirement: Modern browsers with WebRTC support

---

## 12. Expo Demonstration Strategy

### 12.1 Demo Script
**Duration:** 3-5 minutes

1. **Introduction (30 sec)**
   - Problem statement: Attendance fraud is common
   - Solution: AI-powered anti-spoofing system

2. **Registration Demo (1 min)**
   - Register a new user live
   - Show face encoding generation
   - Display database entry

3. **Spoofing Attempt (1 min)**
   - Hold up printed photo to webcam
   - System rejects with "Spoof Detected" message
   - Explain liveness detection mechanism

4. **Successful Attendance (1 min)**
   - Perform blink action
   - System recognizes face and marks attendance
   - Show real-time update in dashboard

5. **Dashboard Overview (1 min)**
   - Navigate to admin panel
   - Show attendance logs
   - Highlight key statistics

6. **Q&A (1 min)**

### 12.2 Backup Plans
- **Backup Laptop:** Configured identically
- **Offline Mode:** Preloaded with test data
- **Video Recording:** Full demo as fallback
- **Printed Slides:** Architecture diagrams and technical details

### 12.3 Key Selling Points
1. **Active Liveness Detection:** Superior to passive systems
2. **Real-time Processing:** <10 second attendance marking
3. **Scalable Architecture:** Ready for cloud deployment
4. **Privacy-Focused:** No raw image storage
5. **Open-Source Stack:** Cost-effective implementation

---

## 13. Future Roadmap (Post-Expo)

### Version 2.0 (Q2 2025)
- Multi-factor authentication (face + PIN)
- Mobile app (React Native)
- Cloud deployment (AWS/Azure)
- Advanced analytics dashboard

### Version 3.0 (Q3 2025)
- Passive liveness detection (no user action required)
- Facial mask detection
- Integration with LMS platforms
- Multi-language support

### Long-term Vision
- Enterprise SaaS platform
- AI-powered attention tracking
- Emotion analytics for engagement
- Hardware partnership (custom cameras)

---

## 14. Appendix

### 14.1 Glossary
- **Face Encoding:** 128-dimensional vector representing facial features
- **EAR:** Eye Aspect Ratio, metric for eye openness
- **Liveness Detection:** Process to verify a real person vs. photo/video
- **Spoofing:** Attack using fake biometric data
- **MediaPipe:** Google's ML framework for real-time perception

### 14.2 References
- [Face Recognition Library](https://github.com/ageitgey/face_recognition)
- [MediaPipe Face Mesh](https://google.github.io/mediapipe/solutions/face_mesh.html)
- [Eye Aspect Ratio Paper](https://vision.fe.uni-lj.si/cvww2016/proceedings/papers/05.pdf)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Webcam](https://github.com/mozmorris/react-webcam)

### 14.3 Contact Information
- **Project Owner:** [Your Name]
- **Institution:** [College Name]
- **Event:** IGNITE College Expo
- **Date:** [Expo Date]

---

**Document Version:** 1.0  
**Last Updated:** February 16, 2026  
**Status:** Approved for Development
