import { Badge } from './UI'
import './PredictionCard.css'

const LEAVE_COLORS = {
  SICK: '#ef4444', CASUAL: '#f59e0b', EARNED: '#10b981', UNPAID: '#f97316'
}

const CONFIDENCE_COLOR = (c) => c >= 0.7 ? '#ef4444' : c >= 0.4 ? '#f59e0b' : '#10b981'

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function signalIcon(signal) {
  const s = signal.toLowerCase()
  if (s.includes('bridge') || s.includes('holiday'))          return '🏖️'
  if (s.includes('gap') || s.includes('days ago') || s.includes('recurring')) return '🔁'
  if (s.includes('unpaid') || s.includes('absence management')) return '⚠️'
  if (s.includes('monday') || s.includes('friday'))           return '📅'
  if (s.includes('consistent') || s.includes('repeated'))     return '📆'
  if (s.includes('overdue'))                                   return '⏰'
  return '🗓️'
}

function parseSignals(reason) {
  return reason.split(';').map(s => s.trim()).filter(Boolean)
}

const RANK_COLORS = ['#f59e0b', '#94a3b8', '#b45309', '#6b7280', '#6b7280']

const BRADFORD_COLOR = { GREEN: '#10b981', AMBER: '#f59e0b', RED: '#ef4444' }

export default function PredictionCard({ prediction, rank }) {
  const { employeeName, role, predictedDateStart, predictedDateEnd, leaveType,
          confidence, reason, bradfordScore, bradfordBand, collisionRisk } = prediction
  const pct     = Math.round(confidence * 100)
  const color   = CONFIDENCE_COLOR(confidence)
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
              <span className="pred-date-from">{formatDate(predictedDateStart)}</span>
              <svg className="pred-date-arrow" viewBox="0 0 16 8" fill="none">
                <path d="M0 4h14M11 1l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="pred-date-to">{formatDate(predictedDateEnd)}</span>
            </div>
            <div className="pred-badges">
              <Badge label={leaveType} color={LEAVE_COLORS[leaveType] || '#6b7280'} />
              <span className="pred-conf-pill" style={{ color, background: `${color}14`, borderColor: `${color}40` }}>
                {pct}%
              </span>
              {bradfordBand && (
                <span className="pred-bradford-pill" style={{ color: BRADFORD_COLOR[bradfordBand], background: BRADFORD_COLOR[bradfordBand] + '18', borderColor: BRADFORD_COLOR[bradfordBand] + '40' }}>
                  {bradfordBand === 'RED' ? '🔴' : bradfordBand === 'AMBER' ? '🟡' : '🟢'} BF {bradfordScore}
                </span>
              )}
              {collisionRisk && (
                <span className="pred-collision-pill">⚠ Cover clash</span>
              )}
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
