# Contributing

## Prerequisites

| Tool | Version |
|---|---|
| .NET SDK | 8.0+ |
| Node.js | 18+ |
| npm | 9+ |

## Running locally

**1. Start the API**

```bash
cd backend/RoomReservation.API
dotnet run
```

The API starts at `http://localhost:5000`. Swagger UI is at `http://localhost:5000/swagger`.

On first run, `DbSeeder` populates five rooms, three users, and two sample reservations.

**2. Start the frontend**

```bash
cd frontend
npm install
npm run dev
```

React dev server starts at `http://localhost:5173`. The Vite proxy in `vite.config.js` forwards all `/api` requests to `http://localhost:5000`.

Both processes need to be running at the same time for the full application to work.

## Running the tests

```bash
cd backend/RoomReservation.Tests
dotnet test
```

Expected: 19 passed, 0 failed, 0 skipped. Each test creates an isolated InMemory database.

To run tests with verbose output:

```bash
dotnet test --logger "console;verbosity=detailed"
```

## Project structure

```
room-reservation-system/
  backend/
    RoomReservation.API/
      Controllers/        HTTP layer (RoomsController, UsersController, ReservationsController)
      Services/           Business logic + validation
      Repositories/       EF Core query wrappers
      Models/             Room, User, Reservation, ReservationStatus
      DTOs/               Request and response shapes
      Mappers/            Entity <-> DTO conversion
      Options/            ReservationOptions (appsettings.json bindings)
      Data/               AppDbContext, DbSeeder
    RoomReservation.Tests/
      ReservationValidationTests.cs   All 19 unit tests
  frontend/
    src/
      api/                axios client + all API call functions
      components/         React components
      pages/              Page-level components
  docs/                   Architecture, API reference, decisions, limitations
```

## Making a change

**Backend change (service or validation logic)**

1. Edit the relevant file in `backend/RoomReservation.API/Services/`.
2. Add or update a test in `ReservationValidationTests.cs`.
3. Run `dotnet test` and confirm all 19+ tests pass.
4. Run `dotnet build` and confirm 0 errors, 0 warnings.

**Adding a new booking rule**

1. Add the validation logic to `ReservationService.ValidateAsync`.
2. Add a new error code constant following the `R{N}_CODE_NAME` pattern.
3. Add a test that exercises the new rule (both the failure case and the boundary).
4. Document the rule in `README.md` (booking rules table) and `docs/API.md`.

**Frontend change**

1. Edit the relevant file in `frontend/src/`.
2. Start the dev server (`npm run dev`) and verify the change in the browser.
3. Confirm no console errors.

## Branch naming

```
feature/<short-description>
fix/<short-description>
docs/<short-description>
```

Examples: `feature/room-export`, `fix/r3-conflict-edge-case`, `docs/api-examples`.

## Commit style

Use the imperative mood, lower-case after the type prefix:

```
feat: add room export endpoint
fix: correct overlap check for same-start-time reservations
docs: add R7 example to API reference
test: add boundary test for R6 horizon at exactly 90 days
refactor: extract overlap check into a helper method
```

## Pull request checklist

Before opening a PR:

- [ ] `dotnet test` passes (19+ tests, 0 failures)
- [ ] `dotnet build` passes with 0 warnings
- [ ] New behaviour is covered by at least one test
- [ ] Relevant documentation updated (README, API.md, KNOWN_LIMITATIONS.md as needed)
- [ ] No `.cs`, `.jsx`, `.csproj`, or config files accidentally included in doc-only PRs

## File editing constraints

The following files are generated or critical configuration and should not be modified without a clear reason:

- `*.csproj` -- project file, change only to add/remove packages
- `backend/RoomReservation.API/Program.cs` -- application startup
- `backend/RoomReservation.API/appsettings.json` -- configuration values
- `frontend/package.json` -- npm dependencies
- `.github/workflows/` -- CI pipeline
