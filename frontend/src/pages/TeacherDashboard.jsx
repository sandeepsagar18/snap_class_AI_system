import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getTeacherSubjects,
  getTeacherLogs,
  getSubjectStudents,
  predictFaceAttendance,
  predictVoiceAttendance
} from '../lib/api'
import CreateSubjectModal from '../components/CreateSubjectModal'
import ShareModal from '../components/ShareModal'
import AttendanceResultModal from '../components/AttendanceResultModal'
import AddStudentModal from '../components/AddStudentModal'
import LiveSessionModal from '../components/LiveSessionModal'
import StartAttendanceConfigModal from '../components/StartAttendanceConfigModal'
import LectureQRRegistrationModal from '../components/LectureQRRegistrationModal'
import CameraCapture from '../components/CameraCapture'
import AudioRecorder from '../components/AudioRecorder'
import { Plus, BookOpen, Users, Camera, Mic, Share2, Calendar, CheckCircle2, RefreshCw, Loader2, Sparkles, X, Video, FileSpreadsheet, Download, Play, Sliders, QrCode, Square, Radio } from 'lucide-react'
import { exportSubjectLogsToExcel, exportClassFullHistoryToExcel, exportAttendanceToExcel } from '../lib/excelExport'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [configSubject, setConfigSubject] = useState(null)
  const [shareSubject, setShareSubject] = useState(null)
  const [activeSubject, setActiveSubject] = useState(null)
  const [liveSubject, setLiveSubject] = useState(null)

  // Active Lecture Session Card
  const [activeLectureSession, setActiveLectureSession] = useState(null)
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)

  // Attendance flow
  const [attendanceMode, setAttendanceMode] = useState(null) // 'face' | 'voice' | null
  const [processingAI, setProcessingAI] = useState(false)
  const [resultsOpen, setResultsOpen] = useState(false)
  const [detectedIds, setDetectedIds] = useState([])
  const [enrolledStudents, setEnrolledStudents] = useState([])

  // Recent logs
  const [recentLogs, setRecentLogs] = useState([])

  const fetchTeacherData = async () => {
    if (!user) return
    setLoading(true)

    try {
      const subs = await getTeacherSubjects(user.id)
      setSubjects(subs || [])

      const logs = await getTeacherLogs(user.id)
      setRecentLogs(logs || [])
    } catch (err) {
      console.error('Error fetching teacher data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeacherData()
  }, [user])

  const [pendingSessionType, setPendingSessionType] = useState('live')

  const openConfigModal = (subject = null) => {
    setConfigSubject(subject)
    setIsConfigOpen(true)
  }

  const handleLaunchSessionFromConfig = ({ session, subject, students, sessionType }) => {
    setActiveLectureSession(session)
    setEnrolledStudents(students)
    setPendingSessionType(sessionType || 'live')
    // STEP 1: First create and open the QR Code modal for students to register
    setIsQRModalOpen(true)
  }

  const handleStartAttendanceSessionFromQR = (updatedStudents = []) => {
    if (updatedStudents && updatedStudents.length > 0) {
      setEnrolledStudents(updatedStudents)
    }
    // STEP 2: After QR registration, launch the attendance camera session
    if (pendingSessionType === 'live') {
      setLiveSubject(activeLectureSession)
    } else {
      setActiveSubject(activeLectureSession)
      setAttendanceMode('face')
    }
  }

  const handleStudentRegisteredInLecture = (newStudent) => {
    if (activeLectureSession) {
      setActiveLectureSession(prev => ({
        ...prev,
        students: [...(prev.students || []), newStudent]
      }))
      setEnrolledStudents(prev => [...prev, newStudent])
    }
    fetchTeacherData()
  }

  const openLiveSession = async (subject) => {
    openConfigModal(subject)
  }

  const openFaceAttendance = async (subject) => {
    openConfigModal(subject)
  }

  const openVoiceAttendance = async (subject) => {
    setActiveSubject(subject)
    setAttendanceMode('voice')

    try {
      const students = await getSubjectStudents(subject.id)
      setEnrolledStudents(students || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleFaceCapture = async (imageBlob) => {
    setProcessingAI(true)
    try {
      const res = await predictFaceAttendance(imageBlob)
      setDetectedIds(res.present_student_ids || [])
      setResultsOpen(true)
      setAttendanceMode(null)
    } catch (err) {
      console.error('Face prediction error:', err)
      alert('Error during face detection: ' + err.message)
    } finally {
      setProcessingAI(false)
    }
  }

  const handleVoiceRecord = async (audioBlob) => {
    setProcessingAI(true)
    try {
      const candidatesDict = {}
      enrolledStudents.forEach((st) => {
        if (st.voice_embedding) {
          candidatesDict[st.id] = st.voice_embedding
        }
      })

      const res = await predictVoiceAttendance(audioBlob, candidatesDict)
      setDetectedIds(res.present_student_ids || [])
      setResultsOpen(true)
      setAttendanceMode(null)
    } catch (err) {
      console.error('Voice prediction error:', err)
      alert('Error during voice recognition: ' + err.message)
    } finally {
      setProcessingAI(false)
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Profile Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> Faculty Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome, {user?.name || 'Professor'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage attendance sessions with automated facial recognition & student lecture registration QR.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => openConfigModal(null)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Attendance Session</span>
          </button>

          <button
            onClick={() => setIsAddStudentOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Add Student</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-semibold text-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Subject</span>
          </button>

          <button
            onClick={fetchTeacherData}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ACTIVE LECTURE SESSION CARD */}
      {activeLectureSession && (
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-950/80 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-rose-400">
                  LIVE CLASSROOM SESSION IN PROGRESS
                </span>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {activeLectureSession.subject_code}
                </span>
              </div>

              <h2 className="text-2xl font-black text-white">
                {activeLectureSession.subject_name}
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                <div>Faculty: <span className="text-indigo-300 font-semibold">{activeLectureSession.faculty_name || 'Department of Computing'}</span></div>
                <div>Teacher: <span className="text-white font-semibold">{activeLectureSession.teacher_name}</span></div>
                <div>Class: <span className="text-slate-400">{activeLectureSession.class_name} ({activeLectureSession.section})</span></div>
                <div>Branch: <span className="text-slate-400">{activeLectureSession.branch}</span></div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
                <div className="text-lg font-black text-emerald-400">{enrolledStudents.length}</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Registered Students</div>
              </div>

              <button
                onClick={() => setIsQRModalOpen(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Show Student Registration QR</span>
              </button>

              <button
                onClick={() => setLiveSubject(activeLectureSession)}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>Open Live Stream Camera</span>
              </button>

              <button
                onClick={() => {
                  setActiveLectureSession(null)
                  fetchTeacherData()
                }}
                className="flex items-center gap-1.5 px-3 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                title="Dismiss Active Card"
              >
                <Square className="w-4 h-4" />
                <span>End Session</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subjects Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Your Classes & Subjects</h2>
            <p className="text-xs text-slate-400">Select a class to trigger face or voice attendance</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
            {subjects.length} Total Subjects
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center border border-slate-800/80">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-200">No subjects created yet</h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">Click below to create your first class and share the join code with students.</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              Create First Subject
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="glass-card rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {sub.subject_code}
                    </span>
                    <button
                      onClick={() => setShareSubject(sub)}
                      className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-indigo-600 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
                      title="Share Join Code / QR"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {sub.name}
                  </h3>
                  <div className="text-xs text-slate-400 mt-1 mb-6">
                    Section: <span className="text-slate-300 font-medium">{sub.section}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/60 text-xs">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-bold text-white">{sub.total_students || 0}</div>
                        <div className="text-[10px] text-slate-500">Students</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-violet-400" />
                      <div>
                        <div className="font-bold text-white">{sub.total_classes || 0}</div>
                        <div className="text-[10px] text-slate-500">Sessions</div>
                      </div>
                    </div>
                  </div>

                  {/* Live 30-Min Streaming Attendance */}
                  <button
                    onClick={() => openLiveSession(sub)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                    Start 30-Min Live Stream Attendance
                  </button>

                  {/* Export Full Class History Button */}
                  <button
                    onClick={async () => {
                      try {
                        const studentsInSub = await getSubjectStudents(sub.id)
                        const subLogs = recentLogs.filter(l => l.subjects?.subject_code === sub.subject_code || l.subjects?.name === sub.name)
                        exportClassFullHistoryToExcel(sub, studentsInSub, subLogs)
                      } catch (err) {
                        console.error('Error exporting class history:', err)
                        exportClassFullHistoryToExcel(sub, [], [])
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Export Complete Class History (Excel)
                  </button>

                  {/* Manual Quick Scan Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openFaceAttendance(sub)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white border border-slate-800 text-xs font-medium transition-all cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Face Photo
                    </button>
                    <button
                      onClick={() => openVoiceAttendance(sub)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-300 hover:text-white border border-slate-800 text-xs font-medium transition-all cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      Voice Audio
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Attendance Logs Table */}
      {recentLogs.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Recent Attendance Logs</h2>
              <p className="text-xs text-slate-400">Latest recorded student attendance entries</p>
            </div>
            <button
              onClick={() => {
                const sub = subjects[0] || { name: 'All Subjects', subject_code: 'ALL', section: 'A' }
                exportSubjectLogsToExcel(sub, recentLogs)
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/20 cursor-pointer self-start sm:self-auto"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export History to Excel</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 bg-slate-900/60 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      {log.students?.name || 'Unknown Student'}
                    </td>
                    <td className="py-3 px-4">
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

      {/* Pre-Attendance Setup Configuration Modal */}
      <StartAttendanceConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        initialSubject={configSubject}
        existingSubjects={subjects}
        currentTeacherName={user?.name || 'Prof. Sharma'}
        onLaunchSession={handleLaunchSessionFromConfig}
      />

      {/* Lecture Student Registration QR Modal */}
      <LectureQRRegistrationModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        session={activeLectureSession}
        onStudentRegistered={handleStudentRegisteredInLecture}
        onStartAttendanceSession={handleStartAttendanceSessionFromQR}
      />

      {/* Modals */}
      <CreateSubjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={fetchTeacherData}
      />

      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        subjects={subjects}
        onStudentAdded={fetchTeacherData}
      />

      <ShareModal
        isOpen={!!shareSubject}
        onClose={() => setShareSubject(null)}
        subject={shareSubject}
      />

      <LiveSessionModal
        isOpen={!!liveSubject}
        onClose={() => setLiveSubject(null)}
        subject={liveSubject}
        students={enrolledStudents}
        onSuccess={fetchTeacherData}
        onOpenQR={() => setIsQRModalOpen(true)}
      />

      <AttendanceResultModal
        isOpen={resultsOpen}
        onClose={() => setResultsOpen(false)}
        subject={activeSubject}
        students={enrolledStudents}
        detectedStudentIds={detectedIds}
        onSuccess={fetchTeacherData}
      />

      {/* Snapshot Face / Voice Scan In-Dashboard Modal */}
      {attendanceMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setAttendanceMode(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${attendanceMode === 'face' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                {attendanceMode === 'face' ? <Camera className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">
                  {attendanceMode === 'face' ? 'Classroom Face Photo Scan' : 'Classroom Voice Audio Scan'}
                </h3>
                <p className="text-xs text-slate-400">
                  {activeSubject?.name} ({activeSubject?.section}) • {enrolledStudents.length} Students Target
                </p>
              </div>
            </div>

            {processingAI ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-sm font-semibold text-slate-300">Processing biometric AI recognition...</p>
                <p className="text-xs text-slate-500">Analyzing faces against student registration embeddings</p>
              </div>
            ) : (
              <div>
                {attendanceMode === 'face' ? (
                  <CameraCapture onCapture={handleFaceCapture} label="Capture Classroom Photo" />
                ) : (
                  <AudioRecorder onRecordingComplete={handleVoiceRecord} />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
