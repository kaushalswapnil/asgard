import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ChatbotProvider } from './components/ChatbotContext'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import StorePredictions from './pages/StorePredictions'
import EmployeePredictions from './pages/EmployeePredictions'
import About from './pages/About'
import Reports from './pages/Reports'
import LoginPage from './pages/LoginPage'
import Chatbot from './components/Chatbot'
import RoboticCanvas from './components/RoboticCanvas'
import { Spinner } from './components/UI'
import './App.css'

function AppShell() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner />
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <ChatbotProvider>
      <RoboticCanvas />
      <Navbar />
      <Routes>
        <Route path="/"         element={<Dashboard />} />
        <Route path="/store"    element={<StorePredictions />} />
        <Route path="/employee" element={<EmployeePredictions />} />
        <Route path="/about"    element={<About />} />
        <Route path="/reports"  element={<Reports />} />
      </Routes>
      <Chatbot />
    </ChatbotProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
