import React from 'react';
import Dashboard from './components/Dashboard';

function App(){
  return (
    <div>
      <header style={{padding:16, background:'#0f172a', color:'white'}}>
        <h1>Smart Grid Ops Dashboard</h1>
      </header>
      <main style={{padding:16}}>
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
