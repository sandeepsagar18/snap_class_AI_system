import React, { useState, useEffect, useRef } from 'react'
import { X, Play, Square, Users, CheckCircle, Clock, Sparkles, Loader2, Video, AlertCircle, Settings2, Globe, FileSpreadsheet, Download, QrCode } from 'lucide-react'
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
      console.error('Failed to open camera stream:', err)
      setStreamError(err.message || 'Could not access the selected camera device.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const handleDeviceChange = (e) => {
    const newDeviceId = e.target.value
    setSelectedDeviceId(newDeviceId)
    if (sessionActive && cameraMode === 'usb') {
      startCamera(newDeviceId)
    }
  }

  const startSession = async () => {
    setStreamError(null)
    setSessionActive(true)
    setSessionCompleted(false)
    setTimeLeft(30 * 60)

    if (cameraMode === 'usb') {
      await startCamera(selectedDeviceId)
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endSession()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    intervalRef.current = setInterval(() => {
      scanCurrentFrame()
    }, 3500)
  }

  const scanCurrentFrame = async () => {
    if (isScanningFrame) return
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas || video.readyState < 2) return

    setIsScanningFrame(true)
    const ctx = canvas.getContext('2d')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsScanningFrame(false)
        return
      }

      try {
        const res = await predictFaceAttendance(blob)
        const detected = res.present_student_ids || []

        if (detected.length > 0) {
          const nowStr = new Date().toLocaleTimeString()
          setPresentMap((prev) => {
            const updated = { ...prev }
            detected.forEach((id) => {
              const matchingStudent = students.find(s => String(s.id) === String(id) || String(s.roll_no) === String(id))
              if (matchingStudent && !updated[matchingStudent.id]) {
                updated[matchingStudent.id] = nowStr
              }
            })
            return updated
          })
        }
        setLastScannedTime(new Date().toLocaleTimeString())
      } catch (err) {
        console.error('Frame recognition background error:', err)
      } finally {
        setIsScanningFrame(false)
      }
    }, 'image/jpeg', 0.9)
  }

  const handleDownloadExcel = () => {
    const sessionFormatted = new Date().toLocaleString()
    const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    const studentsWithStatus = students.map((s) => {
      const isPresent = Boolean(presentMap[s.id] || (s.roll_no && presentMap[s.roll_no]) || (s.name && presentMap[s.name]))
      const exactMarkedTime = presentMap[s.id] || (s.roll_no && presentMap[s.roll_no]) || (s.name && presentMap[s.name]) || nowFormatted

      return {
        ...s,
        isPresent: isPresent,
        method: isPresent ? 'Biometric Face AI (Live Stream)' : 'Absent / Did Not Attend',
        markedAt: isPresent ? `${sessionFormatted.split(',')[0]}, ${exactMarkedTime}` : `${sessionFormatted} (Absent)`
      }
    })

    return exportAttendanceToExcel({
      subjectName: subject.name || subject.subject_name || 'Class Subject',
      subjectCode: subject.subject_code || 'CODE',
      section: subject.section || 'A',
      teacherName: subject.teacher_name || 'Prof. Sharma',
      facultyName: subject.faculty_name || 'Department of Computer Science',
      sessionDate: sessionFormatted,
      sessionType: 'Biometric Face AI Live Stream'
    }, studentsWithStatus)
  }

  const endSession = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    setSessionActive(false)
    setSessionCompleted(true)
    stopCamera()

    setSaving(true)
    try {
      const now = new Date().toISOString()
      const logs = students.map((s) => ({
        subject_id: subject.id,
        student_id: s.id,
        timestamp: now,
        status: presentMap[s.id] ? 'present' : 'absent'
      }))

      if (logs.length > 0) {
        await saveAttendanceLogs(logs)
      }

      // Automatically generate & download the Excel file upon class completion!
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
  const totalCount = students.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-4xl rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">Classroom Live Video Attendance (30 Mins)</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
                  {subject.name} ({subject.section})
                </span>
              </div>
              <p className="text-xs text-slate-400">Stream classroom camera / external CCTV — automatically exports Excel report upon class completion</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenQR && (
              <button
                onClick={onOpenQR}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 text-xs font-semibold transition-all cursor-pointer"
                title="Project Student Registration QR Code"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">Project QR</span>
              </button>
            )}
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition-all cursor-pointer"
              title="Download Excel Sheet (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => { if (sessionActive) endSession(); onClose(); }}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setCameraMode('usb'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                cameraMode === 'usb'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              USB / Plugged Classroom Camera
            </button>
            <button
              onClick={() => { setCameraMode('ip'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                cameraMode === 'ip'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              IP / Network CCTV Camera
            </button>
          </div>

          {cameraMode === 'usb' && devices.length > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <Settings2 className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-400">Camera Device:</span>
              <select
                value={selectedDeviceId}
                onChange={handleDeviceChange}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 max-w-xs truncate"
              >
                {devices.map((device, idx) => (
                  <option key={device.deviceId || idx} value={device.deviceId}>
                    {device.label || `Camera ${idx + 1} (USB/Classroom)`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {cameraMode === 'ip' && !sessionActive && (
          <div className="pt-3">
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>Enter Classroom IP Camera / CCTV Network Stream URL:</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. http://192.168.1.120:8080/video or rtsp://admin:pass@192.168.1.50:554/live"
                  value={ipCameraUrl}
                  onChange={(e) => setIpCameraUrl(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Compatible with standard classroom IP cameras, NVRs, and mobile IP webcam streams.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4 flex-1 overflow-hidden min-h-0">
          <div className="lg:col-span-2 flex flex-col gap-3 min-h-0">
            <div className="relative flex-1 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center min-h-[260px]">
              {cameraMode === 'usb' ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!sessionActive ? 'hidden' : ''}`}
                />
              ) : (
                sessionActive && ipCameraUrl ? (
                  <img
                    src={ipCameraUrl}
                    alt="Classroom CCTV Stream"
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : null
              )}

              <canvas ref={canvasRef} className="hidden" />

              {!sessionActive && (
                <div className="text-center p-6 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                    <Video className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">Classroom Streaming Ready</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      Start the 30-minute automated video session. When finished, an Excel spreadsheet will be created automatically.
                    </p>
                  </div>
                  <button
                    onClick={startSession}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Start 30-Min Live Session
                  </button>
                </div>
              )}

              {sessionActive && (
                <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/80 backdrop-blur-md text-white text-xs font-bold shadow-lg animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  <span>LIVE CLASSROOM STREAM</span>
                </div>
              )}

              {sessionActive && (
                <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md text-white text-xs font-mono font-bold border border-slate-700 shadow-lg">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{formatTimer(timeLeft)}</span>
                </div>
              )}

              {sessionActive && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-slate-300 text-[11px]">
                      {isScanningFrame ? 'AI Frame Analysis in progress...' : `Last scan: ${lastScannedTime || 'Just now'}`}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold">
                    {presentCount} Matched
                  </div>
                </div>
              )}
            </div>

            {streamError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{streamError}</span>
              </div>
            )}

            {sessionActive && (
              <div className="flex gap-3">
                <button
                  onClick={endSession}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
                >
                  <Square className="w-4 h-4 fill-white" />
                  End Class & Export Excel Attendance
                </button>
              </div>
            )}
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col min-h-0">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-xs text-white uppercase tracking-wider">Live Attendance Roster</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
                {presentCount} / {totalCount}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {students.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No students enrolled in this subject yet.
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
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          isPresent ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/40' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <div className="text-xs font-semibold truncate max-w-[110px]">{student.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {student.roll_no ? student.roll_no : (isPresent ? `Marked ${markedTime}` : 'Absent')}
                          </div>
                        </div>
                      </div>

                      {isPresent ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5" /> Present
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Absent</span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-500 shrink-0">
          <div>
            {saving ? (
              <span className="flex items-center gap-2 text-indigo-400 font-semibold">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving session attendance & generating Excel report...
              </span>
            ) : (
              <span className="text-slate-400">
                📊 Attendance logs are stored in PostgreSQL & exported as <b>.xlsx</b> files.
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Excel Report
            </button>
            <button
              onClick={() => { if (sessionActive) endSession(); onClose(); }}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
            >
              Close Window
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
