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
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
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
    try {
      setCameraError(null)
      if (stream) {
        stream.getTracks().forEach(t => t.stop())
      }

      if (!isGetUserMediaSupported) {
        throw new Error("Browser camera API is not accessible in this environment. Please click 'Choose / Snap Photo' or use HTTPS.")
      }

      const devId = deviceIdToUse || selectedDeviceId
      const constraints = {
        video: devId
          ? { deviceId: { exact: devId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      setIsCameraActive(true)
      await getCameraDevices()
    } catch (err) {
      console.warn("Camera start failed:", err)
      setIsCameraActive(false)
      setCameraError(err.message || "Camera permission denied or camera not found.")
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
    startCamera()
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Native Mobile Camera / File Input (Fallback) */}
      <input
        ref={mobileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileUpload}
        className="hidden"
      />

      {devices.length > 1 && (
        <div className="w-full flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
          <Settings2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="font-bold text-slate-500 shrink-0">Camera:</span>
          <select
            value={selectedDeviceId}
            onChange={handleDeviceChange}
            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 truncate font-medium"
          >
            {devices.map((d, index) => (
              <option key={d.deviceId || index} value={d.deviceId}>
                {d.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Video Viewport Container */}
      <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center group shadow-sm">
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
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-2">
              <Camera className="w-6 h-6 text-indigo-400" />
            </div>
            <p className="text-xs font-bold text-slate-200">Live Camera Stream</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Click "Open Live Camera" below to view your webcam</p>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        {isCameraActive && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold shadow-md">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            LIVE WEBCAM
          </div>
        )}

        {capturedImage && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-md">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PHOTO SAVED
          </div>
        )}
      </div>

      {cameraError && (
        <div className="flex items-start gap-2 p-2.5 text-xs rounded-xl bg-amber-50 border border-amber-200 text-amber-800 w-full font-medium">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span>{cameraError}</span>
            <button
              type="button"
              onClick={() => mobileInputRef.current?.click()}
              className="ml-2 font-bold underline text-indigo-600 cursor-pointer"
            >
              Upload / Snap Photo
            </button>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
        {!capturedImage ? (
          <>
            {!isCameraActive ? (
              <button
                type="button"
                onClick={() => startCamera()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>Open Live Camera</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={capturePhoto}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Snap Live Photo</span>
              </button>
            )}

            {/* File Upload / Mobile Native Photo */}
            <button
              type="button"
              onClick={() => mobileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all border border-slate-300 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Choose Photo / File</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={retake}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all border border-slate-300 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retake Photo</span>
          </button>
        )}
      </div>
    </div>
  )
}
