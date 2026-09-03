import React from 'react'

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200/80 bg-white/60 py-5 text-center text-xs text-slate-500 mt-10">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-slate-600 font-medium">© {new Date().getFullYear()} SnapClass AI. Real-time Facial & Biometric Attendance System.</p>
        <p className="text-slate-500">Created with ❤️ by <span className="font-bold text-indigo-600">Sandeep Sagar</span></p>
      </div>
    </footer>
  )
}
