import React from 'react'
import { useAuth } from '../context/AuthContext'
import { Sparkles, LogOut, GraduationCap, School } from 'lucide-react'

export default function Navbar() {
  const { user, role, logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80 bg-white/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">SnapClass</span>
            <span className="ml-2 text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
              AI Attendance
            </span>
          </div>
        </div>

        {/* User Info & Logout */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-slate-100/90 border border-slate-200 text-xs shadow-xs">
              {role === 'teacher' ? (
                <School className="w-4 h-4 text-indigo-600" />
              ) : (
                <GraduationCap className="w-4 h-4 text-emerald-600" />
              )}
              <div className="text-left">
                <div className="font-bold text-slate-800 max-w-[140px] truncate">{user.name || user.username}</div>
                <div className="text-[10px] text-slate-500 capitalize font-medium">{role}</div>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all text-xs font-semibold cursor-pointer shadow-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
