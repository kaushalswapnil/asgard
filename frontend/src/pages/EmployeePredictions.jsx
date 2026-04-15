import { useState, useEffect } from 'react'
import { getLocations, getEmployees, predictEmployee, getEmployeeLeaves, getEmployeeHalfLeaves } from '../api'
import { useFetch } from '../hooks/useFetch'
import { Spinner, ErrorMsg, Badge } from '../components/UI'
import PredictionCard from '../components/PredictionCard'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import './EmployeePredictions.css'

const LEAVE_COLORS = { SICK: '#ef4444', CASUAL: '#f59e0b', EARNED: '#10b981', UNPAID: '#6b7280' }

export default function EmployeePredictions() {
  const [locationId, setLocationId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [days, setDays] = useState(60)
  const [prediction, setPrediction] = useState(null)
  const [leaveHistory, setLeaveHistory] = useState([])
  const [halfLeaves, setHalfLeaves] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { data: locations } = useFetch(getLocations, [])

  const [employees, setEmployees] = useState([])
  const [empLoading, setEmpLoading] = useState(false)

  useEffect(() => {
    if (!locationId) { setEmployees([]); return }
    setEmpLoading(true)
    getEmployees(locationId)
      .then(res => setEmployees(res.data))
      .catch(() => setEmployees([]))
      .finally(() => setEmpLoading(false))
  }, [locationId])

  const handlePredict = () => {
    if (!employeeId) return
    setLoading(true)
    setError(null)
    Promise.all([
      predictEmployee(employeeId, days),
      getEmployeeLeaves(employeeId),
      getEmployeeHalfLeaves(employeeId)
    ])
      .then(([predRes, leavesRes, halfRes]) => {
        setPrediction(predRes.data)
        setLeaveHistory(leavesRes.data)
        setHalfLeaves(halfRes.data)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  // Aggregate leave history by month for chart
  const monthlyData = leaveHistory.reduce((acc, l) => {
    const month = l.leaveDate?.slice(0, 7)
    if (!month) return acc
    const existing = acc.find(a => a.month === month)
    if (existing) existing[l.leaveType] = (existing[l.leaveType] || 0) + 1
    else acc.push({ month, [l.leaveType]: 1 })
    return acc
  }, []).sort((a, b) => a.month.localeCompare(b.month)).slice(-12)

  const selectedEmployee = employees.find(e => String(e.id) === String(employeeId))

  return (
    <div className="page">
      <div className="page-header">
        <h1>Employee Leave Predictions</h1>
        <p>Predict upcoming leave for an individual employee based on their history</p>
      </div>

      <div className="controls-bar">
        <div className="control-group">
          <label>Store</label>
          <select value={locationId} onChange={e => { setLocationId(e.target.value); setEmployeeId('') }}>
            <option value="">— Select store —</option>
            {locations?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div className="control-group">
          <label>Employee</label>
          <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} disabled={!locationId || empLoading}>
            <option value="">{empLoading ? 'Loading…' : '— Select employee —'}</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
          </select>
        </div>
        <div className="control-group">
          <label>Window (days)</label>
          <select value={days} onChange={e => setDays(Number(e.target.value))}>
            {[30, 60, 90].map(d => <option key={d} value={d}>{d} days</option>)}
          </select>
        </div>
        <div className="control-group control-action">
          <label>&nbsp;</label>
          <button className="btn-predict" onClick={handlePredict} disabled={!employeeId || loading}>
            {loading ? 'Predicting…' : '🔮 Predict'}
          </button>
        </div>
      </div>

      {error && <ErrorMsg message={error} />}
      {loading && <Spinner />}

      {!loading && prediction !== null && (
        <div className="emp-layout">
          {/* Left: employee info + prediction */}
          <div className="emp-left">
            {selectedEmployee && (
              <div className="card emp-profile">
                <div className="emp-avatar">{selectedEmployee.name.charAt(0)}</div>
                <div>
                  <div className="emp-name">{selectedEmployee.name}</div>
                  <div className="emp-role">{selectedEmployee.role}</div>
                  <div className="emp-meta">
                    <Badge label={`${leaveHistory.length} full-day leaves`} color="#3b82f6" />
                    <Badge label={`${halfLeaves.length} half-day leaves`} color="#8b5cf6" />
                  </div>
                </div>
              </div>
            )}

            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: '1.25rem 0 0.75rem' }}>
              Prediction
            </h2>
            {prediction.length === 0 ? (
              <div className="empty-state">No strong leave signal detected in this window.</div>
            ) : (
              prediction.map(p => <PredictionCard key={p.employeeId} prediction={p} />)
            )}

            {halfLeaves.length > 0 && (
              <div className="card" style={{ marginTop: '1.25rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.75rem' }}>
                  Half-Day Leave History
                </h2>
                <div className="half-list">
                  {halfLeaves.slice(0, 8).map(h => (
                    <div key={h.id} className="half-row">
                      <span>{h.leaveDate}</span>
                      <Badge label={h.half} color="#8b5cf6" />
                      <Badge label={h.leaveType} color={LEAVE_COLORS[h.leaveType]} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: leave history chart */}
          <div className="emp-right">
            <div className="card">
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 1rem' }}>
                Leave History (last 12 months)
              </h2>
              {monthlyData.length === 0 ? (
                <div className="empty-state" style={{ padding: '1.5rem' }}>No history data</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    {['SICK', 'CASUAL', 'EARNED', 'UNPAID'].map(type => (
                      <Bar key={type} dataKey={type} stackId="a" fill={LEAVE_COLORS[type]} radius={type === 'UNPAID' ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card" style={{ marginTop: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.75rem' }}>
                Recent Full-Day Leaves
              </h2>
              <div className="leave-table">
                <div className="leave-table-header">
                  <span>Date</span><span>Type</span><span>Status</span>
                </div>
                {leaveHistory.slice(0, 10).map(l => (
                  <div key={l.id} className="leave-table-row">
                    <span>{l.leaveDate}</span>
                    <Badge label={l.leaveType} color={LEAVE_COLORS[l.leaveType]} />
                    <Badge label={l.status} color={l.status === 'APPROVED' ? '#10b981' : '#f59e0b'} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && prediction === null && !error && (
        <div className="empty-state">👆 Select a store and employee, then click Predict</div>
      )}
    </div>
  )
}
