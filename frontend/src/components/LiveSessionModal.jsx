import React, { useState, useEffect, useRef } from 'react'
import { X, Play, Square, Users, CheckCircle, Clock, Sparkles, Loader2, Video, AlertCircle, Settings2, Globe, FileSpreadsheet, Download, QrCode, ArrowRight, ShieldCheck } from 'lucide-react'
import { predictFaceAttendance, saveAttendanceLogs } from '../lib/api'
import { exportAttendanceToExcel } from '../lib/excelExport'

export default function LiveSessionModal({ isOpen, onClose, subject, students, onSuccess, onOpenQR }) {
  const [sessionActive, setSessionActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30 * 60) // 30 minutes in seconds (1800s)
  const [presentMap, setPresentMap] = useState({}) // { student_id: timestamp }
  const [lastScannedTime, setLastScannedTime] = useState(null)
  const [isScanningFrame, setIsScanningFrame] = useState(false)
  const [saving, setSaving] = useState(false)
  const [streamError, setStreamError] = useState(null)
  const [sessionCompleted, setSessionCompleted] = useState(false)

  // Camera device selection
  const [devices, setDevices] = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [cameraMode, setCameraMode] = useState('usb') // 'usb' | 'ip'
  const [ipCameraUrl, setIpCameraUrl] = useState('')

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)
  const timerRef = useRef(null)

  const getCameraDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = allDevices.filter(d => d.kind === 'videoinput')
      setDevices(videoInputs)
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId)
      }
    } catch (err) {
      console.error('Error listing camera devices:', err)
    }
  }

  const startCamera = async (deviceIdToUse) => {
    try {
      setStreamError(null)
      stopCamera()

      const devId = deviceIdToUse || selectedDeviceId
      const constraints = {
        video: devId
          ? { deviceId: { exact: devId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'user' },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.log('Video play error:', e))
        }
      }
    } catch (err) {
      console.error('Failed to access classroom webcam:', err)
      setStreamError('Could not start classroom webcam stream: ' + err.message)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const handleDeviceChange = (e) => {
    const newId = e.target.value
    setSelectedDeviceId(newId)
    if (sessionActive && cameraMode === 'usb') {
      startCamera(newId)
    }
  }

  const scanFrame = async () => {
    if (isScanningFrame || !sessionActive) return
    setIsScanningFrame(true)

    try {
      let imageBlob = null

      if (cameraMode === 'usb' && videoRef.current && canvasRef.current) {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = 960
          canvas.height = 720
          const ctx = canvas.getContext('2d')
          ctx.drawImage(video, 0, 0, 960, 720)

          imageBlob = await new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', 0.9)
          })
        }
      }

      if (imageBlob) {
        const studentIds = (students || []).map(s => s.id)
        const res = await predictFaceAttendance(imageBlob, studentIds)
        const detectedIds = res?.present_student_ids || []

        if (detectedIds && detectedIds.length > 0) {
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          setPresentMap(prev => {
            const next = { ...prev }
            detectedIds.forEach(id => {
              next[id] = next[id] || nowStr
              // Also map against matching student object in current class
              const matchingStudent = (students || []).find(s => String(s.id) === String(id) || String(s.student_id) === String(id) || (s.roll_no && String(s.roll_no) === String(id)))
              if (matchingStudent && matchingStudent.id) {
                next[matchingStudent.id] = next[matchingStudent.id] || nowStr
              }
            })
            return next
          })
        }
      }

      setLastScannedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch (err) {
      console.warn('Frame scan skip:', err)
    } finally {
      setIsScanningFrame(false)
    }
  }

  const startSession = () => {
    setSessionActive(true)
    setSessionCompleted(false)
    setTimeLeft(30 * 60)
    setPresentMap({})
    setLastScannedTime(null)

    if (cameraMode === 'usb') {
      startCamera()
    }

    // Trigger instant initial scan
    setTimeout(() => {
      scanFrame()
    }, 500)

    // Run rapid frame scan every 1.5 seconds for instant attendance!
    intervalRef.current = setInterval(() => {
      scanFrame()
    }, 1500)

    // Run countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endSession()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleDownloadExcel = () => {
    const sessionFormatted = new Date().toLocaleString()

    const studentsWithStatus = (students || []).map(s => {
      const markedTime = presentMap[s.id]
      const isPresent = !!markedTime
      return {
        ...s,
        isPresent,
        method: isPresent ? 'Biometric Face AI (Live Stream)' : 'Absent / Not Detected',
        markedAt: isPresent ? `${sessionFormatted.split(',')[0]}, ${markedTime}` : `${sessionFormatted} (Absent)`
      }
    })

    exportAttendanceToExcel({
      subjectName: subject?.name || subject?.subject_name || 'Class Subject',
      subjectCode: subject?.subject_code || 'CODE',
      section: subject?.section || 'A',
      teacherName: subject?.teacher_name || 'Prof. Sharma',
      facultyName: subject?.faculty_name || 'Department of Computer Science',
      sessionDate: sessionFormatted,
      sessionType: '30-Minute Live Video AI Session'
    }, studentsWithStatus)
  }

  const endSession = async () => {
    setSessionActive(false)
    setSessionCompleted(true)

    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    stopCamera()

    setSaving(true)
    try {
      const logs = (students || []).map(s => ({
        student_id: s.id,
        subject_id: subject?.id || subject?.session_id,
        status: presentMap[s.id] ? 'present' : 'absent',
        timestamp: new Date().toISOString()
      }))

      if (logs.length > 0) {
        await saveAttendanceLogs(logs)
      }

      handleDownloadExcel()
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Error saving session attendance:', err)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    getCameraDevices()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
      stopCamera()
    }
  }, [])

  if (!isOpen || !subject) return null

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const presentCount = Object.keys(presentMap).length
  const totalCount = (students || []).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="glass-panel w-full max-w-5xl rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] bg-white">
        
        {/* MODAL HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-slate-900">
                  {subject.name || subject.subject_name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono text-xs font-bold">
                  {subject.subject_code} ({subject.section})
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Teacher: <b className="text-slate-800">{subject.teacher_name || 'Faculty'}</b> • 30-Min Automated Facial Attendance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {sessionActive && (
              <button
                onClick={endSession}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-rose-600/25 animate-pulse"
                title="Finish class immediately and save attendance"
              >
                <CheckCircle className="w-4 h-4" />
                <span>End Class Session</span>
              </button>
            )}

            {onOpenQR && (
              <button
                onClick={onOpenQR}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="Project Student Registration QR Code"
              >
                <QrCode className="w-4 h-4" />
                <span>Project QR</span>
              </button>
            )}

            <button
              onClick={() => { if (sessionActive) endSession(); onClose(); }}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTROLS BAR: Camera Mode Switcher & Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 pb-2 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => { setCameraMode('usb'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                cameraMode === 'usb'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Classroom Webcam
            </button>
            <button
              onClick={() => { setCameraMode('ip'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                cameraMode === 'ip'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              CCTV / IP Stream
            </button>
          </div>

          {cameraMode === 'usb' && devices.length > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <Settings2 className="w-4 h-4 text-indigo-600" />
              <span className="text-slate-600 font-bold">Source:</span>
              <select
                value={selectedDeviceId}
                onChange={handleDeviceChange}
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 max-w-xs truncate font-medium"
              >
                {devices.map((device, idx) => (
                  <option key={device.deviceId || idx} value={device.deviceId}>
                    {device.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {cameraMode === 'ip' && !sessionActive && (
          <div className="pb-3 shrink-0">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>Classroom IP Camera / RTSP Network Stream URL:</span>
              </div>
              <input
                type="text"
                placeholder="e.g. http://192.168.1.120:8080/video or rtsp://admin:pass@192.168.1.50:554/live"
                value={ipCameraUrl}
                onChange={(e) => setIpCameraUrl(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono font-medium"
              />
            </div>
          </div>
        )}

        {/* MAIN SPLIT VIEW: LEFT = VIDEO FEED, RIGHT = REAL-TIME ROSTER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 py-2 flex-1 overflow-hidden min-h-0">
          
          {/* VIDEO CANVAS CONTAINER (7 COLS) */}
          <div className="lg:col-span-7 flex flex-col gap-3 min-h-0">
            <div className="relative flex-1 bg-slate-950 rounded-2xl border border-slate-300 overflow-hidden flex items-center justify-center min-h-[380px] sm:min-h-[440px] shadow-inner">
              {cameraMode === 'usb' ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-contain max-h-[460px] transform scale-x-[-1] ${!sessionActive ? 'hidden' : ''}`}
                />
              ) : (
                sessionActive && ipCameraUrl ? (
                  <img
                    src={ipCameraUrl}
                    alt="Classroom CCTV Stream"
                    className="w-full h-full object-contain max-h-[460px]"
                    crossOrigin="anonymous"
                  />
                ) : null
              )}

              <canvas ref={canvasRef} className="hidden" />

              {/* Ready to Start State */}
              {!sessionActive && !sessionCompleted && (
                <div className="text-center p-8 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-slate-900 text-indigo-400 flex items-center justify-center mx-auto border border-slate-800 shadow-md">
                    <Video className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-lg">Classroom Stream Ready</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                      Launch the automated video scan to detect all students sitting in this class session.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={startSession}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black transition-all shadow-xl shadow-indigo-600/30 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      Start 30-Min Live Session
                    </button>
                    {onOpenQR && (
                      <button
                        onClick={onOpenQR}
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all border border-slate-800 cursor-pointer"
                      >
                        <QrCode className="w-4 h-4 text-indigo-400" />
                        Project Student QR
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Finished Celebration State */}
              {sessionCompleted && !sessionActive && (
                <div className="text-center p-8 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-xl">Class Lecture Completed!</h4>
                    <p className="text-xs text-emerald-300 max-w-sm mx-auto mt-1 font-medium">
                      Attendance saved in PostgreSQL database: <b>{presentCount}</b> Present / {totalCount} Enrolled.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={handleDownloadExcel}
                      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all shadow-xl shadow-emerald-600/30 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Download Attendance Excel Sheet (.xlsx)
                    </button>
                  </div>
                </div>
              )}

              {/* Live Overlay Badges */}
              {sessionActive && (
                <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  <span>LIVE CLASSROOM STREAM</span>
                </div>
              )}

              {sessionActive && (
                <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-mono font-bold border border-slate-700 shadow-md">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{formatTimer(timeLeft)}</span>
                </div>
              )}

              {sessionActive && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-slate-300 text-[11px]">
                      {isScanningFrame ? 'AI Frame Analysis scanning students...' : `Last scan: ${lastScannedTime || 'Just now'}`}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-black">
                    {presentCount} Matched
                  </div>
                </div>
              )}
            </div>

            {streamError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{streamError}</span>
              </div>
            )}

            {sessionActive && (
              <button
                onClick={endSession}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-all shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white" />
                Finish Class & Save Attendance
              </button>
            )}
          </div>

          {/* REAL-TIME ROSTER PANEL (5 COLS) */}
          <div className="lg:col-span-5 rounded-2xl p-4 border border-slate-200 flex flex-col min-h-0 bg-slate-50">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Class Attendance Roster</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold">
                {presentCount} / {totalCount} Present
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {totalCount === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No students registered in this section yet</p>
                  <p className="text-[11px] text-slate-500 mt-1">Click "Project QR" above so students can scan and join.</p>
                </div>
              ) : (
                students.map((student) => {
                  const markedTime = presentMap[student.id]
                  const isPresent = !!markedTime

                  return (
                    <div
                      key={student.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        isPresent
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-950 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          isPresent ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <div className="text-xs font-bold truncate max-w-[130px] text-slate-900">{student.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {student.roll_no ? `Roll: ${student.roll_no}` : (isPresent ? `Marked ${markedTime}` : 'Absent')}
                          </div>
                        </div>
                      </div>

                      {isPresent ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                          <CheckCircle className="w-3.5 h-3.5" /> Present
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded-md bg-slate-100">
                          Absent
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3.5 border-t border-slate-100 text-xs text-slate-600 gap-3 shrink-0">
          <div>
            {saving ? (
              <span className="flex items-center gap-2 text-indigo-600 font-bold">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving session attendance & generating Excel report...
              </span>
            ) : sessionCompleted ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Attendance recorded! Download the Excel sheet below:
              </span>
            ) : (
              <span className="text-slate-500">
                📊 Attendance logs are stored in PostgreSQL database and exported as formatted <b>.xlsx</b> files.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {sessionActive && (
              <button
                onClick={endSession}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/25 cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                End & Finalize Class
              </button>
            )}

            {sessionCompleted && (
              <button
                onClick={handleDownloadExcel}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/25 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download Excel Sheet
              </button>
            )}

            <button
              onClick={() => { if (sessionActive) endSession(); onClose(); }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-all cursor-pointer"
            >
              {sessionActive ? 'Cancel / Close' : 'Close Window'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
