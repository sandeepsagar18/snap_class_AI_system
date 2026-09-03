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

  const handleLaunchSessionFromConfig = async (sessionData) => {
    setActiveLectureSession(sessionData)
    try {
      if (sessionData.id && !sessionData.is_adhoc) {
        const studList = await getSubjectStudents(sessionData.id)
        setEnrolledStudents(studList || [])
      } else {
        setEnrolledStudents([])
      }
    } catch (e) {
      console.error(e)
    }
    setIsQRModalOpen(true)
  }

  const handleStartAttendanceSessionFromQR = (studentsList) => {
    if (studentsList && studentsList.length > 0) {
      setEnrolledStudents(studentsList)
    }
    setLiveSubject(activeLectureSession)
  }

  const handleStudentRegisteredInLecture = (newStudent) => {
    setEnrolledStudents((prev) => {
      const exists = prev.some((s) => s.id === newStudent.id || s.roll_no === newStudent.roll_no)
      if (exists) return prev
      return [newStudent, ...prev]
    })
  }

  const openLiveSession = async (subject) => {
    setActiveSubject(subject)
    const sessionObj = {
      session_id: subject.id,
      id: subject.id,
      subject_name: subject.name,
      subject_code: subject.subject_code,
      section: subject.section,
      teacher_name: user?.name || 'Prof. Sharma',
      faculty_name: user?.department || 'Department of Computer Science',
      class_name: 'Class Section',
      branch: user?.department || 'General'
    }
    setActiveLectureSession(sessionObj)

    try {
      const students = await getSubjectStudents(subject.id)
      setEnrolledStudents(students || [])
    } catch (err) {
      console.error('Error fetching students:', err)
      setEnrolledStudents([])
    }

    // Directly show the Projector QR modal for students to scan first!
    setIsQRModalOpen(true)
  }

  const openFaceAttendance = async (subject) => {
    setActiveSubject(subject)
    try {
      const students = await getSubjectStudents(subject.id)
      setEnrolledStudents(students || [])
      setAttendanceMode('face')
    } catch (err) {
      console.error('Error fetching students:', err)
      alert('Failed to load subject students')
    }
  }

  const openVoiceAttendance = async (subject) => {
    setActiveSubject(subject)
    try {
      const students = await getSubjectStudents(subject.id)
      setEnrolledStudents(students || [])
      setAttendanceMode('voice')
    } catch (err) {
      console.error('Error fetching students:', err)
      alert('Failed to load subject students')
    }
  }

  const handleFaceCapture = async (blob) => {
    setProcessingAI(true)
    try {
      const candidatesDict = {}
      enrolledStudents.forEach((st) => {
        if (st.face_embedding) {
          candidatesDict[st.id] = st.face_embedding
        }
      })

      const res = await predictFaceAttendance(blob, candidatesDict)
      setDetectedIds(res.present_student_ids || [])
      setResultsOpen(true)
      setAttendanceMode(null)
    } catch (err) {
      console.error('Face prediction error:', err)
      alert('Error during face recognition: ' + err.message)
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
    <div className="space-y-6 pb-12">
      {/* Compact Faculty Header Profile Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 glass-panel rounded-2xl p-5 border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center gap-4">
          {/* Teacher Profile Avatar */}
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0 shadow-xs">
            {user?.photo_url ? (
              <img
                src={user.photo_url}
                alt={user?.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-indigo-600 font-black text-xl">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-indigo-600 text-[11px] font-bold uppercase tracking-wider mb-0.5">
              <Sparkles className="w-3.5 h-3.5" /> Faculty Dashboard
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Welcome, {user?.name || 'Professor'}
            </h1>
            
            {/* Faculty Academic Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs">
              {user?.designation && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[11px]">
                  {user.designation}
                </span>
              )}
              {user?.department && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium">
                  {user.department}
                </span>
              )}
              {user?.qualification && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                  {user.qualification}
                </span>
              )}
              {user?.username && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-500 font-mono text-[11px]">
                  ID: {user.username}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => openConfigModal(null)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Start Attendance Session</span>
          </button>

          <button
            onClick={() => setIsAddStudentOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Subject</span>
          </button>

          <button
            onClick={fetchTeacherData}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-600 transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ACTIVE LECTURE SESSION CARD */}
      {activeLectureSession && (
        <div className="glass-panel rounded-2xl p-5 border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50/90 via-white/95 to-purple-50/90 shadow-md relative overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-rose-600">
                  LIVE CLASSROOM SESSION IN PROGRESS
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 border border-indigo-200">
                  {activeLectureSession.subject_code}
                </span>
              </div>

              <h2 className="text-xl font-black text-slate-900">
                {activeLectureSession.subject_name}
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                <div>Faculty: <span className="text-indigo-700 font-semibold">{activeLectureSession.faculty_name || 'Department of Computing'}</span></div>
                <div>Teacher: <span className="text-slate-900 font-semibold">{activeLectureSession.teacher_name}</span></div>
                <div>Class: <span className="text-slate-600">{activeLectureSession.class_name} ({activeLectureSession.section})</span></div>
                <div>Branch: <span className="text-slate-600">{activeLectureSession.branch}</span></div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
                <div className="text-base font-black text-emerald-600">{enrolledStudents.length}</div>
                <div className="text-[9px] text-slate-500 uppercase font-semibold">Registered</div>
              </div>

              <button
                onClick={() => setIsQRModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Show QR</span>
              </button>

              <button
                onClick={() => setLiveSubject(activeLectureSession)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>Open Live Camera</span>
              </button>

              <button
                onClick={() => {
                  setActiveLectureSession(null)
                  fetchTeacherData()
                }}
                className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold border border-slate-300 transition-all cursor-pointer"
                title="Dismiss Active Card"
              >
                <Square className="w-3.5 h-3.5" />
                <span>End</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subjects Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Your Classes & Subjects</h2>
            <p className="text-xs text-slate-500">Select a class to trigger face or voice attendance</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
            {subjects.length} Total Subjects
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="glass-panel rounded-2xl p-10 text-center border border-slate-200 bg-white">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No subjects created yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Click below to create your first class and share the join code with students.</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" />
              Create First Subject
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="glass-card rounded-2xl p-5 border border-slate-200 flex flex-col justify-between hover:border-indigo-300 transition-all group bg-white shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200">
                      {sub.subject_code}
                    </span>
                    <button
                      onClick={() => setShareSubject(sub)}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-600 text-slate-500 hover:text-white border border-slate-200 transition-all cursor-pointer"
                      title="Share Join Code / QR"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {sub.name}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5 mb-4">
                    Section: <span className="text-slate-800 font-semibold">{sub.section}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="font-bold text-slate-900">{sub.total_students || 0}</div>
                        <div className="text-[10px] text-slate-500">Students</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-violet-600" />
                      <div>
                        <div className="font-bold text-slate-900">{sub.total_classes || 0}</div>
                        <div className="text-[10px] text-slate-500">Sessions</div>
                      </div>
                    </div>
                  </div>

                  {/* Live 30-Min Streaming Attendance */}
                  <button
                    onClick={() => openLiveSession(sub)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-500/20 cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Start 30-Min Live Attendance
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
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Export Complete History (Excel)
                  </button>

                  {/* Manual Quick Scan Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openFaceAttendance(sub)}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-indigo-700 border border-slate-200 text-xs font-medium transition-all cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Face Photo
                    </button>
                    <button
                      onClick={() => openVoiceAttendance(sub)}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-rose-700 border border-slate-200 text-xs font-medium transition-all cursor-pointer"
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
        <div className="glass-panel rounded-2xl p-5 border border-slate-200 bg-white shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recent Attendance Logs</h2>
              <p className="text-xs text-slate-500">Latest recorded student attendance entries</p>
            </div>
            <button
              onClick={() => {
                const sub = subjects[0] || { name: 'All Subjects', subject_code: 'ALL', section: 'A' }
                exportSubjectLogsToExcel(sub, recentLogs)
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export History to Excel</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-600 bg-slate-50 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3.5 font-bold">Student</th>
                  <th className="py-2.5 px-3.5 font-bold">Subject</th>
                  <th className="py-2.5 px-3.5 font-bold">Section</th>
                  <th className="py-2.5 px-3.5 font-bold">Timestamp</th>
                  <th className="py-2.5 px-3.5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 bg-white">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">
                      {log.students?.name || 'Unknown Student'}
                    </td>
                    <td className="py-2.5 px-3.5 font-medium">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 bg-white">
            <button
              onClick={() => setAttendanceMode(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${attendanceMode === 'face' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                {attendanceMode === 'face' ? <Camera className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  {attendanceMode === 'face' ? 'Classroom Face Photo Scan' : 'Classroom Voice Audio Scan'}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeSubject?.name} ({activeSubject?.section}) • {enrolledStudents.length} Students Target
                </p>
              </div>
            </div>

            {processingAI ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-sm font-semibold text-slate-800">Processing biometric AI recognition...</p>
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
