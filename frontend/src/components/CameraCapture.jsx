import React, { useRef, useState, useEffect } from 'react'
import { Camera, RefreshCw, Upload, CheckCircle2, AlertCircle, Video, Settings2, Smartphone, Image as ImageIcon } from 'lucide-react'

export default function CameraCapture({ onCapture, label = "Take Photo" }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const mobileInputRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [devices, setDevices] = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')

  const isGetUserMediaSupported = Boolean(
    navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function'
  )

  const getCameraDevices = async () => {
    if (!isGetUserMediaSupported) return
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
    if (!isGetUserMediaSupported) {
      // In non-https mobile environments, directly trigger native selfie camera
      if (mobileInputRef.current) {
        mobileInputRef.current.click()
      }
      return
    }

    try {
      setCameraError(null)
      if (stream) {
        stream.getTracks().forEach(t => t.stop())
      }

      const devId = deviceIdToUse || selectedDeviceId
      const constraints = {
        video: devId
          ? { deviceId: { exact: devId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'user' },
        audio: false
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      setIsCameraActive(true)
      await getCameraDevices()
    } catch (err) {
      console.warn("Browser getUserMedia failed, triggering mobile native camera:", err)
      // Automatically trigger native mobile selfie camera if getUserMedia is blocked by browser policy
      if (mobileInputRef.current) {
        mobileInputRef.current.click()
      } else {
        setCameraError("Browser camera access was restricted. Please use the 'Take Selfie Photo' button below.")
      }
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsCameraActive(false)
  }

  const handleDeviceChange = (e) => {
    const newDeviceId = e.target.value
    setSelectedDeviceId(newDeviceId)
    if (isCameraActive) {
      startCamera(newDeviceId)
    }
  }

  useEffect(() => {
    if (isCameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(err => console.log("Play error:", err))
      }
    }
  }, [isCameraActive, stream])

  useEffect(() => {
    getCameraDevices()
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedImage(URL.createObjectURL(blob))
        stopCamera()
        onCapture(blob)
      }
    }, 'image/jpeg', 0.95)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      stopCamera()
      setCapturedImage(URL.createObjectURL(file))
      onCapture(file)
    }
  }

  const retake = () => {
    setCapturedImage(null)
    if (isGetUserMediaSupported) {
      startCamera()
    } else if (mobileInputRef.current) {
      mobileInputRef.current.click()
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Hidden Mobile Native Front Camera Input */}
      <input
        ref={mobileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileUpload}
        className="hidden"
      />

      {devices.length > 1 && (
        <div className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <Settings2 className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="font-semibold text-slate-400 shrink-0">Source:</span>
          <select
            value={selectedDeviceId}
            onChange={handleDeviceChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 truncate"
          >
            {devices.map((d, index) => (
              <option key={d.deviceId || index} value={d.deviceId}>
                {d.label || `Camera ${index + 1} (Classroom / USB / External)`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center group shadow-inner">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured preview"
            className="w-full h-full object-cover"
          />
        ) : isCameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
            <Camera className="w-12 h-12 mb-2 stroke-1 text-indigo-400" />
            <p className="text-sm font-medium text-slate-300">Face Photo Required</p>
            <p className="text-xs text-slate-500 mt-1">Tap below to open your phone selfie camera or upload a photo</p>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        {isCameraActive && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE
          </div>
        )}

        {capturedImage && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold backdrop-blur-md">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PHOTO READY
          </div>
        )}
      </div>

      {cameraError && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 w-full">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 w-full">
        {!capturedImage ? (
          <>
            {/* Primary Native Selfie Camera Trigger (Works 100% on all mobile devices & LAN) */}
            <button
              type="button"
              onClick={() => {
                if (mobileInputRef.current) {
                  mobileInputRef.current.click()
                } else {
                  startCamera()
                }
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Take Live Selfie Photo (Camera)</span>
            </button>

            {isCameraActive && (
              <button
                type="button"
                onClick={capturePhoto}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Snap Webcam Frame</span>
              </button>
            )}

            {/* Gallery Upload Option */}
            <label className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-all border border-slate-800 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Choose Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </>
        ) : (
          <button
            type="button"
            onClick={retake}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-700 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Retake / Change Photo
          </button>
        )}
      </div>
    </div>
  )
}
