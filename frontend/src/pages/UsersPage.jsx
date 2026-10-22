import { useEffect, useState } from 'react'
import { getUsers, createUser, updateUser, deleteUser, extractError } from '../api/client'

const EMPTY_FORM = { name: '', email: '' }

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => setUsers(await getUsers())
  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)
    try {
      if (editing) {
        await updateUser(editing, form)
        setSuccess('User updated.')
      } else {
        await createUser(form)
        setSuccess('User created.')
      }
      setForm(EMPTY_FORM); setEditing(null); await load()
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (u) => {
    setEditing(u.id)
    setForm({ name: u.name, email: u.email })
    setError(''); setSuccess('')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user and all their reservations?')) return
    setError(''); setSuccess('')
    try {
      await deleteUser(id)
      setSuccess('User deleted.')
      await load()
    } catch (err) {
      setError(extractError(err))
    }
  }

  const labelCls = 'flex flex-col gap-1 text-sm font-medium text-gray-700'
  const inputCls = 'mt-0.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-gray-800">Users</h1>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{editing ? 'Edit User' : 'Add New User'}</h2>
        {error && <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</div>}
        {success && <div className="mb-3 rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">{success}</div>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className={labelCls}>Full Name *
            <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Alice Johnson" required />
          </label>
          <label className={labelCls}>Email *
            <input type="email" className={inputCls} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="alice@example.com" required />
          </label>
          <div className="sm:col-span-2 flex gap-2 pt-1">
            <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50" disabled={loading}>
              {editing ? 'Save Changes' : 'Add User'}
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
                {['Name', 'Email', 'Active Bookings', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${u.activeReservationCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {u.activeReservationCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 rounded border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50" onClick={() => handleEdit(u)}>Edit</button>
                      <button className="px-3 py-1 rounded bg-red-50 border border-red-200 text-xs font-medium text-red-700 hover:bg-red-100" onClick={() => handleDelete(u.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-400">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
