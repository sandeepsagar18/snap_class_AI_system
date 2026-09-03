import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { teacherLogin, teacherSignup, studentLogin, registerStudentFull } from '../lib/api'
import CameraCapture from '../components/CameraCapture'
import { Sparkles, ArrowRight, School, GraduationCap, Lock, User, Mail, Hash, Calendar, Layers, GitBranch, Users, Loader2, ShieldCheck, AlertCircle, CheckCircle, Zap, Shield, QrCode } from 'lucide-react'

export default function LandingPage() {
  const [role, setRole] = useState('teacher') // 'teacher' | 'student'
  const [isSignUp, setIsSignUp] = useState(false)
  const [isStudentRegister, setIsStudentRegister] = useState(false)

  // Teacher Form State
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  // Student Form State
  const [studentEmail, setStudentEmail] = useState('')
  const [studentPassword, setStudentPassword] = useState('')
  const [studentName, setStudentName] = useState('')
  const [studentRollNo, setStudentRollNo] = useState('')
  const [studentDob, setStudentDob] = useState('')
  const [studentClassName, setStudentClassName] = useState('')
  const [studentSection, setStudentSection] = useState('')
  const [studentCourse, setStudentCourse] = useState('B.Tech')
  const [studentBranch, setStudentBranch] = useState('')
  const [studentPhotoBlob, setStudentPhotoBlob] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()

  const handleTeacherAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        if (!name.trim() || !username.trim() || !password.trim()) {
          throw new Error('Please fill in all fields')
        }
        const teacher = await teacherSignup(name, username, password)
        login(teacher, 'teacher')
      } else {
        if (!username.trim() || !password.trim()) {
          throw new Error('Please enter your username and password')
        }
        const teacher = await teacherLogin(username, password)
        login(teacher, 'teacher')
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
    setLoading(true)
    setError('')

    try {
      if (isStudentRegister) {
        if (!studentName.trim()) throw new Error('Please enter your full name')
        if (!studentRollNo.trim()) throw new Error('Please enter your Roll Number')
        if (!studentEmail.trim()) throw new Error('Please enter your College Email')
        if (!studentPassword.trim()) throw new Error('Please create a secure password')

        const student = await registerStudentFull({
          name: studentName.trim(),
          email: studentEmail.trim().toLowerCase(),
          password: studentPassword.trim(),
          roll_no: studentRollNo.trim(),
          dob: studentDob.trim() || undefined,
          class_name: studentClassName.trim() || undefined,
          section: studentSection.trim() || undefined,
          course: studentCourse.trim() || 'B.Tech',
          branch: studentBranch.trim() || undefined
        }, studentPhotoBlob)

        login(student, 'student')
      } else {
        if (!studentEmail.trim()) throw new Error('Please enter your College Email')
        if (!studentPassword.trim()) throw new Error('Please enter your password')

        const student = await studentLogin(studentEmail.trim(), studentPassword.trim())
        login(student, 'student')
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Student login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* LEFT COLUMN: HERO HEADLINE & HIGHLIGHTS */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-sm shadow-indigo-500/10">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Next-Gen Attendance Automation
          </div>

          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight text-white leading-[1.12]">
            Making Attendance Faster with <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-purple-400 bg-clip-text text-transparent">Biometric AI</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
            Automated facial recognition, in-class QR registration, and instant semester attendance reports designed for high-accuracy institutional tracking.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Instant Face AI</div>
                <div className="text-[11px] text-slate-400">128-d Biometrics</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Dynamic Class QR</div>
                <div className="text-[11px] text-slate-400">All Networks (4G/5G)</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: EXPANDED AUTHENTICATION BOX WITH TALL COMFORTABLE PROPORTIONS */}
        <div className="lg:col-span-6 w-full flex justify-center lg:justify-end">
          <div className={`w-full ${isStudentRegister ? 'max-w-xl' : 'max-w-lg'} min-h-[520px] flex flex-col justify-between glass-panel rounded-3xl p-7 sm:p-10 border border-slate-700/70 shadow-2xl relative transition-all duration-300 bg-slate-900/95`}>
            <div>
              {/* Portal switch tabs */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800/90 mb-7">
                <button
                  type="button"
                  onClick={() => { setRole('teacher'); setError(''); }}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    role === 'teacher'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <School className="w-4 h-4" />
                  Teacher Portal
                </button>
                <button
                  type="button"
                  onClick={() => { setRole('student'); setError(''); }}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    role === 'student'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Student Portal
                </button>
              </div>

              {error && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {role === 'teacher' ? (
                <form onSubmit={handleTeacherAuth} className="space-y-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      {isSignUp ? 'Create Teacher Account' : 'Sign In as Teacher'}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      {isSignUp ? 'Already registered? Login' : 'Need an account? Sign up'}
                    </button>
                  </div>

                  {isSignUp && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                        <input
                          type="text"
                          placeholder="Prof. Alex Smith"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Username / Email</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                      <input
                        type="text"
                        placeholder="teacher_username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm transition-all shadow-xl shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span>{isSignUp ? 'Create Account' : 'Enter Dashboard'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleStudentAuth} className="space-y-5">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        {isStudentRegister ? 'New Student Registration' : 'Student Portal'}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {isStudentRegister ? 'Register your profile & live face photo' : 'Sign in using your College Email & Password'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setIsStudentRegister(!isStudentRegister); setError(''); }}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer shrink-0"
                    >
                      {isStudentRegister ? 'Registered? Sign in' : 'New student? Register'}
                    </button>
                  </div>

                  {isStudentRegister ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name *</label>
                          <div className="relative">
                            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                            <input
                              type="text"
                              placeholder="Aman Verma"
                              value={studentName}
                              onChange={(e) => setStudentName(e.target.value)}
                              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Roll Number *</label>
                          <div className="relative">
                            <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                            <input
                              type="text"
                              placeholder="2023021001"
                              value={studentRollNo}
                              onChange={(e) => setStudentRollNo(e.target.value)}
                              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">College Email ID *</label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                            <input
                              type="email"
                              placeholder="aman.2023@college.edu"
                              value={studentEmail}
                              onChange={(e) => setStudentEmail(e.target.value)}
                              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Create Password *</label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                            <input
                              type="password"
                              placeholder="••••••••"
                              value={studentPassword}
                              onChange={(e) => setStudentPassword(e.target.value)}
                              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Course</label>
                          <input
                            type="text"
                            placeholder="B.Tech"
                            value={studentCourse}
                            onChange={(e) => setStudentCourse(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Branch</label>
                          <input
                            type="text"
                            placeholder="CSE"
                            value={studentBranch}
                            onChange={(e) => setStudentBranch(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Section</label>
                          <input
                            type="text"
                            placeholder="A"
                            value={studentSection}
                            onChange={(e) => setStudentSection(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">Live Face Photo Capture (Biometrics)</label>
                        <CameraCapture onCapture={(blob) => setStudentPhotoBlob(blob)} label="Capture Live Photo" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">College Email ID</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                          <input
                            type="text"
                            placeholder="student@college.edu or Roll Number"
                            value={studentEmail}
                            onChange={(e) => setStudentEmail(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">Password</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                          <input
                            type="password"
                            placeholder="••••••••"
                            value={studentPassword}
                            onChange={(e) => setStudentPassword(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>Unregistered students cannot access the portal. Contact your instructor or click <b>"New student? Register"</b> to create an account.</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm transition-all shadow-xl shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span>{isStudentRegister ? 'Complete Registration & Access Portal' : 'Authenticate & Enter Portal'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
