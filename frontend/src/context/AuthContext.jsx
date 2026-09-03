import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('snapclass_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [role, setRole] = useState(() => {
    return localStorage.getItem('snapclass_role') || null
  })

  // Universal login helper supporting (data, role) or role-specific
  const login = (userData, userRole = 'teacher') => {
    setUser(userData)
    setRole(userRole)
    localStorage.setItem('snapclass_user', JSON.stringify(userData))
    localStorage.setItem('snapclass_role', userRole)
  }

  const loginTeacher = (teacherData) => {
    login(teacherData, 'teacher')
  }

  const loginStudent = (studentData) => {
    login(studentData, 'student')
  }

  const logout = () => {
    setUser(null)
    setRole(null)
    localStorage.removeItem('snapclass_user')
    localStorage.removeItem('snapclass_role')
  }

  return (
    <AuthContext.Provider value={{ user, setUser, role, setRole, login, loginTeacher, loginStudent, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
