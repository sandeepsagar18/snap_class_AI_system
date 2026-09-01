import React, { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, QrCode, Copy, Check, Users, UserPlus, Sparkles, User, Hash, Mail, Loader2, Camera, Play, Video, ArrowRight, Wifi, Globe, Smartphone, Signal, ExternalLink, Settings } from 'lucide-react'
import CameraCapture from './CameraCapture'
import { registerStudentForLecture, getLectureSession, getNetworkIp } from '../lib/api'

export default function LectureQRRegistrationModal({
  isOpen,
  onClose,
  session,
  onStudentRegistered,
  onStartAttendanceSession
}) {
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState('qr') // 'qr' | 'manual'
  const [currentStudents, setCurrentStudents] = useState([])

  // Network IP & Public Domain configuration
  const [networkHost, setNetworkHost] = useState('192.168.29.137')
  const [availableIps, setAvailableIps] = useState(['192.168.29.137', '192.168.137.1'])
  const [usePublicUrl, setUsePublicUrl] = useState(false)
  const [publicDomain, setPublicDomain] = useState('')
  const [showNetworkSettings, setShowNetworkSettings] = useState(false)

  // Manual student form
  const [studentName, setStudentName] = useState('')
  const [rollNo, setRollNo] = useState('')
  const [email, setEmail] = useState('')
  const [dob, setDob] = useState('')
  const [photoBlob, setPhotoBlob] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')

  // Sync initial students
  useEffect(() => {
    if (session?.students) {
      setCurrentStudents(session.students)
    }
  }, [session])

  // Load saved public domain or detect LAN IPs
  useEffect(() => {
    try {
      const savedDomain = localStorage.getItem('snapclass_public_domain')
      if (savedDomain) {
        setPublicDomain(savedDomain)
        setUsePublicUrl(true)
      }
    } catch (e) {}

    const detectIp = async () => {
      try {
        const netData = await getNetworkIp()
        if (netData.public_tunnel_url) {
          setPublicDomain(netData.public_tunnel_url)
          setUsePublicUrl(true)
        }
        if (netData.primary_ip && netData.primary_ip !== '127.0.0.1') {
          setNetworkHost(netData.primary_ip)
        }
        if (netData.all_ips && netData.all_ips.length > 0) {
          setAvailableIps(netData.all_ips)
        }
      } catch (e) {
        console.error('IP detection error:', e)
      }
    }
    if (isOpen) detectIp()
  }, [isOpen])

  // Live polling every 2.5s for real-time student registration updates from QR scans
  useEffect(() => {
    if (!isOpen || !session?.session_id) return

    let isMounted = true
    const interval = setInterval(async () => {
      try {
        const latest = await getLectureSession(session.session_id)
        if (isMounted && latest?.students) {
          setCurrentStudents(latest.students)
        }
      } catch (err) {
        // ignore background poll errors
      }
    }, 2500)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [isOpen, session?.session_id])

  if (!isOpen || !session) return null

  // Calculate dynamic QR registration URL based on network mode
  const port = window.location.port ? `:${window.location.port}` : ''
  let registrationUrl = ''

  if (usePublicUrl && publicDomain.trim()) {
    let clean = publicDomain.trim().replace(/\/$/, '')
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`
    }
    registrationUrl = `${clean}/?join_lecture=${session.session_id}`
  } else {
    registrationUrl = `http://${networkHost}${port}/?join_lecture=${session.session_id}`
  }

  const handleSavePublicDomain = (val) => {
    setPublicDomain(val)
    try {
      localStorage.setItem('snapclass_public_domain', val)
    } catch (e) {}
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(registrationUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleManualRegister = async (e) => {
    e.preventDefault()
    if (!studentName.trim()) {
      setSubmitError('Please enter student full name')
      return
    }
    if (!rollNo.trim()) {
      setSubmitError('Please enter student Roll Number')
      return
    }

    setSubmitting(true)
    setSubmitError('')
    setSubmitSuccess('')

    try {
      const res = await registerStudentForLecture(session.session_id, {
        name: studentName.trim(),
        roll_no: rollNo.trim(),
        email: email.trim() || undefined,
        course: session.course,
        branch: session.branch,
        class_name: session.class_name,
        section: session.section,
        dob: dob.trim() || undefined
      }, photoBlob)

      setSubmitSuccess(`✓ Student ${studentName} registered for this lecture!`)
      setStudentName('')
      setRollNo('')
      setEmail('')
      setPhotoBlob(null)

      if (res.student) {
        setCurrentStudents(prev => [...prev, res.student])
        if (onStudentRegistered) onStudentRegistered(res.student)
      }
    } catch (err) {
      console.error('Manual student registration error:', err)
      setSubmitError(err.message || 'Failed to register student for lecture')
    } finally {
      setSubmitting(false)
    }
  }

  const totalRegistered = currentStudents.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-8 border-2 border-indigo-500/30 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[94vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Step 1: Student Registration QR</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                {totalRegistered} In Roster
              </span>
            </div>
            <h3 className="font-extrabold text-lg text-white">
              {session.subject_name} ({session.subject_code})
            </h3>
            <p className="text-xs text-slate-400">
              Teacher: <b className="text-white">{session.teacher_name}</b> • Faculty: <b className="text-indigo-300">{session.faculty_name || 'Computing'}</b> • Class: <b className="text-slate-300">{session.class_name} ({session.section})</b>
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('qr')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'qr' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Classroom Projector QR</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'manual' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Manual In-Class Registration</span>
          </button>
        </div>

        {mode === 'qr' ? (
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Network Access Mode Switcher */}
            <div className="w-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3 text-xs text-left space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <Signal className="w-4 h-4 text-indigo-400" />
                  <span>Network Access Mode:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNetworkSettings(!showNetworkSettings)}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>{showNetworkSettings ? 'Hide Options' : 'Configure Network'}</span>
                </button>
              </div>

              {/* Mode Toggle Chips */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setUsePublicUrl(false)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl border text-[11px] font-semibold cursor-pointer transition-all ${
                    !usePublicUrl
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Wi-Fi / Hotspot ({networkHost})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUsePublicUrl(true)
                    setShowNetworkSettings(true)
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl border text-[11px] font-semibold cursor-pointer transition-all ${
                    usePublicUrl
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>All Networks (4G/5G/Anywhere)</span>
                </button>
              </div>

              {/* Expanded Network Settings */}
              {showNetworkSettings && (
                <div className="pt-2 border-t border-slate-800/80 space-y-2 text-[11px]">
                  {usePublicUrl ? (
                    <div>
                      <label className="block text-slate-400 mb-1">
                        Public Tunnel / Domain URL (for Mobile Phone 4G/5G Network):
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. https://your-tunnel.loca.lt or https://snapclass.yourcollege.edu"
                        value={publicDomain}
                        onChange={(e) => handleSavePublicDomain(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Enter your Cloudflare, Ngrok, or deployed server link to allow students on cellular mobile data (Jio, Airtel, etc.) to scan from anywhere!
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Select Local IP:</span>
                      <select
                        value={networkHost}
                        onChange={(e) => setNetworkHost(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-emerald-300 font-mono focus:outline-none focus:border-indigo-500"
                      >
                        {availableIps.map((ip) => (
                          <option key={ip} value={ip}>{ip} (Wi-Fi/Hotspot)</option>
                        ))}
                        <option value="localhost">localhost</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-indigo-500/30 inline-block">
              <QRCodeSVG
                value={registrationUrl}
                size={220}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="space-y-1 max-w-sm">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400">
                <Smartphone className="w-4 h-4" />
                <span>Accessible by Any Smartphone</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {usePublicUrl
                  ? 'Students on ANY network (Wi-Fi, 4G, 5G) can scan this QR code to register their details & selfie.'
                  : 'Students connected to the classroom Wi-Fi or Mobile Hotspot can scan this QR code.'}
              </p>
            </div>

            <div className="w-full flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 text-xs">
              <input
                type="text"
                readOnly
                value={registrationUrl}
                className="flex-1 bg-transparent px-2 text-slate-300 font-mono text-[11px] outline-none truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>

            {/* Live registered roster preview chips */}
            {currentStudents.length > 0 && (
              <div className="w-full text-left p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Live Registered Students ({currentStudents.length})
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Live Updating
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {currentStudents.map((st, idx) => (
                    <span key={st.id || idx} className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300">
                      ✓ {st.name} {st.roll_no ? `(${st.roll_no})` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleManualRegister} className="space-y-3.5">
            {submitError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {submitError}
              </div>
            )}
            {submitSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                {submitSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Student Full Name *</label>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">College Email ID</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    placeholder="student@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Live Face Photo Capture *</label>
              <CameraCapture onCapture={(blob) => setPhotoBlob(blob)} label="Capture Student Face Photo" />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              <span>Register & Add to This Lecture Roster</span>
            </button>
          </form>
        )}

        {/* STEP 2 ACTION: START ATTENDANCE SESSION */}
        <div className="pt-5 mt-5 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer text-center"
          >
            Keep QR Open on Dashboard
          </button>

          {onStartAttendanceSession && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onStartAttendanceSession(currentStudents)
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-extrabold transition-all shadow-xl shadow-emerald-600/25 cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>Start Live Attendance Session Now ({totalRegistered} Students)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
