import { useEffect, useState } from 'react'
import './About.css'
import AutobotIcon from '../components/AutobotIcon'

const quotes = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
]

function QuoteSlider() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % quotes.length)
        setVisible(true)
      }, 400)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="quote-slider card">
      <div className={`quote-content ${visible ? 'quote-visible' : 'quote-hidden'}`}>
        <div className="quote-mark">❝</div>
        <p className="quote-text">{quotes[index].text}</p>
        <p className="quote-author">— {quotes[index].author}</p>
      </div>
      <div className="quote-dots">
        {quotes.map((_, i) => (
          <span key={i} className={`quote-dot ${i === index ? 'active' : ''}`} onClick={() => setIndex(i)} />
        ))}
      </div>
    </div>
  )
}

const features = [
  {
    icon: '🏪',
    title: 'Store Leave Predictions',
    desc: 'Predicts which employees across any UK store are most likely to take leave in the next 14–90 days, ranked by confidence score.',
  },
  {
    icon: '👤',
    title: 'Employee Leave Predictions',
    desc: 'Deep-dives into individual employee leave history to forecast their next leave date, type, and likelihood based on behavioural patterns.',
  },
  {
    icon: '🤖',
    title: 'AI Chatbot Assistant',
    desc: 'An intelligent chatbot that answers questions about stores, employees, holidays and predictions in natural language. Powered by OpenAI GPT.',
  },
  {
    icon: '🧠',
    title: 'RAG Training (Admin)',
    desc: 'Admins can train the chatbot with custom knowledge chunks — leave policies, seasonal patterns, role behaviours — to improve prediction context.',
  },
  {
    icon: '📊',
    title: 'Dashboard Overview',
    desc: 'A real-time overview of all 10 UK stores across England, Scotland, Wales and Northern Ireland with regional breakdowns and store navigation.',
  },
  {
    icon: '🔐',
    title: 'Role-Based Access',
    desc: 'Admins have full access including RAG training and all stores. Store Managers are scoped to their own store and employee data.',
  },
]

const stats = [
  { value: '10', label: 'UK Stores' },
  { value: '500+', label: 'Employees' },
  { value: '85%', label: 'Prediction Accuracy' },
  { value: '4', label: 'Prediction Signals' },
]

export default function About() {
  return (
    <div className="page">
      <div className="about-hero">
        <AutobotIcon size={64} glow />
        <div>
          <h1 className="about-title">EBP AI Assistant</h1>
          <p className="about-tagline">Employee & Branch Portal — Intelligent Leave Prediction Platform</p>
        </div>
      </div>

      <div className="about-description card">
        <p>
          EBP AI Assistant is an intelligent workforce management platform built for UK retail operations.
          It uses machine learning heuristics to analyse historical employee leave patterns and predict
          upcoming absences — helping store managers plan ahead, reduce disruption, and maintain optimal
          staffing levels across all branches.
        </p>
        <p>
          The system analyses four key signals: <strong>monthly leave tendency</strong>, <strong>average leave gap</strong>,
          <strong>holiday bridge patterns</strong>, and <strong>day-of-week preferences</strong> — combining them
          into a confidence-scored prediction for each employee.
        </p>
      </div>

      <div className="about-stats">
        {stats.map(s => (
          <div key={s.label} className="about-stat card">
            <div className="about-stat-value">{s.value}</div>
            <div className="about-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <h2 className="about-section-title">Key Features</h2>
      <div className="about-features">
        {features.map(f => (
          <div key={f.title} className="about-feature card">
            <div className="about-feature-icon">{f.icon}</div>
            <div>
              <div className="about-feature-title">{f.title}</div>
              <div className="about-feature-desc">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <QuoteSlider />
    </div>
  )
}
