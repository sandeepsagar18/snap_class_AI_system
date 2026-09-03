const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.port !== '8000') {
    return '/api'
  }
  return `http://${(typeof window !== 'undefined' && window.location.hostname) || '127.0.0.1'}:8000/api`
}

const API_BASE_URL = getApiBaseUrl()

export async function getNetworkIp() {
  try {
    const res = await fetch(`${API_BASE_URL}/network-ip`)
    const data = await res.json()
    return data
  } catch (err) {
    return { primary_ip: (typeof window !== 'undefined' && window.location.hostname) || '127.0.0.1', all_ips: [] }
  }
}

export async function teacherSignup(teacherData, photoBlob = null) {
  const formData = new FormData()
  formData.append('name', teacherData.name)
  formData.append('username', teacherData.username)
  formData.append('password', teacherData.password)
  if (teacherData.qualification) formData.append('qualification', teacherData.qualification)
  if (teacherData.department) formData.append('department', teacherData.department)
  if (teacherData.designation) formData.append('designation', teacherData.designation)

  if (photoBlob) {
    formData.append('file', photoBlob, 'teacher_photo.jpg')
  }

  const res = await fetch(`${API_BASE_URL}/teacher/signup`, {
    method: 'POST',
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Sign up failed')
  return data.teacher
}

export async function teacherLogin(username, password) {
  const res = await fetch(`${API_BASE_URL}/teacher/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Login failed')
  return data.teacher
}

export async function studentLogin(email, password) {
  const res = await fetch(`${API_BASE_URL}/student/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Student authentication failed')
  return data.student
}

export async function registerStudentFull(studentData, photoBlob = null) {
  const formData = new FormData()
  formData.append('name', studentData.name)
  if (studentData.email) formData.append('email', studentData.email)
  if (studentData.password) formData.append('password', studentData.password)
  if (studentData.roll_no) formData.append('roll_no', studentData.roll_no)
  if (studentData.dob) formData.append('dob', studentData.dob)
  if (studentData.class_name) formData.append('class_name', studentData.class_name)
  if (studentData.section) formData.append('section', studentData.section)
  if (studentData.course) formData.append('course', studentData.course)
  if (studentData.branch) formData.append('branch', studentData.branch)
  if (photoBlob) formData.append('file', photoBlob, 'photo.jpg')

  const res = await fetch(`${API_BASE_URL}/student/register`, {
    method: 'POST',
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Student registration failed')
  return data.student
}

export async function getStudentProfile(studentId) {
  const res = await fetch(`${API_BASE_URL}/student/${studentId}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to fetch student profile')
  return data.student
}

export async function updateStudentProfile(studentId, studentData, photoBlob = null) {
  const formData = new FormData()
  if (studentData.name) formData.append('name', studentData.name)
  if (studentData.email) formData.append('email', studentData.email)
  if (studentData.password) formData.append('password', studentData.password)
  if (studentData.roll_no) formData.append('roll_no', studentData.roll_no)
  if (studentData.dob) formData.append('dob', studentData.dob)
  if (studentData.class_name) formData.append('class_name', studentData.class_name)
  if (studentData.section) formData.append('section', studentData.section)
  if (studentData.course) formData.append('course', studentData.course)
  if (studentData.branch) formData.append('branch', studentData.branch)
  if (photoBlob) formData.append('file', photoBlob, 'photo.jpg')

  const res = await fetch(`${API_BASE_URL}/student/${studentId}/profile`, {
    method: 'POST',
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to update student profile')
  return data.student
}

export async function getTeacherSubjects(teacherId) {
  const res = await fetch(`${API_BASE_URL}/teacher/${teacherId}/subjects`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to fetch subjects')
  return data.subjects
}

export async function createSubject(subject_code, name, section, teacher_id) {
  const res = await fetch(`${API_BASE_URL}/subjects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject_code, name, section, teacher_id }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to create subject')
  return data.subject
}

export async function getTeacherLogs(teacherId) {
  const res = await fetch(`${API_BASE_URL}/teacher/${teacherId}/attendance-logs`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to fetch attendance logs')
  return data.logs
}

export async function enrollStudentInSubject(studentId, subjectId) {
  const res = await fetch(`${API_BASE_URL}/student/${studentId}/enroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject_id: subjectId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to enroll in subject')
  return data
}

export async function getStudentSubjects(studentId) {
  const res = await fetch(`${API_BASE_URL}/student/${studentId}/subjects`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to fetch student subjects')
  return data.subjects
}

export async function getStudentAttendance(studentId) {
  const res = await fetch(`${API_BASE_URL}/student/${studentId}/attendance`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to fetch student attendance')
  return data.attendance
}

export async function getSubjectStudents(subjectId) {
  const res = await fetch(`${API_BASE_URL}/subjects/${subjectId}/students`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to fetch subject students')
  return data.students
}

export async function queryStudentsRoster(filterData) {
  const res = await fetch(`${API_BASE_URL}/students/query-roster`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filterData),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to query students roster')
  return data.students
}

export async function saveAttendanceLogs(logs) {
  const res = await fetch(`${API_BASE_URL}/attendance/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logs }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to save attendance logs')
  return data
}

// --- BIOMETRIC AI API ---

export async function extractFaceEmbedding(imageBlobOrFile, studentId = null) {
  const formData = new FormData()
  formData.append('file', imageBlobOrFile, 'face.jpg')
  if (studentId) formData.append('student_id', studentId)

  const response = await fetch(`${API_BASE_URL}/face-embedding`, {
    method: 'POST',
    body: formData,
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'Failed to extract face embedding')
  return data
}

export async function predictFaceAttendance(imageBlobOrFile, candidateIds = null) {
  const formData = new FormData()
  formData.append('file', imageBlobOrFile, 'class.jpg')
  if (candidateIds && candidateIds.length > 0) {
    formData.append('candidate_ids', JSON.stringify(candidateIds))
  }

  const response = await fetch(`${API_BASE_URL}/predict-face-attendance`, {
    method: 'POST',
    body: formData,
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'Failed to analyze classroom image')
  return data
}

export async function extractVoiceEmbedding(audioBlob, studentId = null) {
  const formData = new FormData()
  formData.append('file', audioBlob, 'voice.wav')
  if (studentId) formData.append('student_id', studentId)

  const response = await fetch(`${API_BASE_URL}/voice-embedding`, {
    method: 'POST',
    body: formData,
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'Failed to extract voice embedding')
  return data
}

export async function predictVoiceAttendance(audioBlob, candidatesDict) {
  const formData = new FormData()
  formData.append('file', audioBlob, 'bulk_voice.wav')
  formData.append('candidates_json', JSON.stringify(candidatesDict))

  const response = await fetch(`${API_BASE_URL}/predict-voice-attendance`, {
    method: 'POST',
    body: formData,
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'Failed to process voice attendance')
  return data
}

export async function retrainClassifier() {
  const response = await fetch(`${API_BASE_URL}/train-classifier`, {
    method: 'POST',
  })
  return await response.json()
}

// --- ACTIVE LECTURE SESSIONS & STUDENT QR REGISTRATION ---

export async function createLectureSession(sessionPayload) {
  const res = await fetch(`${API_BASE_URL}/lecture-sessions/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionPayload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to create lecture session')
  return data.session
}

export async function getActiveLectureSessions() {
  const res = await fetch(`${API_BASE_URL}/lecture-sessions/active`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to fetch active lecture sessions')
  return data.sessions
}

export async function getLectureSession(sessionId) {
  const res = await fetch(`${API_BASE_URL}/lecture-sessions/${sessionId}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to fetch lecture session')
  return data.session
}

export async function registerStudentForLecture(sessionId, studentData, photoBlob = null) {
  const formData = new FormData()
  formData.append('name', studentData.name)
  if (studentData.roll_no) formData.append('roll_no', studentData.roll_no)
  if (studentData.email) formData.append('email', studentData.email)
  if (studentData.course) formData.append('course', studentData.course)
  if (studentData.branch) formData.append('branch', studentData.branch)
  if (studentData.class_name) formData.append('class_name', studentData.class_name)
  if (studentData.section) formData.append('section', studentData.section)
  if (studentData.dob) formData.append('dob', studentData.dob)
  if (photoBlob) formData.append('file', photoBlob, 'photo.jpg')

  const res = await fetch(`${API_BASE_URL}/lecture-sessions/${sessionId}/register-student`, {
    method: 'POST',
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to register student for lecture')
  return data
}

export async function endLectureSession(sessionId, presentMap = {}) {
  const res = await fetch(`${API_BASE_URL}/lecture-sessions/${sessionId}/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ present_map: presentMap }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to end lecture session')
  return data.session
}
