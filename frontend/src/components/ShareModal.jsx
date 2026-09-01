import React, { useState } from 'react'
import { X, Copy, Check, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export default function ShareModal({ isOpen, onClose, subject }) {
  const [copied, setCopied] = useState(false)
  if (!isOpen || !subject) return null

  const joinUrl = `${window.location.origin}/?join-code=${subject.id}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(subject.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Enrollment QR & Code</h3>
            <p className="text-xs text-slate-400">{subject.name} ({subject.section})</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl mb-6 shadow-inner">
          <QRCodeSVG value={joinUrl} size={180} level="H" />
          <p className="text-[11px] text-slate-500 font-semibold mt-3 text-center">
            Scan to enroll directly in this course
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">Subject Join Code</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={subject.id}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono select-all focus:outline-none"
            />
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
