import { Routes, Route, NavLink } from 'react-router-dom'
import RoomsPage from './pages/RoomsPage'
import UsersPage from './pages/UsersPage'
import ReservationsPage from './pages/ReservationsPage'
import UsageReportPage from './pages/UsageReportPage'
import './App.css'

export default function App() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-inner">
          <span className="brand">Room Reservation</span>
          <nav className="nav">
            <NavLink to="/rooms" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Rooms</NavLink>
            <NavLink to="/users" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Users</NavLink>
            <NavLink to="/reservations" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Reservations</NavLink>
            <NavLink to="/usage-report" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Usage Report</NavLink>
          </nav>
        </div>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<RoomsPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
          <Route path="/usage-report" element={<UsageReportPage />} />
        </Routes>
      </main>
    </div>
  )
}
