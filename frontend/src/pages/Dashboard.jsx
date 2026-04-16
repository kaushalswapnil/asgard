import { useFetch } from '../hooks/useFetch'
import { getLocations } from '../api'
import { Spinner, ErrorMsg } from '../components/UI'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts'
import './Dashboard.css'

const REGION_COLORS = {
  England:          '#3b82f6',
  Scotland:         '#8b5cf6',
  Wales:            '#10b981',
  'Northern Ireland': '#f59e0b',
}

// Darker shades for the extrusion / depth layer
const REGION_DEPTH = {
  England:          '#1d4ed8',
  Scotland:         '#5b21b6',
  Wales:            '#065f46',
  'Northern Ireland': '#92400e',
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { region, count, pct } = payload[0].payload
  return (
    <div className="donut-tooltip">
      <span className="donut-tooltip-dot" style={{ background: REGION_COLORS[region] }} />
      <strong className="donut-tooltip-region">{region}</strong>
      <span className="donut-tooltip-count">{count} store{count !== 1 ? 's' : ''} · {pct}%</span>
    </div>
  )
}

export default function Dashboard() {
  const { data: locations, loading, error } = useFetch(getLocations, [])
  const navigate = useNavigate()

  if (loading) return <Spinner />
  if (error)   return <ErrorMsg message={error} />

  const byRegion  = locations.reduce((acc, loc) => {
    acc[loc.region] = (acc[loc.region] || 0) + 1
    return acc
  }, {})
  const total     = locations.length
  const chartData = Object.entries(byRegion).map(([region, count]) => ({
    region,
    count,
    pct: Math.round((count / total) * 100),
  }))

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of all EBP stores across the UK</p>
      </div>

      <div className="dashboard-grid">

        {/* ── 3D Donut card ── */}
        <div className="donut-card">
          <div className="donut-card-header">
            <div>
              <div className="donut-card-title">Stores by Region</div>
              <div className="donut-card-sub">UK retail network</div>
            </div>
            <div className="donut-card-total">
              <span className="donut-total-num">{total}</span>
              <span className="donut-total-lbl">stores</span>
            </div>
          </div>

          {/* 3D perspective scene */}
          <div className="donut-3d-scene">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                {/* Depth / extrusion layer — shifted down, darker fill */}
                <Pie
                  data={chartData}
                  cx="50%" cy="54%"
                  innerRadius={104} outerRadius={152}
                  dataKey="count" paddingAngle={3} strokeWidth={0}
                  isAnimationActive={false}
                >
                  {chartData.map(e => (
                    <Cell key={`d-${e.region}`} fill={REGION_DEPTH[e.region] || '#334155'} />
                  ))}
                </Pie>

                {/* Surface layer — on top */}
                <Pie
                  data={chartData}
                  cx="50%" cy="48%"
                  innerRadius={100} outerRadius={148}
                  dataKey="count" paddingAngle={3} strokeWidth={0}
                >
                  {chartData.map(e => (
                    <Cell key={`s-${e.region}`} fill={REGION_COLORS[e.region] || '#94a3b8'} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      const { cx, cy } = viewBox
                      return (
                        <text textAnchor="middle">
                          <tspan x={cx} y={cy - 6}  className="donut-center-total">{total}</tspan>
                          <tspan x={cx} y={cy + 20} className="donut-center-label">stores</tspan>
                        </text>
                      )
                    }}
                    position="center"
                  />
                </Pie>

                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend with percentage bars */}
          <div className="donut-legend">
            {chartData.map(({ region, count, pct }) => (
              <div key={region} className="donut-legend-item">
                <div className="donut-legend-left">
                  <span className="donut-legend-dot" style={{ background: REGION_COLORS[region] }} />
                  <span className="donut-legend-region">{region}</span>
                </div>
                <div className="donut-legend-bar-wrap">
                  <div
                    className="donut-legend-bar"
                    style={{ width: `${pct}%`, background: REGION_COLORS[region] }}
                  />
                </div>
                <div className="donut-legend-right">
                  <span className="donut-legend-pct">{pct}%</span>
                  <span className="donut-legend-count">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Store list card ── */}
        <div className="stores-card">
          <div className="stores-card-header">
            <span className="stores-card-title">All Stores</span>
            <span className="stores-card-badge">{total}</span>
          </div>
          <div className="store-list">
            {locations.map(loc => (
              <div
                key={loc.id}
                className="store-row"
                onClick={() => navigate(`/store?id=${loc.id}`)}
              >
                <div
                  className="store-row-accent"
                  style={{ background: REGION_COLORS[loc.region] }}
                />
                <div className="store-row-body">
                  <div className="store-name">{loc.name}</div>
                  <div className="store-meta">{loc.city}</div>
                </div>
                <span
                  className="region-badge"
                  style={{
                    background: REGION_COLORS[loc.region] + '20',
                    color: REGION_COLORS[loc.region],
                    borderColor: REGION_COLORS[loc.region] + '40',
                  }}
                >
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
