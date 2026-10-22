import { useEffect, useState } from 'react'
import { getUsageReport } from '../api/client'
import './Page.css'

export default function UsageReportPage() {
  const [rows, setRows] = useState([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async (f, t) => {
    setLoading(true)
    const params = {}
    if (f) params.from = new Date(f).toISOString()
    if (t) params.to = new Date(t).toISOString()
    try {
      setRows(await getUsageReport(params))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load('', '') }, [])

  const handleFilter = (e) => {
    e.preventDefault()
    load(from, to)
  }

  const bar = (pct) => {
    const capped = Math.min(pct, 100)
    const color = pct < 40 ? '#ef4444' : pct < 70 ? '#f59e0b' : '#22c55e'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
        <div style={{ flex: 1, background: '#e5e7eb', borderRadius: 4, height: 8 }}>
          <div style={{ width: `${capped}%`, background: color, height: 8, borderRadius: 4 }} />
        </div>
        <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{pct}%</span>
      </div>
    )
  }

  return (
    <div>
      <h1 className="page-title">Room Usage Report</h1>
      <p style={{ marginBottom: 16, color: '#6b7280', fontSize: '0.9rem' }}>
        Compares scheduled booking hours against actual usage (accounting for early completions).
        Red = under 40%, amber = 40-69%, green = 70%+.
      </p>

      <form className="filter-bar card" onSubmit={handleFilter}>
        <label>From
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </label>
        <label>To
          <input type="date" value={to} onChange={e => setTo(e.target.value)} />
        </label>
        <button type="submit" className="btn-primary">Filter</button>
        <button type="button" className="btn-secondary" onClick={() => { setFrom(''); setTo(''); load('', '') }}>Clear</button>
      </form>

      <div className="card table-card">
        {loading ? (
          <p style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>Loading...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Room</th>
                <th>Capacity</th>
                <th>Total Bookings</th>
                <th>Completed</th>
                <th>Cancelled</th>
                <th>Scheduled h</th>
                <th>Actual h</th>
                <th>Utilisation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.roomId}>
                  <td><strong>{r.roomName}</strong></td>
                  <td>{r.capacity}</td>
                  <td>{r.totalBookings}</td>
                  <td>{r.completedBookings}</td>
                  <td>{r.cancelledBookings}</td>
                  <td>{r.totalScheduledHours}</td>
                  <td>{r.totalActualHours}</td>
                  <td>{bar(r.utilisationPct)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>
                    No data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
