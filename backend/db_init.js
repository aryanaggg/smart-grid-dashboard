const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite');

db.serialize(() => {
  // Drop if exists (safe for dev)
  db.run(`DROP TABLE IF EXISTS plants`);
  db.run(`DROP TABLE IF EXISTS metrics`);
  db.run(`DROP TABLE IF EXISTS alerts`);

  db.run(`
    CREATE TABLE plants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      type TEXT,
      capacity REAL,
      location TEXT
    )
  `);

  db.run(`
    CREATE TABLE metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plant_id INTEGER,
      timestamp TEXT,
      output REAL,
      capacity REAL,
      efficiency REAL,
      load REAL,
      renewable_contrib REAL,
      FOREIGN KEY (plant_id) REFERENCES plants(id)
    )
  `);

  db.run(`
    CREATE TABLE alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plant_id INTEGER,
      timestamp TEXT,
      type TEXT,
      severity TEXT,
      message TEXT,
      FOREIGN KEY (plant_id) REFERENCES plants(id)
    )
  `);

  const stmt = db.prepare("INSERT INTO plants (name, type, capacity, location) VALUES (?, ?, ?, ?)");
  stmt.run("Solar Plant A", "solar", 500, "Grid Sector 1");
  stmt.run("Wind Farm B", "wind", 300, "Coastal Zone");
  stmt.run("Thermal Plant C", "thermal", 1000, "Industrial Park");
  stmt.run("Solar Plant D", "solar", 250, "Remote Site");
  stmt.finalize();

  console.log("DB initialized and plants seeded. Run `npm run simulate` to start data generator (or start app).");
});

db.close();
