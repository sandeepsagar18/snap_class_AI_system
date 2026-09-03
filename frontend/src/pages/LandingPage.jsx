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
        
        {/* LEFT COLUMN: HERO HEADLINE & HIGHLIGHTS (Crisp Dark Text on Light Canvas) */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Next-Gen Attendance Automation
          </div>

          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight text-slate-900 leading-[1.12]">
            Making Attendance Faster with <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">Biometric AI</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-lg font-medium">
            Automated facial recognition, in-class QR registration, and instant semester attendance reports designed for high-accuracy institutional tracking.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Instant Face AI</div>
                <div className="text-[11px] text-slate-500">128-d Biometrics</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Dynamic Class QR</div>
                <div className="text-[11px] text-slate-500">All Networks (4G/5G)</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: EXPANDED AUTHENTICATION BOX (Crisp High-Contrast White Surface) */}
        <div className="lg:col-span-6 w-full flex justify-center lg:justify-end">
          <div className={`w-full ${isStudentRegister ? 'max-w-xl' : 'max-w-lg'} min-h-[520px] flex flex-col justify-between rounded-3xl p-7 sm:p-10 border border-slate-200/90 shadow-xl relative transition-all duration-300 bg-white`}>
            <div>
              {/* Portal switch tabs */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 mb-7">
                <button
                  type="button"
                  onClick={() => { setRole('teacher'); setError(''); }}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    role === 'teacher'
                      ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                      : 'text-slate-600 hover:text-slate-900'
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
                      ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Student Portal
                </button>
              </div>

              {error && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {role === 'teacher' ? (
                <form onSubmit={handleTeacherAuth} className="space-y-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {isSignUp ? 'Create Teacher Account' : 'Sign In as Teacher'}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                    >
                      {isSignUp ? 'Already registered? Login' : 'Need an account? Sign up'}
                    </button>
                  </div>

                  {isSignUp && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                        <input
                          type="text"
                          placeholder="Prof. Alex Smith"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Username / Email</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                      <input
                        type="text"
                        placeholder="teacher_username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
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
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        {isStudentRegister ? 'New Student Registration' : 'Student Portal'}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isStudentRegister ? 'Register your profile & live face photo' : 'Sign in using your College Email & Password'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setIsStudentRegister(!isStudentRegister); setError(''); }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer shrink-0"
                    >
                      {isStudentRegister ? 'Registered? Sign in' : 'New student? Register'}
                    </button>
                  </div>

                  {isStudentRegister ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
                          <div className="relative">
                            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                            <input
                              type="text"
                              placeholder="Aman Verma"
                              value={studentName}
                              onChange={(e) => setStudentName(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Roll Number *</label>
                          <div className="relative">
                            <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                            <input
                              type="text"
                              placeholder="2023021001"
                              value={studentRollNo}
                              onChange={(e) => setStudentRollNo(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono font-bold"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">College Email ID *</label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                            <input
                              type="email"
                              placeholder="aman.2023@college.edu"
                              value={studentEmail}
                              onChange={(e) => setStudentEmail(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Create Password *</label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                            <input
                              type="password"
                              placeholder="••••••••"
                              value={studentPassword}
                              onChange={(e) => setStudentPassword(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Course</label>
                          <input
                            type="text"
                            placeholder="B.Tech"
                            value={studentCourse}
                            onChange={(e) => setStudentCourse(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Branch</label>
                          <input
                            type="text"
                            placeholder="CSE"
                            value={studentBranch}
                            onChange={(e) => setStudentBranch(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Section</label>
                          <input
                            type="text"
                            placeholder="A"
                            value={studentSection}
                            onChange={(e) => setStudentSection(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">Live Face Photo Capture (Biometrics)</label>
                        <CameraCapture onCapture={(blob) => setStudentPhotoBlob(blob)} label="Capture Live Photo" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">College Email ID</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                          <input
                            type="text"
                            placeholder="student@college.edu or Roll Number"
                            value={studentEmail}
                            onChange={(e) => setStudentEmail(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">Password</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                          <input
                            type="password"
                            placeholder="••••••••"
                            value={studentPassword}
                            onChange={(e) => setStudentPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium"
                            required
                          />
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2.5 font-medium">
                        <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>Unregistered students cannot access the portal. Contact your instructor or click <b className="text-slate-900">"New student? Register"</b> to create an account.</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
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
