const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite');

function nowISO() {
  return new Date().toISOString();
}

function gaussianNoise(scale = 1) {
  // simple gaussian using Box-Muller
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * scale;
}

function simulateOutput(plant, t) {
  // t is Date object
  const hour = t.getHours() + t.getMinutes() / 60;
  const baseCapacity = plant.capacity;

  let output = 0;
  if (plant.type === 'solar') {
    // solar peaks in middle of day
    const rad = Math.PI * (hour - 6) / 12; // -pi/2 at 0h -> pi/2 at 12h
    const factor = Math.max(0, Math.sin(rad)); // 0..1..0
    output = Math.max(0, factor * baseCapacity * (0.6 + Math.random() * 0.4) + gaussianNoise(baseCapacity * 0.02));
  } else if (plant.type === 'wind') {
    // wind fluctuates
    output = Math.max(0, (0.4 + 0.6 * Math.abs(Math.sin(t.getTime() / (1000*60*10)))) * baseCapacity * (0.5 + Math.random() * 0.5) + gaussianNoise(baseCapacity * 0.05));
  } else { // thermal / dispatchable
    // follow base load with small variance
    output = Math.max(0, baseCapacity * (0.6 + 0.3 * Math.sin(t.getTime() / (1000*60*60))) + gaussianNoise(baseCapacity * 0.02));
  }
  return output;
}

function computeGridLoad(plantOutputs) {
  // simple: consumption = sum(outputs) * factor + base consumption
  const totalGen = plantOutputs.reduce((s,p)=>s+p.output,0);
  const base = 400; // baseline consumption
  const variation = 200 * Math.abs(Math.sin(Date.now() / (1000 * 60 * 60))); // some daily variation
  // artificially make demand sometimes higher than gen to produce alerts
  const consumption = base + variation + (Math.random() - 0.5) * 100 + Math.max(0, (Math.random() - 0.7) * 200);
  return consumption;
}

function insertMetric(plant, output, consumption, callback) {
  const efficiency = +( (output / plant.capacity) * 100 ).toFixed(2);
  const renewable_contrib = null; // calculated at grid-level
  const stmt = db.prepare(`INSERT INTO metrics (plant_id, timestamp, output, capacity, efficiency, load, renewable_contrib) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  stmt.run(plant.id, nowISO(), output, plant.capacity, efficiency, consumption, renewable_contrib, function(err) {
    stmt.finalize();
    if (err) console.error("Insert metric error", err);
    if (callback) callback();
  });
}

function maybeInsertAlert(plant, output, consumption) {
  // Simple rules: if efficiency < 20% or consumption > generation + threshold -> alert
  const gen = output;
  if ((output / plant.capacity) * 100 < 15) {
    const stmt = db.prepare(`INSERT INTO alerts (plant_id, timestamp, type, severity, message) VALUES (?, ?, ?, ?, ?)`);
    stmt.run(plant.id, nowISO(), 'Low Efficiency', 'warning', `${plant.name} efficiency below 15%`, function(){ stmt.finalize(); });
  }
  // Random occasional alert
  if (Math.random() < 0.01) {
    const st = db.prepare(`INSERT INTO alerts (plant_id, timestamp, type, severity, message) VALUES (?, ?, ?, ?, ?)`);
    st.run(plant.id, nowISO(), 'Random Fault', 'critical', `Simulated fault at ${plant.name}`, function(){ st.finalize(); });
  }
}

function tick() {
  db.all(`SELECT * FROM plants`, (err, plants) => {
    if (err) { console.error(err); return; }
    const t = new Date();
    const outputs = plants.map(pl => {
      const out = simulateOutput(pl, t);
      return { plant: pl, output: out };
    });

    // compute consumption (grid load)
    const consumption = computeGridLoad(outputs);

    // insert per-plant metrics
    let remaining = outputs.length;
    outputs.forEach(p => {
      insertMetric(p.plant, p.output, consumption, () => {
        maybeInsertAlert(p.plant, p.output, consumption);
        remaining--;
        if (remaining === 0) {
          // console.log(`[${new Date().toLocaleTimeString()}] Inserted metrics. Total gen: ${Math.round(outputs.reduce((s,o)=>s+o.output,0))} kW, consumption: ${Math.round(consumption)}`);
        }
      });
    });
  });
}

// run every 10 seconds
console.log("Starting simulator, inserting metrics every 10 seconds. Press Ctrl+C to stop.");
tick();
setInterval(tick, 10000);
