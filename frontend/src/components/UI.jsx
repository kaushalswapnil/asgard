export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <div className="spinner" />
    </div>
  )
}

export function ErrorMsg({ message }) {
  return (
    <div style={{
      background: '#fef2f2', border: '1px solid #fca5a5',
      color: '#b91c1c', borderRadius: 8, padding: '1rem', margin: '1rem 0'
    }}>
      ⚠️ {message}
    </div>
  )
}

export function Badge({ label, color = '#3b82f6' }) {
  return (
    <span style={{
      background: color + '22', color, border: `1px solid ${color}55`,
      borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600
    }}>
      {label}
    </span>
  )
}
