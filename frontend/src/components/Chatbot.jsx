import { useState, useRef, useEffect } from 'react'
import { useChatbot } from './ChatbotContext'
import { useAuth } from '../context/AuthContext'
import { managerReply, adminReply, saveRagChunk, getRagCorpus, clearRagCorpus } from './chatbotEngine'
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
  const [ragTitle, setRagTitle]         = useState('')
  const [ragContent, setRagContent]     = useState('')
  const [ragChunks, setRagChunks]       = useState(getRagCorpus())
  const [ragTab, setRagTab]             = useState('chat')
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
      const reply = chatView === 'manager' ? await managerReply(text, mode) : adminReply(text)
      const botMsg = { id: Date.now() + 1, from: 'bot', text: reply, ts: now() }
      updateActiveMessages([...withUser, botMsg])
    } finally {
      setThinking(false)
    }
  }

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  const trainChunk = () => {
    if (!ragTitle.trim() || !ragContent.trim()) return
    const chunk = saveRagChunk(ragTitle.trim(), ragContent.trim())
    setRagChunks(getRagCorpus())
    setRagTitle(''); setRagContent('')
    updateActiveMessages([...messages, { id: Date.now(), from: 'bot', text: `✅ Chunk "${chunk.title}" added. Total: ${getRagCorpus().length}`, ts: now() }])
    setRagTab('chat')
  }

  const clearCorpus = () => {
    clearRagCorpus(); setRagChunks([])
    updateActiveMessages([...messages, { id: Date.now(), from: 'bot', text: '🗑️ RAG corpus cleared.', ts: now() }])
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
                🧠 Train Data {ragChunks.length > 0 && <span className="chunk-badge">{ragChunks.length}</span>}
              </button>
            </div>
          )}

          {/* Train panel */}
          {isAdmin && chatView === 'admin' && ragTab === 'train' && (
            <div className="chatbot-train-panel">
              <div className="train-section-title">Add Knowledge Chunk</div>
              <input className="train-input" placeholder="Chunk title" value={ragTitle} onChange={e => setRagTitle(e.target.value)} />
              <textarea className="train-textarea" placeholder="Paste content here…" value={ragContent} onChange={e => setRagContent(e.target.value)} rows={5} />
              <button className="train-btn" onClick={trainChunk} disabled={!ragTitle.trim() || !ragContent.trim()}>➕ Add to Corpus</button>
              {ragChunks.length > 0 && (
                <div className="train-corpus">
                  <div className="train-corpus-header">
                    <span>Trained Chunks ({ragChunks.length})</span>
                    <button className="train-clear-btn" onClick={clearCorpus}>🗑️ Clear All</button>
                  </div>
                  {ragChunks.map(c => (
                    <div key={c.id} className="train-chunk">
                      <div className="train-chunk-title">{c.title}</div>
                      <div className="train-chunk-preview">{c.content.slice(0, 80)}…</div>
                    </div>
                  ))}
                </div>
              )}
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
