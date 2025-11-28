# Smart Grid Dashboard (prou_assignment)

Brief overview
- This project is a simple smart-grid monitoring dashboard consisting of a Node.js backend (API + SQLite DB + data simulator) and a React frontend that visualizes plant metrics, alerts, and grid summary.
- Backend provides REST endpoints used by the frontend. A small simulator inserts metrics and occasional alerts into the database to emulate a live system.

Repository layout (important paths)
- `backend/` — Node.js API and data: `app.js`, `simulator.js`, `db_init.js`, `db.sqlite`
- `frontend/` — React app (CRA): main components under `src/`, key files: `src/components/Dashboard.jsx`, `src/api.js`

Quick architecture summary
- Data model: `plants` (static/seeds), `metrics` (time-series per plant), `alerts` (events)
- Simulator (`backend/simulator.js`) runs regularly (default every 10s) to insert metric rows and occasionally alerts
- API (`backend/app.js`) exposes endpoints used by frontend:
  - `GET /plants` — list of plants
  - `GET /realtime` — latest metric per plant + grid summary
  - `GET /plants/:id/metrics?limit=` — historical metrics for a plant
  - `GET /alerts` — recent alerts
  - `POST /plants` — create a new plant

Getting started (Windows PowerShell)
1) Prerequisites
- Node.js (v14+ recommended)
- npm (comes with Node.js)
- Optional: `nodemon` for backend dev (the project includes it as devDependency)

2) Backend setup
Open a PowerShell terminal in `backend`:

```powershell
cd f:\\code\\prou_assignment\\backend
npm install
```

Initialize the database and seed plants (recommended before first run):

```powershell
npm run seed
```

Start the backend API:

```powershell
npm start
# or in dev mode with auto-restart
npm run dev
```

Notes:
- Backend listens by default on port `4000` (see `app.js` or set `PORT` env var before running).
- The SQLite file is `backend/db.sqlite` after seeding or running the app.

3) Start the simulator (optional, required for live-updating metrics)
The simulator inserts new metric rows every 10 seconds. Run it in the backend directory:

```powershell
cd f:\\code\\prou_assignment\\backend
npm run simulate
```

Leave it running to generate live data. If you prefer not to run the simulator, you can still inspect static data produced by `npm run seed`.

4) Frontend setup
Open a PowerShell terminal in `frontend`:

```powershell
cd f:\\code\\prou_assignment\\frontend
npm install
```

By default the frontend expects the backend API at `http://localhost:4000`. If your backend is running elsewhere, set the `REACT_APP_API` environment variable before starting the frontend. Example (PowerShell):

```powershell
# If backend on default port
$env:REACT_APP_API = "http://localhost:4000"
npm start

# If you want to point to a different host:
$env:REACT_APP_API = "http://192.168.1.10:4000"; npm start
```

Start the frontend (CRA runs on port 3000 by default):

```powershell
npm start
```

Open `http://localhost:3000` in your browser.

Workflow / development notes
- To add new plants use the backend API `POST /plants` (the frontend does not expose a create form by default).
- Frontend polling: the dashboard polls the `/realtime` endpoint every 5s and fetches recent metrics for each plant.
- Important frontend files:
  - `src/api.js` — axios instance and API helpers (change `REACT_APP_API` if needed)
  - `src/components/Dashboard.jsx` — main dashboard component (visualization and polling)

Troubleshooting
- Backend fails to start: check `npm install` completed, and ensure `node app.js` is run from the `backend` directory.
- Database file missing: run `npm run seed` to create `db.sqlite` and seed plants.
- Frontend cannot fetch API: ensure backend is running and CORS is enabled (backend uses `cors()` by default). Check `REACT_APP_API` and browser console for failing requests (CORS or network errors).
- Port collisions: if port 4000 or 3000 already in use, change `PORT` (backend) or allow CRA to offer a different port for frontend.

Useful commands summary (PowerShell)
```powershell
# Backend
cd f:\\code\\prou_assignment\\backend
npm install
npm run seed         # create db and seed plants
npm start            # start API on port 4000
npm run dev          # start API with nodemon
npm run simulate     # start data simulator (inserts metrics every 10s)

# Frontend
cd f:\\code\\prou_assignment\\frontend
npm install
$env:REACT_APP_API = "http://localhost:4000"  # set API endpoint if needed
npm start
```

Where to look in code
- Backend: `backend/app.js`, `backend/simulator.js`, `backend/db_init.js`
- Frontend: `frontend/src/components/Dashboard.jsx`, `frontend/src/api.js`, `frontend/src/components/PlantChart.jsx` (chart rendering)

Contact / next steps
- If you'd like, I can:
  - Add a small `Procfile` or npm script that starts both backend and simulator in parallel for local dev.
  - Add a Dockerfile / docker-compose to run the stack in containers.
  - Improve the README with screenshots or API examples.

Enjoy exploring the dashboard! If you want, I can commit this README into the repo now or add a quick `dev` script to run both services concurrently.