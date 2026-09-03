import React from 'react'

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-850 py-6 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© {new Date().getFullYear()} SnapClass AI. Real-time Facial & Biometric Attendance System.</p>
        <p className="text-slate-400">Created with ❤️ by <span className="font-bold text-indigo-400">Sandeep Sagar</span></p>
      </div>
    </footer>
  )
}
