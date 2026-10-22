import { useEffect, useState } from 'react'
import { getReservations, createReservation, updateReservation, cancelReservation, completeReservation, getRooms, getUsers, extractError } from '../api/client'

function toLocalInput(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const EMPTY_FORM = { roomId: '', userId: '', startTime: '', endTime: '', title: '', attendeesCount: '' }

const STATUS_BADGE = {
  Booked:    'bg-green-100 text-green-800',
  Completed: 'bg-blue-100 text-blue-800',
  Cancelled: 'bg-gray-100 text-gray-500',
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([])
  const [rooms, setRooms] = useState([])
  const [users, setUsers] = useState([])
  const [filterRoom, setFilterRoom] = useState('')
  const [filterUser, setFilterUser] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async (rId, uId, status, from, to) => {
    const params = {}
    if (rId) params.roomId = rId
    if (uId) params.userId = uId
    if (status) params.status = status
    if (from) params.from = new Date(from).toISOString()
    if (to) params.to = new Date(to).toISOString()
    setReservations(await getReservations(params))
  }

  useEffect(() => {
    Promise.all([getRooms(), getUsers(), load('', '', '', '', '')]).then(([r, u]) => {
      setRooms(r); setUsers(u)
    })
  }, [])

  const handleFilter = async (e) => {
    e.preventDefault()
    await load(filterRoom, filterUser, filterStatus, filterFrom, filterTo)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)
    try {
      const payload = {
        roomId: Number(form.roomId),
        userId: Number(form.userId),
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        title: form.title,
        attendeesCount: Number(form.attendeesCount),
      }
      if (editing) {
        await updateReservation(editing, payload)
        setSuccess('Reservation updated.')
      } else {
        await createReservation(payload)
        setSuccess('Reservation created.')
      }
      setForm(EMPTY_FORM); setEditing(null)
      await load(filterRoom, filterUser, filterStatus, filterFrom, filterTo)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (r) => {
    setEditing(r.id)
    setForm({
      roomId: r.roomId, userId: r.userId,
      startTime: toLocalInput(r.startTime), endTime: toLocalInput(r.endTime),
      title: r.title, attendeesCount: r.attendeesCount
    })
    setError(''); setSuccess('')
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return
    setError(''); setSuccess('')
    try {
      await cancelReservation(id)
      setSuccess('Reservation cancelled.')
      await load(filterRoom, filterUser, filterStatus, filterFrom, filterTo)
    } catch (err) {
      setError(extractError(err))
    }
  }

  const handleComplete = async (id) => {
    setError(''); setSuccess('')
    try {
      await completeReservation(id)
      setSuccess('Reservation marked as completed.')
      await load(filterRoom, filterUser, filterStatus, filterFrom, filterTo)
    } catch (err) {
      setError(extractError(err))
    }
  }

  const fmt = (dt) => dt ? new Date(dt).toLocaleString() : ''

  const labelCls = 'flex flex-col gap-1 text-sm font-medium text-gray-700'
  const inputCls = 'mt-0.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-gray-800">Reservations</h1>

      {/* Filter bar */}
      <form onSubmit={handleFilter} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-4 items-end">
        <label className={labelCls}>Filter by Room
          <select className={inputCls} value={filterRoom} onChange={e => { setFilterRoom(e.target.value); setFilterUser('') }}>
            <option value="">All rooms</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <label className={labelCls}>Filter by User
          <select className={inputCls} value={filterUser} onChange={e => { setFilterUser(e.target.value); setFilterRoom('') }}>
            <option value="">All users</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </label>
        <label className={labelCls}>Status
          <select className={inputCls} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="Booked">Booked</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </label>
        <label className={labelCls}>From
          <input type="date" className={inputCls} value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
        </label>
        <label className={labelCls}>To
          <input type="date" className={inputCls} value={filterTo} onChange={e => setFilterTo(e.target.value)} />
        </label>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">Filter</button>
          <button type="button" className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => { setFilterRoom(''); setFilterUser(''); setFilterStatus(''); setFilterFrom(''); setFilterTo(''); load('','','','','') }}>
            Clear
          </button>
        </div>
      </form>

      {/* Create / Edit form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{editing ? 'Edit Reservation' : 'New Reservation'}</h2>
        {error && <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</div>}
        {success && <div className="mb-3 rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">{success}</div>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className={labelCls}>Room *
            <select className={inputCls} value={form.roomId} onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))} required>
              <option value="">Select room</option>
              {rooms.filter(r => r.isActive).map(r => <option key={r.id} value={r.id}>{r.name} (cap. {r.capacity})</option>)}
            </select>
          </label>
          <label className={labelCls}>User *
            <select className={inputCls} value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} required>
              <option value="">Select user</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label className={labelCls}>Start Time *
            <input type="datetime-local" className={inputCls} value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required />
          </label>
          <label className={labelCls}>End Time *
            <input type="datetime-local" className={inputCls} value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required />
          </label>
          <label className={labelCls}>Meeting Title *
            <input className={inputCls} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Sprint Planning" required />
          </label>
          <label className={labelCls}>Number of Attendees *
            <input type="number" min="1" className={inputCls} value={form.attendeesCount} onChange={e => setForm(f => ({ ...f, attendeesCount: e.target.value }))} placeholder="5" required />
          </label>
          <div className="sm:col-span-2 lg:col-span-3 flex gap-2 pt-1">
            <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50" disabled={loading}>
              {editing ? 'Save Changes' : 'Book Room'}
            </button>
            {editing && (
              <button type="button" className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => { setEditing(null); setForm(EMPTY_FORM) }}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Title', 'Room', 'User', 'Start', 'End', 'Attendees', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reservations.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.title}</td>
                  <td className="px-4 py-3 text-gray-600">{r.roomName}</td>
                  <td className="px-4 py-3 text-gray-600">{r.userName}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmt(r.startTime)}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmt(r.endTime)}</td>
                  <td className="px-4 py-3 text-gray-600">{r.attendeesCount}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[r.status] || 'bg-gray-100 text-gray-500'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'Booked' ? (
                      <div className="flex gap-1.5">
                        <button className="px-2.5 py-1 rounded border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50" onClick={() => handleEdit(r)}>Edit</button>
                        <button className="px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700 hover:bg-amber-100" onClick={() => handleComplete(r.id)}>End Early</button>
                        <button className="px-2.5 py-1 rounded bg-red-50 border border-red-200 text-xs font-medium text-red-700 hover:bg-red-100" onClick={() => handleCancel(r.id)}>Cancel</button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">{r.status}</span>
                    )}
                  </td>
                </tr>
              ))}
              {reservations.length === 0 && (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-400">No reservations found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
