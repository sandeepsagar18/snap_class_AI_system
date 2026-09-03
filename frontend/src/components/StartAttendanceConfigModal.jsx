import React, { useState, useEffect } from 'react'
import { X, Play, BookOpen, Layers, GitBranch, Users, Video, Camera, Sparkles, CheckCircle2, AlertCircle, Hash, Loader2, User, Building } from 'lucide-react'
import { queryStudentsRoster, createLectureSession } from '../lib/api'

export default function StartAttendanceConfigModal({
  isOpen,
  onClose,
  initialSubject = null,
  existingSubjects = [],
  currentTeacherName = 'Prof. Sharma',
  onLaunchSession
}) {
  const [teacherName, setTeacherName] = useState(currentTeacherName)
  const [facultyName, setFacultyName] = useState('Department of Computer Science')
  const [subjectName, setSubjectName] = useState('')
  const [subjectCode, setSubjectCode] = useState('')
  const [course, setCourse] = useState('B.Tech')
  const [branch, setBranch] = useState('Computer Science')
  const [className, setClassName] = useState('4th Year')
  const [section, setSection] = useState('Section A')
  const [sessionType, setSessionType] = useState('live') // 'live' | 'photo'

  const [matchingStudents, setMatchingStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [creating, setCreating] = useState(false)

  // Initialize or update fields when initialSubject changes
  useEffect(() => {
    if (initialSubject) {
      setSubjectName(initialSubject.name || '')
      setSubjectCode(initialSubject.subject_code || '')
      setSection(initialSubject.section || 'Section A')
    }
  }, [initialSubject, isOpen])

  useEffect(() => {
    if (currentTeacherName) {
      setTeacherName(currentTeacherName)
    }
  }, [currentTeacherName])

  // Query database students matching branch, class, section, or subject
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    const fetchMatching = async () => {
      setLoadingStudents(true)
      try {
        const students = await queryStudentsRoster({
          subject_id: initialSubject?.id,
          branch: branch,
          class_name: className,
          section: section,
          course: course
        })
        if (isMounted) {
          setMatchingStudents(students || [])
        }
      } catch (err) {
        console.error('Error fetching matching roster:', err)
      } finally {
        if (isMounted) setLoadingStudents(false)
      }
    }

    const timer = setTimeout(fetchMatching, 300)
    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [isOpen, initialSubject, branch, className, section, course])

  if (!isOpen) return null

  const handleSubjectSelect = (subId) => {
    const selected = existingSubjects.find(s => s.id === subId)
    if (selected) {
      setSubjectName(selected.name)
      setSubjectCode(selected.subject_code)
      setSection(selected.section)
    }
  }

  const handleLaunch = async (e) => {
    e.preventDefault()
    if (!subjectName.trim()) {
      alert('Please enter Subject Name')
      return
    }
    if (!teacherName.trim()) {
      alert('Please enter Teacher Name')
      return
    }

    setCreating(true)
    try {
      const createdSession = await createLectureSession({
        teacher_name: teacherName.trim(),
        faculty_name: facultyName.trim(),
        subject_name: subjectName.trim(),
        subject_code: subjectCode.trim() || 'SUB-01',
        course: course.trim(),
        branch: branch.trim(),
        class_name: className.trim(),
        section: section.trim(),
        students: matchingStudents
      })

      const sessionData = {
        session_id: createdSession.session_id,
        session: createdSession,
        subject: {
          id: initialSubject?.id || createdSession.session_id,
          name: subjectName.trim(),
          subject_code: subjectCode.trim() || 'SUB-01',
          section: section.trim() || 'A',
          course: course.trim(),
          branch: branch.trim(),
          class_name: className.trim(),
          teacher_name: teacherName.trim(),
          faculty_name: facultyName.trim()
        },
        students: matchingStudents,
        sessionType
      }

      onLaunchSession(sessionData)
      onClose()
    } catch (err) {
      console.error('Failed to create lecture session:', err)
      alert('Failed to launch session: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto bg-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">Start Attendance Session</h3>
            <p className="text-xs text-slate-500">Configure lecture details, teacher name, and student registration QR</p>
          </div>
        </div>

        <form onSubmit={handleLaunch} className="space-y-4">
          {/* Teacher and Faculty Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Teacher / Professor Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-indigo-600 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Prof. Sharma"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Faculty / Department Name *</label>
              <div className="relative">
                <Building className="w-4 h-4 text-indigo-600 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Department of Computer Science & Engg"
                  value={facultyName}
                  onChange={(e) => setFacultyName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                  required
                />
              </div>
            </div>
          </div>

          {existingSubjects.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quick Select Saved Subject</label>
              <select
                onChange={(e) => handleSubjectSelect(e.target.value)}
                defaultValue={initialSubject?.id || ''}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="">-- Custom / New Subject Session --</option>
                {existingSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.section}) - {sub.subject_code}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subject Name *</label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Machine Learning / Logic Programming"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subject Code *</label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. CS404 / CS405"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono font-bold"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Course</label>
              <input
                type="text"
                placeholder="e.g. B.Tech / BCA"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Branch / Department</label>
              <div className="relative">
                <GitBranch className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Class / Year</label>
              <div className="relative">
                <Layers className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. 4th Year"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Section</label>
            <div className="relative">
              <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="e.g. Section A / Section B"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Session Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Choose Attendance Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSessionType('live')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  sessionType === 'live'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Video className={`w-4 h-4 ${sessionType === 'live' ? 'text-indigo-600' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold">30-Min Live Stream</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Continuous video recognition from classroom webcam / stream.</p>
              </button>

              <button
                type="button"
                onClick={() => setSessionType('photo')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  sessionType === 'photo'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Camera className={`w-4 h-4 ${sessionType === 'photo' ? 'text-indigo-600' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold">Classroom Photo Snapshot</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Capture single classroom photo to scan all student faces at once.</p>
              </button>
            </div>
          </div>

          {/* Live Roster Target Preview */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Target Student Roster in Database
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold">
                {loadingStudents ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : `${matchingStudents.length} Students`}
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              ⚡ <b>Attendance Rule:</b> If student image is matched during lecture ➔ <span className="text-emerald-700 font-bold">PRESENT</span>; otherwise ➔ <span className="text-rose-700 font-bold">ABSENT</span>. Unregistered students can scan the in-class QR to register on mobile.
            </p>

            {matchingStudents.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {matchingStudents.slice(0, 6).map((st) => (
                  <span key={st.id} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-800 font-bold">
                    {st.name} {st.roll_no ? `(${st.roll_no})` : ''}
                  </span>
                ))}
                {matchingStudents.length > 6 && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                    +{matchingStudents.length - 6} more
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || matchingStudents.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              Launch Attendance & Create Session Card
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
