import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import AutobotIcon from '../components/AutobotIcon'
import RoboticCanvas from '../components/RoboticCanvas'
import './LoginPage.css'

export default function LoginPage() {
  const { login } = useAuth()
  const { dark, toggle } = useTheme()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
    } catch {
      setError('Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <RoboticCanvas />
      <button className="login-theme-toggle" onClick={toggle} title="Toggle theme">
        {dark ? '☀️' : '🌙'}
      </button>
      <div className="login-card">

        <div className="login-brand">
          <AutobotIcon size={52} glow />
          <div className="login-brand-text">
            <div className="login-title">EBP AI Assistant</div>
            <div className="login-subtitle">Employee & Branch Portal</div>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoFocus
              required
            />
          </div>
          <div className="login-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••"
              required
            />
          </div>

          {error && <div className="login-error">⚠️ {error}</div>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  )
}
