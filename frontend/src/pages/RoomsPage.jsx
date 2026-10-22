import { useEffect, useState } from 'react'
import { getRooms, createRoom, updateRoom, deleteRoom, extractError } from '../api/client'
import './Page.css'

const EMPTY_FORM = {
  name: '', capacity: '', location: '',
  hasProjector: false, hasWhiteboard: false,
  hasTVScreen: false, hasVideoConferencing: false,
  isActive: true
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState([])
  const [filters, setFilters] = useState({ minCapacity: '', hasProjector: '', hasWhiteboard: '', hasTVScreen: '', hasVideoConferencing: '', isActive: '', floor: '' })
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const params = {}
    if (filters.minCapacity) params.minCapacity = filters.minCapacity
    if (filters.hasProjector !== '') params.hasProjector = filters.hasProjector
    if (filters.hasWhiteboard !== '') params.hasWhiteboard = filters.hasWhiteboard
    if (filters.hasTVScreen !== '') params.hasTVScreen = filters.hasTVScreen
    if (filters.hasVideoConferencing !== '') params.hasVideoConferencing = filters.hasVideoConferencing
    if (filters.isActive !== '') params.isActive = filters.isActive
    if (filters.floor) params.floor = filters.floor
    setRooms(await getRooms(params))
  }

  useEffect(() => { load() }, [])

  const handleFilter = async (e) => {
    e.preventDefault()
    await load()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)
    try {
      const payload = {
        name: form.name,
        capacity: Number(form.capacity),
        location: form.location,
        hasProjector: form.hasProjector,
        hasWhiteboard: form.hasWhiteboard,
        hasTVScreen: form.hasTVScreen,
        hasVideoConferencing: form.hasVideoConferencing,
        isActive: form.isActive,
      }
      if (editing) {
        await updateRoom(editing, payload)
        setSuccess('Room updated.')
      } else {
        await createRoom(payload)
        setSuccess('Room created.')
      }
      setForm(EMPTY_FORM); setEditing(null); await load()
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (room) => {
    setEditing(room.id)
    setForm({
      name: room.name, capacity: room.capacity, location: room.location,
      hasProjector: room.hasProjector, hasWhiteboard: room.hasWhiteboard,
      hasTVScreen: room.hasTVScreen, hasVideoConferencing: room.hasVideoConferencing,
      isActive: room.isActive
    })
    setError(''); setSuccess('')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this room and all its reservations?')) return
    setError(''); setSuccess('')
    try {
      await deleteRoom(id)
      setSuccess('Room deleted.')
      await load()
    } catch (err) {
      setError(extractError(err))
    }
  }

  const yn = (val) => (
    <span className={val ? 'badge badge-green' : 'badge badge-gray'}>{val ? 'Yes' : 'No'}</span>
  )

  return (
    <div>
      <h1 className="page-title">Rooms</h1>

      {/* Filter bar */}
      <form className="filter-bar card" onSubmit={handleFilter}>
        <label>Min capacity
          <input type="number" min="1" value={filters.minCapacity}
            onChange={e => setFilters(f => ({ ...f, minCapacity: e.target.value }))} placeholder="Any" />
        </label>
        <label>Floor
          <input value={filters.floor}
            onChange={e => setFilters(f => ({ ...f, floor: e.target.value }))} placeholder="e.g. Floor 1" />
        </label>
        <label>Projector
          <select value={filters.hasProjector} onChange={e => setFilters(f => ({ ...f, hasProjector: e.target.value }))}>
            <option value="">Any</option><option value="true">Yes</option><option value="false">No</option>
          </select>
        </label>
        <label>Whiteboard
          <select value={filters.hasWhiteboard} onChange={e => setFilters(f => ({ ...f, hasWhiteboard: e.target.value }))}>
            <option value="">Any</option><option value="true">Yes</option><option value="false">No</option>
          </select>
        </label>
        <label>TV Screen
          <select value={filters.hasTVScreen} onChange={e => setFilters(f => ({ ...f, hasTVScreen: e.target.value }))}>
            <option value="">Any</option><option value="true">Yes</option><option value="false">No</option>
          </select>
        </label>
        <label>Video Conf.
          <select value={filters.hasVideoConferencing} onChange={e => setFilters(f => ({ ...f, hasVideoConferencing: e.target.value }))}>
            <option value="">Any</option><option value="true">Yes</option><option value="false">No</option>
          </select>
        </label>
        <label>Active
          <select value={filters.isActive} onChange={e => setFilters(f => ({ ...f, isActive: e.target.value }))}>
            <option value="">Any</option><option value="true">Active only</option><option value="false">Inactive only</option>
          </select>
        </label>
        <button type="submit" className="btn-primary">Filter</button>
        <button type="button" className="btn-secondary" onClick={() => { setFilters({ minCapacity: '', hasProjector: '', hasWhiteboard: '', hasTVScreen: '', hasVideoConferencing: '', isActive: '', floor: '' }); load() }}>Clear</button>
      </form>

      {/* Create / Edit form */}
      <div className="card form-card">
        <h2 className="form-title">{editing ? 'Edit Room' : 'Add New Room'}</h2>
        {error && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">{success}</div>}
        <form onSubmit={handleSubmit} className="room-form">
          <label>Room Name *
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Conference Room A" required />
          </label>
          <label>Capacity *
            <input type="number" min="1" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} placeholder="10" required />
          </label>
          <label>Location *
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Floor 1" required />
          </label>
          <div className="checkboxes">
            <label className="checkbox-label">
              <input type="checkbox" checked={form.hasProjector} onChange={e => setForm(f => ({ ...f, hasProjector: e.target.checked }))} />
              Has Projector
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={form.hasWhiteboard} onChange={e => setForm(f => ({ ...f, hasWhiteboard: e.target.checked }))} />
              Has Whiteboard
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={form.hasTVScreen} onChange={e => setForm(f => ({ ...f, hasTVScreen: e.target.checked }))} />
              Has TV Screen
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={form.hasVideoConferencing} onChange={e => setForm(f => ({ ...f, hasVideoConferencing: e.target.checked }))} />
              Has Video Conferencing
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              Active (available for booking)
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>{editing ? 'Save Changes' : 'Add Room'}</button>
            {editing && <button type="button" className="btn-secondary" onClick={() => { setEditing(null); setForm(EMPTY_FORM) }}>Cancel</button>}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Cap.</th><th>Location</th><th>Projector</th><th>Whiteboard</th><th>TV Screen</th><th>Video Conf.</th><th>Active</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(r => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.capacity}</td>
                <td>{r.location}</td>
                <td>{yn(r.hasProjector)}</td>
                <td>{yn(r.hasWhiteboard)}</td>
                <td>{yn(r.hasTVScreen)}</td>
                <td>{yn(r.hasVideoConferencing)}</td>
                <td>{yn(r.isActive)}</td>
                <td className="action-cell">
                  <button className="btn-secondary" onClick={() => handleEdit(r)}>Edit</button>
                  <button className="btn-danger" onClick={() => handleDelete(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {rooms.length === 0 && <tr><td colSpan="9" style={{textAlign:'center',color:'#9ca3af',padding:'24px'}}>No rooms found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
