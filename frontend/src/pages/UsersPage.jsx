import { useEffect, useState } from 'react'
import { getUsers, createUser, updateUser, deleteUser, extractError } from '../api/client'
import './Page.css'

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

  return (
    <div>
      <h1 className="page-title">Users</h1>

      <div className="card form-card">
        <h2 className="form-title">{editing ? 'Edit User' : 'Add New User'}</h2>
        {error && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">{success}</div>}
        <form onSubmit={handleSubmit} className="room-form">
          <label>Full Name *
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Alice Johnson" required />
          </label>
          <label>Email *
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="alice@example.com" required />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>{editing ? 'Save Changes' : 'Add User'}</button>
            {editing && <button type="button" className="btn-secondary" onClick={() => { setEditing(null); setForm(EMPTY_FORM) }}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="card table-card">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Active Bookings</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={u.activeReservationCount > 0 ? 'badge badge-green' : 'badge badge-gray'}>
                    {u.activeReservationCount}
                  </span>
                </td>
                <td className="action-cell">
                  <button className="btn-secondary" onClick={() => handleEdit(u)}>Edit</button>
                  <button className="btn-danger" onClick={() => handleDelete(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan="4" style={{textAlign:'center',color:'#9ca3af',padding:'24px'}}>No users found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
