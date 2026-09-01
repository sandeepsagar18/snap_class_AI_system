import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('snapclass_user')
    return saved ? JSON.parse(saved) : null
  })
  const [role, setRole] = useState(() => {
    return localStorage.getItem('snapclass_role') || null
  })

  const loginTeacher = (teacherData) => {
    setUser(teacherData)
    setRole('teacher')
    localStorage.setItem('snapclass_user', JSON.stringify(teacherData))
    localStorage.setItem('snapclass_role', 'teacher')
  }

  const loginStudent = (studentData) => {
    setUser(studentData)
    setRole('student')
    localStorage.setItem('snapclass_user', JSON.stringify(studentData))
    localStorage.setItem('snapclass_role', 'student')
  }

  const logout = () => {
    setUser(null)
    setRole(null)
    localStorage.removeItem('snapclass_user')
    localStorage.removeItem('snapclass_role')
  }

  return (
    <AuthContext.Provider value={{ user, setUser, role, loginTeacher, loginStudent, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
