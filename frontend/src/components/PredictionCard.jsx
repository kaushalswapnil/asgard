import { Badge } from './UI'
import './PredictionCard.css'

const LEAVE_COLORS = {
  SICK: '#ef4444', CASUAL: '#f59e0b', EARNED: '#10b981', UNPAID: '#6b7280'
}

const CONFIDENCE_COLOR = (c) => c >= 0.7 ? '#10b981' : c >= 0.4 ? '#f59e0b' : '#ef4444'

function dateRange(predictedDate, confidence) {
  const buffer = confidence >= 0.7 ? 3 : confidence >= 0.4 ? 5 : 7
  const base = new Date(predictedDate)
  const from = new Date(base); from.setDate(from.getDate() - buffer)
  const to   = new Date(base); to.setDate(to.getDate()   + buffer)
  const fmt  = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return { from: fmt(from), to: fmt(to) }
}

function signalIcon(signal) {
  const s = signal.toLowerCase()
  if (s.includes('bridge') || s.includes('holiday')) return '🏖️'
  if (s.includes('gap') || s.includes('days ago'))   return '🔁'
  return '🗓️'
}

function parseSignals(reason) {
  return reason.split(';').map(s => s.trim()).filter(Boolean)
}

const RANK_COLORS = ['#f59e0b', '#94a3b8', '#b45309', '#6b7280', '#6b7280']

export default function PredictionCard({ prediction, rank }) {
  const { employeeName, role, predictedDate, leaveType, confidence, reason } = prediction
  const pct     = Math.round(confidence * 100)
  const color   = CONFIDENCE_COLOR(confidence)
  const range   = dateRange(predictedDate, confidence)
  const signals = parseSignals(reason)
  const initials = employeeName.split(' ').map(n => n[0]).slice(0, 2).join('')

  return (
    <div className="pred-row-item">

      {/* Rank */}
      <div className="pred-rank" style={{ borderColor: RANK_COLORS[rank - 1] ?? '#e2e8f0', color: RANK_COLORS[rank - 1] ?? '#94a3b8' }}>
        {rank}
      </div>

      {/* Avatar */}
      <div className="pred-avatar">{initials}</div>

      {/* Main body */}
      <div className="pred-body">

        <div className="pred-top">
          {/* Identity */}
          <div className="pred-identity">
            <span className="pred-name">{employeeName}</span>
            <span className="pred-role">{role}</span>
          </div>

          {/* Date window + badges */}
          <div className="pred-right-block">
            <div className="pred-date-range">
              <span className="pred-date-from">{range.from}</span>
              <svg className="pred-date-arrow" viewBox="0 0 16 8" fill="none">
                <path d="M0 4h14M11 1l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="pred-date-to">{range.to}</span>
            </div>
            <div className="pred-badges">
              <Badge label={leaveType} color={LEAVE_COLORS[leaveType] || '#6b7280'} />
              <span className="pred-conf-pill" style={{ color, background: `${color}14`, borderColor: `${color}40` }}>
                {pct}%
              </span>
            </div>
          </div>
        </div>

        {/* Signal chips */}
        <div className="pred-signals">
          {signals.map((s, i) => (
            <span key={i} className="pred-signal-chip">
              <span className="signal-icon">{signalIcon(s)}</span>
              {s}
            </span>
          ))}
        </div>

        {/* Confidence bar */}
        <div className="pred-conf-track">
          <div className="pred-conf-fill" style={{ width: `${pct}%`, background: color }} />
        </div>

      </div>
    </div>
  )
}
