import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getStudentProfile,
  getStudentSubjects,
  getStudentAttendance,
  enrollStudentInSubject,
  extractFaceEmbedding,
  extractVoiceEmbedding
} from '../lib/api'
import CameraCapture from '../components/CameraCapture'
import AudioRecorder from '../components/AudioRecorder'
import EditProfileModal from '../components/EditProfileModal'
import { BookOpen, Camera, Mic, Plus, CheckCircle2, Hash, Loader2, Sparkles, X, User, Edit3 } from 'lucide-react'

export default function StudentDashboard() {
  const { user, setUser } = useAuth()
  const [enrolledSubjects, setEnrolledSubjects] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)

  // Join code flow
  const [joinCodeInput, setJoinCodeInput] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinMsg, setJoinMsg] = useState({ type: '', text: '' })

  // Biometric registration modal
  const [bioModal, setBioModal] = useState(null) // 'face' | 'voice' | null
  const [bioLoading, setBioLoading] = useState(false)

  const fetchStudentData = async () => {
    if (!user) return
    setLoading(true)

    try {
      const profile = await getStudentProfile(user.id)
      if (profile) setUser(profile)

      const subs = await getStudentSubjects(user.id)
      setEnrolledSubjects((subs || []).map(e => e.subjects).filter(Boolean))

      const logs = await getStudentAttendance(user.id)
      setAttendanceRecords(logs || [])
    } catch (err) {
      console.error('Error fetching student data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudentData()

    // Handle auto-join from URL parameter
    const params = new URLSearchParams(window.location.search)
    const code = params.get('join-code')
    if (code) {
      setJoinCodeInput(code)
    }
  }, [user?.id])

  const handleJoinSubject = async () => {
    if (!joinCodeInput.trim()) {
      setJoinMsg({ type: 'error', text: 'Please enter a join code' })
      return
    }

    setJoining(true)
    setJoinMsg({ type: '', text: '' })

    try {
      await enrollStudentInSubject(user.id, joinCodeInput.trim())
      setJoinMsg({ type: 'success', text: 'Successfully enrolled in class!' })
      setJoinCodeInput('')
      fetchStudentData()
    } catch (err) {
      setJoinMsg({ type: 'error', text: err.message || 'Failed to join class' })
    } finally {
      setJoining(false)
    }
  }

  const handleFaceUpload = async (imageBlob) => {
    setBioLoading(true)
    try {
      await extractFaceEmbedding(imageBlob, user.id)
      alert('Face embedding registered successfully!')
      setBioModal(null)
      fetchStudentData()
    } catch (err) {
      alert('Failed to register face: ' + err.message)
    } finally {
      setBioLoading(false)
    }
  }

  const handleVoiceUpload = async (audioBlob) => {
    setBioLoading(true)
    try {
      await extractVoiceEmbedding(audioBlob, user.id)
      alert('Voice sample registered successfully!')
      setBioModal(null)
      fetchStudentData()
    } catch (err) {
      alert('Failed to register voice: ' + err.message)
    } finally {
      setBioLoading(false)
    }
  }

  const hasFace = !!user?.face_embedding
  const hasVoice = !!user?.voice_embedding

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner & Student Profile Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-5">
          {/* Student Profile Photo */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-900 border-2 border-indigo-500/30 flex items-center justify-center shadow-xl">
              {user?.photo_url ? (
                <img
                  src={user.photo_url}
                  alt={user?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 text-center p-2">
                  <User className="w-8 h-8 text-slate-600 mb-1" />
                  <span className="text-[10px]">No Photo</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setBioModal('face')}
              className="absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all cursor-pointer"
              title="Update Face Photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold tracking-wider uppercase mb-1">
              <Sparkles className="w-4 h-4" /> Verified Student Profile
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {user?.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {user?.email ? user.email : (user?.roll_no ? `Roll Number: ${user.roll_no}` : 'Student Portal')}
            </p>

            {/* Academic Info Chips */}
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
              {user?.roll_no && (
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono font-semibold">
                  Roll: {user.roll_no}
                </span>
              )}
              {user?.course && (
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold">
                  Course: {user.course}
                </span>
              )}
              {user?.branch && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                  Branch: {user.branch}
                </span>
              )}
              {user?.class_name && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                  Class: {user.class_name} {user?.section ? `(${user.section})` : ''}
                </span>
              )}
              {user?.dob && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                  DOB: {user.dob}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsEditProfileOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile & Photo</span>
          </button>

          <button
            onClick={() => setBioModal('face')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              hasFace
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Face AI: {hasFace ? 'Active' : 'Missing'}</span>
          </button>

          <button
            onClick={() => setBioModal('voice')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              hasVoice
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Voice AI: {hasVoice ? 'Active' : 'Missing'}</span>
          </button>
        </div>
      </div>

      {/* Complete Student Academic Identity Card */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Registered Student Academic Record</h2>
          </div>
          <button
            onClick={() => setIsEditProfileOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Info
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] text-slate-500 uppercase font-semibold">College Email</div>
            <div className="text-xs font-bold font-mono text-indigo-400 mt-0.5 truncate" title={user?.email}>{user?.email || 'Not set'}</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] text-slate-500 uppercase font-semibold">Roll Number</div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">{user?.roll_no || 'Not set'}</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] text-slate-500 uppercase font-semibold">Course & Branch</div>
            <div className="text-xs font-bold text-slate-200 mt-0.5">{user?.course || 'General'} {user?.branch ? `(${user.branch})` : ''}</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] text-slate-500 uppercase font-semibold">Class / Year</div>
            <div className="text-sm font-bold text-slate-200 mt-0.5">{user?.class_name || 'Not set'}</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] text-slate-500 uppercase font-semibold">Section</div>
            <div className="text-sm font-bold text-slate-200 mt-0.5">{user?.section || 'Not set'}</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] text-slate-500 uppercase font-semibold">Date of Birth</div>
            <div className="text-sm font-bold text-slate-200 mt-0.5">{user?.dob || 'Not set'}</div>
          </div>
        </div>
      </div>

      {/* Join Subject Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800">
        <h2 className="text-xl font-bold text-white tracking-tight mb-1">Join a New Class</h2>
        <p className="text-xs text-slate-400 mb-4">Enter the join code shared by your teacher</p>

        {joinMsg.text && (
          <div className={`mb-4 p-3 rounded-xl border text-xs ${
            joinMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}>
            {joinMsg.text}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleJoinSubject(); }} className="flex flex-col sm:flex-row gap-3 max-w-xl">
          <div className="relative flex-1">
            <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Paste 36-character Subject Code"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={joining}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Join Class
          </button>
        </form>
      </div>

      {/* Enrolled Subjects List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Your Enrolled Classes</h2>
            <p className="text-xs text-slate-400">Courses and attendance history</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
            {enrolledSubjects.length} Classes Enrolled
          </span>
        </div>

        {enrolledSubjects.length === 0 ? (
          <div className="glass-panel rounded-3xl p-10 text-center border border-slate-800/80">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-200">You haven't joined any classes yet</h3>
            <p className="text-xs text-slate-400 mt-1">Use the join code provided by your teacher above to enroll.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledSubjects.map((sub) => {
              const myLogs = attendanceRecords.filter(r => r.subject_id === sub.id)
              const presentCount = myLogs.filter(r => r.status === 'present').length
              const totalClasses = myLogs.length
              const pct = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 100

              return (
                <div
                  key={sub.id}
                  className="glass-card rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {sub.subject_code}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                        pct >= 75
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {pct}% Attendance
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1">{sub.name}</h3>
                    <p className="text-xs text-slate-400">Section: {sub.section}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                    <div>Attended: <span className="text-white font-semibold">{presentCount}</span> / {totalClasses} classes</div>
                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 75 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Attendance History Table */}
      {attendanceRecords.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800">
          <h2 className="text-xl font-bold text-white tracking-tight mb-1">Your Attendance Log History</h2>
          <p className="text-xs text-slate-400 mb-6">Complete record of your marked class attendances</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 bg-slate-900/60 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {attendanceRecords.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      {log.subjects?.name} ({log.subjects?.subject_code})
                    </td>
                    <td className="py-3 px-4 text-slate-400">{log.subjects?.section}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        log.status === 'present'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Biometrics Setup Modal */}
      {bioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setBioModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                bioModal === 'face'
                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}>
                {bioModal === 'face' ? <Camera className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">
                  {bioModal === 'face' ? 'Register Face Biometrics' : 'Register Voice Sample'}
                </h3>
                <p className="text-xs text-slate-400">
                  {bioModal === 'face' ? 'Take a clear portrait photo' : 'Record a 3-5 second speech sample'}
                </p>
              </div>
            </div>

            {bioLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                <div>
                  <h4 className="font-bold text-slate-200">Extracting 128-d Embedding...</h4>
                  <p className="text-xs text-slate-400 mt-1">Saving profile to Supabase database</p>
                </div>
              </div>
            ) : bioModal === 'face' ? (
              <CameraCapture onCapture={handleFaceUpload} label="Save Face Embedding" />
            ) : (
              <AudioRecorder onRecordingComplete={handleVoiceUpload} label="Save Voice Sample" />
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        student={user}
        onProfileUpdated={(updated) => setUser(updated)}
      />
    </div>
  )
}
