import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// -------- Rooms --------
export const getRooms = (params) => api.get('/rooms', { params }).then(r => r.data)
export const createRoom = (data) => api.post('/rooms', data).then(r => r.data)
export const updateRoom = (id, data) => api.put(`/rooms/${id}`, data).then(r => r.data)
export const deleteRoom = (id) => api.delete(`/rooms/${id}`)

// -------- Users --------
export const getUsers = () => api.get('/users').then(r => r.data)
export const createUser = (data) => api.post('/users', data).then(r => r.data)
export const updateUser = (id, data) => api.put(`/users/${id}`, data).then(r => r.data)
export const deleteUser = (id) => api.delete(`/users/${id}`)

// -------- Reservations --------
export const getReservations = (params) => api.get('/reservations', { params }).then(r => r.data)
export const createReservation = (data) => api.post('/reservations', data).then(r => r.data)
export const updateReservation = (id, data) => api.put(`/reservations/${id}`, data).then(r => r.data)
export const cancelReservation = (id) => api.patch(`/reservations/${id}/cancel`).then(r => r.data)
export const completeReservation = (id) => api.patch(`/reservations/${id}/complete`).then(r => r.data)
export const deleteReservation = (id) => api.delete(`/reservations/${id}`)
export const getUsageReport = (params) => api.get('/reservations/usage-report', { params }).then(r => r.data)

// Extract human-readable error message from axios error
export function extractError(err) {
  return err?.response?.data?.message || err?.message || 'An unexpected error occurred.'
}
