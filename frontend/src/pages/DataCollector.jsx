import React, { useState } from 'react';

const DataCollector = () => {
  // Added buildingType to the initial state
  const initialRow = { 
    buildingType: 'Residential',
    cohesion: '', 
    normalStress: '', 
    frictionAngle: '', 
    shearStress: '', 
    porePressure: '', 
    posX: '', 
    posY: '', 
    depth: '' 
  };
  
  const [rows, setRows] = useState([]);
  const [current, setCurrent] = useState(initialRow);

  const buildingOptions = [
    "Residential", 
    "Commercial", 
    "Industrial", 
    "Infrastructure (Bridge/Dam)", 
    "Temporary Structure"
  ];

  const handleFileUpload = (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();

    reader.onload = (event) => {
        const text = event.target.result;
        const lines = text.split('\n');
        const newRows = [];

        // Skip the header row (i=1)
        for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',');
        if (columns.length >= 9) {
            const rowData = {
            buildingType: columns[0],
            cohesion: columns[1],
            normalStress: columns[2],
            frictionAngle: columns[3],
            shearStress: columns[4],
            porePressure: columns[5],
            posX: columns[6],
            posY: columns[7],
            depth: columns[8]
            };
            // Calculate FS for the imported row
            rowData.fs = calculateFS(rowData);
            rowData.id = Date.now() + i;
            newRows.push(rowData);
        }
        }
        setRows([...rows, ...newRows]);
    };
    reader.readAsText(file);
    };

  const calculateFS = (data) => {
    const { cohesion, normalStress, frictionAngle, shearStress } = data;
    if (!cohesion || !normalStress || !frictionAngle || !shearStress) return null;
    const phiRad = (parseFloat(frictionAngle) * Math.PI) / 180;
    const fs = (parseFloat(cohesion) + parseFloat(normalStress) * Math.tan(phiRad)) / parseFloat(shearStress);
    return fs.toFixed(2);
  };

  const addRow = () => {
    const fs = calculateFS(current);
    setRows([...rows, { ...current, fs, id: Date.now() }]);
    setCurrent(initialRow);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={styles.title}>Foundation Data Entry</h2>
        <p style={styles.subtitle}>Specify building type and parameters for risk assessment</p>
      </header>

        <div style={{ marginBottom: '20px', padding: '15px', border: '1px dashed #cbd5e0', borderRadius: '8px', textAlign: 'center' }}>
            <label style={styles.label}>Import Dataset (.csv)</label>
            <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileUpload} 
                style={{ marginTop: '10px', display: 'block', margin: '10px auto' }} 
            />
        </div>
        
      <div style={styles.inputCard}>
        {/* Building Type Selection Box */}
        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
          <label style={styles.label}>Building Category</label>
          <select 
            style={{ ...styles.input, width: '100%', marginTop: '8px', cursor: 'pointer' }}
            value={current.buildingType}
            onChange={e => setCurrent({...current, buildingType: e.target.value})}
          >
            {buildingOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div style={styles.grid}>
          {/* Exclude buildingType from the mapped inputs since we handled it above */}
          {Object.keys(initialRow).filter(key => key !== 'buildingType').map((key) => (
            <div key={key} style={styles.inputGroup}>
              <label style={styles.label}>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</label>
              <input 
                style={styles.input}
                type="number"
                placeholder="0.00"
                value={current[key]} 
                onChange={e => setCurrent({...current, [key]: e.target.value})}
              />
            </div>
          ))}
        </div>
        <button onClick={addRow} style={styles.addButton}>+ Add Row to Dataset</button>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Cohesion</th>
              <th style={styles.th}>Normal σ'</th>
              <th style={styles.th}>Angle φ'</th>
              <th style={styles.th}>Shear τ</th>
              <th style={styles.th}>X / Y / Z</th>
              <th style={{...styles.th, background: '#f0f4f8'}}>FS</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} style={styles.tr}>
                <td style={styles.td}>{r.buildingType}</td>
                <td style={styles.td}>{r.cohesion}</td>
                <td style={styles.td}>{r.normalStress}</td>
                <td style={styles.td}>{r.frictionAngle}°</td>
                <td style={styles.td}>{r.shearStress}</td>
                <td style={styles.td}>{r.posX}, {r.posY}, {r.depth}</td>
                <td style={{...styles.td, fontWeight: 'bold', color: r.fs < 1.2 ? '#d32f2f' : '#2e7d32'}}>
                  {r.fs}
                </td>
                <td style={styles.td}>
                  <span style={r.fs < 1.2 ? styles.badgeDanger : styles.badgeSuccess}>
                    {r.fs < 1.2 ? 'Critical' : 'Stable'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Change this line in your DataCollector.jsx */}
    <button 
    onClick={async () => {
        try {
        const res = await fetch('http://localhost:8000/api/data-ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rows),
        });
        if (res.ok) alert(`Successfully pushed ${rows.length} records!`);
        } catch (err) {
        alert("Backend not found. Make sure your Python server is running on port 8000.");
        }
    }}
    style={styles.submitButton}
    >
    Push {rows.length} Records to Python Engine
    </button>
    </div>
  );
};

// Styles remain largely the same, but adding minor adjustments for the select box
const styles = {
  container: { padding: '40px', maxWidth: '1300px', margin: '0 auto', fontFamily: '"Segoe UI", Tahoma, sans-serif', backgroundColor: '#f9fafb' },
  header: { marginBottom: '30px' },
  title: { margin: 0, color: '#1a202c', fontSize: '24px' },
  subtitle: { color: '#718096', marginTop: '5px' },
  inputCard: { background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '30px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '11px', fontWeight: 'bold', color: '#4a5568', letterSpacing: '0.5px' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', backgroundColor: '#fff' },
  addButton: { width: '100%', padding: '12px', background: '#3182ce', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  tableWrapper: { background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '15px', background: '#edf2f7', color: '#4a5568', fontSize: '12px', textTransform: 'uppercase' },
  td: { padding: '15px', borderBottom: '1px solid #edf2f7', fontSize: '13px', color: '#2d3748' },
  tr: { transition: 'background 0.2s' },
  badgeSuccess: { background: '#c6f6d5', color: '#22543d', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' },
  badgeDanger: { background: '#fed7d7', color: '#822727', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' },
  submitButton: { marginTop: '25px', width: '100%', padding: '15px', background: '#2d3748', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }
};

export default DataCollector;