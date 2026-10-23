# Architecture Decision Records

## ADR-01: Controllers pattern over Minimal API

**Status**: Accepted

**Context**: ASP.NET Core 8 supports both a traditional controllers-based approach and a Minimal API style for defining HTTP routes.

**Decision**: Use controllers (`[ApiController]`, `ControllerBase`).

**Reasons**:
- Automatic model binding and validation attributes work out of the box.
- Swagger/Swashbuckle generates richer documentation from controller metadata.
- The three resource types (Rooms, Users, Reservations) each have enough routes that a class-per-resource grouping reads more clearly than a flat list of lambdas.
- Familiar structure for .NET developers reviewing the code.

**Trade-off**: More boilerplate per endpoint compared to Minimal API. Acceptable given the scope.

---

## ADR-02: EF Core InMemory database

**Status**: Accepted

**Context**: The task spec called for a working API with a meaningful data model. A full relational database (SQL Server, PostgreSQL) requires installation and connection-string configuration that would add setup friction.

**Decision**: Use the `Microsoft.EntityFrameworkCore.InMemory` provider with a fixed database name (`"RoomReservationDb"`).

**Reasons**:
- Zero external dependencies -- the API starts with `dotnet run`, no server needed.
- xUnit tests each spin up a fresh InMemory database via `Guid.NewGuid()`, ensuring test isolation without database cleanup.
- The business logic and validation are the interesting parts of this submission; persistence technology is not.

**Trade-off**: All data is lost when the process restarts. Documented in [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md).

---

## ADR-03: Repository pattern with generic IRepository<T>

**Status**: Accepted

**Context**: The service layer needed a way to query and persist entities without directly depending on `AppDbContext`.

**Decision**: Introduce `IRepository<T>` with `GetAllAsync`, `GetByIdAsync`, `AddAsync`, `UpdateAsync`, `DeleteAsync`, and `Query()`. Each entity has a concrete implementation (`RoomRepository`, `UserRepository`, `ReservationRepository`).

**Reasons**:
- Services depend on the interface, making unit tests possible without EF Core.
- `Query()` exposes `IQueryable<T>` so services can compose filters that EF Core pushes to the database layer (important for the IQueryable-based room filtering in `RoomService`).
- The abstraction is thin enough that it does not over-engineer a submission-sized project.

**Trade-off**: An extra layer compared to using `DbContext` directly in services. The indirection is worth it for testability.

---

## ADR-04: DTOs with a static mapper class

**Status**: Accepted

**Context**: Controllers should not expose raw EF Core entities (navigation property cycles, over-posting risk).

**Decision**: Define separate `CreateXxxDto`, `UpdateXxxDto`, and `XxxDto` (response) classes per entity, and a static `XxxMapper` class with `ToDto`, `ToEntity`, and `Apply` methods.

**Reasons**:
- Clear separation between the API contract and the data model.
- Static mappers are easy to follow and add no DI complexity.
- AutoMapper was not introduced because the mapping logic is simple enough that a manual mapper is shorter than the AutoMapper configuration it would replace.

**Trade-off**: Manual mappers need updating when the model changes. Acceptable for this scope.

---

## ADR-05: Centralised validation in a single ValidateAsync method

**Status**: Accepted

**Context**: Booking rules R1-R7 need to run on both `CreateAsync` and `UpdateAsync`.

**Decision**: A private `ValidateAsync(dto, excludeId)` method in `ReservationService` encodes all seven rules in order. Both `CreateAsync` and `UpdateAsync` call it; `excludeId` lets update operations skip the current reservation when checking for conflicts.

**Reasons**:
- Single place to read and test all booking constraints.
- Rules run in a consistent order (R4 before R2 means a past-start request fails on R4 before the conflict check).
- Easier to add or change a rule without touching multiple call sites.

**Trade-off**: One large method instead of separate rule objects. Acceptable given the fixed rule set.

---

## ADR-06: Static SemaphoreSlim for write serialisation

**Status**: Accepted

**Context**: Two concurrent POST requests for the same room/time slot could both pass the conflict check before either writes to the database, resulting in a double-booking.

**Decision**: A `private static readonly SemaphoreSlim _writeLock = new(1, 1)` in `ReservationService` serialises all write operations (`CreateAsync`, `UpdateAsync`, `CancelAsync`, `CompleteAsync`).

**Reasons**:
- The InMemory provider has no transaction isolation; a database-level lock is not available.
- A static (class-level) semaphore works across all instances of `ReservationService` within the same process, which is the unit the InMemory database lives in.
- Simple to understand and review.

**Trade-off**: All writes are sequential, which limits write throughput. For this project's scope (a demonstration system, one process) this is fine. A multi-process deployment would need a different approach -- see [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md).

---

## ADR-07: Half-open interval for overlap detection

**Status**: Accepted

**Context**: Two reservations conflict when their time ranges overlap. The question is whether adjacent bookings (A ends at 10:00, B starts at 10:00) should be treated as conflicting.

**Decision**: Use a half-open interval `[start, end)`. Two bookings A and B conflict when `A.Start < B.End && B.Start < A.End`.

**Reasons**:
- Adjacent bookings do not conflict: a room is available the moment a meeting ends.
- This matches the mental model of most calendar systems.
- The condition is symmetric and covers all four overlap cases (A contains B, B contains A, A starts during B, B starts during A).

**Trade-off**: None significant.

---

## ADR-08: ActualEndTime as a nullable field on Reservation

**Status**: Accepted

**Context**: Early completion (`PATCH /complete`) needs to record when the room was actually freed, both for audit purposes and for the usage report.

**Decision**: Add `DateTime? ActualEndTime` to the `Reservation` model. It is `null` for all reservations that have not been completed early. `CompleteAsync` sets it to `min(now, EndTime)`.

**Reasons**:
- Distinguishes between "used until scheduled end" and "freed early" without a separate table.
- The usage report can compute actual vs scheduled hours from this single field.
- The `PATCH /complete` endpoint already frees the slot for new bookings (conflict check excludes Completed reservations), so `ActualEndTime` is a precise timestamp for that release moment.

**Trade-off**: Nullable fields require null-checks in the usage report. A small cost for clear semantics.
