import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getLocations, predictStore, getHolidays, getEmployees } from '../api'
import { useFetch } from '../hooks/useFetch'
import { Spinner, ErrorMsg } from '../components/UI'
import PredictionCard from '../components/PredictionCard'
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer, Label } from 'recharts'
import './StorePredictions.css'

const DAY_OPTIONS = [14, 30, 60, 90, 180, 270, 360]
const PAGE_SIZE   = 10

// Confidence-tier palette
const CONF_SURFACE = (pct) => pct >= 70 ? '#ef4444' : pct >= 40 ? '#f59e0b' : '#10b981'
const CONF_DEPTH   = (pct) => pct >= 70 ? '#7f1d1d' : pct >= 40 ? '#78350f' : '#064e3b'
const CONF_LABEL   = (pct) => pct >= 70 ? 'High' : pct >= 40 ? 'Med' : 'Low'

// Custom 3D-donut tooltip
function ConfTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, pct, firstName } = payload[0].payload
  const color = CONF_SURFACE(pct)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      background: '#1e293b', border: '1px solid rgba(100,180,255,0.2)',
      borderRadius: 8, padding: '7px 12px', fontSize: '0.78rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
      <strong style={{ color: '#f1f5f9' }}>{firstName}</strong>
      <span style={{ color: '#64748b', marginLeft: 2 }}>{pct}% · {CONF_LABEL(pct)} risk</span>
    </div>
  )
}

function buildTopNOptions(count) {
  if (!count) return []
  const opts = []
  for (let n = 5; n < count; n += 5) opts.push({ value: n, label: `${n}` })
  opts.push({ value: count, label: `All (${count})` })
  return opts
}

export default function StorePredictions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [locationId, setLocationId] = useState(searchParams.get('id') || '')
  const [days, setDays] = useState(30)
  const [topN, setTopN] = useState(5)
  const [empCount, setEmpCount] = useState(null)
  const [prediction, setPrediction] = useState(null)
  const [page, setPage] = useState(1)
  const [holidays, setHolidays] = useState([])
  const [predLoading, setPredLoading] = useState(false)
  const [predError, setPredError] = useState(null)

  const { data: locations, loading: locLoading } = useFetch(getLocations, [])

  const topNOptions = buildTopNOptions(empCount)

  useEffect(() => {
    if (!locationId) return
    setPredLoading(true)
    setPredError(null)
    Promise.all([
      predictStore(locationId, days, topN),
      getHolidays(locationId,
        new Date().toISOString().slice(0, 10),
        new Date(Date.now() + days * 86400000).toISOString().slice(0, 10))
    ])
      .then(([predRes, holRes]) => {
        setPrediction(predRes.data)
        setHolidays(holRes.data)
      })
      .catch(e => setPredError(e.message))
      .finally(() => setPredLoading(false))
  }, [locationId, days, topN])

  // Fetch employee count whenever the selected store changes
  useEffect(() => {
    if (!locationId) { setEmpCount(null); return }
    getEmployees(locationId)
      .then(res => {
        const count = res.data?.length ?? 0
        setEmpCount(count)
        setTopN(Math.min(5, count))
      })
      .catch(() => setEmpCount(null))
  }, [locationId])

  const handleStoreChange = (e) => {
    setLocationId(e.target.value)
    setSearchParams({ id: e.target.value })
  }

  // Reset to page 1 whenever the result set changes
  useEffect(() => { setPage(1) }, [prediction])

  // Pagination helpers
  const allPreds   = prediction?.predictions ?? []
  const totalPages = Math.ceil(allPreds.length / PAGE_SIZE)
  const pageSlice  = allPreds.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Build per-employee confidence slices for 3D donut
  const chartData = (prediction?.predictions || []).map(p => {
    const pct       = Math.round(p.confidence * 100)
    const firstName = p.employeeName.split(' ')[0]
    return { name: p.employeeName, firstName, pct, value: pct }
  })
  const avgConf = chartData.length
    ? Math.round(chartData.reduce((s, d) => s + d.pct, 0) / chartData.length)
    : 0

  return (
    <div className="page">
      <div className="page-header">
        <h1>Store Leave Predictions</h1>
        <p>AI-predicted upcoming leaves for employees at a store</p>
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
        <div className="control-group">
          <label>No. of Employees</label>
          <select
            value={topN}
            onChange={e => setTopN(Number(e.target.value))}
            disabled={!empCount}
          >
            {!empCount && <option>— select a store first —</option>}
            {topNOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {!locationId && (
        <div className="empty-state">👆 Select a store to see predictions</div>
      )}

      {predLoading && <Spinner />}
      {predError && <ErrorMsg message={predError} />}

      {prediction && !predLoading && (
        <>
          <div className="store-summary card" style={{ marginBottom: '1.5rem' }}>
            <div className="summary-title">{prediction.storeName}</div>
            <div className="summary-meta">{prediction.city} · {prediction.region} · {prediction.windowDays}-day window</div>
            {holidays.length > 0 && (
              <div className="holiday-chips">
                {holidays.map(h => (
                  <span key={h.id} className="holiday-chip">🏖️ {h.holidayDate} — {h.holidayName}</span>
                ))}
              </div>
            )}
          </div>

          {prediction.predictions.length === 0 ? (
            <div className="empty-state">No strong leave signals detected for this window.</div>
          ) : (
            <div className="pred-layout">
              <div className="pred-list-card card">
                <div className="pred-list-header">
                  <span>
                    Predicted Leaves <span className="pred-list-count">{allPreds.length}</span>
                  </span>
                  {totalPages > 1 && (
                    <span className="pred-page-info">
                      {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, allPreds.length)} of {allPreds.length}
                    </span>
                  )}
                </div>

                <div className="pred-list">
                  {pageSlice.map((p, i) => (
                    <PredictionCard
                      key={p.employeeId}
                      prediction={p}
                      rank={(page - 1) * PAGE_SIZE + i + 1}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="pred-pagination">
                    <button
                      className="page-btn"
                      onClick={() => setPage(p => p - 1)}
                      disabled={page === 1}
                    >
                      ‹ Prev
                    </button>

                    <div className="page-numbers">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                        <button
                          key={n}
                          className={`page-num ${n === page ? 'page-num--active' : ''}`}
                          onClick={() => setPage(n)}
                        >
                          {n}
                        </button>
                      ))}
                    </div>

                    <button
                      className="page-btn"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page === totalPages}
                    >
                      Next ›
                    </button>
                  </div>
                )}
              </div>

              {/* ── 3-D confidence donut ── */}
              <div className="conf-donut-card">
                <div className="conf-donut-header">
                  <div>
                    <div className="conf-donut-title">Confidence</div>
                    <div className="conf-donut-sub">by employee</div>
                  </div>
                  <div className="conf-donut-avg">
                    <span className="conf-avg-num" style={{ color: CONF_SURFACE(avgConf) }}>{avgConf}%</span>
                    <span className="conf-avg-lbl">avg risk</span>
                  </div>
                </div>

                <div className="conf-3d-scene">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      {/* depth layer */}
                      <Pie data={chartData} cx="50%" cy="54%"
                        innerRadius={68} outerRadius={98}
                        dataKey="value" paddingAngle={3} strokeWidth={0}
                        isAnimationActive={false}>
                        {chartData.map(d => (
                          <Cell key={`d-${d.name}`} fill={CONF_DEPTH(d.pct)} />
                        ))}
                      </Pie>
                      {/* surface layer */}
                      <Pie data={chartData} cx="50%" cy="48%"
                        innerRadius={64} outerRadius={94}
                        dataKey="value" paddingAngle={3} strokeWidth={0}>
                        {chartData.map(d => (
                          <Cell key={`s-${d.name}`} fill={CONF_SURFACE(d.pct)} />
                        ))}
                        <Label
                          content={({ viewBox }) => {
                            const { cx, cy } = viewBox
                            return (
                              <text textAnchor="middle">
                                <tspan x={cx} y={cy - 4}  className="conf-center-num"  style={{ fill: CONF_SURFACE(avgConf) }}>{avgConf}%</tspan>
                                <tspan x={cx} y={cy + 14} className="conf-center-lbl">avg</tspan>
                              </text>
                            )
                          }}
                          position="center"
                        />
                      </Pie>
                      <ReTooltip content={<ConfTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* legend */}
                <div className="conf-legend">
                  {chartData.map(d => (
                    <div key={d.name} className="conf-legend-row">
                      <span className="conf-legend-dot" style={{ background: CONF_SURFACE(d.pct) }} />
                      <span className="conf-legend-name">{d.firstName}</span>
                      <div className="conf-legend-bar-wrap">
                        <div className="conf-legend-bar"
                          style={{ width: `${d.pct}%`, background: CONF_SURFACE(d.pct) }} />
                      </div>
                      <span className="conf-legend-pct" style={{ color: CONF_SURFACE(d.pct) }}>{d.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
