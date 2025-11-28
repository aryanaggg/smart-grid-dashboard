const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');

const db = new sqlite3.Database('./db.sqlite');
const app = express();
app.use(cors());
app.use(bodyParser.json());

function toRows(rows) {
  return rows.map(r => ({
    ...r
  }));
}

// GET /plants
app.get('/plants', (req, res) => {
  db.all(`SELECT * FROM plants`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /realtime -> latest metric per plant + grid summary
app.get('/realtime', (req, res) => {
  db.all(`SELECT p.id as plant_id, p.name, p.type, p.capacity,
                 m.timestamp, m.output, m.efficiency, m.load
          FROM plants p
          LEFT JOIN (
            SELECT * FROM metrics WHERE id IN (
              SELECT MAX(id) FROM metrics GROUP BY plant_id
            )
          ) m ON p.id = m.plant_id`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // compute grid summary
    const totalGen = rows.reduce((s, r) => s + (r.output || 0), 0);
    const totalCapacity = rows.reduce((s, r) => s + (r.capacity || 0), 0);
    // get latest overall load by getting latest metric row across metrics (approx)
    db.get(`SELECT load FROM metrics ORDER BY id DESC LIMIT 1`, (err2, loadRow) => {
      const gridLoad = loadRow ? loadRow.load : null;
      res.json({ plants: rows, totalGen, totalCapacity, gridLoad });
    });
  });
});

// GET /plants/:id/metrics?limit=144 (default to last 24h with 10s -> many rows; use limit)
app.get('/plants/:id/metrics', (req, res) => {
  const pid = req.params.id;
  const limit = parseInt(req.query.limit || '200');
  db.all(`SELECT * FROM metrics WHERE plant_id = ? ORDER BY id DESC LIMIT ?`, [pid, limit], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.reverse()); // return ascending by time
  });
});

// GET /alerts
app.get('/alerts', (req, res) => {
  db.all(`SELECT a.*, p.name as plant_name FROM alerts a LEFT JOIN plants p ON p.id = a.plant_id ORDER BY id DESC LIMIT 200`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST /plants (create)
app.post('/plants', (req, res) => {
  const { name, type, capacity, location } = req.body;
  const stmt = db.prepare(`INSERT INTO plants (name, type, capacity, location) VALUES (?, ?, ?, ?)`);
  stmt.run(name, type, capacity, location, function(err) {
    stmt.finalize();
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend API listening on http://localhost:${PORT}`));
