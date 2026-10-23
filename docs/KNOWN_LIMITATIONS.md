# Known Limitations

These are intentional scope decisions or known gaps in the current implementation, documented here so that reviewers and contributors have a clear picture of what the system does not do and how it could be extended.

---

## 1. In-memory persistence -- data is lost on restart

**What**: All rooms, users, and reservations are stored in an EF Core InMemory database. The database is re-seeded from `DbSeeder` every time the API starts.

**Why**: Removing the dependency on a real database server keeps the quick-start path to a single `dotnet run` command. Persistence technology is not the focus of this submission.

**Mitigation path**: Replace `UseInMemoryDatabase` in `Program.cs` with `UseSqlite` or `UseSqlServer` and add EF Core migrations. The repository and service layers do not need to change.

---

## 2. Single-process concurrency only

**What**: The `SemaphoreSlim _writeLock` in `ReservationService` serialises writes within one running process. It does not protect against concurrent writes from a second process or a second host behind a load balancer.

**Why**: The InMemory provider has no transaction isolation. A process-level lock is the strongest guard available within this setup.

**Mitigation path**: Switch to a real database and use an optimistic concurrency token or a database-level advisory lock. With SQL Server or PostgreSQL, wrapping the validate-then-insert in a serialisable transaction achieves the same guarantee at any scale.

---

## 3. No authentication or authorisation

**What**: Any caller can create, update, cancel, or delete any reservation or room. There is no concept of a logged-in user; `userId` in a reservation request is taken at face value.

**Why**: Authentication is outside the task scope.

**Mitigation path**: Add ASP.NET Core Identity or a JWT bearer middleware. Restrict `CancelAsync` and `CompleteAsync` to the reservation's owner or an admin role.

---

## 4. Basic email validation

**What**: User email addresses are validated with `System.Net.Mail.MailAddress.TryCreate`, which accepts some technically valid but unusual addresses (e.g. `a@b`).

**Why**: A regex-based validator would add complexity without changing the observable behaviour for normal inputs.

**Mitigation path**: Add a stricter regex or a library such as `EmailValidation` if needed for production use.

---

## 5. No integration, frontend, or concurrency tests

**What**: The 19 tests in `ReservationValidationTests` cover the service layer only. There are no:
- HTTP-level integration tests (via `WebApplicationFactory`)
- Frontend tests (no Playwright or Cypress suite)
- Concurrency tests that actually race two threads against the semaphore

**Why**: The task asked for backend unit tests. Frontend and concurrency testing were out of scope.

**Mitigation path**: Add `Microsoft.AspNetCore.Mvc.Testing` for integration tests. Add a concurrency test that fires two `CreateAsync` calls in parallel for the same slot and asserts exactly one succeeds.

---

## 6. Floor filter is a substring match, not a structured field

**What**: The `floor` query parameter on `GET /rooms` does a case-insensitive `Contains` check on the `Location` string field. Rooms store their floor as free text (e.g. `"Floor 1"`), not as a separate integer column.

**Why**: A free-text location was sufficient for the seeded data and keeps the Room model simple.

**Mitigation path**: Add a `Floor` int column to `Room`, migrate existing data, and filter on the integer. This would also enable range queries ("all rooms on floors 2 through 4").

---

## 7. Fixed seed data

**What**: `DbSeeder` always creates the same five rooms, three users, and two reservations on startup. There is no way to configure or disable seeding without editing the source.

**Why**: A fixed seed provides a consistent starting state for demonstrations and manual testing.

**Mitigation path**: Read seed data from a JSON file, or add an environment variable (`SEED_DATA=false`) to skip seeding in environments that manage their own data.
