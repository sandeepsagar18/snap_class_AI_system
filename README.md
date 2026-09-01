# 🎓 SnapClass AI - Next-Gen Smart Facial Recognition Attendance System

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Python](https://img.shields.io/badge/Python_3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare_Tunnel-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://cloudflare.com/)

**SnapClass AI** is a state-of-the-art AI-powered smart classroom attendance and analytics platform. Built with **FastAPI**, **Deep Face Recognition (128-d Biometric Embeddings)**, **React + Vite**, and **PostgreSQL**, SnapClass AI automates student verification, eliminates proxy attendance, and exports comprehensive semester-level attendance dossiers with a single click.

---

## 🌟 Key Features

### 1. ⚡ Two-Stage Smart Attendance Workflow
- **Stage 1 (Classroom Projection QR)**: Teachers configure the lecture details (Teacher Name, Faculty/Dept, Subject Name & Code, Branch, Year, Section) and project a dynamic QR code.
- **Stage 2 (Live AI Face Recognition Camera)**: Once students scan and register, the teacher launches live camera verification to mark attendance automatically in real-time.

### 2. 📱 Universal Mobile QR Registration (All Networks Supported)
- **Multi-Network Support**: Students can scan the QR code from **any network** — classroom Wi-Fi, mobile hotspot, or **cellular 4G/5G mobile data (Jio, Airtel, Vi)** via built-in Cloudflare tunnel reverse proxy.
- **Dedicated In-Class Card**: Scanning the QR code opens only the clean, focused student registration card (no extra dashboard clutter).
- **Selfie Biometric Capture**: Students snap a live selfie photo via their native smartphone camera.
- **Smart Memory Auto-Fill**: Student details (Roll No, Name, Branch, Section) are remembered locally on their device for 1-click registration in all future lectures.

### 3. 🤖 High-Accuracy Biometric Face Recognition
- Generates **128-dimensional facial embedding vectors** using deep metric learning (`dlib` + ResNet).
- Real-time frame analysis with multi-face detection, bounding boxes, and dynamic cosine similarity thresholding ($< 0.45$ distance).
- Instant model retraining on the fly whenever a new student joins the roster.

### 4. 📊 Dynamic Roster Querying & Verification
- Filter students dynamically by **Course**, **Branch**, **Class/Academic Year**, and **Section**.
- Matches detected student faces against enrolled roster entries:
  - 🟢 **Recognized in DB Roster** $\longrightarrow$ Marked **`PRESENT`**
  - 🔴 **Not Detected / Absent** $\longrightarrow$ Marked **`ABSENT`**

### 5. 📑 Automated Excel & CSV Export (.xlsx)
- **Single Lecture Session Report**: Generates structured `.xlsx` spreadsheets complete with S.No, Roll No, Student Name, Email, Course, Branch, Section, Attendance Status, **Verification Mode**, and **Exact Date & Timestamp**.
- **Cumulative Multi-Sheet Semester Dossier**:
  - *Sheet 1*: Cumulative summary with total lectures held, attended, missed, attendance percentage, and **75% eligibility shortage alerts**.
  - *Sheet 2*: Full lecture-by-lecture attendance timeline matrix.
  - *Sheet 3*: Raw detailed audit log trail.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Teacher["Teacher Dashboard"]
        T1["1. Configure Lecture (Teacher, Dept, Subject, Branch, Section)"]
        T2["2. Project Dynamic Class QR Code"]
        T3["3. Launch Live AI Camera Stream"]
        T4["4. Automatic Excel (.xlsx) Export"]
    end

    subgraph Student["Student Smartphone (Any Network 4G/5G / Wi-Fi)"]
        S1["Scan QR Code"]
        S2["Auto-fill Details (Name, Roll No, Branch, Sec)"]
        S3["Snap Live Selfie Face Photo"]
        S4["Submit Registration"]
    end

    subgraph Cloud["Cloudflare Edge & Reverse Proxy"]
        CF["HTTPS Secure Tunnel"]
    end

    subgraph Backend["FastAPI AI Engine (Python 3.13)"]
        B1["/api/lecture-sessions/create"]
        B2["/api/lecture-sessions/{id}/register-student"]
        B3["128-d Face Embedding Generator (dlib)"]
        B4["/api/predict-face-attendance"]
    end

    subgraph Database["PostgreSQL / Supabase"]
        DB1[("students (embeddings, photos, credentials)")]
        DB2[("subjects & subject_students")]
        DB3[("attendance_logs")]
    end

    T1 --> T2
    T2 -.->|Projected QR Link| CF
    CF --> S1
    S1 --> S2 --> S3 --> S4
    S4 -->|Encrypted POST Request| B2
    B2 --> B3
    B3 --> DB1
    B2 --> DB2
    B2 -.->|Real-time Poll| T2
    T2 --> T3
    T3 -->|Live Video Frames| B4
    B4 -->|Face Match Algorithm| DB1
    B4 --> DB3
    T3 --> T4
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python 3.10+** (Python 3.13 recommended)
- **Node.js 18+** & `npm`
- **CMake & Visual Studio C++ Build Tools** (for `dlib`)
- **Git**

### 2. Clone the Repository
```bash
git clone https://github.com/sandeepsagar18/snap_class_AI_system.git
cd snap_class_AI_system
```

### 3. Backend Setup (FastAPI & AI Biometrics)
```bash
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate # Linux / macOS

# Install dependencies
pip install fastapi uvicorn dlib face_recognition pillow numpy supabase bcrypt python-multipart openpyxl
```

Configure your environment variables in `.env`:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

Run the backend server:
```bash
python -m uvicorn api:app --host 0.0.0.0 --port 8000
```

### 4. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev -- --host
```

Access the application in your browser:
- **Teacher / Student Portal**: `http://localhost:5173`
- **API Documentation**: `http://127.0.0.1:8000/docs`

---

## 📁 Project Structure

```
snap_class_AI_system/
├── api.py                          # FastAPI server & biometric AI recognition endpoints
├── src/
│   ├── database/
│   │   └── db.py                   # Supabase PostgreSQL database operations
│   └── models/                     # Deep learning face recognition models & embeddings
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── StartAttendanceConfigModal.jsx   # Pre-session teacher & subject configuration
│   │   │   ├── LectureQRRegistrationModal.jsx   # Dynamic QR projector & real-time roster sync
│   │   │   ├── StudentLectureJoinView.jsx       # Dedicated student mobile registration view
│   │   │   ├── CameraCapture.jsx                # Native mobile camera & webcam photo capture
│   │   │   ├── LiveSessionModal.jsx             # Live stream face detection & verification
│   │   │   └── AttendanceResultModal.jsx        # Snapshot attendance & override modal
│   │   ├── pages/
│   │   │   ├── TeacherDashboard.jsx             # Teacher control center & analytics
│   │   │   ├── StudentDashboard.jsx             # Student attendance portal & history
│   │   │   └── LandingPage.jsx                  # Main authentication landing page
│   │   └── lib/
│   │       ├── api.js                           # API client with automatic reverse proxy
│   │       └── excelExport.js                   # Multi-sheet semester Excel report generator
│   ├── package.json
│   └── vite.config.js
├── README.md
└── requirements.txt
```

---

## 🔒 Security & Privacy
- Face photos are converted into mathematical **128-dimensional embedding vectors**; raw image storage is optional.
- All communications are served over **HTTPS** via Cloudflare Tunnel encryption.
- Passwords and authentication hashes use **Bcrypt** cryptographic salt.

---

## 👨‍💻 Author & Contributions
Developed by **[Sandeep Sagar](https://github.com/sandeepsagar18)**  
*Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/sandeepsagar18/snap_class_AI_system/issues).*

---

## 📜 License
This project is licensed under the MIT License.
