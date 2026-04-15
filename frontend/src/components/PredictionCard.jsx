import { Badge } from './UI'
import './PredictionCard.css'

const LEAVE_COLORS = {
  SICK: '#ef4444', CASUAL: '#f59e0b', EARNED: '#10b981', UNPAID: '#6b7280'
}

const CONFIDENCE_COLOR = (c) => c >= 0.7 ? '#10b981' : c >= 0.4 ? '#f59e0b' : '#ef4444'

export default function PredictionCard({ prediction }) {
  const { employeeName, role, predictedDate, leaveType, confidence, reason } = prediction
  const pct = Math.round(confidence * 100)

  return (
    <div className="pred-card">
      <div className="pred-card-header">
        <div>
          <div className="pred-name">{employeeName}</div>
          <div className="pred-role">{role}</div>
        </div>
        <div className="pred-confidence" style={{ color: CONFIDENCE_COLOR(confidence) }}>
          {pct}%
          <div className="pred-conf-label">confidence</div>
        </div>
      </div>

      <div className="pred-card-body">
        <div className="pred-row">
          <span className="pred-label">📅 Predicted Date</span>
          <span className="pred-value">{new Date(predictedDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        <div className="pred-row">
          <span className="pred-label">🏷️ Leave Type</span>
          <Badge label={leaveType} color={LEAVE_COLORS[leaveType] || '#6b7280'} />
        </div>
        <div className="pred-reason">💡 {reason}</div>
      </div>

      <div className="pred-bar-bg">
        <div className="pred-bar-fill" style={{ width: `${pct}%`, background: CONFIDENCE_COLOR(confidence) }} />
      </div>
    </div>
  )
}
