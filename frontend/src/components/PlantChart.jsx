import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function formatTime(ts){
  const d = new Date(ts);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export default function PlantChart({ metrics = [] }){
  if (!metrics || metrics.length === 0) return <div>No metrics available.</div>;

  const data = metrics.map(m => ({
    time: formatTime(m.timestamp),
    output: Math.round(m.output),
    efficiency: m.efficiency
  }));

  return (
    <div style={{flex: 1, width: "100%", display: "flex", flexDirection: "column"}}>
      <h4 style={{marginBottom: 6}}>Last {data.length} samples</h4>
      <div style={{flex: 1, width: "100%"}}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" minTickGap={20}/>
            <YAxis yAxisId="left" orientation="left" />
            <Tooltip />
            <Line yAxisId="left" type="monotone" dataKey="output" stroke="#1f77b4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
