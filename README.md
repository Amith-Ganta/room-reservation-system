# Room Reservation System

A full-stack meeting-room booking application built with **ASP.NET Core 8** (backend) and **React 18 + Vite** (frontend).

---

## Architecture

```
Internship/
├── backend/
│   ├── RoomReservation.API/        # ASP.NET Core 8 Web API
│   │   ├── Controllers/            # Thin HTTP layer — parses requests, delegates to Services
│   │   ├── Services/               # All business logic (validation rules, lifecycle)
│   │   ├── Repositories/           # EF Core data access via generic IRepository<T>
│   │   ├── DTOs/                   # Request/response shapes + RoomUsageReportRow
│   │   ├── Mappers/                # Static ToDto / ToEntity / Apply helpers
│   │   ├── Models/                 # EF Core entities (Room, User, Reservation)
│   │   ├── Data/                   # AppDbContext + DbSeeder
│   │   └── Program.cs              # DI wiring, Swagger, CORS
│   └── RoomReservation.Tests/      # xUnit — 14 tests covering R1–R7 + lifecycle
└── frontend/
    └── src/
        ├── api/client.js           # Axios module — all HTTP calls + extractError()
        ├── pages/
        │   ├── RoomsPage.jsx
        │   ├── UsersPage.jsx
        │   ├── ReservationsPage.jsx
        │   └── UsageReportPage.jsx # Room utilisation dashboard
        └── App.jsx                 # Routes + nav
```

### Design patterns

| Pattern | Where |
|---|---|
| Repository pattern | `IRepository<T>` + per-entity implementations |
| Service layer | All validation and mutations live in `*Service.cs` |
| DTO + static Mapper | No AutoMapper; explicit `ToDto` / `ToEntity` / `Apply` |
| `(dto, error)` tuple | Services never throw; callers pattern-match the result |
| Error format `"CODE: message"` | Controllers split at `:` to set HTTP status + response body |
| Config-driven limits | `Reservation:MaxDurationDays`, `Reservation:MaxBookingHorizonDays` |

---

## Prerequisites

| Tool | Version |
|---|---|
| .NET SDK | 8.0+ |
| Node.js | 18+ |

---

## Setup and Run

### Backend

```bash
cd backend
dotnet run --project RoomReservation.API
# API: http://localhost:5000
# Swagger: http://localhost:5000/swagger
```

The API uses an **EF Core InMemory database** — data resets on every restart. Five rooms and three users are seeded automatically by `DbSeeder` on first startup.

### Frontend

```bash
cd frontend
npm install
npm run dev
# App: http://localhost:5173
```

Vite proxies `/api` → `http://localhost:5000`, so no CORS issues in development.

---

## Business Rules

All rules are enforced server-side in `ReservationService.ValidateAsync`.

| Code | Rule |
|---|---|
| R1 | End time must be after start; duration ≤ `MaxDurationDays` (default 7) |
| R2 | No two bookings may overlap for the same room |
| R3 | No two bookings may overlap for the same organiser |
| R4 | Reservation must start in the future |
| R5 | Number of attendees must not exceed room capacity |
| R6 | Start may not be more than `MaxBookingHorizonDays` (default 90) in the future |
| R7 | Room must be active (`IsActive = true`) |

**Back-to-back bookings are allowed.** A 10:00–11:00 reservation does not block an 11:00–12:00 one.

**Early completion.** `PATCH /api/reservations/{id}/complete` ends a reservation immediately. The actual end time is stored in `ActualEndTime`. The room becomes available from that moment — subsequent conflict checks use `ActualEndTime ?? EndTime`.

---

## API Endpoints

### Rooms — `GET/POST/PUT/DELETE /api/rooms`

```
GET    /api/rooms              list (filter: isActive, hasProjector, …)
GET    /api/rooms/{id}
POST   /api/rooms
PUT    /api/rooms/{id}
DELETE /api/rooms/{id}
```

### Users — `GET/POST/PUT/DELETE /api/users`

```
GET    /api/users
GET    /api/users/{id}
POST   /api/users
PUT    /api/users/{id}
DELETE /api/users/{id}
```

### Reservations — `GET/POST/PUT/PATCH/DELETE /api/reservations`

```
GET    /api/reservations                   filter: roomId, userId, status, from, to
GET    /api/reservations/{id}
POST   /api/reservations
PUT    /api/reservations/{id}
PATCH  /api/reservations/{id}/cancel
PATCH  /api/reservations/{id}/complete     records ActualEndTime
DELETE /api/reservations/{id}
GET    /api/reservations/usage-report      filter: from, to
```

### Error format

All errors use `400 Bad Request` (or `404`) with body:

```json
{ "error": "R2_ROOM_CONFLICT", "message": "The room is already booked during this time slot." }
```

---

## Room Usage Report

`GET /api/reservations/usage-report` returns per-room statistics:

| Field | Description |
|---|---|
| `totalBookings` | All reservations (any status) |
| `completedBookings` | Status = Completed |
| `cancelledBookings` | Status = Cancelled |
| `totalScheduledHours` | Sum of `(EndTime - StartTime)` |
| `totalActualHours` | Sum of `(ActualEndTime ?? EndTime) - StartTime` |
| `utilisationPct` | `actualHours / scheduledHours * 100` |

The frontend **Usage Report** page visualises this with a colour-coded progress bar (red < 40%, amber 40–69%, green ≥ 70%).

---

## Tests

```bash
cd backend
dotnet test
```

14 xUnit tests covering:

- R1–R7 validation rules
- Happy-path creation
- Cancel changes status, does not delete
- Cancelled slot is rebookable
- `CompleteAsync` rejects not-yet-started reservations
- `CompleteAsync` records `ActualEndTime`
- Post-early-completion rebook succeeds

Each test uses a fresh `Guid.NewGuid()` InMemory database — no shared state.

---

## Configuration

`backend/RoomReservation.API/appsettings.json`:

```json
{
  "Reservation": {
    "MaxDurationDays": 7,
    "MaxBookingHorizonDays": 90
  }
}
```

---

## CI

GitHub Actions runs two jobs on every push and pull request (`.github/workflows/codeql.yml`):

1. **Backend Tests** — `dotnet test` runs all 14 xUnit tests
2. **CodeQL** — security analysis for C# and JavaScript
