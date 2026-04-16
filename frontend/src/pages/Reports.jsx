import { useState, useEffect } from 'react'
import { getLocations, getStoreLeaves } from '../api'
import { useFetch } from '../hooks/useFetch'
import { Spinner, ErrorMsg } from '../components/UI'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer,
  CartesianGrid, Cell, PieChart, Pie, Label
} from 'recharts'
import './Reports.css'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const MONTH_COLORS = [
  '#3b82f6','#818cf8','#06b6d4','#10b981',
  '#34d399','#f59e0b','#ef4444','#ec4899',
  '#f97316','#14b8a6','#a78bfa','#0ea5e9',
]

const TYPE_PALETTE = {
  SICK:    { surface: '#ef4444', depth: '#7f1d1d' },
  CASUAL:  { surface: '#f59e0b', depth: '#78350f' },
  EARNED:  { surface: '#10b981', depth: '#064e3b' },
  UNPAID:  { surface: '#6b7280', depth: '#1f2937' },
}
const FALLBACK_PAL = { surface: '#3b82f6', depth: '#1d4ed8' }

const RANK_COLORS = [
  '#ffd700','#c0c0c0','#cd7f32',
  '#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444',
]

// ── Custom tooltips ──────────────────────────────────────────────────────────
function MonthTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rpt-tooltip">
      <strong className="rpt-tooltip-label">{label}</strong>
      <span className="rpt-tooltip-val">{payload[0].value} days</span>
    </div>
  )
}

function TypeTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { type, count } = payload[0].payload
  const pal = TYPE_PALETTE[type] || FALLBACK_PAL
  return (
    <div className="rpt-tooltip">
      <span className="rpt-tooltip-dot" style={{ background: pal.surface }} />
      <strong className="rpt-tooltip-label">{type}</strong>
      <span className="rpt-tooltip-val">{count} days</span>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
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
      .catch(e  => setError(e.message))
      .finally(() => setLoading(false))
  }, [locationId, year])

  // ── Derived data ────────────────────────────────────────────────────────────
  const monthCounts = MONTHS.map((m, i) => ({
    month: m,
    count: leaves.filter(l => new Date(l.leaveDate).getMonth() === i).length,
  }))

  const leaveByEmp = leaves.reduce((acc, l) => {
    const id = l.employee?.id; const name = l.employee?.name
    if (!id) return acc
    if (!acc[id]) acc[id] = { name, count: 0 }
    acc[id].count += 1
    return acc
  }, {})

  const topTakers = Object.values(leaveByEmp)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const typeMap = leaves.reduce((acc, l) => {
    const t = l.leaveType || 'Unknown'
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {})
  const typeData  = Object.entries(typeMap).map(([type, count]) => ({ type, count, value: count }))
  const typeTotal = typeData.reduce((s, d) => s + d.count, 0)

  const storeName = locations?.find(l => String(l.id) === String(locationId))?.name || ''
  const years     = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i)
  const peakMonth = monthCounts.reduce((a, b) => a.count > b.count ? a : b).month
  const avgDays   = leaves.length && Object.keys(leaveByEmp).length
    ? (leaves.length / Object.keys(leaveByEmp).length).toFixed(1) : '0'

  const kpis = [
    { label: 'Total Leave Days',    value: leaves.length,                  icon: '📅', accent: '#3b82f6' },
    { label: 'Employees on Leave',  value: Object.keys(leaveByEmp).length, icon: '👥', accent: '#8b5cf6' },
    { label: 'Peak Month',          value: peakMonth,                       icon: '📈', accent: '#10b981' },
    { label: 'Avg Days / Employee', value: avgDays,                         icon: '⚡', accent: '#f59e0b' },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <h1>Leave Reports</h1>
        <p>Annual leave analysis for {storeName || 'all stores'} — trends, peak periods &amp; top leave-takers</p>
      </div>

      {/* Controls */}
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
      {loading  && <Spinner />}
      {error    && <ErrorMsg message={error} />}
      {locationId && !loading && leaves.length === 0 && !error && (
        <div className="empty-state">No leave data found for {storeName} in {year}.</div>
      )}

      {locationId && !loading && leaves.length > 0 && (
        <>
          {/* ── KPI strip ─────────────────────────────────────────────────── */}
          <div className="rpt-kpi-row">
            {kpis.map((k, i) => (
              <div key={i} className="rpt-kpi-card">
                <div className="rpt-kpi-glow"  style={{ background: k.accent + '35' }} />
                <div className="rpt-kpi-shine" />
                <div className="rpt-kpi-icon">{k.icon}</div>
                <div className="rpt-kpi-value" style={{ color: k.accent }}>{k.value}</div>
                <div className="rpt-kpi-label">{k.label}</div>
                <div className="rpt-kpi-bar"   style={{ background: `linear-gradient(90deg, ${k.accent}80, ${k.accent})` }} />
              </div>
            ))}
          </div>

          {/* ── Charts row ───────────────────────────────────────────────── */}
          <div className="rpt-charts-row">

            {/* Monthly gradient bars */}
            <div className="rpt-bar-card">
              <div className="rpt-card-header">
                <div>
                  <div className="rpt-card-title">Monthly Leave Trend</div>
                  <div className="rpt-card-sub">{storeName} · {year}</div>
                </div>
                <div className="rpt-card-total">
                  <span className="rpt-total-num">{leaves.length}</span>
                  <span className="rpt-total-lbl">days</span>
                </div>
              </div>

              <div className="rpt-bar-scene">
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={monthCounts} margin={{ top: 14, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      {MONTH_COLORS.map((c, i) => (
                        <linearGradient key={i} id={`mg${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor={c} stopOpacity={1}    />
                          <stop offset="100%" stopColor={c} stopOpacity={0.28} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <ReTooltip content={<MonthTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 4 }} />
                    <Bar dataKey="count" radius={[7,7,0,0]} maxBarSize={38}>
                      {monthCounts.map((_, i) => (
                        <Cell key={i} fill={`url(#mg${i})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3D type donut */}
            <div className="rpt-donut-card">
              <div className="rpt-card-header rpt-donut-header">
                <div>
                  <div className="rpt-card-title">Leave Types</div>
                  <div className="rpt-card-sub">breakdown</div>
                </div>
                <div className="rpt-card-total">
                  <span className="rpt-total-num">{typeTotal}</span>
                  <span className="rpt-total-lbl">days</span>
                </div>
              </div>

              <div className="rpt-donut-scene">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    {/* depth layer */}
                    <Pie data={typeData} cx="50%" cy="54%"
                      innerRadius={58} outerRadius={84}
                      dataKey="value" paddingAngle={4} strokeWidth={0}
                      isAnimationActive={false}>
                      {typeData.map(d => {
                        const p = TYPE_PALETTE[d.type] || FALLBACK_PAL
                        return <Cell key={`d-${d.type}`} fill={p.depth} />
                      })}
                    </Pie>
                    {/* surface layer */}
                    <Pie data={typeData} cx="50%" cy="48%"
                      innerRadius={54} outerRadius={80}
                      dataKey="value" paddingAngle={4} strokeWidth={0}>
                      {typeData.map(d => {
                        const p = TYPE_PALETTE[d.type] || FALLBACK_PAL
                        return <Cell key={`s-${d.type}`} fill={p.surface} />
                      })}
                      <Label
                        content={({ viewBox }) => {
                          const { cx, cy } = viewBox
                          return (
                            <text textAnchor="middle">
                              <tspan x={cx} y={cy - 4}  className="rpt-donut-center-num">{typeData.length}</tspan>
                              <tspan x={cx} y={cy + 14} className="rpt-donut-center-lbl">types</tspan>
                            </text>
                          )
                        }}
                        position="center"
                      />
                    </Pie>
                    <ReTooltip content={<TypeTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="rpt-type-legend">
                {typeData.map(d => {
                  const p   = TYPE_PALETTE[d.type] || FALLBACK_PAL
                  const pct = Math.round((d.count / typeTotal) * 100)
                  return (
                    <div key={d.type} className="rpt-type-row">
                      <span className="rpt-type-dot"   style={{ background: p.surface }} />
                      <span className="rpt-type-name">{d.type}</span>
                      <div className="rpt-type-bar-wrap">
                        <div className="rpt-type-bar" style={{ width: `${pct}%`, background: p.surface }} />
                      </div>
                      <span className="rpt-type-pct"   style={{ color: p.surface }}>{pct}%</span>
                      <span className="rpt-type-count">{d.count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Leaderboard ───────────────────────────────────────────────── */}
          <div className="rpt-leaderboard">
            <div className="rpt-lb-header">
              <div className="rpt-card-title">Top Leave-Takers</div>
              <span className="rpt-lb-badge">{topTakers.length} employees</span>
            </div>

            <div className="rpt-lb-list">
              {topTakers.map((e, i) => {
                const pct      = Math.round((e.count / topTakers[0].count) * 100)
                const color    = RANK_COLORS[i]
                const initials = e.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                const isTop    = i < 3
                return (
                  <div key={e.name}
                    className={`rpt-lb-row${isTop ? ' rpt-lb-row--top' : ''}`}
                    style={{ '--lb-color': color }}>

                    <div className="rpt-lb-rank">
                      <span className="rpt-lb-num" style={ isTop ? { color } : {} }>#{i + 1}</span>
                    </div>

                    <div className="rpt-lb-avatar"
                      style={{ background: color + '22', color, border: `1.5px solid ${color}55` }}>
                      {initials}
                    </div>

                    <div className="rpt-lb-info">
                      <div className="rpt-lb-name">{e.name}</div>
                    </div>

                    <div className="rpt-lb-bar-wrap">
                      <div className="rpt-lb-bar"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}55, ${color})` }} />
                    </div>

                    <div className="rpt-lb-count" style={{ color }}>
                      {e.count}<span> days</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
