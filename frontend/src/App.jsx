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

  // If a student scanned the QR code, show ONLY the clean mobile registration card (no navbar/footer/whole app)
  if (joinLectureSessionId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white flex items-center justify-center p-3 sm:p-6">
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
      <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
        <Navbar />
        <main className="flex-1">
          <MainContent />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}
