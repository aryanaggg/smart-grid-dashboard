# Smart Grid Operations & Energy Analytics Dashboard

## Overview
Full-stack demo showing smart-grid-like time-series metrics, alerts, and a React dashboard.
Backend: Node.js + Express + SQLite
Frontend: React + Recharts + Axios

## Quick start (local)

### 1. Backend
```bash
cd backend
npm install
# seed DB
npm run seed
# start the simulator in background (optional)
node simulator.js &   # or `npm run simulate` in separate terminal
# start server
npm start
# smart-grid-dashboard
