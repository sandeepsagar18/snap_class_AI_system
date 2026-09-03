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
    if (!joinCodeInput.trim()) return
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

  const handleFaceUpload = async (blob) => {
    setBioLoading(true)
    try {
      await extractFaceEmbedding(blob, user.id)
      alert('Face biometrics registered successfully!')
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
    <div className="space-y-6 pb-12">
      {/* Header Banner & Student Profile Card */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          {/* Student Profile Photo */}
          <div className="relative group shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-100 border border-indigo-200 flex items-center justify-center shadow-xs">
              {user?.photo_url ? (
                <img
                  src={user.photo_url}
                  alt={user?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 text-center p-2">
                  <User className="w-6 h-6 text-slate-400 mb-0.5" />
                  <span className="text-[9px] font-semibold">No Photo</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setBioModal('face')}
              className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer"
              title="Update Face Photo"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-indigo-600 text-[11px] font-bold tracking-wider uppercase mb-0.5">
              <Sparkles className="w-3.5 h-3.5" /> Verified Student Profile
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {user?.name}
            </h1>
            <p className="text-xs text-slate-500">
              {user?.email ? user.email : (user?.roll_no ? `Roll Number: ${user.roll_no}` : 'Student Portal')}
            </p>

            {/* Academic Info Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-xs">
              {user?.roll_no && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold text-[11px]">
                  Roll: {user.roll_no}
                </span>
              )}
              {user?.course && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[11px]">
                  {user.course}
                </span>
              )}
              {user?.branch && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium">
                  {user.branch}
                </span>
              )}
              {user?.class_name && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium">
                  {user.class_name} {user?.section ? `(${user.section})` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsEditProfileOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-500/20 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>

          <button
            onClick={() => setBioModal('face')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              hasFace
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Face AI: {hasFace ? 'Active' : 'Missing'}</span>
          </button>

          <button
            onClick={() => setBioModal('voice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              hasVoice
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice AI: {hasVoice ? 'Active' : 'Missing'}</span>
          </button>
        </div>
      </div>

      {/* Complete Student Academic Identity Card */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Registered Student Academic Record</h2>
          </div>
          <button
            onClick={() => setIsEditProfileOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            Edit Info
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-bold">College Email</div>
            <div className="text-xs font-bold font-mono text-indigo-600 mt-0.5 truncate" title={user?.email}>{user?.email || 'Not set'}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Roll Number</div>
            <div className="text-xs font-bold font-mono text-slate-900 mt-0.5">{user?.roll_no || 'Not set'}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Course & Branch</div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">{user?.course || 'General'} {user?.branch ? `(${user.branch})` : ''}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Class / Year</div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">{user?.class_name || 'Not set'}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Section</div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">{user?.section || 'Not set'}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Date of Birth</div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">{user?.dob || 'Not set'}</div>
          </div>
        </div>
      </div>

      {/* Join Subject Card */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-200 bg-white shadow-xs">
        <h2 className="text-base font-bold text-slate-900 tracking-tight mb-0.5">Join a New Class</h2>
        <p className="text-xs text-slate-500 mb-3">Enter the join code shared by your teacher</p>

        {joinMsg.text && (
          <div className={`mb-3 p-2.5 rounded-xl border text-xs font-medium ${
            joinMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            {joinMsg.text}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleJoinSubject(); }} className="flex flex-col sm:flex-row gap-2 max-w-xl">
          <div className="relative flex-1">
            <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Paste 36-character Subject Code"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={joining}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-500/20 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {joining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Join Class
          </button>
        </form>
      </div>

      {/* Enrolled Subjects List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Your Enrolled Classes</h2>
            <p className="text-xs text-slate-500">Courses and attendance history</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
            {enrolledSubjects.length} Classes Enrolled
          </span>
        </div>

        {enrolledSubjects.length === 0 ? (
          <div className="glass-panel rounded-2xl p-10 text-center border border-slate-200 bg-white">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">You haven't joined any classes yet</h3>
            <p className="text-xs text-slate-500 mt-1">Use the join code provided by your teacher above to enroll.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {enrolledSubjects.map((sub) => {
              const myLogs = attendanceRecords.filter(r => r.subject_id === sub.id)
              const presentCount = myLogs.filter(r => r.status === 'present').length
              const totalClasses = myLogs.length
              const pct = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 100

              return (
                <div
                  key={sub.id}
                  className="glass-card rounded-2xl p-5 border border-slate-200 flex flex-col justify-between bg-white shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200">
                        {sub.subject_code}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                        pct >= 75
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {pct}% Attendance
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-0.5">{sub.name}</h3>
                    <p className="text-xs text-slate-500">Section: <span className="text-slate-700 font-semibold">{sub.section}</span></p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div>Attended: <span className="text-slate-900 font-bold">{presentCount}</span> / {totalClasses} classes</div>
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
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
        <div className="glass-panel rounded-2xl p-5 border border-slate-200 bg-white shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-0.5">Your Attendance Log History</h2>
          <p className="text-xs text-slate-500 mb-4">Complete record of your marked class attendances</p>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-600 bg-slate-50 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3.5 font-bold">Subject</th>
                  <th className="py-2.5 px-3.5 font-bold">Section</th>
                  <th className="py-2.5 px-3.5 font-bold">Date & Time</th>
                  <th className="py-2.5 px-3.5 font-bold">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 bg-white">
                {attendanceRecords.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">
                      {log.subjects?.name} ({log.subjects?.subject_code})
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-600">{log.subjects?.section}</td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        log.status === 'present'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl relative bg-white">
            <button
              onClick={() => setBioModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                bioModal === 'face'
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}>
                {bioModal === 'face' ? <Camera className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  {bioModal === 'face' ? 'Register Face Biometrics' : 'Register Voice Sample'}
                </h3>
                <p className="text-xs text-slate-500">
                  {bioModal === 'face' ? 'Take a clear portrait photo' : 'Record a 3-5 second speech sample'}
                </p>
              </div>
            </div>

            {bioLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                <div>
                  <h4 className="font-bold text-slate-800">Extracting 128-d Embedding...</h4>
                  <p className="text-xs text-slate-500 mt-1">Saving profile to Supabase database</p>
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
