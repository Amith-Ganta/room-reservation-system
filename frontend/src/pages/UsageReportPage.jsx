import { useEffect, useState } from 'react'
import { getUsageReport } from '../api/client'

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
    const colorClass = pct < 40 ? 'bg-red-500' : pct < 70 ? 'bg-amber-400' : 'bg-green-500'
    return (
      <div className="flex items-center gap-2 min-w-28">
        <div className="flex-1 h-2 rounded-full bg-gray-200">
          <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${capped}%` }} />
        </div>
        <span className="text-xs tabular-nums text-gray-600 whitespace-nowrap">{pct}%</span>
      </div>
    )
  }

  const labelCls = 'flex flex-col gap-1 text-sm font-medium text-gray-700'
  const inputCls = 'mt-0.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Room Usage Report</h1>
        <p className="mt-1 text-sm text-gray-500">
          Compares scheduled booking hours against actual usage (accounting for early completions).
          Red = under 40%, amber = 40–69%, green = 70%+.
        </p>
      </div>

      <form onSubmit={handleFilter} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-4 items-end">
        <label className={labelCls}>From
          <input type="date" className={inputCls} value={from} onChange={e => setFrom(e.target.value)} />
        </label>
        <label className={labelCls}>To
          <input type="date" className={inputCls} value={to} onChange={e => setTo(e.target.value)} />
        </label>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">Filter</button>
          <button type="button" className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => { setFrom(''); setTo(''); load('', '') }}>
            Clear
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="py-8 text-center text-sm text-gray-400">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Room', 'Capacity', 'Total Bookings', 'Completed', 'Cancelled', 'Scheduled h', 'Actual h', 'Utilisation'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(r => (
                  <tr key={r.roomId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.roomName}</td>
                    <td className="px-4 py-3 text-gray-600 tabular-nums">{r.capacity}</td>
                    <td className="px-4 py-3 text-gray-600 tabular-nums">{r.totalBookings}</td>
                    <td className="px-4 py-3 text-gray-600 tabular-nums">{r.completedBookings}</td>
                    <td className="px-4 py-3 text-gray-600 tabular-nums">{r.cancelledBookings}</td>
                    <td className="px-4 py-3 text-gray-600 tabular-nums">{r.totalScheduledHours}</td>
                    <td className="px-4 py-3 text-gray-600 tabular-nums">{r.totalActualHours}</td>
                    <td className="px-4 py-3">{bar(r.utilisationPct)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-400">No data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
