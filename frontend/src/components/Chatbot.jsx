import { useState, useRef, useEffect } from 'react'
import { useChatbot } from './ChatbotContext'
import { useAuth } from '../context/AuthContext'
import { managerReply, adminReply } from './chatbotEngine'
import AutobotIcon from './AutobotIcon'
import './Chatbot.css'

const MAX_SESSIONS = 10

const WELCOME = {
  manager: (name, mode) => mode === 'general'
    ? `👋 Hi ${name}! You're in **General** mode — ask me anything!`
    : `👋 Hi ${name}! I can help you with:\n• Store leave predictions\n• Employee schedules\n• Upcoming holidays\n\nType "help" to see all commands.`,
  admin: (name) => `👋 Hi ${name}! You have full Admin access.\n\nUse the **Train Data** tab to build the RAG corpus, or switch to **Manager View** to test the chatbot.`,
}

const sessionsKey = (userId) => `ebp_sessions_${userId}`

function loadSessions(userId) {
  try { return JSON.parse(localStorage.getItem(sessionsKey(userId)) || '[]') } catch { return [] }
}

function saveSessions(userId, sessions) {
  localStorage.setItem(sessionsKey(userId), JSON.stringify(sessions))
}

function sessionTitle(messages) {
  const first = messages.find(m => m.from === 'user')
  if (!first) return 'New conversation'
  return first.text.slice(0, 36) + (first.text.length > 36 ? '…' : '')
}

export default function Chatbot() {
  const { isOpen, setIsOpen } = useChatbot()
  const { user }              = useAuth()

  const [chatView, setChatView]         = useState(null)
  const [sessions, setSessions]         = useState([])
  const [activeId, setActiveId]         = useState(null)
  const [messages, setMessages]         = useState([])
  const [input, setInput]               = useState('')
  const [thinking, setThinking]         = useState(false)
  const [closing, setClosing]           = useState(false)
  const [showSidebar, setShowSidebar]   = useState(false)
  const [mode, setMode]                 = useState('business')
  const [ragTab, setRagTab]             = useState('chat')
  const [trainMode, setTrainMode]       = useState('single')
  const [trainEmpId, setTrainEmpId]     = useState('')
  const [trainBatch, setTrainBatch]     = useState('')
  const [trainLoading, setTrainLoading] = useState(false)
  const [trainStats, setTrainStats]     = useState(null)
  const [trainResult, setTrainResult]   = useState(null)
  const bottomRef = useRef(null)

  const isAdmin   = user?.userRole === 'ADMIN'
  const isManager = user?.userRole === 'MANAGER'

  const now = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const today = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  // ── Session helpers ──────────────────────────────────────
  const persistSessions = (updated) => {
    setSessions(updated)
    saveSessions(user.userId, updated)
  }

  const updateActiveMessages = (msgs) => {
    setMessages(msgs)
    setSessions(prev => {
      const updated = prev.map(s => s.id === activeId ? { ...s, messages: msgs, title: sessionTitle(msgs), updatedAt: Date.now() } : s)
      saveSessions(user.userId, updated)
      return updated
    })
  }

  const createNewSession = (view, currentMode) => {
    const welcome = [{ id: Date.now(), from: 'bot', text: WELCOME[view](user?.fullName || 'there', currentMode), ts: now() }]
    const session = { id: Date.now(), title: 'New conversation', messages: welcome, createdAt: Date.now(), updatedAt: Date.now(), date: today() }
    setSessions(prev => {
      const trimmed = prev.length >= MAX_SESSIONS ? prev.slice(1) : prev
      const updated = [session, ...trimmed]
      saveSessions(user.userId, updated)
      return updated
    })
    setActiveId(session.id)
    setMessages(welcome)
    return session
  }

  const switchSession = (id) => {
    const s = sessions.find(s => s.id === id)
    if (s) { setActiveId(id); setMessages(s.messages); setShowSidebar(false) }
  }

  const deleteSession = (id, e) => {
    e.stopPropagation()
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id)
      saveSessions(user.userId, updated)
      if (id === activeId) {
        if (updated.length > 0) { setActiveId(updated[0].id); setMessages(updated[0].messages) }
        else createNewSession(chatView || (isAdmin ? 'admin' : 'manager'), mode)
      }
      return updated
    })
  }

  // ── Lifecycle ────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && !chatView) {
      const defaultView = isAdmin ? 'admin' : 'manager'
      setChatView(defaultView)
      const saved = loadSessions(user?.userId)
      if (saved.length > 0) {
        setSessions(saved)
        setActiveId(saved[0].id)
        setMessages(saved[0].messages)
      } else {
        createNewSession(defaultView, mode)
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) { setChatView(null); setRagTab('chat'); setShowSidebar(false) }
  }, [isOpen])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  useEffect(() => {
    if (ragTab === 'train') fetchTrainStats()
  }, [ragTab])

  // ── Actions ──────────────────────────────────────────────
  const closePanel = () => {
    setClosing(true)
    setTimeout(() => { setClosing(false); setIsOpen(false) }, 420)
  }

  const deleteMessage = (id) => {
    const updated = messages.filter(m => m.id !== id)
    updateActiveMessages(updated)
  }

  const switchView = (view) => {
    setChatView(view)
    setRagTab('chat')
    setShowSidebar(false)
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    createNewSession('manager', newMode)
  }

  const send = async () => {
    const text = input.trim()
    if (!text || thinking) return
    setInput('')
    const userMsg = { id: Date.now(), from: 'user', text, ts: now() }
    const withUser = [...messages, userMsg]
    updateActiveMessages(withUser)
    setThinking(true)
    try {
      const reply = chatView === 'manager' ? await managerReply(text, mode) : await adminReply(text)
      const botMsg = { id: Date.now() + 1, from: 'bot', text: reply, ts: now() }
      updateActiveMessages([...withUser, botMsg])
    } finally {
      setThinking(false)
    }
  }

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  const API = 'http://localhost:8080'

  const fetchTrainStats = async () => {
    try {
      const res = await fetch(`${API}/api/rag/stats`)
      setTrainStats(await res.json())
    } catch {}
  }

  const handleTrainSingle = async () => {
    const id = parseInt(trainEmpId)
    if (!id) return
    setTrainLoading(true); setTrainResult(null)
    try {
      await fetch(`${API}/api/rag/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: id })
      })
      setTrainResult({ ok: true, msg: `Employee ${id} trained successfully` })
      setTrainEmpId('')
      await fetchTrainStats()
    } catch {
      setTrainResult({ ok: false, msg: 'Training failed — check backend connection' })
    } finally { setTrainLoading(false) }
  }

  const handleTrainBatch = async () => {
    const ids = trainBatch.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
    if (!ids.length) return
    setTrainLoading(true); setTrainResult(null)
    try {
      const res = await fetch(`${API}/api/rag/train/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeIds: ids })
      })
      const data = await res.json()
      setTrainResult({ ok: true, msg: `${data.trained_count} employees trained successfully` })
      setTrainBatch('')
      await fetchTrainStats()
    } catch {
      setTrainResult({ ok: false, msg: 'Batch training failed — check backend connection' })
    } finally { setTrainLoading(false) }
  }

  const handleClearAll = async () => {
    if (!window.confirm('Delete all trained embeddings from Milvus?')) return
    setTrainLoading(true); setTrainResult(null)
    try {
      await fetch(`${API}/api/rag/clear`, { method: 'DELETE' })
      setTrainResult({ ok: true, msg: 'All embeddings cleared' })
      setTrainStats(prev => prev ? { ...prev, total_embeddings: 0 } : null)
    } catch {
      setTrainResult({ ok: false, msg: 'Clear failed' })
    } finally { setTrainLoading(false) }
  }

  const formatText = (text) =>
    text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
          part.startsWith('**') ? <strong key={j}>{part.slice(2, -2)}</strong> : part
        )}
        <br />
      </span>
    ))

  if (!user) return null

  const showModeToggle = chatView === 'manager'
  const showChat = isManager || chatView === 'manager' || (isAdmin && ragTab === 'chat')

  return (
    <>
      <button className="chatbot-fab" onClick={() => isOpen ? closePanel() : setIsOpen(true)} title="Open AI Assistant">
        {isOpen ? <span className="chatbot-fab-close">✕</span> : <AutobotIcon size={30} glow />}
        {!isOpen && <span className="chatbot-fab-label">AI Assistant</span>}
      </button>

      {isOpen && (
        <div className={`chatbot-panel${closing ? ' chatbot-panel--closing' : ''}`}>

          {/* Sidebar */}
          {showSidebar && (
            <div className="chat-sidebar">
              <div className="sidebar-header">
                <span className="sidebar-title">Chat History</span>
                <span className="sidebar-limit">{sessions.length}/{MAX_SESSIONS}</span>
              </div>
              <button className="sidebar-new-btn" onClick={() => { createNewSession(chatView || 'manager', mode); setShowSidebar(false) }}>
                ✏️ New Chat
              </button>
              <div className="sidebar-list">
                {sessions.map(s => (
                  <div
                    key={s.id}
                    className={`sidebar-item ${s.id === activeId ? 'sidebar-item--active' : ''}`}
                    onClick={() => switchSession(s.id)}
                  >
                    <div className="sidebar-item-title">{s.title}</div>
                    <div className="sidebar-item-date">{s.date}</div>
                    <button className="sidebar-item-del" onClick={(e) => deleteSession(s.id, e)} title="Delete">×</button>
                  </div>
                ))}
                {sessions.length === 0 && <div className="sidebar-empty">No conversations yet</div>}
              </div>
            </div>
          )}

          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <button className="chatbot-icon-btn" onClick={() => setShowSidebar(o => !o)} title="Chat history">☰</button>
              <AutobotIcon size={30} glow />
              <div>
                <div className="chatbot-title">EBP AI Assistant</div>
                <div className="chatbot-subtitle">
                  {chatView === 'admin' ? '🛠️ Admin Mode'
                    : chatView === 'manager' && isAdmin ? '🏪 Manager View'
                    : `🏪 ${user.locationName || 'Store Manager'}`}
                </div>
              </div>
            </div>
            <div className="chatbot-header-actions">
              {isAdmin && chatView === 'admin' && <button className="chatbot-view-toggle" onClick={() => switchView('manager')}>🏪 Manager</button>}
              {isAdmin && chatView === 'manager' && <button className="chatbot-view-toggle" onClick={() => switchView('admin')}>🛠️ Admin</button>}
              {showChat && <button className="chatbot-icon-btn" onClick={() => { createNewSession(chatView || 'manager', mode) }} title="New chat">✏️</button>}
              <button className="chatbot-icon-btn" onClick={closePanel}>✕</button>
            </div>
          </div>

          {/* Mode toggle */}
          {showModeToggle && (
            <div className="chatbot-mode-toggle">
              <div
                className="mode-track"
                onMouseDown={(e) => {
                  const startX = e.clientX
                  const onUp = (ev) => {
                    const diff = ev.clientX - startX
                    if (diff > 30) switchMode('general')
                    else if (diff < -30) switchMode('business')
                    window.removeEventListener('mouseup', onUp)
                  }
                  window.addEventListener('mouseup', onUp)
                }}
                onTouchStart={(e) => {
                  const startX = e.touches[0].clientX
                  const onEnd = (ev) => {
                    const diff = ev.changedTouches[0].clientX - startX
                    if (diff > 30) switchMode('general')
                    else if (diff < -30) switchMode('business')
                    window.removeEventListener('touchend', onEnd)
                  }
                  window.addEventListener('touchend', onEnd)
                }}
              >
                <div className={`mode-track-slider ${mode === 'general' ? 'mode-track-slider--general' : ''}`} />
                <button className={`mode-pill ${mode === 'business' ? 'mode-pill--active' : ''}`} onClick={() => switchMode('business')}>🏢 Business</button>
                <button className={`mode-pill ${mode === 'general'  ? 'mode-pill--active' : ''}`} onClick={() => switchMode('general')}>💬 General</button>
              </div>
            </div>
          )}

          {/* Admin tabs */}
          {isAdmin && chatView === 'admin' && (
            <div className="chatbot-tabs">
              <button className={ragTab === 'chat'  ? 'active' : ''} onClick={() => setRagTab('chat')}>💬 Chat</button>
              <button className={ragTab === 'train' ? 'active' : ''} onClick={() => setRagTab('train')}>
                🧠 Train Data {trainStats?.total_embeddings > 0 && <span className="chunk-badge">{trainStats.total_embeddings}</span>}
              </button>
            </div>
          )}

          {/* Train panel */}
          {isAdmin && chatView === 'admin' && ragTab === 'train' && (
            <div className="chatbot-train-panel">

              {/* Stats bar */}
              <div className="train-stats-bar">
                <span className="train-stats-count">
                  <strong>{trainStats?.total_embeddings ?? '—'}</strong> embeddings
                </span>
                <span className={`train-stats-status ${trainStats?.connected ? 'train-stats-status--ok' : 'train-stats-status--err'}`}>
                  {trainStats?.connected ? '● Milvus connected' : '● Milvus disconnected'}
                </span>
              </div>

              {/* Result message */}
              {trainResult && (
                <div className={`train-result ${trainResult.ok ? 'train-result--ok' : 'train-result--err'}`}>
                  {trainResult.msg}
                </div>
              )}

              {/* Single / Batch toggle */}
              <div className="train-mode-tabs">
                <button className={trainMode === 'single' ? 'active' : ''} onClick={() => setTrainMode('single')}>Single</button>
                <button className={trainMode === 'batch'  ? 'active' : ''} onClick={() => setTrainMode('batch')}>Batch</button>
              </div>

              {trainMode === 'single' ? (
                <>
                  <div className="train-section-title">Train by Employee ID</div>
                  <div className="train-row">
                    <input
                      className="train-input"
                      type="number"
                      placeholder="Employee ID  e.g. 1"
                      value={trainEmpId}
                      onChange={e => setTrainEmpId(e.target.value)}
                      disabled={trainLoading}
                    />
                    <button className="train-btn train-btn--inline" onClick={handleTrainSingle} disabled={trainLoading || !trainEmpId}>
                      {trainLoading ? '…' : 'Train'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="train-section-title">Batch — comma-separated IDs</div>
                  <textarea
                    className="train-textarea"
                    placeholder="1,2,3,4,5,10,15,20,25,30"
                    value={trainBatch}
                    onChange={e => setTrainBatch(e.target.value)}
                    disabled={trainLoading}
                    rows={3}
                  />
                  {trainBatch.trim() && (
                    <div className="train-batch-count">
                      {trainBatch.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)).length} employees selected
                    </div>
                  )}
                  <button className="train-btn" onClick={handleTrainBatch} disabled={trainLoading || !trainBatch.trim()}>
                    {trainLoading ? '…' : 'Train All'}
                  </button>
                </>
              )}

              <div className="train-footer">
                <button className="train-refresh-btn" onClick={fetchTrainStats} disabled={trainLoading}>↻ Refresh</button>
                <button className="train-clear-btn" onClick={handleClearAll} disabled={trainLoading}>🗑️ Clear All</button>
              </div>

            </div>
          )}

          {/* Chat messages */}
          {showChat && (
            <>
              <div className="chatbot-messages">
                {messages.map((m) => (
                  <div key={m.id} className={`chatbot-msg chatbot-msg--${m.from}`}>
                    {m.from === 'bot' && <span className="msg-avatar"><AutobotIcon size={26} /></span>}
                    <div className="msg-bubble">
                      <div className="msg-text">{formatText(m.text)}</div>
                      <div className="msg-ts">{m.ts}</div>
                    </div>
                    <button className="msg-delete" onClick={() => deleteMessage(m.id)} title="Delete">×</button>
                  </div>
                ))}
                {thinking && (
                  <div className="chatbot-msg chatbot-msg--bot">
                    <span className="msg-avatar"><AutobotIcon size={26} spin /></span>
                    <div className="msg-bubble"><div className="typing-dots"><span/><span/><span/></div></div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="chatbot-input-row">
                <textarea
                  className="chatbot-input"
                  placeholder={mode === 'general' ? 'Ask me anything…' : 'Ask about stores, leaves, predictions…'}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  rows={1}
                />
                <button className="chatbot-send-btn" onClick={send} disabled={!input.trim() || thinking}>➤</button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
