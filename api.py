import os
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Body
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from PIL import Image
import io
import json
import base64
import bcrypt
from typing import Optional, Dict, Any, List

from src.pipelines.face_pipeline import get_face_embeddings, predict_attendance, train_classifier
from src.pipelines.voice_pipeline import get_voice_embeddings, process_bulk_audio
from src.database.db import (
    supabase,
    get_teacher_by_username,
    create_teacher,
    get_teacher_subjects,
    create_subject,
    get_all_students,
    get_student_by_email,
    get_student_by_roll_no,
    get_student_by_identifier,
    create_student,
    get_subject_students,
    enroll_student_to_subject,
    insert_attendance_log,
    get_attendance_for_teacher,
)

CREDENTIALS_FILE = os.path.join(os.path.dirname(__file__), "student_credentials.json")

def _load_local_credentials() -> Dict[str, Any]:
    try:
        if os.path.exists(CREDENTIALS_FILE):
            with open(CREDENTIALS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return {}

def _save_local_credential(student_id: str, email: Optional[str] = None, password_hash: Optional[str] = None, roll_no: Optional[str] = None, name: Optional[str] = None):
    try:
        creds = _load_local_credentials()
        entry = creds.get(student_id, {})
        if email: entry["email"] = email.strip().lower()
        if password_hash: entry["password"] = password_hash
        if roll_no: entry["roll_no"] = roll_no.strip()
        if name: entry["name"] = name.strip()
        creds[student_id] = entry
        with open(CREDENTIALS_FILE, "w", encoding="utf-8") as f:
            json.dump(creds, f, indent=2)
    except Exception as e:
        print("Failed to save local credential:", e)

def _enrich_student_dict(student: Dict[str, Any]) -> Dict[str, Any]:
    if not student:
        return student
    sid = str(student.get("id", ""))
    sname = str(student.get("name", "")).strip().lower()
    sroll = str(student.get("roll_no", "")).strip()

    creds = _load_local_credentials()
    # Find matching cred
    matched = creds.get(sid)
    if not matched:
        for cid, centry in creds.items():
            if (sroll and centry.get("roll_no") == sroll) or (sname and centry.get("name", "").lower() == sname):
                matched = centry
                break
                
    if matched:
        if not student.get("email") and matched.get("email"):
            student["email"] = matched["email"]
        if not student.get("password") and matched.get("password"):
            student["password"] = matched["password"]
    return student

app = FastAPI(title="SnapClass AI Bridge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "SnapClass AI Backend Bridge"}

@app.get("/api/network-ip")
def get_network_ip():
    import socket
    import re
    ip_list = []
    try:
        hostname = socket.gethostname()
        for ip in socket.gethostbyname_ex(hostname)[2]:
            if not ip.startswith("127.") and not ip.startswith("169.254"):
                ip_list.append(ip)
    except Exception:
        pass
    
    # Sort so actual Wi-Fi subnet (192.168.29.x or 192.168.x.x) is prioritized over virtual adapters
    def ip_priority(ip):
        if ip.startswith("192.168.29."):
            return 0
        if ip.startswith("192.168.") and not ip.startswith("192.168.137."):
            return 1
        if ip.startswith("10.") or ip.startswith("172."):
            return 2
        return 3

    ip_list.sort(key=ip_priority)
    primary_ip = ip_list[0] if ip_list else "127.0.0.1"
    
    # Dynamically detect active public tunnel URL from file or task logs
    public_tunnel = None
    tunnel_file = os.path.join(os.path.dirname(__file__), ".tunnel_url")
    if os.path.exists(tunnel_file):
        try:
            with open(tunnel_file, "r", encoding="utf-8") as f:
                val = f.read().strip()
                if val.startswith("https://"):
                    public_tunnel = val
        except Exception:
            pass

    if not public_tunnel:
        # Check task logs or tunnel_stderr.log
        for test_path in [
            os.path.join(os.path.dirname(__file__), "tunnel_stderr.log"),
            r"C:\Users\asus\.gemini\antigravity\brain\160b792d-7710-4662-9b21-140b0c5faec3\.system_generated\tasks\task-2539.log"
        ]:
            if os.path.exists(test_path):
                try:
                    with open(test_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        matches = re.findall(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", content)
                        if matches:
                            public_tunnel = matches[-1]
                            break
                except Exception:
                    pass

    if not public_tunnel:
        public_tunnel = f"http://{primary_ip}:5173"

    return {
        "success": True,
        "primary_ip": primary_ip,
        "all_ips": ip_list,
        "public_tunnel_url": public_tunnel
    }

# --- TEACHER AUTH & DASHBOARD ---

@app.post("/api/teacher/signup")
async def teacher_signup(
    name: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    qualification: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    designation: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    if not name or not username or not password:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    existing = get_teacher_by_username(username.strip())
    if existing:
        raise HTTPException(status_code=400, detail="A teacher with this username already exists")
    
    photo_url = None
    if file:
        try:
            contents = await file.read()
            b64_data = base64.b64encode(contents).decode("utf-8")
            photo_url = f"data:image/jpeg;base64,{b64_data}"
        except Exception as e:
            print("Teacher photo processing warning:", e)

    hashed = bcrypt.hashpw(password.strip().encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    created = create_teacher(
        name=name.strip(),
        username=username.strip(),
        password=hashed,
        qualification=qualification.strip() if qualification else None,
        department=department.strip() if department else None,
        designation=designation.strip() if designation else None,
        photo_url=photo_url
    )
    if not created:
        raise HTTPException(status_code=500, detail="Failed to create teacher account")
    
    teacher_obj = created[0]
    # Ensure profile details are stored locally too
    _save_local_credential(
        student_id=teacher_obj.get("id"),
        email=username.strip(),
        password_hash=hashed,
        name=name.strip()
    )
    
    return {"success": True, "teacher": teacher_obj}

@app.post("/api/teacher/login")
def teacher_login(payload: Dict[str, Any] = Body(...)):
    username = payload.get("username")
    password = payload.get("password")
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
    
    teacher_record = get_teacher_by_username(username.strip())
    if not teacher_record:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    teacher = teacher_record[0]
    stored_hash = teacher.get("password", "")
    
    try:
        match = bcrypt.checkpw(password.strip().encode("utf-8"), stored_hash.encode("utf-8"))
    except Exception:
        match = (password.strip() == stored_hash)
        
    if not match:
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    return {"success": True, "teacher": teacher}

@app.get("/api/teacher/{teacher_id}/subjects")
def teacher_subjects_api(teacher_id: str):
    subjects = get_teacher_subjects(teacher_id)
    return {"success": True, "subjects": subjects}

@app.post("/api/subjects")
def create_subject_api(payload: Dict[str, Any] = Body(...)):
    subject_code = payload.get("subject_code")
    name = payload.get("name")
    section = payload.get("section")
    teacher_id = payload.get("teacher_id")
    
    created = create_subject(subject_code, name, section, teacher_id)
    if not created:
        raise HTTPException(status_code=500, detail="Failed to create subject")
    return {"success": True, "subject": created[0]}

@app.get("/api/teacher/{teacher_id}/attendance-logs")
def teacher_logs_api(teacher_id: str):
    logs = get_attendance_for_teacher(teacher_id)
    return {"success": True, "logs": logs}

# --- SECURE STUDENT ENDPOINTS ---

@app.post("/api/student/register")
async def register_student_full(
    name: str = Form(...),
    email: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
    roll_no: Optional[str] = Form(None),
    dob: Optional[str] = Form(None),
    class_name: Optional[str] = Form(None),
    section: Optional[str] = Form(None),
    course: Optional[str] = Form(None),
    branch: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    try:
        # Check if student with this email or roll number already exists
        if email:
            existing_email = get_student_by_email(email.strip())
            if existing_email:
                raise HTTPException(status_code=400, detail="A student with this College Email already exists. Please login instead.")

        if roll_no:
            existing_roll = get_student_by_roll_no(roll_no.strip())
            if existing_roll:
                raise HTTPException(status_code=400, detail="A student with this Roll Number is already registered.")

        # Hash password if provided
        hashed_password = None
        if password and password.strip():
            hashed_password = bcrypt.hashpw(password.strip().encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        face_embedding = None
        photo_url = None
        
        if file:
            contents = await file.read()
            b64_data = base64.b64encode(contents).decode("utf-8")
            photo_url = f"data:image/jpeg;base64,{b64_data}"
            
            image = Image.open(io.BytesIO(contents)).convert("RGB")
            image_np = np.array(image)
            embeddings = get_face_embeddings(image_np)
            if embeddings:
                face_embedding = embeddings[0].tolist()

        created = create_student(
            new_name=name.strip(),
            email=email.strip().lower() if email else None,
            password=hashed_password,
            roll_no=roll_no.strip() if roll_no else None,
            dob=dob.strip() if dob else None,
            class_name=class_name.strip() if class_name else None,
            section=section.strip() if section else None,
            course=course.strip() if course else None,
            branch=branch.strip() if branch else None,
            face_embedding=face_embedding,
            photo_url=photo_url
        )
        
        if not created:
            raise HTTPException(status_code=500, detail="Failed to create student in database")
        
        student_obj = created[0]
        if email or hashed_password:
            _save_local_credential(
                student_id=str(student_obj["id"]),
                email=email,
                password_hash=hashed_password,
                roll_no=roll_no,
                name=name
            )

        if face_embedding:
            train_classifier()

        return {"success": True, "student": _enrich_student_dict(student_obj)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/student/login")
def student_login_api(payload: Dict[str, Any] = Body(...)):
    email = payload.get("email")
    password = payload.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="College Email and password are required")
    
    # 1. Search student in database by college email / roll number / name
    student_records = get_student_by_identifier(email)

    # 2. Check local credentials fallback
    if not student_records:
        creds = _load_local_credentials()
        clean_input = email.strip().lower()
        for sid, centry in creds.items():
            if centry.get("email", "").lower() == clean_input or centry.get("roll_no") == clean_input:
                student_records = get_student_by_identifier(sid)
                break

    # SECURITY CHECK: If student is NOT in database, DENY ACCESS immediately!
    if not student_records or len(student_records) == 0:
        raise HTTPException(
            status_code=401,
            detail="Student not found in database. Access Denied. Please register first or contact your professor."
        )
    
    student = _enrich_student_dict(student_records[0])
    stored_hash = student.get("password")

    # If student has a password set, verify hash
    if stored_hash:
        try:
            match = bcrypt.checkpw(password.strip().encode("utf-8"), stored_hash.encode("utf-8"))
        except Exception:
            match = (password.strip() == stored_hash)
            
        if not match:
            raise HTTPException(status_code=401, detail="Invalid password. Access Denied.")
    
    return {"success": True, "student": student}

@app.get("/api/student/{student_id}")
def get_student_profile(student_id: str):
    students = get_student_by_identifier(student_id)
    if not students or len(students) == 0:
        # Check local creds fallback
        creds = _load_local_credentials()
        for sid, centry in creds.items():
            if centry.get("email") == student_id.lower() or centry.get("roll_no") == student_id:
                students = get_student_by_identifier(sid)
                break

    if not students or len(students) == 0:
        raise HTTPException(status_code=404, detail="Student not found")
        
    return {"success": True, "student": _enrich_student_dict(students[0])}

@app.post("/api/student/{student_id}/profile")
async def update_student_profile(
    student_id: str,
    name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
    roll_no: Optional[str] = Form(None),
    dob: Optional[str] = Form(None),
    class_name: Optional[str] = Form(None),
    section: Optional[str] = Form(None),
    course: Optional[str] = Form(None),
    branch: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    try:
        update_data = {}
        if name: update_data["name"] = name.strip()
        if email: update_data["email"] = email.strip().lower()
        
        hashed_password = None
        if password and password.strip():
            hashed_password = bcrypt.hashpw(password.strip().encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            update_data["password"] = hashed_password
            
        if roll_no: update_data["roll_no"] = roll_no.strip()
        if dob: update_data["dob"] = dob.strip()
        if class_name: update_data["class_name"] = class_name.strip()
        if section: update_data["section"] = section.strip()
        if course: update_data["course"] = course.strip()
        if branch: update_data["branch"] = branch.strip()

        if file:
            contents = await file.read()
            b64_data = base64.b64encode(contents).decode("utf-8")
            update_data["photo_url"] = f"data:image/jpeg;base64,{b64_data}"

            image = Image.open(io.BytesIO(contents)).convert("RGB")
            image_np = np.array(image)
            embeddings = get_face_embeddings(image_np)
            if embeddings:
                update_data["face_embedding"] = embeddings[0].tolist()

        try:
            res = supabase.table("students").update(update_data).eq("id", student_id).execute()
        except Exception:
            # If email or password column is not in Postgres yet, update other fields gracefully
            fallback_data = {k: v for k, v in update_data.items() if k not in ["email", "password"]}
            res = supabase.table("students").update(fallback_data).eq("id", student_id).execute()

        # Save to local credentials storage to guarantee email & password persistence
        if email or hashed_password or roll_no or name:
            _save_local_credential(
                student_id=student_id,
                email=email,
                password_hash=hashed_password,
                roll_no=roll_no,
                name=name
            )

        if not res.data:
            # If student record fetched by id didn't update directly, try by roll_no/name
            students = get_student_by_identifier(student_id)
            if students:
                actual_id = students[0]["id"]
                res = supabase.table("students").update({k: v for k, v in update_data.items() if k not in ["email", "password"]}).eq("id", actual_id).execute()

        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to update student profile")

        if "face_embedding" in update_data:
            train_classifier()

        return {"success": True, "student": _enrich_student_dict(res.data[0])}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/student/{student_id}/enroll")
def enroll_student(student_id: str, payload: Dict[str, Any] = Body(...)):
    subject_id = payload.get("subject_id")
    
    sub = supabase.table("subjects").select("*").eq("id", subject_id).execute()
    if not sub.data:
        raise HTTPException(status_code=404, detail="Subject not found with the provided code")
    
    try:
        created = enroll_student_to_subject(student_id, subject_id)
        return {"success": True, "enrollment": created, "subject": sub.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Already enrolled or invalid join code")

@app.get("/api/student/{student_id}/subjects")
def student_subjects_api(student_id: str):
    # 1. Fetch explicitly enrolled subjects
    res = supabase.table("subject_students").select("subjects(*)").eq("student_id", student_id).execute()
    explicit_subjects = [item["subjects"] for item in (res.data or []) if item.get("subjects")]
    
    # 2. Also fetch subjects matching student's section/class/branch
    student_records = get_student_by_identifier(student_id)
    auto_subjects = []
    if student_records and len(student_records) > 0:
        st = student_records[0]
        sec = st.get("section")
        all_subs = supabase.table("subjects").select("*").execute().data or []
        for s in all_subs:
            # If section matches or already enrolled
            if sec and s.get("section") and (s.get("section").strip().lower() == sec.strip().lower() or s.get("section").strip().lower() == f"section {sec.strip().lower()}"):
                if not any(ex.get("id") == s.get("id") for ex in explicit_subjects):
                    auto_subjects.append(s)

    combined = [{"subjects": s} for s in (explicit_subjects + auto_subjects)]
    return {"success": True, "subjects": combined}

@app.get("/api/student/{student_id}/attendance")
def student_attendance_api(student_id: str):
    res = supabase.table("attendance_logs").select("*, subjects(name, subject_code, section)").eq("student_id", student_id).order("timestamp", desc=True).execute()
    return {"success": True, "attendance": res.data}

@app.get("/api/subjects/{subject_id}/students")
def subject_students_api(subject_id: str):
    students = get_subject_students(subject_id)
    enriched = [_enrich_student_dict(s) for s in students]
    return {"success": True, "students": enriched}

@app.post("/api/students/query-roster")
def query_students_roster(payload: Dict[str, Any] = Body(...)):
    subject_id = payload.get("subject_id")
    branch = payload.get("branch")
    class_name = payload.get("class_name")
    section = payload.get("section")
    course = payload.get("course")

    # 1. If subject_id provided, check enrolled students
    if subject_id:
        students = get_subject_students(subject_id)
        if students and len(students) > 0:
            return {"success": True, "students": [_enrich_student_dict(s) for s in students]}

    # 2. Query all students from DB
    all_students = get_all_students() or []
    filtered = []

    for s in all_students:
        s_branch = (s.get("branch") or "").strip().lower()
        s_class = (s.get("class_name") or "").strip().lower()
        s_section = (s.get("section") or "").strip().lower()
        s_course = (s.get("course") or "").strip().lower()

        match = True
        if branch and branch.strip():
            b_clean = branch.strip().lower()
            if b_clean not in s_branch and s_branch not in b_clean:
                match = False
        if class_name and class_name.strip():
            c_clean = class_name.strip().lower()
            if c_clean not in s_class and s_class not in c_clean:
                match = False
        if section and section.strip():
            sec_clean = section.strip().lower()
            if sec_clean != s_section and f"section {sec_clean}" != s_section:
                match = False

        if match:
            filtered.append(_enrich_student_dict(s))

    if len(filtered) == 0:
        filtered = [_enrich_student_dict(s) for s in all_students]

    return {"success": True, "students": filtered}

@app.post("/api/attendance/save")
def save_attendance(payload: Dict[str, Any] = Body(...)):
    logs = payload.get("logs", [])
    for log in logs:
        insert_attendance_log(
            subject_id=log.get("subject_id"),
            student_id=log.get("student_id"),
            timestamp=log.get("timestamp"),
            status=log.get("status")
        )
    return {"success": True, "saved_count": len(logs)}

# --- BIOMETRIC AI ENDPOINTS ---

@app.post("/api/face-embedding")
async def extract_face_embedding(file: UploadFile = File(...), student_id: Optional[str] = Form(None)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    image_np = np.array(image)
    
    embeddings = get_face_embeddings(image_np)
    if not embeddings:
        raise HTTPException(status_code=400, detail="No face detected in the image. Please take a clearer photo.")
        
    embedding_list = embeddings[0].tolist()
    
    if student_id:
        b64_data = base64.b64encode(contents).decode("utf-8")
        photo_url = f"data:image/jpeg;base64,{b64_data}"
        supabase.table("students").update({"face_embedding": embedding_list, "photo_url": photo_url}).eq("id", student_id).execute()
        train_classifier()
        
    return {"success": True, "embedding": embedding_list, "faces_found": len(embeddings)}

@app.post("/api/predict-face-attendance")
async def predict_face_attendance_endpoint(file: UploadFile = File(...), candidate_ids: Optional[str] = Form(None)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    image_np = np.array(image)
    
    allowed = None
    if candidate_ids:
        try:
            allowed = json.loads(candidate_ids)
        except Exception:
            pass

    detected_students, all_students, total_faces = predict_attendance(image_np, allowed_candidate_ids=allowed)
    present_ids = [student_id for student_id, is_present in detected_students.items() if is_present]
    
    return {
        "success": True,
        "total_faces_detected": total_faces,
        "present_student_ids": present_ids,
        "all_enrolled_count": len(all_students),
    }

@app.post("/api/voice-embedding")
async def extract_voice_embedding(file: UploadFile = File(...), student_id: Optional[str] = Form(None)):
    contents = await file.read()
    audio_bytes_io = io.BytesIO(contents)
    
    try:
        embedding = get_voice_embeddings(audio_bytes_io)
        embedding_list = embedding.tolist()
        
        if student_id:
            supabase.table("students").update({"voice_embedding": embedding_list}).eq("id", student_id).execute()
            
        return {"success": True, "embedding": embedding_list}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Voice processing failed: {str(e)}")

@app.post("/api/predict-voice-attendance")
async def predict_voice_attendance_endpoint(file: UploadFile = File(...), candidates_json: str = Form(...)):
    contents = await file.read()
    audio_bytes_io = io.BytesIO(contents)
    
    try:
        candidates_dict = json.loads(candidates_json)
        detected_students, total_segments = process_bulk_audio(audio_bytes_io, candidates_dict)
        present_ids = [student_id for student_id, is_present in detected_students.items() if is_present]
        
        return {
            "success": True,
            "total_segments_analyzed": total_segments,
            "present_student_ids": present_ids,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Voice recognition failed: {str(e)}")

@app.post("/api/train-classifier")
def retrain_model_endpoint():
    success = train_classifier()
    return {"success": success}

# --- ACTIVE LECTURE SESSIONS & QR STUDENT REGISTRATION ---

ACTIVE_SESSIONS: Dict[str, Any] = {}

@app.post("/api/lecture-sessions/create")
def create_lecture_session(payload: Dict[str, Any] = Body(...)):
    import time
    # Ensure a completely unique QR / Session ID per class
    unique_suffix = os.urandom(3).hex()
    session_id = f"lec_{int(time.time())}_{unique_suffix}"
    
    teacher_name = payload.get("teacher_name", "Faculty")
    faculty_name = payload.get("faculty_name", "Department of Computer Science")
    subject_name = payload.get("subject_name", "General Lecture")
    subject_code = payload.get("subject_code", "GEN-01")
    course = payload.get("course", "B.Tech")
    branch = payload.get("branch", "Computer Science")
    class_name = payload.get("class_name", "4th Year")
    section = payload.get("section", "Section A")
    students = payload.get("students", [])

    session_obj = {
        "session_id": session_id,
        "teacher_name": teacher_name,
        "faculty_name": faculty_name,
        "subject_name": subject_name,
        "subject_code": subject_code,
        "course": course,
        "branch": branch,
        "class_name": class_name,
        "section": section,
        "status": "in_progress",
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "students": students,
        "present_map": {}
    }

    ACTIVE_SESSIONS[session_id] = session_obj
    return {"success": True, "session": session_obj}

@app.get("/api/lecture-sessions/active")
def get_active_sessions():
    active = [s for s in ACTIVE_SESSIONS.values() if s.get("status") == "in_progress"]
    return {"success": True, "sessions": active}

@app.get("/api/lecture-sessions/{session_id}")
def get_lecture_session(session_id: str):
    session = ACTIVE_SESSIONS.get(session_id)
    if not session:
        # Check if session_id corresponds to a valid subject in PostgreSQL
        try:
            sub_res = supabase.table("subjects").select("*, teachers(name)").eq("id", session_id).execute()
            if sub_res.data and len(sub_res.data) > 0:
                sub = sub_res.data[0]
                teacher_name = sub.get("teachers", {}).get("name") if sub.get("teachers") else "Faculty"
                students = get_subject_students(session_id)
                session = {
                    "session_id": session_id,
                    "id": session_id,
                    "teacher_name": teacher_name,
                    "faculty_name": "Department of Computer Science",
                    "subject_name": sub.get("name"),
                    "subject_code": sub.get("subject_code"),
                    "course": "B.Tech",
                    "branch": "CSE",
                    "class_name": "Class Section",
                    "section": sub.get("section"),
                    "status": "in_progress",
                    "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "students": [_enrich_student_dict(s) for s in students],
                    "present_map": {}
                }
                ACTIVE_SESSIONS[session_id] = session
        except Exception as e:
            print("Auto-session init error:", e)

    if not session:
        raise HTTPException(status_code=404, detail="Lecture session not found")
    return {"success": True, "session": session}

@app.post("/api/lecture-sessions/{session_id}/register-student")
async def register_student_for_lecture(
    session_id: str,
    name: str = Form(...),
    roll_no: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    course: Optional[str] = Form(None),
    branch: Optional[str] = Form(None),
    class_name: Optional[str] = Form(None),
    section: Optional[str] = Form(None),
    dob: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    import time
    session = ACTIVE_SESSIONS.get(session_id)
    if not session:
        # Attempt auto-initialization from DB
        try:
            sub_res = supabase.table("subjects").select("*, teachers(name)").eq("id", session_id).execute()
            if sub_res.data and len(sub_res.data) > 0:
                sub = sub_res.data[0]
                teacher_name = sub.get("teachers", {}).get("name") if sub.get("teachers") else "Faculty"
                students = get_subject_students(session_id)
                session = {
                    "session_id": session_id,
                    "id": session_id,
                    "teacher_name": teacher_name,
                    "faculty_name": "Department of Computer Science",
                    "subject_name": sub.get("name"),
                    "subject_code": sub.get("subject_code"),
                    "course": "B.Tech",
                    "branch": "CSE",
                    "class_name": "Class Section",
                    "section": sub.get("section"),
                    "status": "in_progress",
                    "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "students": [_enrich_student_dict(s) for s in students],
                    "present_map": {}
                }
                ACTIVE_SESSIONS[session_id] = session
        except Exception as e:
            print("Auto-session init error:", e)

    if not session:
        raise HTTPException(status_code=404, detail="Lecture session not found or has expired")

    # 1. Process face embedding & photo
    face_embedding = None
    photo_url = None
    if file:
        contents = await file.read()
        b64_data = base64.b64encode(contents).decode("utf-8")
        photo_url = f"data:image/jpeg;base64,{b64_data}"

        image = Image.open(io.BytesIO(contents)).convert("RGB")
        image_np = np.array(image)
        embeddings = get_face_embeddings(image_np)
        if embeddings:
            face_embedding = embeddings[0].tolist()

    # 2. Check if student already exists in DB by roll_no or email
    clean_roll = roll_no.strip() if roll_no else None
    clean_email = email.strip().lower() if email else None
    student_obj = None

    if clean_roll:
        existing = get_student_by_roll_no(clean_roll)
        if existing:
            student_obj = existing[0]

    if not student_obj and clean_email:
        existing = get_student_by_email(clean_email)
        if existing:
            student_obj = existing[0]

    if student_obj:
        # Update existing student photo/embedding and academic info
        sid = student_obj["id"]
        update_dict = {}
        if photo_url: update_dict["photo_url"] = photo_url
        if face_embedding: update_dict["face_embedding"] = face_embedding
        if branch: update_dict["branch"] = branch.strip()
        if section: update_dict["section"] = section.strip()
        if class_name: update_dict["class_name"] = class_name.strip()
        if course: update_dict["course"] = course.strip()
        if update_dict:
            try:
                supabase.table("students").update(update_dict).eq("id", sid).execute()
            except Exception:
                pass
    else:
        # Create new student in database
        created = create_student(
            new_name=name.strip(),
            email=clean_email,
            roll_no=clean_roll,
            dob=dob.strip() if dob else None,
            class_name=class_name.strip() if class_name else session.get("class_name"),
            section=section.strip() if section else session.get("section"),
            course=course.strip() if course else session.get("course"),
            branch=branch.strip() if branch else session.get("branch"),
            face_embedding=face_embedding,
            photo_url=photo_url
        )
        if created:
            student_obj = created[0]
        else:
            student_obj = {
                "id": f"st_{int(time.time())}",
                "name": name.strip(),
                "roll_no": clean_roll,
                "email": clean_email,
                "photo_url": photo_url,
                "face_embedding": face_embedding,
                "branch": branch or session.get("branch"),
                "section": section or session.get("section"),
                "course": course or session.get("course"),
                "class_name": class_name or session.get("class_name")
            }

    # Save local credentials memory for fallback persistence
    if clean_roll or clean_email:
        _save_local_credential(
            student_id=student_obj.get("id"),
            email=clean_email,
            roll_no=clean_roll,
            name=name.strip()
        )

    # Enroll student in the subject permanently (via subject_id and subject_code)
    target_subject_id = session.get("id") or (session.get("session_id") if not session.get("session_id", "").startswith("lec_") else None)
    
    if not target_subject_id and session.get("subject_code"):
        try:
            sub_res = supabase.table("subjects").select("id").eq("subject_code", session.get("subject_code")).execute()
            if sub_res.data and len(sub_res.data) > 0:
                target_subject_id = sub_res.data[0]["id"]
        except Exception:
            pass

    if target_subject_id and student_obj.get("id"):
        try:
            enroll_student_to_subject(student_obj["id"], target_subject_id)
        except Exception as e:
            print("Permanent subject enrollment note:", e)

    # Retrain classifier with new live face embedding
    if face_embedding:
        train_classifier()

    # Add student into active lecture roster permanently if not already present
    enriched = _enrich_student_dict(student_obj)
    if not any(str(s.get("id")) == str(enriched.get("id")) or str(s.get("roll_no")) == str(enriched.get("roll_no")) for s in session.get("students", [])):
        session["students"].append(enriched)

    return {
        "success": True,
        "message": f"Student {name} registered for this lecture successfully!",
        "student": enriched,
        "total_registered_in_session": len(session["students"])
    }

@app.post("/api/lecture-sessions/{session_id}/end")
def end_lecture_session(session_id: str, payload: Dict[str, Any] = Body(...)):
    session = ACTIVE_SESSIONS.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Lecture session not found")

    present_map = payload.get("present_map", {})
    session["status"] = "completed"
    session["present_map"] = present_map

    return {"success": True, "session": session}
