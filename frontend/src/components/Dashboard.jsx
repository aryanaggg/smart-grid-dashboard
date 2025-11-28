import React, { useEffect, useState } from 'react';
import { getRealtime, getPlantMetrics, getAlerts } from '../api';
import PlantChart from './PlantChart';

function getStatus(efficiency) {
  if (efficiency == null) return { label: 'Unknown', color: '#6B7280' };
  if (efficiency > 50) return { label: 'Healthy', color: '#10B981' };
  if (efficiency > 20) return { label: 'Warning', color: '#f59e0b' };
  return { label: 'Critical', color: '#EF4444' };
}

function formatTimestamp(ts) {
  try {
    const asNumber = Number(ts);
    const d = (!Number.isNaN(asNumber) && String(ts).trim() !== '') ? new Date(asNumber) : new Date(ts);
    if (Number.isNaN(d.getTime())) return ts;
    const secs = d.getSeconds();
    if (secs >= 30) d.setMinutes(d.getMinutes() + 1);
    d.setSeconds(0, 0);
    const opts = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return d.toLocaleString(undefined, opts);
  } catch (e) {
    return ts;
  }
}

export default function Dashboard() {
  const [dark, setDark] = useState(false);
  const [data, setData] = useState({ plants: [], totalGen: 0, totalCapacity: 0, gridLoad: null });
  const [alerts, setAlerts] = useState([]);
  const [plantMetricsMap, setPlantMetricsMap] = useState({});

  useEffect(() => {
    document.body.style.background = dark ? "#121212" : "#FFFFFF";
    document.body.style.color = dark ? "#E5E7EB" : "#1F2937";
  }, [dark]);

  async function fetchAll() {
    try {
      const d = await getRealtime();
      setData(d);
      const a = await getAlerts();
      setAlerts(a.slice(0, 10));
      if (d.plants && d.plants.length) {
        d.plants.forEach(async (p) => {
          const metrics = await getPlantMetrics(p.plant_id, 300);
          setPlantMetricsMap(prev => ({ ...prev, [p.plant_id]: metrics }));
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      background: dark ? "#121212" : "#FFFFFF",
      color: dark ? "#E5E7EB" : "#1F2937",
      minHeight: "100vh",
      padding: 24,
      transition: "0.3s ease"
    }}>
      <button
        onClick={() => setDark(!dark)}
        style={{
          padding: "8px 14px",
          borderRadius: "8px",
          background: dark ? "#1E1E1E" : "#e5e7eb",
          color: dark ? "#E5E7EB" : "#111",
          border: "1px solid #999",
          cursor: "pointer",
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 999,
        }}
      >
        {dark ? "🌙" : "☀️"}
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <Card title="Total Generation" dark={dark}>{Math.round(data.totalGen)} kW</Card>
            <Card title="Total Capacity" dark={dark}>{Math.round(data.totalCapacity)} kW</Card>
            <Card title="Grid Load" dark={dark}>{data.gridLoad ? Math.round(data.gridLoad) + ' kW' : '---'}</Card>
            <Card title="Renewable %" dark={dark}>{data.totalCapacity ? Math.round((data.totalGen / data.totalCapacity) * 100) : 0}%</Card>
          </div>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
            {data.plants.map(p => {
              const eff = p.efficiency == null ? null : Number(p.efficiency);
              const { label, color } = getStatus(eff);

              return (
                <div
                  key={p.plant_id}
                  style={{
                    position: 'relative',
                    padding: 12,
                    border: '1px solid',
                    borderColor: dark ? "#2a2a2a" : "#ddd",
                    borderRadius: 8,
                    background: dark ? "#1E1E1E" : "#fff",
                    marginBottom: 16,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 350,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '6px 10px',
                      borderRadius: 12,
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      backgroundColor: color
                    }}>{label}</span>
                  </div>

                  <h3>{p.name}</h3>
                  <div>Type: {p.type}</div>
                  <div>Capacity: {p.capacity} kW</div>
                  <div>Output: {p.output ? Math.round(p.output) + ' kW' : '—'}</div>

                  <div style={{
                    width: "100%",
                    height: "7px",
                    background: dark ? '#2b2b2b' : "#e5e7eb",
                    borderRadius: "4px",
                    marginTop: "6px"
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${(p.output && p.capacity) ? (p.output / p.capacity) * 100 : 0}%`,
                      background: dark ? '#60A5FA' : "#3B82F6",
                      borderRadius: "4px",
                      transition: "width 0.4s ease"
                    }} />
                  </div>

                  <div>Efficiency: {eff != null ? eff.toFixed(2) + '%' : '—'}</div>

                  {plantMetricsMap[p.plant_id] ? (
                    <div style={{
                      marginTop: 12,
                      flexGrow: 1,
                      display: "flex",
                      minHeight: 150,
                      width: "100%"
                    }}>
                      <PlantChart metrics={plantMetricsMap[p.plant_id]} style={{ flex: 1, width: "100%" }} />
                    </div>
                  ) : (
                    <div style={{ marginTop: 12, fontSize: 12, color: dark ? '#A1A1AA' : '#6B7280' }}>Loading chart...</div>
                  )}

                </div>
              );
            })}
          </section>
        </div>

        <aside style={{
          padding: 12,
          border: "1px solid",
          borderColor: dark ? "#2a2a2a" : "#ddd",
          background: dark ? "#1E1E1E" : "#fff",
          color: dark ? "#E5E7EB" : "#111",
          borderRadius: 8
        }}>
          <h3><span style={{display: 'inline-block', width: 15, height: 15, background: dark ? '#F87171' : '#EF4444', borderRadius: '100%', marginRight: 8, verticalAlign: 'middle'}}></span>Alerts</h3>
          {alerts.length === 0 ? <div>No active alerts</div> : alerts.map(a => (
            <div key={a.id} style={{ padding: 8, borderBottom: '1px solid #f1f1f1' }}>
              <strong style={{ color: dark ? '#E5E7EB' : undefined }}>{a.severity}</strong> — {a.type}
              <div style={{ fontSize: 12, color: dark ? '#A1A1AA' : '#6B7280' }}>{formatTimestamp(a.timestamp)}</div>
              <div style={{ fontSize: 13, color: dark ? '#E5E7EB' : undefined }}>{a.message}</div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

function Card({ title, children, dark }) {
  return (
    <div style={{
      border: '1px solid',
      borderColor: dark ? "#2a2a2a" : "#eee",
      padding: 12,
      borderRadius: 8,
      background: dark ? "#1E1E1E" : "#fff",
      color: dark ? "#E5E7EB" : "#111",
      transition: "0.3s",
      minHeight: 120,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    }}>
      <div style={{ fontSize: 12, color: dark ? '#A1A1AA' : '#6B7280', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 18, fontWeight: 600 }}>{children}</div>
    </div>
  );
}
