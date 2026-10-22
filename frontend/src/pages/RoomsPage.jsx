import { useEffect, useState } from 'react'
import { getRooms, createRoom, updateRoom, deleteRoom, extractError } from '../api/client'

const EMPTY_FORM = {
  name: '', capacity: '', location: '',
  hasProjector: false, hasWhiteboard: false,
  hasTVScreen: false, hasVideoConferencing: false,
  isActive: true
}

function Badge({ on }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${on ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
      {on ? 'Yes' : 'No'}
    </span>
  )
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

  const labelCls = 'flex flex-col gap-1 text-sm font-medium text-gray-700'
  const inputCls = 'mt-0.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
  const selectCls = inputCls

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-gray-800">Rooms</h1>

      {/* Filter bar */}
      <form onSubmit={handleFilter} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-4 items-end">
        <label className={labelCls}>Min capacity
          <input type="number" min="1" className={inputCls} value={filters.minCapacity}
            onChange={e => setFilters(f => ({ ...f, minCapacity: e.target.value }))} placeholder="Any" />
        </label>
        <label className={labelCls}>Floor
          <input className={inputCls} value={filters.floor}
            onChange={e => setFilters(f => ({ ...f, floor: e.target.value }))} placeholder="e.g. Floor 1" />
        </label>
        <label className={labelCls}>Projector
          <select className={selectCls} value={filters.hasProjector} onChange={e => setFilters(f => ({ ...f, hasProjector: e.target.value }))}>
            <option value="">Any</option><option value="true">Yes</option><option value="false">No</option>
          </select>
        </label>
        <label className={labelCls}>Whiteboard
          <select className={selectCls} value={filters.hasWhiteboard} onChange={e => setFilters(f => ({ ...f, hasWhiteboard: e.target.value }))}>
            <option value="">Any</option><option value="true">Yes</option><option value="false">No</option>
          </select>
        </label>
        <label className={labelCls}>TV Screen
          <select className={selectCls} value={filters.hasTVScreen} onChange={e => setFilters(f => ({ ...f, hasTVScreen: e.target.value }))}>
            <option value="">Any</option><option value="true">Yes</option><option value="false">No</option>
          </select>
        </label>
        <label className={labelCls}>Video Conf.
          <select className={selectCls} value={filters.hasVideoConferencing} onChange={e => setFilters(f => ({ ...f, hasVideoConferencing: e.target.value }))}>
            <option value="">Any</option><option value="true">Yes</option><option value="false">No</option>
          </select>
        </label>
        <label className={labelCls}>Active
          <select className={selectCls} value={filters.isActive} onChange={e => setFilters(f => ({ ...f, isActive: e.target.value }))}>
            <option value="">Any</option><option value="true">Active only</option><option value="false">Inactive only</option>
          </select>
        </label>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">Filter</button>
          <button type="button" className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => { setFilters({ minCapacity: '', hasProjector: '', hasWhiteboard: '', hasTVScreen: '', hasVideoConferencing: '', isActive: '', floor: '' }); load() }}>
            Clear
          </button>
        </div>
      </form>

      {/* Create / Edit form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{editing ? 'Edit Room' : 'Add New Room'}</h2>
        {error && <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</div>}
        {success && <div className="mb-3 rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">{success}</div>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className={labelCls}>Room Name *
            <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Conference Room A" required />
          </label>
          <label className={labelCls}>Capacity *
            <input type="number" min="1" className={inputCls} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} placeholder="10" required />
          </label>
          <label className={labelCls}>Location *
            <input className={inputCls} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Floor 1" required />
          </label>
          <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap gap-5">
            {[
              ['hasProjector', 'Has Projector'],
              ['hasWhiteboard', 'Has Whiteboard'],
              ['hasTVScreen', 'Has TV Screen'],
              ['hasVideoConferencing', 'Has Video Conferencing'],
              ['isActive', 'Active (available for booking)'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 accent-indigo-600"
                  checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
                {label}
              </label>
            ))}
          </div>
          <div className="sm:col-span-2 lg:col-span-3 flex gap-2 pt-1">
            <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50" disabled={loading}>
              {editing ? 'Save Changes' : 'Add Room'}
            </button>
            {editing && (
              <button type="button" className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => { setEditing(null); setForm(EMPTY_FORM) }}>
                Cancel
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
                {['Name', 'Cap.', 'Location', 'Projector', 'Whiteboard', 'TV Screen', 'Video Conf.', 'Active', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rooms.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                  <td className="px-4 py-3 text-gray-600">{r.capacity}</td>
                  <td className="px-4 py-3 text-gray-600">{r.location}</td>
                  <td className="px-4 py-3"><Badge on={r.hasProjector} /></td>
                  <td className="px-4 py-3"><Badge on={r.hasWhiteboard} /></td>
                  <td className="px-4 py-3"><Badge on={r.hasTVScreen} /></td>
                  <td className="px-4 py-3"><Badge on={r.hasVideoConferencing} /></td>
                  <td className="px-4 py-3"><Badge on={r.isActive} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 rounded border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50" onClick={() => handleEdit(r)}>Edit</button>
                      <button className="px-3 py-1 rounded bg-red-50 border border-red-200 text-xs font-medium text-red-700 hover:bg-red-100" onClick={() => handleDelete(r.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {rooms.length === 0 && (
                <tr><td colSpan="9" className="px-4 py-8 text-center text-gray-400">No rooms found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
