# Room Reservation System — Run Instructions

Follow these steps on **any PC** (Windows, Mac, or Linux) to get the app running.

---

## Step 1 — Install prerequisites

You need two tools installed. Check if you already have them first.

### Check .NET 8 SDK
Open a terminal and run:
```
dotnet --version
```
If you see `8.x.x`, you already have it. If the command is not found or the version starts with something other than `8`, download and install it:

**Download:** https://dotnet.microsoft.com/en-us/download/dotnet/8.0

Choose the **.NET 8.0 SDK** (not Runtime) for your operating system. Run the installer, then close and reopen the terminal.

### Check Node.js
```
node --version
```
If you see `v18.x.x` or higher, you already have it. Otherwise:

**Download:** https://nodejs.org  
Choose the **LTS** version. Run the installer.

---

## Step 2 — Get the code

If you cloned the repository via GitHub, the folder already exists. Otherwise copy the entire `Internship` folder to your PC.

Open a terminal and navigate to the `Internship` folder:
```
cd path\to\Internship
```
(On Mac/Linux use forward slashes: `cd path/to/Internship`)

---

## Step 3 — Start the backend (ASP.NET Core API)

Open a terminal window and run:

```
cd backend\RoomReservation.API
dotnet run
```

Wait for this message to appear:
```
Now listening on: http://localhost:5000
```

The API is now running. The in-memory database is seeded with 5 rooms, 3 users, and 2 sample reservations automatically.

To explore the API in a browser, open: http://localhost:5000/swagger

**Leave this terminal window open.**

---

## Step 4 — Start the frontend (React)

Open a **second** terminal window and run:

```
cd frontend
npm install
npm run dev
```

The first time you run `npm install` it downloads packages — this takes about 30 seconds. You only need to do it once per PC.

Wait for this message:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

**Leave this terminal window open too.**

---

## Step 5 — Open the app

Open a browser and go to:

**http://localhost:5173**

You will see the Room Reservation System with three pages:
- **Rooms** — view, add, edit, delete rooms; filter by capacity or projector availability
- **Users** — manage users
- **Reservations** — book rooms, filter by room or user, edit or cancel bookings

---

## Stopping the app

Press `Ctrl + C` in each terminal window to stop the backend and frontend.

---

## Run the backend tests

In a terminal:
```
cd backend
dotnet test
```

All 8 tests should pass. These tests verify all 7 booking validation rules.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `dotnet: command not found` | Install .NET 8 SDK (Step 1) and restart terminal |
| `node: command not found` | Install Node.js LTS (Step 1) and restart terminal |
| Port 5000 already in use | Stop whatever is running on port 5000, or change the port in `backend/RoomReservation.API/Properties/launchSettings.json` |
| Port 5173 already in use | Add `--port 5174` to the `npm run dev` command and update `vite.config.js` proxy accordingly |
| Frontend shows "Network Error" | Make sure the backend is running on port 5000 (Step 3) |
| `npm install` fails | Make sure you are inside the `frontend` folder |

---

## Data resets on restart

The database is **in-memory** by design (as required by the task). Every time you stop and restart the backend, data resets to the 5 seeded rooms, 3 seeded users, and 2 seeded reservations. This is expected behaviour.
