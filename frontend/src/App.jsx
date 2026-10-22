import { Routes, Route, NavLink } from 'react-router-dom'
import RoomsPage from './pages/RoomsPage'
import UsersPage from './pages/UsersPage'
import ReservationsPage from './pages/ReservationsPage'
import UsageReportPage from './pages/UsageReportPage'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 h-15 flex items-center gap-8" style={{ height: 60 }}>
          <span className="font-bold text-lg text-indigo-600 whitespace-nowrap">Room Reservation</span>
          <nav className="flex gap-1">
            {[
              { to: '/rooms', label: 'Rooms' },
              { to: '/users', label: 'Users' },
              { to: '/reservations', label: 'Reservations' },
              { to: '/usage-report', label: 'Usage Report' },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 py-7">
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
