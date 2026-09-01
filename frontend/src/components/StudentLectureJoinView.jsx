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
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs">Loading Unique Class Session...</p>
      </div>
    )
  }

  if (sessionError || !session) {
    return (
      <div className="max-w-md mx-auto my-12 glass-panel p-8 rounded-3xl border border-slate-800 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Invalid or Expired Class QR</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{sessionError || 'This class attendance session is no longer active.'}</p>
        <button
          onClick={onBackToPortal}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
        >
          Return to Portal
        </button>
      </div>
    )
  }

  if (submitSuccess) {
    return (
      <div className="max-w-md mx-auto my-12 glass-panel p-8 rounded-3xl border border-slate-800 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Class Registration Successful</span>
          <h3 className="text-xl font-black text-white mt-1">You Are Registered!</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Your details and face biometrics are saved for <b>{session.subject_name}</b> ({session.subject_code}).
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-left space-y-2">
          <div className="flex justify-between text-slate-400"><span>Student Name:</span> <b className="text-white">{name}</b></div>
          <div className="flex justify-between text-slate-400"><span>Roll Number:</span> <b className="text-white font-mono">{rollNo}</b></div>
          <div className="flex justify-between text-slate-400"><span>Branch:</span> <b className="text-white">{branch}</b></div>
          <div className="flex justify-between text-slate-400"><span>Class & Section:</span> <b className="text-white">{className} ({section})</b></div>
          <div className="flex justify-between text-slate-400"><span>Teacher:</span> <b className="text-indigo-300">{session.teacher_name}</b></div>
          <div className="flex justify-between text-slate-400"><span>Faculty:</span> <b className="text-slate-300">{session.faculty_name || 'Computing'}</b></div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 text-left space-y-1">
          <p className="font-bold">✓ Profile Remembered & Synced</p>
          <p className="text-slate-300">
            During lecture, the camera will automatically detect your face and mark you <b>PRESENT</b>.
          </p>
        </div>

        <button
          onClick={onBackToPortal}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
        >
          Done & Return to Portal
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto my-8 px-4">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Class In-Session QR Registration</span>
              <h2 className="text-lg font-black text-white">{session.subject_name} ({session.subject_code})</h2>
              <p className="text-xs text-slate-400">
                Teacher: <span className="text-slate-200 font-semibold">{session.teacher_name}</span> • Faculty: <span className="text-indigo-300">{session.faculty_name || 'Department of Computing'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onBackToPortal}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Student Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Sagar Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Roll Number *</label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. 2023021060"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">College Email ID</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  placeholder="2023021060@mmmut.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Course</label>
              <input
                type="text"
                placeholder="e.g. B.Tech / BCA"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Branch / Dept *</label>
              <div className="relative">
                <GitBranch className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Class / Year *</label>
              <div className="relative">
                <Layers className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. 4th Year"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Section *</label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Section A"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Live Webcam / Selfie Photo Capture *
            </label>
            <CameraCapture onCapture={(blob) => setPhotoBlob(blob)} label="Take Selfie Face Photo" />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
            <span>Register in this Class & Remember Details</span>
          </button>
        </form>
      </div>
    </div>
  )
}
