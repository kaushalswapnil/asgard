import { useFetch } from '../hooks/useFetch'
import { getLocations } from '../api'
import { Spinner, ErrorMsg } from '../components/UI'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import './Dashboard.css'

const REGION_COLORS = { England: '#3b82f6', Scotland: '#8b5cf6', Wales: '#10b981', 'Northern Ireland': '#f59e0b' }

export default function Dashboard() {
  const { data: locations, loading, error } = useFetch(getLocations, [])
  const navigate = useNavigate()

  if (loading) return <Spinner />
  if (error) return <ErrorMsg message={error} />

  const byRegion = locations.reduce((acc, loc) => {
    acc[loc.region] = (acc[loc.region] || 0) + 1
    return acc
  }, {})

  const chartData = Object.entries(byRegion).map(([region, count]) => ({ region, count }))

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of all EBP stores across the UK</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{locations.length}</div>
          <div className="stat-label">Total Stores</div>
        </div>
        {Object.entries(byRegion).map(([region, count]) => (
          <div className="stat-card" key={region} style={{ borderTop: `3px solid ${REGION_COLORS[region]}` }}>
            <div className="stat-value" style={{ color: REGION_COLORS[region] }}>{count}</div>
            <div className="stat-label">{region}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2>Stores by Region</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="region" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.region} fill={REGION_COLORS[entry.region] || '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2>All Stores</h2>
          <div className="store-list">
            {locations.map(loc => (
              <div key={loc.id} className="store-row" onClick={() => navigate(`/store?id=${loc.id}`)}>
                <div>
                  <div className="store-name">{loc.name}</div>
                  <div className="store-meta">{loc.city}</div>
                </div>
                <span className="region-badge" style={{ background: REGION_COLORS[loc.region] + '22', color: REGION_COLORS[loc.region] }}>
                  {loc.region}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
