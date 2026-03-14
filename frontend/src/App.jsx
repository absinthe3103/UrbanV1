import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Visualizer from './components/Visualizer';
import DataCollector from './pages/DataCollector';

function App() {
  return (
    <Router>
      <div style={{ fontFamily: 'sans-serif' }}>
        <nav style={{ padding: '15px', borderBottom: '1px solid #ddd', display: 'flex', gap: '20px' }}>
          <Link to="/" style={{ fontWeight: 'bold', textDecoration: 'none', color: '#007bff' }}>Dashboard</Link>
          <Link to="/collect" style={{ fontWeight: 'bold', textDecoration: 'none', color: '#007bff' }}>Data Entry</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Visualizer />} />
          <Route path="/collect" element={<DataCollector />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;