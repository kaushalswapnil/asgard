import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

const api = axios.create({ baseURL: 'http://localhost:8080/api' })

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('ebp_session')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        api.get('/auth/me', { headers: { Authorization: `Bearer ${parsed.token}` } })
          .then(() => setUser(parsed))
          .catch(() => localStorage.removeItem('ebp_session'))
          .finally(() => setLoading(false))
      } catch {
        localStorage.removeItem('ebp_session')
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password })
    localStorage.setItem('ebp_session', JSON.stringify(data))
    setUser(data)
    return data
  }

  const logout = async () => {
    if (user?.token) {
      await api.post('/auth/logout', {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      }).catch(() => {})
    }
    localStorage.removeItem('ebp_session')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
