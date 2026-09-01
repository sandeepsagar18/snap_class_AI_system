import * as XLSX from 'xlsx'

/**
 * 1. Export single lecture session attendance to Excel
 */
export function exportAttendanceToExcel(sessionInfo, studentsList) {
  const {
    subjectName = 'Class Subject',
    subjectCode = 'N/A',
    section = 'A',
    teacherName = 'Faculty',
    facultyName = 'Department of Computer Science',
    sessionDate = new Date().toLocaleString(),
    sessionType = 'Biometric Face AI Live Stream'
  } = sessionInfo

  const totalStudents = studentsList.length
  const presentCount = studentsList.filter(s => s.isPresent).length
  const absentCount = totalStudents - presentCount
  const attendanceRate = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : '0.0'
  const currentFormattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const metaRows = [
    ['SNAPCLASS AI - LECTURE ATTENDANCE REPORT'],
    ['Subject Name:', subjectName, '', 'Subject Code:', subjectCode],
    ['Section / Class:', section, '', 'Teacher / Faculty:', `${teacherName} (${facultyName})`],
    ['Session Date & Time:', sessionDate, '', 'Attendance Mode:', sessionType],
    ['Total Enrolled:', totalStudents, 'Present Count:', presentCount, 'Absent Count:', absentCount, 'Attendance Rate:', `${attendanceRate}%`],
    []
  ]

  const tableHeaders = [
    'S.No',
    'Roll Number',
    'Student Name',
    'College Email ID',
    'Course',
    'Branch',
    'Class / Year',
    'Section',
    'Attendance Status',
    'Verification Mode',
    'Date & Timestamp'
  ]

  const dataRows = studentsList.map((st, index) => {
    const isPresent = Boolean(st.isPresent)
    const verificationMode = st.method || (isPresent ? 'Biometric Face AI (Live Scan)' : 'Absent / Not Detected')
    const timestampStr = st.markedAt || (isPresent ? `${sessionDate} [${currentFormattedTime}]` : `${sessionDate} (Absent)`)

    return [
      index + 1,
      st.roll_no || 'N/A',
      st.name || 'Unnamed Student',
      st.email || 'N/A',
      st.course || 'B.Tech',
      st.branch || 'Computer Science',
      st.class_name || '4th Year',
      st.section || section || 'A',
      isPresent ? 'PRESENT' : 'ABSENT',
      verificationMode,
      timestampStr
    ]
  })

  const fullWorksheetData = [...metaRows, tableHeaders, ...dataRows]
  const worksheet = XLSX.utils.aoa_to_sheet(fullWorksheetData)

  worksheet['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 16 }, // Roll No
    { wch: 22 }, // Name
    { wch: 26 }, // Email
    { wch: 12 }, // Course
    { wch: 20 }, // Branch
    { wch: 14 }, // Class / Year
    { wch: 10 }, // Section
    { wch: 18 }, // Status
    { wch: 30 }, // Verification Mode
    { wch: 28 }  // Timestamp
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Session Report')

  const cleanSubject = (subjectCode || 'CLASS').replace(/[^a-zA-Z0-9]/g, '_')
  const dateStamp = new Date().toISOString().split('T')[0]
  const timeStamp = new Date().toTimeString().split(' ')[0].replace(/:/g, '-')
  const fileName = `Attendance_${cleanSubject}_${dateStamp}_${timeStamp}.xlsx`

  XLSX.writeFile(workbook, fileName)
  return fileName
}

/**
 * 2. Comprehensive Multi-Sheet Cumulative Student History Excel Exporter
 */
export function exportClassFullHistoryToExcel(subject, enrolledStudents = [], logs = []) {
  const subjectName = subject?.name || 'Subject'
  const subjectCode = subject?.subject_code || 'CODE'
  const section = subject?.section || 'A'
  const teacherName = subject?.teacher_name || 'Faculty'

  const lectureTimestamps = Array.from(new Set(logs.map(l => l.timestamp))).sort()
  const totalLecturesCount = subject.total_classes || Math.max(1, lectureTimestamps.length)

  // -------------------------------------------------------------
  // SHEET 1: CUMULATIVE STUDENT SUMMARY (Totals & Eligibility)
  // -------------------------------------------------------------
  const summaryHeaders = [
    'S.No',
    'Roll Number',
    'Student Name',
    'College Email ID',
    'Course',
    'Branch',
    'Class / Year',
    'Section',
    'Total Lectures Held',
    'Lectures Attended',
    'Lectures Missed',
    'Attendance %',
    'Attendance Eligibility Status'
  ]

  const summaryRows = enrolledStudents.map((st, index) => {
    const studentLogs = logs.filter(l => 
      (l.student_id && String(l.student_id) === String(st.id)) ||
      (l.students?.name && l.students.name.toLowerCase() === st.name?.toLowerCase())
    )

    const attendedCount = studentLogs.filter(l => l.status?.toLowerCase() === 'present').length
    const missedCount = Math.max(0, totalLecturesCount - attendedCount)
    const percentage = totalLecturesCount > 0 ? ((attendedCount / totalLecturesCount) * 100).toFixed(1) : '100.0'
    const isEligible = parseFloat(percentage) >= 75.0

    return [
      index + 1,
      st.roll_no || 'N/A',
      st.name || 'Unnamed Student',
      st.email || 'N/A',
      st.course || 'B.Tech',
      st.branch || 'Computer Science',
      st.class_name || '4th Year',
      st.section || section,
      totalLecturesCount,
      attendedCount,
      missedCount,
      `${percentage}%`,
      isEligible ? 'ELIGIBLE (≥75%)' : 'SHORTAGE ALERT (<75%)'
    ]
  })

  const sheet1Data = [
    [`SNAPCLASS AI - CUMULATIVE STUDENT ATTENDANCE HISTORY: ${subjectName} (${subjectCode})`],
    [`Section / Class: ${section}`, '', `Total Lectures Conducted: ${totalLecturesCount}`, '', `Faculty / Teacher: ${teacherName}`, '', `Report Exported: ${new Date().toLocaleString()}`],
    [],
    summaryHeaders,
    ...summaryRows
  ]

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data)
  ws1['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 16 }, // Roll No
    { wch: 22 }, // Name
    { wch: 26 }, // Email
    { wch: 12 }, // Course
    { wch: 20 }, // Branch
    { wch: 14 }, // Class / Year
    { wch: 10 }, // Section
    { wch: 20 }, // Total Lectures
    { wch: 18 }, // Attended
    { wch: 16 }, // Missed
    { wch: 15 }, // %
    { wch: 26 }  // Eligibility
  ]

  // -------------------------------------------------------------
  // SHEET 2: LECTURE-BY-LECTURE TIMELINE MATRIX
  // -------------------------------------------------------------
  const dateColumns = lectureTimestamps.map((ts, idx) => `Lecture ${idx + 1} (${new Date(ts).toLocaleDateString()})`)
  const matrixHeaders = ['Roll Number', 'Student Name', ...dateColumns]

  const matrixRows = enrolledStudents.map((st) => {
    const row = [st.roll_no || 'N/A', st.name]
    lectureTimestamps.forEach((ts) => {
      const log = logs.find(l => 
        l.timestamp === ts && (
          (l.student_id && String(l.student_id) === String(st.id)) ||
          (l.students?.name && l.students.name.toLowerCase() === st.name?.toLowerCase())
        )
      )
      row.push(log && log.status?.toLowerCase() === 'present' ? 'PRESENT (P)' : 'ABSENT (A)')
    })
    return row
  })

  const sheet2Data = [
    [`LECTURE-BY-LECTURE ATTENDANCE MATRIX: ${subjectName} (${subjectCode})`],
    [],
    matrixHeaders,
    ...matrixRows
  ]

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data)

  // -------------------------------------------------------------
  // SHEET 3: RAW DETAILED LOG AUDIT TRAIL
  // -------------------------------------------------------------
  const auditHeaders = [
    'Log ID',
    'Subject Code',
    'Subject Name',
    'Section',
    'Student Name',
    'Roll Number',
    'College Email',
    'Attendance Status',
    'Verification Mode',
    'Date & Timestamp'
  ]

  const auditRows = logs.map((log) => {
    const studentName = log.students?.name || 'Student'
    const studentInfo = enrolledStudents.find(s => s.name === studentName) || {}

    return [
      log.id || 'N/A',
      subjectCode,
      subjectName,
      section,
      studentName,
      studentInfo.roll_no || 'N/A',
      studentInfo.email || 'N/A',
      (log.status || 'present').toUpperCase(),
      'Biometric Face AI Scan',
      log.timestamp ? new Date(log.timestamp).toLocaleString() : new Date().toLocaleString()
    ]
  })

  const ws3 = XLSX.utils.aoa_to_sheet([
    [`SNAPCLASS AI - RAW ATTENDANCE AUDIT LOGS: ${subjectName} (${subjectCode})`],
    [],
    auditHeaders,
    ...auditRows
  ])

  ws3['!cols'] = [
    { wch: 38 },
    { wch: 14 },
    { wch: 22 },
    { wch: 10 },
    { wch: 22 },
    { wch: 16 },
    { wch: 26 },
    { wch: 18 },
    { wch: 26 },
    { wch: 26 }
  ]

  // -------------------------------------------------------------
  // BUILD WORKBOOK & TRIGGER DOWNLOAD
  // -------------------------------------------------------------
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, ws1, 'Cumulative Summary')
  if (lectureTimestamps.length > 0) {
    XLSX.utils.book_append_sheet(workbook, ws2, 'Lecture Matrix')
  }
  if (logs.length > 0) {
    XLSX.utils.book_append_sheet(workbook, ws3, 'Raw Audit Logs')
  }

  const cleanSubject = (subjectCode || 'CLASS').replace(/[^a-zA-Z0-9]/g, '_')
  const dateStamp = new Date().toISOString().split('T')[0]
  const fileName = `ClassHistory_${cleanSubject}_${section}_${dateStamp}.xlsx`

  XLSX.writeFile(workbook, fileName)
  return fileName
}

/**
 * 3. Export raw historical logs
 */
export function exportSubjectLogsToExcel(subject, logs, enrolledStudents = []) {
  return exportClassFullHistoryToExcel(subject, enrolledStudents, logs)
}
