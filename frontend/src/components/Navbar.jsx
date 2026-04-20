import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import BrandIcon from './BrandIcon'
import { useState, useRef, useEffect } from 'react'
import './Navbar.css'

const AVATAR_OPTIONS = [
  { type: 'initials', label: 'Initials' },
  { type: 'emoji', value: '🧑‍💼', label: '🧑‍💼' },
  { type: 'emoji', value: '👩‍💻', label: '👩‍💻' },
  { type: 'emoji', value: '🧑‍🔬', label: '🧑‍🔬' },
  { type: 'emoji', value: '🦸', label: '🦸' },
  { type: 'emoji', value: '🧑‍🎨', label: '🧑‍🎨' },
  { type: 'emoji', value: '🤖', label: '🤖' },
  { type: 'emoji', value: '🦊', label: '🦊' },
  { type: 'emoji', value: '🐺', label: '🐺' },
  { type: 'emoji', value: '🦁', label: '🦁' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const [open, setOpen] = useState(false)
  const [avatar, setAvatar] = useState(() => {
    const saved = localStorage.getItem('ebp_avatar')
    return saved ? JSON.parse(saved) : { type: 'initials' }
  })
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectAvatar = (opt) => {
    const val = opt.type === 'initials' ? { type: 'initials' } : { type: 'emoji', value: opt.value }
    setAvatar(val)
    localStorage.setItem('ebp_avatar', JSON.stringify(val))
  }

  const navigate = useNavigate()

  const initials = user?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('') || '?'
  const role = user?.userRole === 'ADMIN' ? 'admin' : 'manager'

  const AvatarFace = ({ size = 34 }) => (
    <div
      className={`navbar-avatar navbar-avatar--${role}`}
      style={{ width: size, height: size, fontSize: avatar.type === 'emoji' ? size * 0.55 : size * 0.35 }}
      onClick={() => setOpen(o => !o)}
    >
      {avatar.type === 'emoji' ? avatar.value : initials}
    </div>
  )

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <div className="brand-icon-3d">
          <BrandIcon size={36} />
        </div>
        <span className="navbar-brand-text">EBP AI Assistant</span>
      </div>

      <div className="navbar-links">
        <NavLink to="/store" className={({ isActive }) => isActive ? 'active' : ''}>Store Predictions</NavLink>
        <NavLink to="/employee" className={({ isActive }) => isActive ? 'active' : ''}>Employee Predictions</NavLink>
        <NavLink to="/reports"  className={({ isActive }) => isActive ? 'active' : ''}>Reports</NavLink>
        <Link to="/about" className="about-link">About</Link>
      </div>

      {user && (
        <div className="navbar-user" ref={dropdownRef}>
          <button className="navbar-theme-toggle" onClick={toggle} title="Toggle theme">
            {dark ? '☀️' : '🌙'}
          </button>

          <div className="nav-avatar-orbit-wrap">
            <div className="nav-avatar-ring" />
            <AvatarFace />
          </div>

          {open && (
            <div className="profile-dropdown">
              {/* Header */}
              <div className="profile-header">
                <AvatarFace size={56} />
                <div className="profile-header-info">
                  <div className="profile-name">{user.fullName}</div>
                  <div className="profile-role-badge profile-role-badge--{role}">
                    <span className={`role-dot role-dot--${role}`} />
                    {user.userRole === 'ADMIN' ? 'Administrator' : 'Store Manager'}
                  </div>
                  {user.locationName && <div className="profile-store">📍 {user.locationName}</div>}
                </div>
              </div>

              <div className="profile-divider" />

              {/* Contact info */}
              <div className="profile-section-label">Account Details</div>
              <div className="profile-info-row">✉️ <span>{user.email || 'No email on record'}</span></div>
              <div className="profile-info-row">📞 <span>+44 7700 900000</span></div>

              <div className="profile-divider" />

              {/* Avatar picker */}
              <div className="profile-section-label">Choose Avatar</div>
              <div className="avatar-picker">
                {AVATAR_OPTIONS.map((opt, i) => (
                  <button
                    key={i}
                    className={`avatar-option ${
                      (opt.type === 'initials' && avatar.type === 'initials') ||
                      (opt.type === 'emoji' && avatar.value === opt.value)
                        ? 'avatar-option--active' : ''
                    }`}
                    onClick={() => selectAvatar(opt)}
                  >
                    {opt.type === 'initials'
                      ? <span style={{
                          width: '100%', height: '100%', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem', fontWeight: 800, color: '#fff',
                          background: role === 'admin'
                            ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                            : 'linear-gradient(135deg, #3b82f6, #2563eb)'
                        }}>{initials}</span>
                      : opt.value}
                  </button>
                ))}
              </div>

              <div className="profile-divider" />

              {/* Actions */}
              <button className="profile-action profile-action--danger" onClick={() => { setOpen(false); logout() }}>
                <span>🚪</span> Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
