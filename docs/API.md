# API Reference

Base URL: `http://localhost:5000/api`

All request and response bodies are JSON. Dates are ISO 8601 UTC strings.

## Error response shape

```json
{ "error": "ERROR_CODE", "message": "Human-readable description." }
```

---

## Rooms

### GET /rooms

Returns all rooms. Supports optional query parameters for filtering.

**Query parameters**

| Parameter | Type | Description |
|---|---|---|
| minCapacity | int | Only return rooms with capacity >= this value |
| hasProjector | bool | Filter by projector availability |
| hasWhiteboard | bool | Filter by whiteboard availability |
| hasTVScreen | bool | Filter by TV screen availability |
| hasVideoConferencing | bool | Filter by video conferencing availability |
| isActive | bool | Filter by active status (default: all) |
| floor | string | Case-insensitive substring match on Location field |

**Example**

```bash
curl "http://localhost:5000/api/rooms?minCapacity=10&hasProjector=true&floor=floor%201"
```

**Response 200**

```json
[
  {
    "id": 1,
    "name": "Conference Room A",
    "capacity": 10,
    "location": "Floor 1",
    "hasProjector": true,
    "hasWhiteboard": true,
    "hasTVScreen": false,
    "hasVideoConferencing": false,
    "isActive": true
  }
]
```

---

### POST /rooms

Create a room.

**Request body**

```json
{
  "name": "New Room",
  "capacity": 8,
  "location": "Floor 2",
  "hasProjector": true,
  "hasWhiteboard": false,
  "hasTVScreen": false,
  "hasVideoConferencing": true,
  "isActive": true
}
```

**Response 201** -- the created room with its assigned `id`.

**Error codes**

| Code | Condition |
|---|---|
| ROOM_NAME_REQUIRED | name is blank |
| ROOM_CAPACITY_INVALID | capacity < 1 |
| ROOM_LOCATION_REQUIRED | location is blank |

---

### PUT /rooms/{id}

Replace a room's fields. Same request body shape as POST.

**Response 200** -- updated room.

**Error codes**: same as POST, plus `ROOM_NOT_FOUND` (404).

---

### DELETE /rooms/{id}

**Response 204** on success. `ROOM_NOT_FOUND` (404) if not found.

---

## Users

### GET /users

Returns all users.

```bash
curl "http://localhost:5000/api/users"
```

**Response 200**

```json
[
  { "id": 1, "name": "Alice Johnson", "email": "alice@example.com" }
]
```

---

### POST /users

**Request body**

```json
{ "name": "New User", "email": "new@example.com" }
```

**Response 201** -- created user.

**Error codes**

| Code | Condition |
|---|---|
| USER_NAME_REQUIRED | name is blank |
| USER_EMAIL_REQUIRED | email is blank |
| USER_EMAIL_INVALID | email fails MailAddress.TryCreate |
| USER_EMAIL_DUPLICATE | email already registered |

---

### PUT /users/{id}

Replace user fields. Same body shape as POST.

**Response 200** -- updated user.

**Error codes**: same as POST plus `USER_NOT_FOUND` (404).

---

### DELETE /users/{id}

**Response 204** on success. `USER_NOT_FOUND` (404) if not found.

---

## Reservations

### GET /reservations

Returns reservations. Supports optional filters.

**Query parameters**

| Parameter | Type | Description |
|---|---|---|
| roomId | int | Filter by room |
| userId | int | Filter by organiser |
| status | string | `Booked`, `Completed`, or `Cancelled` |
| from | datetime | Start of date range (inclusive) |
| to | datetime | End of date range (inclusive) |

**Example**

```bash
curl "http://localhost:5000/api/reservations?status=Booked&from=2025-01-01T00:00:00Z"
```

**Response 200**

```json
[
  {
    "id": 1,
    "roomId": 1,
    "userId": 1,
    "startTime": "2025-06-01T09:00:00Z",
    "endTime": "2025-06-01T10:00:00Z",
    "title": "Sprint Planning",
    "attendeesCount": 5,
    "status": "Booked",
    "actualEndTime": null
  }
]
```

---

### POST /reservations

Create a reservation. Enforces R1-R7.

**Request body**

```json
{
  "roomId": 1,
  "userId": 1,
  "startTime": "2025-06-10T09:00:00Z",
  "endTime": "2025-06-10T10:30:00Z",
  "title": "Product Review",
  "attendeesCount": 4
}
```

**Response 201** -- created reservation DTO.

**Booking rule error codes**

| Code | HTTP | Condition |
|---|---|---|
| R1_MAX_DURATION | 400 | start >= end or duration > MaxDurationDays |
| R2_ROOM_CONFLICT | 400 | Room already booked in that slot |
| R2_ROOM_NOT_FOUND | 404 | roomId not found |
| R3_ORGANIZER_CONFLICT | 400 | User already has an overlapping booking |
| R3_USER_NOT_FOUND | 404 | userId not found |
| R4_FUTURE_ONLY | 400 | startTime is in the past |
| R5_CAPACITY_EXCEEDED | 400 | attendeesCount > room.Capacity |
| R6_BOOKING_HORIZON | 400 | startTime > now + MaxBookingHorizonDays |
| R7_ROOM_INACTIVE | 400 | Room is not active |

---

### PUT /reservations/{id}

Update a reservation. Same body as POST; R1-R7 re-enforced.

**Response 200** -- updated reservation.

Additional error codes: `RESERVATION_NOT_FOUND` (404), `INVALID_STATUS` (400 -- cannot update a cancelled or completed reservation).

---

### PATCH /reservations/{id}/cancel

Cancel a reservation. No request body.

**Response 200** -- reservation with `status: "Cancelled"`.

**Error codes**: `RESERVATION_NOT_FOUND` (404), `INVALID_STATUS` (400 -- already cancelled or completed).

---

### PATCH /reservations/{id}/complete

End a reservation early. Sets `actualEndTime = min(now, endTime)`.

**Requires the reservation to have already started** (`startTime <= now`).

**Response 200**

```json
{
  "id": 1,
  "status": "Completed",
  "actualEndTime": "2025-06-10T09:52:00Z",
  ...
}
```

**Error codes**: `RESERVATION_NOT_FOUND` (404), `INVALID_STATUS` (400 -- not started yet, or already closed).

---

### GET /reservations/usage-report

Returns per-room utilisation figures.

```bash
curl "http://localhost:5000/api/reservations/usage-report"
```

**Response 200**

```json
[
  {
    "roomId": 1,
    "roomName": "Conference Room A",
    "totalBookings": 5,
    "completed": 3,
    "cancelled": 1,
    "scheduledHours": 7.5,
    "actualHours": 6.2,
    "utilizationPct": 82.67
  }
]
```

`scheduledHours` sums `(endTime - startTime)` for all non-cancelled bookings. `actualHours` sums `(actualEndTime - startTime)` for completed bookings plus `(endTime - startTime)` for booked ones.

---

### DELETE /reservations/{id}

**Response 204** on success. `RESERVATION_NOT_FOUND` (404) if not found.

---

## Global exception handler

Unhandled exceptions return:

```json
{ "error": "INTERNAL_ERROR", "message": "An unexpected error occurred." }
```

HTTP status 500.

---

## Swagger UI

Interactive documentation available at `http://localhost:5000/swagger` when the API is running in Development mode.
