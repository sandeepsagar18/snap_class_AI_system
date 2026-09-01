import React, { useState } from 'react'
import { X, CheckCircle, AlertCircle, Save, Loader2, Users, FileSpreadsheet, Download } from 'lucide-react'
import { saveAttendanceLogs } from '../lib/api'
import { exportAttendanceToExcel } from '../lib/excelExport'

export default function AttendanceResultModal({
  isOpen,
  onClose,
  subject,
  students,
  detectedStudentIds,
  onSuccess
}) {
  const [saving, setSaving] = useState(false)
  const [attendanceState, setAttendanceState] = useState(() => {
    const initial = {}
    students.forEach((s) => {
      const isPresent = detectedStudentIds.some(id => String(id) === String(s.id))
      initial[s.id] = isPresent ? 'present' : 'absent'
    })
    return initial
  })

  if (!isOpen || !subject) return null

  const toggleStatus = (studentId) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }))
  }

  const handleDownloadExcel = () => {
    const sessionFormatted = new Date().toLocaleString()
    const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    const studentsWithStatus = students.map((s) => {
      const isPresent = attendanceState[s.id] === 'present'
      return {
        ...s,
        isPresent,
        method: isPresent ? 'Biometric Face AI (Snapshot Scan)' : 'Absent / Not Detected',
        markedAt: isPresent ? `${sessionFormatted.split(',')[0]}, ${nowFormatted}` : `${sessionFormatted} (Absent)`
      }
    })

    exportAttendanceToExcel({
      subjectName: subject.name || subject.subject_name || 'Class Subject',
      subjectCode: subject.subject_code || 'CODE',
      section: subject.section || 'A',
      teacherName: subject.teacher_name || 'Prof. Sharma',
      facultyName: subject.faculty_name || 'Department of Computer Science',
      sessionDate: sessionFormatted,
      sessionType: 'Biometric Face AI Snapshot Scan'
    }, studentsWithStatus)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const logs = Object.entries(attendanceState).map(([studentId, status]) => ({
        subject_id: subject.id,
        student_id: studentId,
        timestamp: now,
        status: status
      }))

      await saveAttendanceLogs(logs)

      // Auto-trigger Excel download for convenience
      handleDownloadExcel()

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      console.error('Error saving attendance:', err)
      alert('Failed to save attendance: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const presentCount = Object.values(attendanceState).filter(s => s === 'present').length
  const totalCount = students.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-xl rounded-2xl p-6 border border-slate-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-lg text-white">Attendance Results</h3>
            <p className="text-xs text-slate-400">{subject.name} ({subject.section})</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition-all cursor-pointer"
              title="Download Excel Sheet (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Users className="w-4 h-4" />
              <span>{presentCount} / {totalCount} Present</span>
            </div>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto space-y-2 pr-1 my-4 divide-y divide-slate-800/40">
          {students.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No students enrolled in this subject yet.
            </div>
          ) : (
            students.map((student) => {
              const status = attendanceState[student.id] || 'absent'
              const isPresent = status === 'present'

              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-900/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isPresent ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                      {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-200">{student.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {student.roll_no ? `Roll: ${student.roll_no}` : (student.email || student.id?.slice(0, 8))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleStatus(student.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isPresent
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                    }`}
                  >
                    {isPresent ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Present
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" />
                        Absent
                      </>
                    )}
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save & Export Excel
          </button>
        </div>
      </div>
    </div>
  )
}
