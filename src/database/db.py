from src.database.config import get_supabase_client
import streamlit as st

supabase = get_supabase_client()

def get_teacher_by_username(username):
    response = supabase.table('teachers').select('*').eq('username', username).execute()
    return response.data

def create_teacher(name, username, password):
    data = {'name': name, 'username': username, 'password': password}
    response = supabase.table('teachers').insert(data).execute()
    return response.data

def get_teacher_subjects(teacher_id):
    response = supabase.table('subjects').select('*').eq('teacher_id', teacher_id).execute()
    subjects = response.data

    for subject in subjects:
        subject_id = subject['id']

        student_count_response = (
            supabase.table('subject_students')
            .select('student_id', count='exact')
            .eq('subject_id', subject_id)
            .execute()
        )
        subject['total_students'] = student_count_response.count

        class_count_response = (
            supabase.table('attendance_logs')
            .select('timestamp', count='exact')
            .eq('subject_id', subject_id)
            .execute()
        )
        subject['total_classes'] = class_count_response.count

    return subjects

def get_all_students():
    response = supabase.table('students').select("*").execute()
    return response.data

def get_student_by_email(email):
    try:
        response = supabase.table('students').select('*').eq('email', email.strip().lower()).execute()
        return response.data if response and hasattr(response, 'data') and response.data else []
    except Exception:
        return []

def get_student_by_roll_no(roll_no):
    try:
        response = supabase.table('students').select('*').eq('roll_no', roll_no.strip()).execute()
        return response.data if response and hasattr(response, 'data') and response.data else []
    except Exception:
        return []

def get_student_by_identifier(identifier):
    clean = str(identifier).strip()
    
    # 1. Try by UUID id
    try:
        by_id = supabase.table('students').select('*').eq('id', clean).execute()
        if by_id and hasattr(by_id, 'data') and by_id.data:
            return by_id.data
    except Exception:
        pass

    # 2. Try by email
    by_email = get_student_by_email(clean)
    if by_email:
        return by_email
        
    # 3. Try by roll_no
    by_roll = get_student_by_roll_no(clean)
    if by_roll:
        return by_roll
        
    # 4. Try by exact name
    try:
        by_name = supabase.table('students').select('*').eq('name', clean).execute()
        if by_name and hasattr(by_name, 'data') and by_name.data:
            return by_name.data
    except Exception:
        pass
        
    return []

def create_student(
    new_name,
    email=None,
    password=None,
    roll_no=None,
    dob=None,
    class_name=None,
    section=None,
    course=None,
    branch=None,
    face_embedding=None,
    voice_embedding=None,
    photo_url=None
):
    data = {
        'name': new_name,
        'email': email.strip().lower() if email else None,
        'password': password,
        'roll_no': roll_no,
        'dob': dob,
        'class_name': class_name,
        'section': section,
        'course': course,
        'branch': branch,
        'face_embedding': face_embedding,
        'voice_embedding': voice_embedding,
        'photo_url': photo_url
    }
    clean_data = {k: v for k, v in data.items() if v is not None}
    clean_data['name'] = new_name
    
    try:
        response = supabase.table('students').insert(clean_data).execute()
        return response.data
    except Exception as e:
        # Fallback if email/password columns not created yet in Postgres table
        fallback_data = {
            'name': new_name,
            'roll_no': roll_no,
            'dob': dob,
            'class_name': class_name,
            'section': section,
            'course': course,
            'branch': branch,
            'face_embedding': face_embedding,
            'voice_embedding': voice_embedding,
            'photo_url': photo_url
        }
        clean_fallback = {k: v for k, v in fallback_data.items() if v is not None}
        response = supabase.table('students').insert(clean_fallback).execute()
        return response.data

def create_subject(subject_code, name, section, teacher_id):
    data = {"subject_code": subject_code, "name": name, "section": section, "teacher_id": teacher_id}
    response = supabase.table("subjects").insert(data).execute()
    return response.data

def get_subject_students(subject_id):
    try:
        response = supabase.table('subject_students').select("student_id, students(*)").eq('subject_id', subject_id).execute()
        return [item['students'] for item in response.data if item.get('students')]
    except Exception:
        return []

def enroll_student_to_subject(student_id, subject_id):
    data = {"student_id": student_id, "subject_id": subject_id}
    response = supabase.table("subject_students").insert(data).execute()
    return response.data

def insert_attendance_log(subject_id, student_id, timestamp, status):
    data = {'subject_id': subject_id, 'student_id': student_id, 'timestamp': timestamp, 'status': status}
    response = supabase.table('attendance_logs').insert(data).execute()
    return response.data

def get_attendance_for_teacher(teacher_id):
    response = supabase.table('attendance_logs').select(
        'id, timestamp, status, subjects!inner(name, subject_code, section, teacher_id), students(name)'
    ).eq('subjects.teacher_id', teacher_id).order('timestamp', desc=True).limit(20).execute()
    return response.data
