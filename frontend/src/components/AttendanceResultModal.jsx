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
      const logs = Object.keys(attendanceState).map((studentId) => ({
        student_id: studentId,
        subject_id: subject.id,
        status: attendanceState[studentId],
        timestamp: new Date().toISOString()
      }))

      await saveAttendanceLogs(logs)
      handleDownloadExcel()
      alert('Attendance saved successfully & Excel report exported!')
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      console.error('Error saving attendance:', err)
      alert('Failed to save attendance logs: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const presentCount = Object.values(attendanceState).filter(s => s === 'present').length
  const totalCount = students.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 bg-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">Attendance Verification Results</h3>
            <p className="text-xs text-slate-500">{subject.name} • Section {subject.section}</p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-6">
          <div className="text-xs text-slate-600 font-medium">
            Detected: <span className="text-emerald-700 font-bold">{presentCount}</span> / {totalCount} Students
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Students list */}
        <div className="max-h-64 overflow-y-auto space-y-2 mb-6 pr-1 divide-y divide-slate-100">
          {students.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">
              No students enrolled in this subject yet.
            </div>
          ) : (
            students.map((student) => {
              const status = attendanceState[student.id] || 'absent'
              const isPresent = status === 'present'

              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isPresent ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                      {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{student.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {student.roll_no ? `Roll: ${student.roll_no}` : (student.email || student.id?.slice(0, 8))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleStatus(student.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isPresent
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
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
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save & Export Excel
          </button>
        </div>
      </div>
    </div>
  )
}
