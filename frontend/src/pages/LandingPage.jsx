import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { teacherLogin, teacherSignup, studentLogin, registerStudentFull } from '../lib/api'
import CameraCapture from '../components/CameraCapture'
import { School, GraduationCap, ArrowRight, Sparkles, Lock, Mail, User, Hash, Calendar, Layers, GitBranch, Users, Loader2, ShieldCheck, AlertCircle } from 'lucide-react'

export default function LandingPage() {
  const { loginTeacher, loginStudent } = useAuth()
  const [role, setRole] = useState('teacher')
  const [isSignUp, setIsSignUp] = useState(false)
  const [isStudentRegister, setIsStudentRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Teacher credentials
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  // Student credentials & academic details
  const [studentEmail, setStudentEmail] = useState('')
  const [studentPassword, setStudentPassword] = useState('')
  const [studentName, setStudentName] = useState('')
  const [rollNo, setRollNo] = useState('')
  const [dob, setDob] = useState('')
  const [className, setClassName] = useState('')
  const [section, setSection] = useState('')
  const [course, setCourse] = useState('')
  const [branch, setBranch] = useState('')
  const [studentPhotoBlob, setStudentPhotoBlob] = useState(null)

  const handleTeacherAuth = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        if (!name || !username || !password) throw new Error('Please fill in all fields')
        const teacher = await teacherSignup(name.trim(), username.trim(), password.trim())
        loginTeacher(teacher)
      } else {
        if (!username || !password) throw new Error('Please enter username and password')
        const teacher = await teacherLogin(username.trim(), password.trim())
        loginTeacher(teacher)
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleStudentAuth = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isStudentRegister) {
        if (!studentName.trim()) throw new Error('Please enter your full name')
        if (!studentEmail.trim()) throw new Error('Please enter your College Email')
        if (!studentPassword || studentPassword.length < 4) throw new Error('Please enter a secure password (min 4 chars)')
        if (!rollNo.trim()) throw new Error('Please enter your Roll Number')

        const student = await registerStudentFull({
          name: studentName.trim(),
          email: studentEmail.trim(),
          password: studentPassword.trim(),
          roll_no: rollNo.trim(),
          dob: dob.trim(),
          class_name: className.trim(),
          section: section.trim(),
          course: course.trim(),
          branch: branch.trim()
        }, studentPhotoBlob)

        loginStudent(student)
      } else {
        // SECURE LOGIN: Student MUST be in database and provide valid college email & password
        if (!studentEmail.trim()) throw new Error('Please enter your College Email')
        if (!studentPassword.trim()) throw new Error('Please enter your Password')

        const student = await studentLogin(studentEmail.trim(), studentPassword.trim())
        loginStudent(student)
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Student login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 py-12">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="text-center max-w-2xl mb-8 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen Attendance Automation
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Making Attendance Faster with <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">Biometric AI</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Seamless face recognition & voice biometrics with institutional access control.
        </p>
      </div>

      <div className={`w-full ${isStudentRegister ? 'max-w-xl' : 'max-w-md'} glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative transition-all duration-300`}>
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => { setRole('teacher'); setError(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              role === 'teacher'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <School className="w-4 h-4" />
            Teacher Portal
          </button>
          <button
            type="button"
            onClick={() => { setRole('student'); setError(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              role === 'student'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Student Portal
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {role === 'teacher' ? (
          <form onSubmit={handleTeacherAuth} className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">
                {isSignUp ? 'Create Teacher Account' : 'Sign In as Teacher'}
              </span>
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                {isSignUp ? 'Already registered? Login' : 'Need an account? Sign up'}
              </button>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Prof. Alex Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="teacher_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Enter Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleStudentAuth} className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {isStudentRegister ? 'New Student Registration' : 'Secure Student Portal Access'}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isStudentRegister ? 'Register your profile, college email & live photo' : 'Sign in using your College Email & Password'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setIsStudentRegister(!isStudentRegister); setError(''); }}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer shrink-0"
              >
                {isStudentRegister ? 'Registered? Sign in' : 'New student? Register'}
              </button>
            </div>

            {isStudentRegister ? (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="e.g. Aman Verma"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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
                        placeholder="e.g. 2023021999"
                        value={rollNo}
                        onChange={(e) => setRollNo(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">College Email ID *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        placeholder="aman.2023@college.edu"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Set Password *</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Class / Year</label>
                    <div className="relative">
                      <Layers className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="4th Year"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Section</label>
                    <div className="relative">
                      <Users className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="Section B"
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Course</label>
                    <input
                      type="text"
                      placeholder="e.g. B.Tech / BCA / MCA"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Branch / Specialization</label>
                    <div className="relative">
                      <GitBranch className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="Computer Science (CSE)"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Live Face Photo Capture *</label>
                  <CameraCapture onCapture={(blob) => setStudentPhotoBlob(blob)} label="Capture Live Photo" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">College Email ID</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="student@college.edu or Roll Number"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Unregistered students cannot access the portal. Contact your instructor or click <b>"New student? Register"</b> to create an account.</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isStudentRegister ? 'Complete Registration & Access Portal' : 'Authenticate & Enter Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
