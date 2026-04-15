import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getLocations, predictStore, getHolidays } from '../api'
import { useFetch } from '../hooks/useFetch'
import { Spinner, ErrorMsg } from '../components/UI'
import PredictionCard from '../components/PredictionCard'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import './StorePredictions.css'

export default function StorePredictions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [locationId, setLocationId] = useState(searchParams.get('id') || '')
  const [days, setDays] = useState(30)
  const [topN, setTopN] = useState(5)
  const [prediction, setPrediction] = useState(null)
  const [holidays, setHolidays] = useState([])
  const [predLoading, setPredLoading] = useState(false)
  const [predError, setPredError] = useState(null)

  const { data: locations, loading: locLoading } = useFetch(getLocations, [])

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

  const handleStoreChange = (e) => {
    setLocationId(e.target.value)
    setSearchParams({ id: e.target.value })
  }

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
            {[14, 30, 60, 90].map(d => <option key={d} value={d}>{d} days</option>)}
          </select>
        </div>
        <div className="control-group">
          <label>Top N</label>
          <select value={topN} onChange={e => setTopN(Number(e.target.value))}>
            {[3, 5, 10].map(n => <option key={n} value={n}>{n} employees</option>)}
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
              <div className="pred-cards">
                <h2>Predicted Leaves ({prediction.predictions.length})</h2>
                <div className="pred-grid">
                  {prediction.predictions.map(p => (
                    <PredictionCard key={p.employeeId} prediction={p} />
                  ))}
                </div>
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
