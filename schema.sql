-- =========================================================================
-- SnapClass AI - Complete Database Schema (Supabase / PostgreSQL)
-- =========================================================================

-- Enable UUID generator extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------------------
-- 1. TEACHERS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);

-- -------------------------------------------------------------------------
-- 2. STUDENTS TABLE (Full Academic Record, Credentials & Biometrics)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password TEXT,
    roll_no TEXT UNIQUE,
    dob TEXT,
    class_name TEXT,
    section TEXT,
    course TEXT,
    branch TEXT,
    photo_url TEXT,
    face_embedding JSONB,
    voice_embedding JSONB
);

-- -------------------------------------------------------------------------
-- 3. SUBJECTS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    subject_code TEXT NOT NULL,
    name TEXT NOT NULL,
    section TEXT NOT NULL,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE
);

-- -------------------------------------------------------------------------
-- 4. SUBJECT ENROLLMENT TABLE (Many-to-Many: Subjects <-> Students)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subject_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    CONSTRAINT unique_subject_student UNIQUE (subject_id, student_id)
);

-- -------------------------------------------------------------------------
-- 5. ATTENDANCE LOGS TABLE (Real-Time Attendance History)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT now(),
    status TEXT NOT NULL -- e.g. 'Present', 'Late', 'Absent'
);

-- -------------------------------------------------------------------------
-- 6. ENSURE ALL COLUMNS EXIST (If tables already existed previously)
-- -------------------------------------------------------------------------
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS roll_no TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS dob TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS class_name TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS face_embedding JSONB;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS voice_embedding JSONB;

-- -------------------------------------------------------------------------
-- 7. PERFORMANCE INDEXES
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_students_roll_no ON public.students(roll_no);
CREATE INDEX IF NOT EXISTS idx_subjects_teacher ON public.subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subject_students_subj ON public.subject_students(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_students_stud ON public.subject_students(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_subject ON public.attendance_logs(subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON public.attendance_logs(timestamp);
