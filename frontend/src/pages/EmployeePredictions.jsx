import { useState, useEffect, useRef } from 'react'
import { getLocations, getEmployees, predictEmployee, getEmployeeLeaves, getEmployeeHalfLeaves } from '../api'
import { useFetch } from '../hooks/useFetch'
import { Spinner, ErrorMsg, Badge } from '../components/UI'
import PredictionCard from '../components/PredictionCard'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, RadialBarChart, RadialBar, Legend,
  LineChart, Line, ReferenceLine, Cell
} from 'recharts'
import './EmployeePredictions.css'
import { useTheme } from '../context/ThemeContext'

const LEAVE_COLORS = { SICK: '#ef4444', CASUAL: '#f59e0b', EARNED: '#10b981', UNPAID: '#6b7280' }

// ── Multi-select dropdown component ──────────────────────
function MultiSelect({ options, selected, onChange, placeholder, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (id) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id])
  }

  const label = selected.length === 0
    ? placeholder
    : selected.length === options.length
      ? 'All selected'
      : `${selected.length} selected`

  return (
    <div className="multi-select" ref={ref}>
      <button
        className={`multi-select-trigger ${open ? 'open' : ''}`}
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        type="button"
      >
        <span>{label}</span>
        <span className="multi-select-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="multi-select-dropdown">
          {options.length === 0 && <div className="multi-select-empty">No options</div>}
          <label className="multi-select-item multi-select-all">
            <input
              type="checkbox"
              checked={selected.length === options.length && options.length > 0}
              onChange={() => onChange(selected.length === options.length ? [] : options.map(o => o.id))}
            />
            <span>Select All</span>
          </label>
          <div className="multi-select-divider" />
          {options.map(o => (
            <label key={o.id} className="multi-select-item">
              <input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggle(o.id)} />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Historical Leave Data (combined full + half day) ─────
function HistoricalLeaveData({ leaveHistory, halfLeaves }) {
  const [tab, setTab] = useState('full')

  // Compute per-employee insights from actual data
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  const monthFreq = leaveHistory.reduce((acc, l) => {
    const m = new Date(l.leaveDate).getMonth()
    acc[m] = (acc[m] || 0) + 1
    return acc
  }, {})
  const peakMonth = Object.entries(monthFreq).sort((a,b) => b[1]-a[1])[0]

  const dayFreq = leaveHistory.reduce((acc, l) => {
    const d = new Date(l.leaveDate).getDay()
    acc[d] = (acc[d] || 0) + 1
    return acc
  }, {})
  const peakDay = Object.entries(dayFreq).sort((a,b) => b[1]-a[1])[0]

  const typeFreq = leaveHistory.reduce((acc, l) => {
    acc[l.leaveType] = (acc[l.leaveType] || 0) + 1
    return acc
  }, {})
  const dominantType = Object.entries(typeFreq).sort((a,b) => b[1]-a[1])[0]

  const approved = leaveHistory.filter(l => l.status === 'APPROVED').length
  const approvalRate = leaveHistory.length ? Math.round((approved / leaveHistory.length) * 100) : 0

  // Avg gap between leaves in days
  const sorted = [...leaveHistory].sort((a,b) => new Date(a.leaveDate) - new Date(b.leaveDate))
  let avgGap = null
  if (sorted.length > 1) {
    const gaps = sorted.slice(1).map((l,i) => (new Date(l.leaveDate) - new Date(sorted[i].leaveDate)) / 86400000)
    avgGap = Math.round(gaps.reduce((a,b) => a+b, 0) / gaps.length)
  }

  return (
    <div style={{ marginTop: '0' }}>
      <div className="hist-header">
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Historical Leave Data</h2>
        <div className="hist-tabs">
          <button className={`hist-tab ${tab === 'insights' ? 'hist-tab--active' : ''}`} onClick={() => setTab('insights')}>Insights</button>
          <button className={`hist-tab ${tab === 'full' ? 'hist-tab--active' : ''}`} onClick={() => setTab('full')}>
            Full-Day <span className="hist-count">{leaveHistory.length}</span>
          </button>
          <button className={`hist-tab ${tab === 'half' ? 'hist-tab--active' : ''}`} onClick={() => setTab('half')}>
            Half-Day <span className="hist-count">{halfLeaves.length}</span>
          </button>
        </div>
      </div>

      {tab === 'insights' && (
        <div className="hist-insights">
          <div className="hist-insight-item">
            <span className="hist-insight-icon">📅</span>
            <div>
              <div className="hist-insight-label">Peak Leave Month</div>
              <div className="hist-insight-value">{peakMonth ? `${MONTHS[peakMonth[0]]} (${peakMonth[1]} days)` : 'N/A'}</div>
            </div>
          </div>
          <div className="hist-insight-item">
            <span className="hist-insight-icon">📆</span>
            <div>
              <div className="hist-insight-label">Preferred Day</div>
              <div className="hist-insight-value">{peakDay ? `${DAYS[peakDay[0]]} (${peakDay[1]} times)` : 'N/A'}</div>
            </div>
          </div>
          <div className="hist-insight-item">
            <span className="hist-insight-icon">🏷️</span>
            <div>
              <div className="hist-insight-label">Dominant Type</div>
              <div className="hist-insight-value">{dominantType ? `${dominantType[0]} (${dominantType[1]} days)` : 'N/A'}</div>
            </div>
          </div>
          <div className="hist-insight-item">
            <span className="hist-insight-icon">✅</span>
            <div>
              <div className="hist-insight-label">Approval Rate</div>
              <div className="hist-insight-value">{approvalRate}%</div>
            </div>
          </div>
          <div className="hist-insight-item">
            <span className="hist-insight-icon">⏱️</span>
            <div>
              <div className="hist-insight-label">Avg Gap Between Leaves</div>
              <div className="hist-insight-value">{avgGap !== null ? `${avgGap} days` : 'N/A'}</div>
            </div>
          </div>
          <div className="hist-insight-item">
            <span className="hist-insight-icon">🌞</span>
            <div>
              <div className="hist-insight-label">Half-Day Preference</div>
              <div className="hist-insight-value">
                {halfLeaves.length === 0 ? 'None recorded' :
                  halfLeaves.filter(h => h.half === 'MORNING').length > halfLeaves.filter(h => h.half === 'AFTERNOON').length
                    ? 'Morning' : 'Afternoon'}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'full' && (
        <div className="leave-table" style={{ marginTop: '0.75rem' }}>
          <div className="leave-table-header">
            <span>Date</span><span>Type</span><span>Status</span>
          </div>
          {leaveHistory.length === 0
            ? <div className="empty-state" style={{ padding: '1rem' }}>No full-day leave records</div>
            : leaveHistory.slice(0, 10).map(l => (
              <div key={l.id} className="leave-table-row">
                <span>{l.leaveDate}</span>
                <Badge label={l.leaveType} color={LEAVE_COLORS[l.leaveType]} />
                <Badge label={l.status} color={l.status === 'APPROVED' ? '#10b981' : '#f59e0b'} />
              </div>
            ))
          }
        </div>
      )}

      {tab === 'half' && (
        <div className="leave-table" style={{ marginTop: '0.75rem' }}>
          <div className="leave-table-header">
            <span>Date</span><span>Half</span><span>Type</span>
          </div>
          {halfLeaves.length === 0
            ? <div className="empty-state" style={{ padding: '1rem' }}>No half-day leave records</div>
            : halfLeaves.slice(0, 10).map(h => (
              <div key={h.id} className="leave-table-row">
                <span>{h.leaveDate}</span>
                <Badge label={h.half} color="#8b5cf6" />
                <Badge label={h.leaveType} color={LEAVE_COLORS[h.leaveType]} />
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────
export default function EmployeePredictions() {
  const [locationIds, setLocationIds]   = useState([])
  const [employeeIds, setEmployeeIds]   = useState([])
  const [days, setDays]                 = useState(60)
  const [results, setResults]           = useState([])   // [{ employee, prediction, leaveHistory, halfLeaves }]
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState(null)
  const [activeEmpId, setActiveEmpId]   = useState(null)

  const { data: locations } = useFetch(getLocations, [])
  const [employees, setEmployees]       = useState([])
  const [empLoading, setEmpLoading]     = useState(false)
  const { dark } = useTheme()

  // Load employees for all selected stores
  useEffect(() => {
    if (locationIds.length === 0) { setEmployees([]); setEmployeeIds([]); return }
    setEmpLoading(true)
    Promise.all(locationIds.map(id => getEmployees(id)))
      .then(responses => {
        const all = responses.flatMap(r => r.data)
        const unique = Array.from(new Map(all.map(e => [e.id, e])).values())
        setEmployees(unique)
      })
      .catch(() => setEmployees([]))
      .finally(() => setEmpLoading(false))
  }, [locationIds])

  const handlePredict = async () => {
    if (employeeIds.length === 0) return
    setLoading(true)
    setError(null)
    setResults([])
    try {
      const all = await Promise.all(
        employeeIds.map(id =>
          Promise.all([
            predictEmployee(id, 30),
            predictEmployee(id, 60),
            getEmployeeLeaves(id),
            getEmployeeHalfLeaves(id)
          ]).then(([pred30Res, pred60Res, leavesRes, halfRes]) => ({
            employee: employees.find(e => e.id === id),
            prediction30: pred30Res.data,
            prediction60: pred60Res.data,
            leaveHistory: leavesRes.data,
            halfLeaves: halfRes.data
          }))
        )
      )
      setResults(all)
      setActiveEmpId(all[0]?.employee?.id ?? null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const locationOptions = locations?.map(l => ({ id: l.id, label: `${l.name} (${l.city})` })) || []
  const employeeOptions = employees.map(e => ({ id: e.id, label: `${e.name} — ${e.role}` }))

  const activeResult = results.find(r => r.employee?.id === activeEmpId)

  const today = new Date()
  const dateIn30 = new Date(today); dateIn30.setDate(today.getDate() + 30)
  const dateIn60 = new Date(today); dateIn60.setDate(today.getDate() + 60)
  const fmt = (d) => d.toISOString().slice(0, 10)

  // Monthly history chart data
  const monthlyData = (activeResult?.leaveHistory || []).reduce((acc, l) => {
    const month = l.leaveDate?.slice(0, 7)
    if (!month) return acc
    const existing = acc.find(a => a.month === month)
    if (existing) existing[l.leaveType] = (existing[l.leaveType] || 0) + 1
    else acc.push({ month, [l.leaveType]: 1 })
    return acc
  }, []).sort((a, b) => a.month.localeCompare(b.month)).slice(-12)

  // Confidence comparison: 30d vs 60d
  const conf30 = activeResult?.prediction30?.[0] ? Math.round(activeResult.prediction30[0].confidence * 100) : 0
  const conf60 = activeResult?.prediction60?.[0] ? Math.round(activeResult.prediction60[0].confidence * 100) : 0

  // Timeline data — map predictions onto a 60-day axis
  const timelineData = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i * 8)
    const label = fmt(d).slice(5)
    const in30 = d <= dateIn30
    const p30 = activeResult?.prediction30?.find(p => p.predictedDate >= fmt(today) && p.predictedDate <= fmt(dateIn30))
    const p60 = activeResult?.prediction60?.find(p => p.predictedDate >= fmt(today) && p.predictedDate <= fmt(dateIn60))
    return {
      date: label,
      '30-day risk': in30 ? (p30 ? Math.round(p30.confidence * 100) : 0) : null,
      '60-day risk': p60 ? Math.round(p60.confidence * 100) : 0,
    }
  })

  // Leave type distribution
  const typeDistribution = Object.entries(
    (activeResult?.leaveHistory || []).reduce((acc, l) => {
      acc[l.leaveType] = (acc[l.leaveType] || 0) + 1
      return acc
    }, {})
  ).map(([type, count]) => ({ type, count, fill: LEAVE_COLORS[type] }))

  return (
    <div className="page">
      <div className="page-header">
        <h1>Employee Leave Predictions</h1>
        <p>Select one or more stores and employees to predict upcoming leave</p>
      </div>

      <div className="controls-bar">
        <div className="control-group">
          <label>Store(s)</label>
          <MultiSelect
            options={locationOptions}
            selected={locationIds}
            onChange={setLocationIds}
            placeholder="— Select stores —"
          />
        </div>
        <div className="control-group">
          <label>Employee(s)</label>
          <MultiSelect
            options={employeeOptions}
            selected={employeeIds}
            onChange={setEmployeeIds}
            placeholder={empLoading ? 'Loading…' : '— Select employees —'}
            disabled={locationIds.length === 0 || empLoading}
          />
        </div>
        <div className="control-group control-action">
          <label>&nbsp;</label>
          <button className="btn-predict" onClick={handlePredict} disabled={employeeIds.length === 0 || loading}>
            {loading ? 'Predicting…' : `🔮 Predict${employeeIds.length > 1 ? ` (${employeeIds.length})` : ''}`}
          </button>
        </div>
      </div>

      {error && <ErrorMsg message={error} />}
      {loading && <Spinner />}

      {!loading && results.length === 0 && !error && (
        <div className="empty-state">👆 Select stores and employees, then click Predict</div>
      )}

      {!loading && results.length > 0 && (
        <div className="emp-page-layout">

          {/* Sidebar — employee list */}
          <div className="emp-sidebar">
            <div className="emp-sidebar-header">
              <span className="emp-sidebar-title">Employees</span>
              <span className="emp-sidebar-count">{results.length}</span>
            </div>
            <div className="emp-sidebar-list">
              {results.map((r, i) => (
                <button
                  key={r.employee?.id}
                  className={`emp-sidebar-item ${r.employee?.id === activeEmpId ? 'emp-sidebar-item--active' : ''}`}
                  onClick={() => setActiveEmpId(r.employee?.id)}
                >
                  <div className="emp-sidebar-avatar">{r.employee?.name?.charAt(0)}</div>
                  <div className="emp-sidebar-info">
                    <div className="emp-sidebar-name">{r.employee?.name}</div>
                    <div className="emp-sidebar-role">{r.employee?.role}</div>
                  </div>
                  {(r.prediction60?.length > 0) && (
                    <span className="emp-sidebar-badge">{r.prediction60.length}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="emp-main">
            {/* Pagination nav */}
            {results.length > 1 && (() => {
              const idx = results.findIndex(r => r.employee?.id === activeEmpId)
              const prev = results[idx - 1]
              const next = results[idx + 1]
              return (
                <div className="emp-pagination">
                  <button className="emp-page-btn" disabled={!prev} onClick={() => prev && setActiveEmpId(prev.employee?.id)}>
                    ← Prev
                  </button>
                  <span className="emp-page-info">{idx + 1} of {results.length}</span>
                  <button className="emp-page-btn" disabled={!next} onClick={() => next && setActiveEmpId(next.employee?.id)}>
                    Next →
                  </button>
                </div>
              )
            })()}

            {activeResult && (
              <div className="emp-unified card">

              {/* Profile + KPIs in one row */}
              <div className="emp-unified-top">
                <div className="emp-profile-inline">
                  <div className="emp-avatar">{activeResult.employee?.name?.charAt(0)}</div>
                  <div>
                    <div className="emp-name">{activeResult.employee?.name}</div>
                    <div className="emp-role">{activeResult.employee?.role}</div>
                    <div className="emp-meta">
                      <Badge label={`${activeResult.leaveHistory.length} full-day`} color="#3b82f6" />
                      <Badge label={`${activeResult.halfLeaves.length} half-day`} color="#8b5cf6" />
                    </div>
                  </div>
                </div>

                <div className="pbi-kpi-row">
                  <div className="pbi-kpi">
                    <div className="pbi-kpi-label">30-Day Risk</div>
                    <div className="pbi-kpi-value" style={{ color: conf30 >= 70 ? '#ef4444' : conf30 >= 40 ? '#f59e0b' : '#10b981' }}>{conf30}%</div>
                    <div className="pbi-kpi-sub">{fmt(dateIn30)}</div>
                  </div>
                  <div className="pbi-kpi">
                    <div className="pbi-kpi-label">60-Day Risk</div>
                    <div className="pbi-kpi-value" style={{ color: conf60 >= 70 ? '#ef4444' : conf60 >= 40 ? '#f59e0b' : '#10b981' }}>{conf60}%</div>
                    <div className="pbi-kpi-sub">{fmt(dateIn60)}</div>
                  </div>
                  <div className="pbi-kpi">
                    <div className="pbi-kpi-label">Total Leaves</div>
                    <div className="pbi-kpi-value" style={{ color: 'var(--primary)' }}>{activeResult.leaveHistory.length}</div>
                    <div className="pbi-kpi-sub">Historical</div>
                  </div>
                  <div className="pbi-kpi">
                    <div className="pbi-kpi-label">Half Days</div>
                    <div className="pbi-kpi-value" style={{ color: '#8b5cf6' }}>{activeResult.halfLeaves.length}</div>
                    <div className="pbi-kpi-sub">Historical</div>
                  </div>
                </div>
              </div>

              <div className="emp-unified-divider" />

              {/* Prediction */}
              <div className="emp-unified-section">
                <div className="emp-unified-label">Prediction</div>
                {activeResult.prediction30?.length === 0 && activeResult.prediction60?.length === 0
                  ? <div className="empty-state" style={{ padding: '0.75rem' }}>No strong leave signal detected.</div>
                  : <div className="emp-pred-grid">{(activeResult.prediction60 || []).map(p => <PredictionCard key={p.employeeId + p.predictedDate} prediction={p} />)}</div>
                }
              </div>

              <div className="emp-unified-divider" />

              {/* Risk Timeline */}
              <div className="emp-unified-section">
                <div className="pbi-card-header">
                  <span className="pbi-card-title">📈 Leave Risk Timeline</span>
                  <div className="pbi-legend">
                    <span className="pbi-legend-dot" style={{ background: '#3b82f6' }} />30-day
                    <span className="pbi-legend-dot" style={{ background: '#8b5cf6' }} />60-day
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={timelineData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="g30" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="g60" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} unit="%" />
                    <Tooltip formatter={(v) => v !== null ? `${v}%` : 'N/A'} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.78rem' }} />
                    <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 2" label={{ value: 'High', fill: '#ef4444', fontSize: 10 }} />
                    <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'Med', fill: '#f59e0b', fontSize: 10 }} />
                    <Area type="monotone" dataKey="30-day risk" stroke="#3b82f6" strokeWidth={2} fill="url(#g30)" connectNulls dot={{ r: 3, fill: '#3b82f6' }} />
                    <Area type="monotone" dataKey="60-day risk" stroke="#8b5cf6" strokeWidth={2} fill="url(#g60)" connectNulls dot={{ r: 3, fill: '#8b5cf6' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="emp-unified-divider" />

              {/* Monthly history */}
              <div className="emp-unified-section">
                <div className="pbi-card-header">
                  <span className="pbi-card-title">📊 Monthly Leave History</span>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.75rem' }} />
                    {['SICK', 'CASUAL', 'EARNED', 'UNPAID'].map(type => (
                      <Bar key={type} dataKey={type} stackId="a" fill={LEAVE_COLORS[type]} radius={type === 'UNPAID' ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="emp-unified-divider" />

              {/* Historical leave data */}
              <div className="emp-unified-section">
                <HistoricalLeaveData leaveHistory={activeResult.leaveHistory} halfLeaves={activeResult.halfLeaves} />
              </div>

            </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
