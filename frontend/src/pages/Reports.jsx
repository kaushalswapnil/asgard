import { useState, useEffect } from 'react'
import { getLocations, getStoreLeaves } from '../api'
import { useFetch } from '../hooks/useFetch'
import { Spinner, ErrorMsg } from '../components/UI'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell
} from 'recharts'
import './Reports.css'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const BAR_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4']

export default function Reports() {
  const { data: locations, loading: locLoading } = useFetch(getLocations, [])
  const [locationId, setLocationId] = useState('')
  const [year, setYear]             = useState(new Date().getFullYear())
  const [leaves, setLeaves]         = useState([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)

  useEffect(() => {
    if (!locationId) return
    setLoading(true)
    setError(null)
    getStoreLeaves(locationId, `${year}-01-01`, `${year}-12-31`)
      .then(res => setLeaves(res.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [locationId, year])

  // Peak leave months
  const monthCounts = MONTHS.map((m, i) => ({
    month: m,
    count: leaves.filter(l => new Date(l.leaveDate).getMonth() === i).length
  }))

  // Top leave-takers — leave has nested employee object: l.employee.id / l.employee.name
  const leaveByEmp = leaves.reduce((acc, l) => {
    const id   = l.employee?.id
    const name = l.employee?.name
    if (!id) return acc
    if (!acc[id]) acc[id] = { name, count: 0 }
    acc[id].count += 1
    return acc
  }, {})
  const topTakers = Object.values(leaveByEmp)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // Leave type breakdown
  const typeMap = leaves.reduce((acc, l) => {
    const t = l.leaveType || 'Unknown'
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {})
  const typeData = Object.entries(typeMap).map(([type, count]) => ({ type, count }))

  const storeName = locations?.find(l => String(l.id) === String(locationId))?.name || ''
  const years = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="page">
      <div className="page-header">
        <h1>Leave Reports</h1>
        <p>Annual leave analysis by store — trends, peak periods and top leave-takers</p>
      </div>

      <div className="controls-bar">
        <div className="control-group">
          <label>Store</label>
          <select value={locationId} onChange={e => setLocationId(e.target.value)} disabled={locLoading}>
            <option value="">— Select a store —</option>
            {locations?.map(l => (
              <option key={l.id} value={l.id}>{l.name} ({l.city})</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label>Year</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {!locationId && <div className="empty-state">👆 Select a store to generate a report</div>}
      {loading && <Spinner />}
      {error && <ErrorMsg message={error} />}

      {locationId && !loading && leaves.length === 0 && !error && (
        <div className="empty-state">No leave data found for {storeName} in {year}.</div>
      )}

      {locationId && !loading && leaves.length > 0 && (
        <>
          {/* Summary stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-value">{leaves.length}</div>
              <div className="stat-label">Total Leave Days</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{Object.keys(leaveByEmp).length}</div>
              <div className="stat-label">Employees on Leave</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {monthCounts.reduce((a, b) => a.count > b.count ? a : b).month}
              </div>
              <div className="stat-label">Peak Month</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {leaves.length && Object.keys(leaveByEmp).length
                  ? (leaves.length / Object.keys(leaveByEmp).length).toFixed(1)
                  : 0}
              </div>
              <div className="stat-label">Avg Days / Employee</div>
            </div>
          </div>

          <div className="reports-grid">
            {/* Monthly trend */}
            <div className="card report-card">
              <h2>Monthly Leave Trend — {year}</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthCounts} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                  <Bar dataKey="count" radius={[4,4,0,0]}>
                    {monthCounts.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Leave type breakdown */}
            <div className="card report-card">
              <h2>Leave Type Breakdown</h2>
              {typeData.length === 0
                ? <div className="empty-state" style={{ padding: '2rem' }}>No type data</div>
                : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={typeData} layout="vertical" margin={{ top: 8, right: 16, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                      <YAxis type="category" dataKey="type" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={90} />
                      <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                      <Bar dataKey="count" radius={[0,4,4,0]}>
                        {typeData.map((_, i) => (
                          <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )
              }
            </div>
          </div>

          {/* Top leave-takers */}
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h2>Top Leave-Takers</h2>
            <div className="top-takers-list">
              {topTakers.map((e, i) => (
                <div key={e.name} className="top-taker-row">
                  <span className="taker-rank">#{i + 1}</span>
                  <span className="taker-name">{e.name}</span>
                  <div className="taker-bar-wrap">
                    <div
                      className="taker-bar-fill"
                      style={{
                        width: `${(e.count / topTakers[0].count) * 100}%`,
                        background: BAR_COLORS[i % BAR_COLORS.length]
                      }}
                    />
                  </div>
                  <span className="taker-count">{e.count} days</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
