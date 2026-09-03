import React from 'react'
import { useAuth } from '../context/AuthContext'
import { Sparkles, LogOut, GraduationCap, School } from 'lucide-react'

export default function Navbar() {
  const { user, role, logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-700/60 bg-slate-900/80 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-white tracking-tight">SnapClass</span>
            <span className="ml-2 text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              AI Attendance
            </span>
          </div>
        </div>

        {/* User Info & Logout */}
        {user && (
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-xs shadow-sm">
              {role === 'teacher' ? (
                <School className="w-4 h-4 text-indigo-400" />
              ) : (
                <GraduationCap className="w-4 h-4 text-emerald-400" />
              )}
              <div className="text-left">
                <div className="font-bold text-white max-w-[140px] truncate">{user.name || user.username}</div>
                <div className="text-[10px] text-slate-300 capitalize font-medium">{role}</div>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 transition-all text-xs font-semibold cursor-pointer shadow-sm"
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
