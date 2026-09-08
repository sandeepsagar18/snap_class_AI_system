import React, { useState, useEffect } from 'react'
import { X, Calendar, Users, CheckCircle2, XCircle, Search, Filter, RefreshCw, Loader2, Sparkles, Clock, BookOpen, Download } from 'lucide-react'
import { getSubjectAttendanceHistory } from '../lib/api'
import { exportSubjectLogsToExcel } from '../lib/excelExport'

export default function SubjectAttendanceHistoryModal({ isOpen, onClose, subject }) {
  const [logs, setLogs] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState('all')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedSection, setSelectedSection] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchHistory = async () => {
    if (!subject?.id) return
    setLoading(true)
    try {
      const res = await getSubjectAttendanceHistory(subject.id)
      setLogs(res?.logs || [])
      setStudents(res?.students || [])
    } catch (err) {
      console.error('Error fetching subject history:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && subject?.id) {
      fetchHistory()
      setSelectedDate('all')
      setSelectedBranch('all')
      setSelectedSection('all')
      setSelectedStatus('all')
      setSearchQuery('')
    }
  }, [isOpen, subject?.id])

  if (!isOpen || !subject) return null

  // Extract distinct dates (sorted desc)
  const dateOptions = Array.from(
    new Set(
      logs.map((l) => {
        try {
          return new Date(l.timestamp).toISOString().split('T')[0]
        } catch {
          return null
        }
      }).filter(Boolean)
    )
  ).sort((a, b) => new Date(b) - new Date(a))

  // Extract distinct branches & sections
  const branchOptions = Array.from(
    new Set([
      ...logs.map((l) => l.students?.branch).filter(Boolean),
      ...students.map((s) => s.branch).filter(Boolean)
    ])
  )

  const sectionOptions = Array.from(
    new Set([
      ...logs.map((l) => l.students?.section).filter(Boolean),
      ...students.map((s) => s.section).filter(Boolean),
      subject.section
    ].filter(Boolean))
  )

  const todayStr = new Date().toISOString().split('T')[0]
  const hasTodayRecords = dateOptions.includes(todayStr)

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const logDate = log.timestamp ? new Date(log.timestamp).toISOString().split('T')[0] : ''
    
    if (selectedDate !== 'all' && logDate !== selectedDate) return false
    
    const studentBranch = log.students?.branch || ''
    if (selectedBranch !== 'all' && studentBranch.toLowerCase() !== selectedBranch.toLowerCase()) return false

    const studentSection = log.students?.section || ''
    if (selectedSection !== 'all' && studentSection.toLowerCase() !== selectedSection.toLowerCase()) return false

    if (selectedStatus !== 'all' && log.status !== selectedStatus) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const name = (log.students?.name || '').toLowerCase()
      const roll = (log.students?.roll_no || '').toLowerCase()
      const email = (log.students?.email || '').toLowerCase()
      if (!name.includes(q) && !roll.includes(q) && !email.includes(q)) return false
    }

    return true
  })

  const presentCount = filteredLogs.filter((l) => l.status === 'present').length
  const absentCount = filteredLogs.filter((l) => l.status === 'absent').length

  const handleExportExcel = () => {
    exportSubjectLogsToExcel(subject, filteredLogs)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="glass-panel w-full max-w-5xl rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] bg-white">
        
        {/* MODAL HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-xl text-slate-900">
                  {subject.name || subject.subject_name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono text-xs font-bold">
                  {subject.subject_code} ({subject.section})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed attendance history, live daily sessions, and date/branch analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={fetchHistory}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-600 transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* METRICS & QUICK FILTER TABS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 shrink-0">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Total Records</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{filteredLogs.length}</div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="text-emerald-700 text-[11px] font-bold uppercase tracking-wider">Present</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">{presentCount}</div>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
            <div className="text-rose-700 text-[11px] font-bold uppercase tracking-wider">Absent</div>
            <div className="text-xl font-black text-rose-700 mt-0.5">{absentCount}</div>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200">
            <div className="text-indigo-700 text-[11px] font-bold uppercase tracking-wider">Attendance Rate</div>
            <div className="text-xl font-black text-indigo-700 mt-0.5">
              {filteredLogs.length > 0 ? `${Math.round((presentCount / filteredLogs.length) * 100)}%` : '0%'}
            </div>
          </div>
        </div>

        {/* ADVANCED FILTER BAR */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-3 space-y-2.5 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Today Button */}
            {hasTodayRecords && (
              <button
                onClick={() => setSelectedDate(selectedDate === todayStr ? 'all' : todayStr)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedDate === todayStr
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                📅 Today's Session ({todayStr})
              </button>
            )}

            {/* Date Select */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">All Dates ({dateOptions.length} Sessions)</option>
                {dateOptions.map((d) => (
                  <option key={d} value={d}>
                    {d === todayStr ? `Today (${d})` : d}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch Select */}
            {branchOptions.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs">
                <span className="font-bold text-slate-500">Branch:</span>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">All Branches</option>
                  {branchOptions.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Section Select */}
            {sectionOptions.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs">
                <span className="font-bold text-slate-500">Section:</span>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">All Sections</option>
                  {sectionOptions.map((s) => (
                    <option key={s} value={s}>Sec {s}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Select */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs">
              <span className="font-bold text-slate-500">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="present">Present Only</option>
                <option value="absent">Absent Only</option>
              </select>
            </div>

            {/* Reset Filters */}
            {(selectedDate !== 'all' || selectedBranch !== 'all' || selectedSection !== 'all' || selectedStatus !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedDate('all')
                  setSelectedBranch('all')
                  setSelectedSection('all')
                  setSelectedStatus('all')
                  setSearchQuery('')
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-2 py-1 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, roll number, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>
        </div>

        {/* LOGS TABLE / ROSTER VIEW */}
        <div className="flex-1 overflow-y-auto min-h-0 rounded-2xl border border-slate-200">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
              <p className="text-xs font-bold text-slate-600">Loading attendance history...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">No attendance records match your filter</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try selecting a different date, section, or branch filter above.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4 font-bold">#</th>
                  <th className="py-3 px-4 font-bold">Student Name</th>
                  <th className="py-3 px-4 font-bold">Roll Number</th>
                  <th className="py-3 px-4 font-bold">Branch / Class</th>
                  <th className="py-3 px-4 font-bold">Session Date & Time</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 bg-white">
                {filteredLogs.map((log, index) => {
                  const student = log.students || {}
                  const isPresent = log.status === 'present'
                  const formattedTime = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'

                  return (
                    <tr key={log.id || index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{index + 1}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                            isPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <div>{student.name || 'Unknown Student'}</div>
                            <div className="text-[10px] text-slate-400">{student.email || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-700">
                        {student.roll_no || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        <div>{student.branch || subject.branch || '—'}</div>
                        <div className="text-[10px] text-slate-400">Sec: {student.section || subject.section || 'A'}</div>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formattedTime}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isPresent
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {isPresent ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {isPresent ? 'Present' : 'Absent'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* MODAL BOTTOM BAR */}
        <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 text-xs text-slate-500 shrink-0">
          <span>
            Showing <b>{filteredLogs.length}</b> records for <b>{subject.name}</b>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}
