import React, { useState } from 'react'
import { X, BookOpen, Hash, Users, Loader2 } from 'lucide-react'
import { createSubject } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function CreateSubjectModal({
  isOpen,
  onClose,
  teacherId,
  onSubjectCreated,
  onCreated
}) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [subjectCode, setSubjectCode] = useState('')
  const [section, setSection] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const effectiveTeacherId = teacherId || user?.id

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !subjectCode.trim() || !section.trim()) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const newSubject = await createSubject(
        subjectCode.trim().toUpperCase(),
        name.trim(),
        section.trim(),
        effectiveTeacherId
      )

      if (onSubjectCreated) onSubjectCreated(newSubject)
      if (onCreated) onCreated(newSubject)
      onClose()
    } catch (err) {
      console.error('Error creating subject:', err)
      setError(err.message || 'Failed to create subject')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 bg-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">Create New Subject</h3>
            <p className="text-xs text-slate-500">Add a class to start tracking attendance</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Subject Name *</label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="e.g. English / Machine Learning"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Subject Code *</label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="CS85"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Section / Batch *</label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="C"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
