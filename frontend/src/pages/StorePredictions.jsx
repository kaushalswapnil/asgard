import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getLocations, predictStore, getHolidays, getEmployees } from '../api'
import { useFetch } from '../hooks/useFetch'
import { Spinner, ErrorMsg } from '../components/UI'
import PredictionCard from '../components/PredictionCard'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import './StorePredictions.css'

const DAY_OPTIONS = [14, 30, 60, 90, 180, 270, 360]
const PAGE_SIZE   = 10

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

  // Build a simple confidence trend from predictions
  const chartData = prediction?.predictions?.map((p, i) => ({
    name: p.employeeName.split(' ')[0],
    confidence: Math.round(p.confidence * 100)
  })) || []

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

              <div className="pred-chart card">
                <h2>Confidence by Employee</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip formatter={v => `${v}%`} />
                    <Line type="monotone" dataKey="confidence" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
