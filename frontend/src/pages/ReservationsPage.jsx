import { useEffect, useState } from 'react'
import { getReservations, createReservation, updateReservation, cancelReservation, completeReservation, getRooms, getUsers, extractError } from '../api/client'
import './Page.css'

function toLocalInput(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const EMPTY_FORM = { roomId: '', userId: '', startTime: '', endTime: '', title: '', attendeesCount: '' }

const STATUS_LABELS = { Booked: 'Booked', Completed: 'Completed', Cancelled: 'Cancelled' }
const STATUS_CLASSES = { Booked: 'badge badge-green', Completed: 'badge badge-blue', Cancelled: 'badge badge-gray' }

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([])
  const [rooms, setRooms] = useState([])
  const [users, setUsers] = useState([])
  const [filterRoom, setFilterRoom] = useState('')
  const [filterUser, setFilterUser] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async (rId, uId, status) => {
    const params = {}
    if (rId) params.roomId = rId
    if (uId) params.userId = uId
    if (status) params.status = status
    setReservations(await getReservations(params))
  }

  useEffect(() => {
    Promise.all([getRooms(), getUsers(), load('', '', '')]).then(([r, u]) => {
      setRooms(r); setUsers(u)
    })
  }, [])

  const handleFilter = async (e) => {
    e.preventDefault()
    await load(filterRoom, filterUser, filterStatus)
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
      await load(filterRoom, filterUser, filterStatus)
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
      await load(filterRoom, filterUser, filterStatus)
    } catch (err) {
      setError(extractError(err))
    }
  }

  const handleComplete = async (id) => {
    setError(''); setSuccess('')
    try {
      await completeReservation(id)
      setSuccess('Reservation marked as completed.')
      await load(filterRoom, filterUser, filterStatus)
    } catch (err) {
      setError(extractError(err))
    }
  }

  const fmt = (dt) => dt ? new Date(dt).toLocaleString() : ''

  return (
    <div>
      <h1 className="page-title">Reservations</h1>

      {/* Filter bar */}
      <form className="filter-bar card" onSubmit={handleFilter}>
        <label>Filter by Room
          <select value={filterRoom} onChange={e => { setFilterRoom(e.target.value); setFilterUser('') }}>
            <option value="">All rooms</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <label>Filter by User
          <select value={filterUser} onChange={e => { setFilterUser(e.target.value); setFilterRoom('') }}>
            <option value="">All users</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </label>
        <label>Status
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="Booked">Booked</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </label>
        <button type="submit" className="btn-primary">Filter</button>
        <button type="button" className="btn-secondary" onClick={() => { setFilterRoom(''); setFilterUser(''); setFilterStatus(''); load('','','') }}>Clear</button>
      </form>

      {/* Create / Edit form */}
      <div className="card form-card">
        <h2 className="form-title">{editing ? 'Edit Reservation' : 'New Reservation'}</h2>
        {error && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">{success}</div>}
        <form onSubmit={handleSubmit} className="room-form">
          <label>Room *
            <select value={form.roomId} onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))} required>
              <option value="">Select room</option>
              {rooms.filter(r => r.isActive).map(r => <option key={r.id} value={r.id}>{r.name} (cap. {r.capacity})</option>)}
            </select>
          </label>
          <label>User *
            <select value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} required>
              <option value="">Select user</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label>Start Time *
            <input type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required />
          </label>
          <label>End Time *
            <input type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required />
          </label>
          <label>Meeting Title *
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Sprint Planning" required />
          </label>
          <label>Number of Attendees *
            <input type="number" min="1" value={form.attendeesCount} onChange={e => setForm(f => ({ ...f, attendeesCount: e.target.value }))} placeholder="5" required />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>{editing ? 'Save Changes' : 'Book Room'}</button>
            {editing && <button type="button" className="btn-secondary" onClick={() => { setEditing(null); setForm(EMPTY_FORM) }}>Cancel Edit</button>}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Title</th><th>Room</th><th>User</th><th>Start</th><th>End</th><th>Attendees</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map(r => (
              <tr key={r.id}>
                <td>{r.title}</td>
                <td>{r.roomName}</td>
                <td>{r.userName}</td>
                <td>{fmt(r.startTime)}</td>
                <td>{fmt(r.endTime)}</td>
                <td>{r.attendeesCount}</td>
                <td><span className={STATUS_CLASSES[r.status] || 'badge badge-gray'}>{STATUS_LABELS[r.status] || r.status}</span></td>
                <td className="action-cell">
                  {r.status === 'Booked' && <>
                    <button className="btn-secondary" onClick={() => handleEdit(r)}>Edit</button>
                    <button className="btn-warning" onClick={() => handleComplete(r.id)}>End Early</button>
                    <button className="btn-danger" onClick={() => handleCancel(r.id)}>Cancel</button>
                  </>}
                  {r.status !== 'Booked' && <span style={{color:'#9ca3af',fontSize:'0.8rem'}}>{r.status}</span>}
                </td>
              </tr>
            ))}
            {reservations.length === 0 && <tr><td colSpan="8" style={{textAlign:'center',color:'#9ca3af',padding:'24px'}}>No reservations found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
