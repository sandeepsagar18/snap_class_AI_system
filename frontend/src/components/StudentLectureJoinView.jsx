import React, { useState, useEffect } from 'react'
import { getLectureSession, registerStudentForLecture } from '../lib/api'
import CameraCapture from './CameraCapture'
import { Sparkles, GraduationCap, User, Hash, Mail, Calendar, CheckCircle2, AlertCircle, Loader2, ArrowLeft, GitBranch, Layers, Users, BookOpen } from 'lucide-react'

export default function StudentLectureJoinView({ sessionId, onBackToPortal }) {
  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [sessionError, setSessionError] = useState('')

  const [name, setName] = useState('')
  const [rollNo, setRollNo] = useState('')
  const [email, setEmail] = useState('')
  const [course, setCourse] = useState('B.Tech')
  const [branch, setBranch] = useState('Computer Science')
  const [className, setClassName] = useState('4th Year')
  const [section, setSection] = useState('Section A')
  const [dob, setDob] = useState('')
  const [photoBlob, setPhotoBlob] = useState(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState('')

  // Load remembered student memory from localStorage
  useEffect(() => {
    try {
      const savedMemory = localStorage.getItem('snapclass_student_memory')
      if (savedMemory) {
        const parsed = JSON.parse(savedMemory)
        if (parsed.name) setName(parsed.name)
        if (parsed.rollNo) setRollNo(parsed.rollNo)
        if (parsed.email) setEmail(parsed.email)
        if (parsed.course) setCourse(parsed.course)
        if (parsed.branch) setBranch(parsed.branch)
        if (parsed.className) setClassName(parsed.className)
        if (parsed.section) setSection(parsed.section)
        if (parsed.dob) setDob(parsed.dob)
      }
    } catch (e) {
      console.error('Failed to load student memory:', e)
    }
  }, [])

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const s = await getLectureSession(sessionId)
        setSession(s)
        // If student memory doesn't have course/branch/class/section, inherit from session
        if (s) {
          if (!branch && s.branch) setBranch(s.branch)
          if (!className && s.class_name) setClassName(s.class_name)
          if (!section && s.section) setSection(s.section)
          if (!course && s.course) setCourse(s.course)
        }
      } catch (err) {
        console.error(err)
        setSessionError('This lecture QR is either expired, completed, or invalid.')
      } finally {
        setLoadingSession(false)
      }
    }
    if (sessionId) fetchSession()
  }, [sessionId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter your full name')
      return
    }
    if (!rollNo.trim()) {
      setError('Please enter your Roll Number')
      return
    }
    if (!photoBlob) {
      setError('Please take a live webcam face photo so the AI can verify your attendance')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await registerStudentForLecture(sessionId, {
        name: name.trim(),
        roll_no: rollNo.trim(),
        email: email.trim() || undefined,
        course: course.trim() || session?.course || 'B.Tech',
        branch: branch.trim() || session?.branch || 'Computer Science',
        class_name: className.trim() || session?.class_name || '4th Year',
        section: section.trim() || session?.section || 'Section A',
        dob: dob.trim() || undefined
      }, photoBlob)

      // Remember student details in localStorage for future classes
      try {
        localStorage.setItem('snapclass_student_memory', JSON.stringify({
          name: name.trim(),
          rollNo: rollNo.trim(),
          email: email.trim(),
          course: course.trim(),
          branch: branch.trim(),
          className: className.trim(),
          section: section.trim(),
          dob: dob.trim()
        }))
      } catch (e) {
        console.error('Failed to save student memory:', e)
      }

      setSubmitSuccess(true)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to register for lecture')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingSession) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-semibold">Loading Class Session...</p>
      </div>
    )
  }

  if (sessionError || !session) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Invalid or Expired Class QR</h3>
        <p className="text-xs text-slate-600 leading-relaxed font-medium">{sessionError || 'This class attendance session is no longer active.'}</p>
        <button
          onClick={onBackToPortal}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
        >
          Return to Portal
        </button>
      </div>
    )
  }

  if (submitSuccess) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">Registration Successful</span>
          <h3 className="text-xl font-black text-slate-900 mt-2">You Are Registered!</h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
            Your details and face biometrics are saved for <b>{session.subject_name}</b> ({session.subject_code}).
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2">
          <div className="flex justify-between text-slate-600"><span>Student Name:</span> <b className="text-slate-900">{name}</b></div>
          <div className="flex justify-between text-slate-600"><span>Roll Number:</span> <b className="text-slate-900 font-mono font-bold">{rollNo}</b></div>
          <div className="flex justify-between text-slate-600"><span>Branch:</span> <b className="text-slate-900">{branch}</b></div>
          <div className="flex justify-between text-slate-600"><span>Class & Section:</span> <b className="text-slate-900">{className} ({section})</b></div>
          <div className="flex justify-between text-slate-600"><span>Teacher:</span> <b className="text-indigo-700 font-bold">{session.teacher_name}</b></div>
          <div className="flex justify-between text-slate-600"><span>Faculty:</span> <b className="text-slate-800">{session.faculty_name || 'Department of Computing'}</b></div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 text-left space-y-1">
          <p className="font-bold">✓ Profile Remembered & Synced</p>
          <p className="text-slate-600">
            During lecture, the camera will automatically detect your face and mark you <b>PRESENT</b>.
          </p>
        </div>

        <button
          onClick={onBackToPortal}
          className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold transition-all cursor-pointer"
        >
          Done & Return to Portal
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-xl w-full mx-auto my-6 px-3 sm:px-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">In-Class QR Registration</span>
              <h2 className="text-lg font-black text-slate-900">{session.subject_name} ({session.subject_code})</h2>
              <p className="text-xs text-slate-500 font-medium">
                Teacher: <span className="text-slate-800 font-bold">{session.teacher_name}</span> • Faculty: <span className="text-indigo-700 font-semibold">{session.faculty_name || 'Department of Computing'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onBackToPortal}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl bg-slate-100 border border-slate-200 text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Student Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Sagar Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Roll Number *</label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. 2023021060"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono font-bold"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">College Email ID</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  placeholder="2023021060@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Course</label>
              <input
                type="text"
                placeholder="e.g. B.Tech / BCA"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Branch / Dept *</label>
              <div className="relative">
                <GitBranch className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Class / Year *</label>
              <div className="relative">
                <Layers className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. 4th Year"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Section *</label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Section A"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Live Webcam / Selfie Photo Capture *
            </label>
            <CameraCapture onCapture={(blob) => setPhotoBlob(blob)} label="Take Selfie Face Photo" />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
            <span>Register in this Class & Remember Details</span>
          </button>
        </form>
      </div>
    </div>
  )
}
