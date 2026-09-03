import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LandingPage from './pages/LandingPage'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentDashboard from './pages/StudentDashboard'
import StudentLectureJoinView from './components/StudentLectureJoinView'

function MainContent() {
  const { user, role } = useAuth()

  if (!user) {
    return <LandingPage />
  }

  if (role === 'teacher') {
    return <TeacherDashboard />
  }

  return <StudentDashboard />
}

export default function App() {
  const [joinLectureSessionId, setJoinLectureSessionId] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const joinLec = params.get('join_lecture')
    if (joinLec) {
      setJoinLectureSessionId(joinLec)
    }
  }, [])

  // If a student scanned the QR code, show ONLY the clean mobile registration card
  if (joinLectureSessionId) {
    return (
      <div className="min-h-screen subtle-gradient-bg bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white flex items-center justify-center p-3 sm:p-6">
        <StudentLectureJoinView
          sessionId={joinLectureSessionId}
          onBackToPortal={() => {
            window.history.replaceState({}, document.title, window.location.pathname)
            setJoinLectureSessionId(null)
          }}
        />
      </div>
    )
  }

  return (
    <AuthProvider>
      <div className="min-h-screen subtle-gradient-bg bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white flex flex-col justify-between relative overflow-hidden">
        {/* Soft background ambient light gradients */}
        <div className="fixed -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-indigo-200/40 via-purple-100/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="fixed top-1/2 -right-40 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="fixed bottom-0 -left-40 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <MainContent />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}
