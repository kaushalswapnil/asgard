import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getLocations, getStoreReplacements, submitSwapAction } from '../api'
import { useFetch } from '../hooks/useFetch'
import { Spinner, ErrorMsg } from '../components/UI'
import './Replacements.css'

const DAY_OPTIONS = [14, 30, 60, 90]

const riskColor = (r) => r >= 0.7 ? '#ef4444' : r >= 0.45 ? '#f59e0b' : '#10b981'

const MappingBadge = ({ status }) => {
  if (status === 'VALID')             return <span className="mapping-badge valid">✓ Fully Mapped</span>
  if (status === 'MISSING_SECONDARY') return <span className="mapping-badge missing-secondary">⚠ No Secondary Store</span>
  return null
}

function RiskBar({ value }) {
  const pct   = Math.round(value * 100)
  const color = riskColor(value)
  return (
    <div className="risk-bar-wrap">
      <span className="risk-bar-label">Leave risk</span>
      <div className="risk-bar-track">
        <div className="risk-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="risk-bar-pct" style={{ color }}>{pct}%</span>
    </div>
  )
}

function RecommendationCard({ rec }) {
  const [selectedId, setSelectedId] = useState(
    rec.candidates.length > 0 ? rec.candidates[0].employeeId : null
  )
  const [note, setNote]         = useState('')
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)

  const handleAction = async (action) => {
    setLoading(true)
    setResult(null)
    try {
      const res = await submitSwapAction({
        atRiskEmployeeId:     rec.atRiskEmployeeId,
        selectedReplacementId: action === 'APPROVE' ? selectedId : null,
        action,
        managerNote: note || null,
      })
      setResult({ status: res.data.status.toLowerCase(), message: res.data.message })
    } catch {
      setResult({ status: 'error', message: 'Request failed — check backend connection' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rec-card">
      <div className="rec-card-header">
        <div className="rec-employee-info">
          <div className="rec-employee-name">{rec.atRiskEmployeeName}</div>
          <div className="rec-meta">
            <span className="rec-role-chip">{rec.role}</span>
            <span className="rec-store-chip">🏪 {rec.primaryStoreName}</span>
            {rec.secondaryStoreName && (
              <span className="rec-secondary-chip">↔ {rec.secondaryStoreName}</span>
            )}
            <span className="predicted-date">
              Predicted leave: <strong>{rec.predictedLeaveDate}</strong>
            </span>
          </div>
        </div>
        <MappingBadge status={rec.mappingStatus} />
      </div>

      <RiskBar value={rec.leaveRisk} />

      {rec.riskReason && (
        <div className="rec-reason">📊 {rec.riskReason}</div>
      )}

      <div className="candidates-title">Replacement Candidates</div>

      {rec.candidates.length === 0 ? (
        <div className="no-candidates">No available candidates match the criteria for this window.</div>
      ) : (
        <div className="candidates-list">
          {rec.candidates.map((c, i) => (
            <div
              key={c.employeeId}
              className={`candidate-row ${selectedId === c.employeeId ? 'selected' : ''}`}
              onClick={() => setSelectedId(c.employeeId)}
            >
              <span className="candidate-rank">#{i + 1}</span>
              <span className="candidate-name">{c.employeeName}</span>
              <span className={`candidate-align ${c.storeAlignment}`}>{c.storeAlignment}</span>
              <span className="candidate-risk" style={{ color: riskColor(c.leaveRisk) }}>
                {Math.round(c.leaveRisk * 100)}%
              </span>
              <span className="candidate-reason">{c.matchReason}</span>
            </div>
          ))}
        </div>
      )}

      <div className="swap-actions">
        <input
          className="swap-note-input"
          placeholder="Manager note (optional)…"
          value={note}
          onChange={e => setNote(e.target.value)}
          disabled={loading || !!result}
        />
        <button
          className="btn-approve"
          disabled={loading || !!result || rec.candidates.length === 0}
          onClick={() => handleAction('APPROVE')}
        >
          {loading ? '…' : '✓ Approve Swap'}
        </button>
        <button
          className="btn-override"
          disabled={loading || !!result}
          onClick={() => handleAction('OVERRIDE')}
        >
          ↩ Override
        </button>
        {result && (
          <span className={`action-result ${result.status}`}>{result.message}</span>
        )}
      </div>
    </div>
  )
}

export default function Replacements() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [locationId, setLocationId]     = useState(searchParams.get('id') || '')
  const [days, setDays]                 = useState(30)
  const [recs, setRecs]                 = useState(null)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState(null)

  const { data: locations, loading: locLoading } = useFetch(getLocations, [])

  useEffect(() => {
    if (!locationId) return
    setLoading(true)
    setError(null)
    setRecs(null)
    getStoreReplacements(locationId, days)
      .then(res => setRecs(res.data))
      .catch(e  => setError(e.message))
      .finally(() => setLoading(false))
  }, [locationId, days])

  const handleStoreChange = (e) => {
    setLocationId(e.target.value)
    setSearchParams({ id: e.target.value })
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Replacement Planning</h1>
        <p>High-risk leave predictions with ranked replacement candidates for manager action</p>
      </div>

      <div className="controls-bar">
        <div className="control-group">
          <label>Store</label>
          <select value={locationId} onChange={handleStoreChange} disabled={locLoading}>
            <option value="">— Select a store —</option>
            {locations?.map(l => (
              <option key={l.id} value={l.id}>{l.name} ({l.city})</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label>Window (days)</label>
          <select value={days} onChange={e => setDays(Number(e.target.value))}>
            {DAY_OPTIONS.map(d => <option key={d} value={d}>{d} days</option>)}
          </select>
        </div>
      </div>

      {!locationId && (
        <div className="empty-state">👆 Select a store to see replacement recommendations</div>
      )}

      {loading && <Spinner />}
      {error   && <ErrorMsg message={error} />}

      {recs && !loading && (
        recs.length === 0
          ? <div className="empty-state">No high-risk employees detected in this window.</div>
          : (
            <>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
                {recs.length} high-risk employee{recs.length !== 1 ? 's' : ''} identified
              </div>
              <div className="replacements-grid">
                {recs.map(rec => (
                  <RecommendationCard key={rec.atRiskEmployeeId} rec={rec} />
                ))}
              </div>
            </>
          )
      )}
    </div>
  )
}
