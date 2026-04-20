import { useEffect, useState } from 'react'
import './About.css'
import AutobotIcon from '../components/AutobotIcon'

const FEATURE_ACCENTS = ['#3b82f6','#8b5cf6','#06b6d4','#f59e0b','#10b981','#ef4444']
const STAT_ACCENTS    = ['#3b82f6','#8b5cf6','#10b981','#f59e0b']

const quotes = [
  { text: "The secret of getting ahead is getting started.",                                                           author: "Mark Twain"         },
  { text: "It does not matter how slowly you go as long as you do not stop.",                                         author: "Confucius"          },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",                    author: "Winston Churchill"  },
  { text: "Believe you can and you're halfway there.",                                                                 author: "Theodore Roosevelt" },
  { text: "The only way to do great work is to love what you do.",                                                     author: "Steve Jobs"         },
  { text: "In the middle of every difficulty lies opportunity.",                                                       author: "Albert Einstein"    },
  { text: "Don't watch the clock; do what it does. Keep going.",                                                      author: "Sam Levenson"       },
  { text: "You are never too old to set another goal or to dream a new dream.",                                        author: "C.S. Lewis"         },
]

const features = [
  { icon:'🏪', title:'Store Leave Predictions',   accent: FEATURE_ACCENTS[0], desc:'Predicts which employees across any UK store are most likely to take leave in the next 14–360 days, ranked by confidence score.'                                                                           },
  { icon:'👤', title:'Employee Leave Predictions', accent: FEATURE_ACCENTS[1], desc:'Deep-dives into individual employee leave history to forecast their next leave date, type and likelihood based on behavioural patterns.'                                                                   },
  { icon:'🤖', title:'AI Chatbot Assistant',        accent: FEATURE_ACCENTS[2], desc:'An intelligent chatbot that answers questions about stores, employees, holidays and predictions in natural language. Powered by OpenAI GPT.'                                                              },
  { icon:'📊', title:'Dashboard Overview',           accent: FEATURE_ACCENTS[4], desc:'A real-time overview of all 10 UK stores across England, Scotland, Wales and Northern Ireland with regional breakdowns and a 3D donut chart.'                                                           },
  { icon:'🔐', title:'Role-Based Access',             accent: FEATURE_ACCENTS[5], desc:'Admins have full access including RAG training and all stores. Store Managers are scoped to their own store and employee data only.'                                                                    },
]

const stats = [
  { value:'10',   label:'UK Stores',           accent: STAT_ACCENTS[0] },
  { value:'500+', label:'Employees',            accent: STAT_ACCENTS[1] },
  { value:'85%',  label:'Prediction Accuracy',  accent: STAT_ACCENTS[2] },
  { value:'4',    label:'Prediction Signals',   accent: STAT_ACCENTS[3] },
]

// ── Quote slider ─────────────────────────────────────────────────────────────
function QuoteSlider() {
  const [index,   setIndex]   = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const iv = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setIndex(i => (i + 1) % quotes.length); setVisible(true) }, 440)
    }, 4800)
    return () => clearInterval(iv)
  }, [])

  const goTo = (i) => {
    if (i === index) return
    setVisible(false)
    setTimeout(() => { setIndex(i); setVisible(true) }, 440)
  }

  return (
    <div className="abt-quote-card">
      {/* giant decorative background mark */}
      <div className="abt-quote-bg-mark">❝</div>

      <div className={`abt-quote-body ${visible ? 'abt-quote-in' : 'abt-quote-out'}`}>
        <p className="abt-quote-text">{quotes[index].text}</p>
        <div className="abt-quote-author-row">
          <span className="abt-quote-line" />
          <span className="abt-quote-author">{quotes[index].author}</span>
        </div>
      </div>

      {/* progress dots */}
      <div className="abt-quote-dots">
        {quotes.map((_, i) => (
          <button key={i}
            className={`abt-quote-dot ${i === index ? 'abt-quote-dot--active' : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function About() {
  return (
    <div className="page">

      {/* ── Hero ── */}
      <div className="abt-hero">
        {/* background orbs */}
        <div className="abt-orb abt-orb-1" />
        <div className="abt-orb abt-orb-2" />
        <div className="abt-orb abt-orb-3" />

        <div className="abt-hero-icon-wrap">
          <div className="abt-orbit abt-orbit-1" />
          <div className="abt-orbit abt-orbit-2" />
          <div className="abt-hero-icon">
            <AutobotIcon size={68} glow />
          </div>
        </div>

        <div className="abt-hero-text">
          <h1 className="abt-hero-title">EBP <span className="abt-hero-gradient">AI Assistant</span></h1>
          <p className="abt-hero-tagline">Employee &amp; Branch Portal — Intelligent Leave Prediction Platform</p>
          <div className="abt-hero-pills">
            <span className="abt-pill">🇬🇧 UK Retail</span>
            <span className="abt-pill">⚡ Real-Time Predictions</span>
            <span className="abt-pill">🔮 GPT-4o Powered</span>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="abt-stats-row">
        {stats.map((s, i) => (
          <div key={s.label} className="abt-stat-card" style={{ '--stat-accent': s.accent }}>
            <div className="abt-stat-glow"  style={{ background: s.accent + '30' }} />
            <div className="abt-stat-shine" />
            <div className="abt-stat-value" style={{ color: s.accent }}>{s.value}</div>
            <div className="abt-stat-label">{s.label}</div>
            <div className="abt-stat-bar"   style={{ background: s.accent }} />
          </div>
        ))}
      </div>

      {/* ── Description ── */}
      <div className="abt-desc-card">
        <div className="abt-desc-glow" />
        <p>
          EBP AI Assistant is an intelligent workforce management platform built for UK retail operations.
          It uses machine-learning heuristics to analyse historical employee leave patterns and predict
          upcoming absences — helping store managers plan ahead, reduce disruption, and maintain optimal
          staffing levels across all branches.
        </p>
        <p>
          The system analyses four key signals: <span className="abt-signal">monthly leave tendency</span>,&nbsp;
          <span className="abt-signal">average leave gap</span>,&nbsp;
          <span className="abt-signal">holiday bridge patterns</span>, and&nbsp;
          <span className="abt-signal">day-of-week preferences</span> — combining them into a
          confidence-scored prediction for each employee.
        </p>
      </div>

      {/* ── Features ── */}
      <div className="abt-section-header">
        <span className="abt-section-line" />
        <h2 className="abt-section-title">Key Features</h2>
        <span className="abt-section-line" />
      </div>

      <div className="abt-features-grid">
        {features.map((f) => (
          <div key={f.title} className="abt-feature-card" style={{ '--feat-accent': f.accent }}>
            <div className="abt-feat-glow"  style={{ background: f.accent + '28' }} />
            <div className="abt-feat-shine" />
            <div className="abt-feat-icon-wrap" style={{ background: f.accent + '18', border: `1px solid ${f.accent}40` }}>
              <span className="abt-feat-icon">{f.icon}</span>
            </div>
            <div className="abt-feat-title" style={{ color: f.accent }}>{f.title}</div>
            <div className="abt-feat-desc">{f.desc}</div>
            <div className="abt-feat-bar" style={{ background: `linear-gradient(90deg, ${f.accent}60, ${f.accent})` }} />
          </div>
        ))}
      </div>

      {/* ── Quote slider ── */}
      <QuoteSlider />

    </div>
  )
}
