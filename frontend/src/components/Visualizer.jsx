import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Text, Plane, Float } from '@react-three/drei';

/**
 * FoundationPoint Component
 * Renders a 3D block at [posX, -depth, posY]
 */
const FoundationPoint = ({ data, onHover, onLeave }) => {
  // We use -data.depth to push the visual block underground
  const position = [parseFloat(data.posX), -parseFloat(data.depth), parseFloat(data.posY)];
  const fsValue = parseFloat(data.fs);
  const isUnstable = fsValue < 1.2;

  return (
    <group position={position}>
      <mesh 
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(data);
        }}
        onPointerOut={() => onLeave()}
      >
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial 
          color={isUnstable ? '#ff4d4d' : '#4dff88'} 
          emissive={isUnstable ? '#ff0000' : '#00ff00'}
          emissiveIntensity={0.3}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
      
      {/* Floating FS Label above the block */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Text 
          position={[0, 0.7, 0]} 
          fontSize={0.25} 
          color="white" 
          outlineWidth={0.02} 
          outlineColor="#000000"
        >
          FS: {data.fs}
        </Text>
      </Float>
    </group>
  );
};

const Visualizer = () => {
  const [points, setPoints] = useState([]);
  const [siteArea, setSiteArea] = useState({ length: 20, width: 20 });
  const [hoveredData, setHoveredData] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Function to fetch the latest foundation data from FastAPI
  const fetchData = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('http://localhost:8000/api/get-foundation-data');
      const data = await res.json();
      setPoints(data);
    } catch (err) {
      console.error("Error loading 3D data:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 10 seconds to catch new data entries
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      
      {/* --- AI ADVICE TOOLTIP --- */}
      {hoveredData && (
        <div style={styles.tooltip}>
          <div style={styles.tooltipHeader}>
            <h3 style={{ margin: 0 }}>Ground Risk Report</h3>
            <span style={{ fontSize: '10px', color: '#4dff88' }}>AI POWERED</span>
          </div>
          <div style={styles.tooltipBody}>
            <p><strong>Building:</strong> {hoveredData.buildingType}</p>
            <p><strong>Factor of Safety:</strong> 
               <span style={{ color: parseFloat(hoveredData.fs) < 1.2 ? '#ff4d4d' : '#4dff88', marginLeft: '5px' }}>
                 {hoveredData.fs}
               </span>
            </p>
            <p><strong>Coordinates:</strong> X:{hoveredData.posX}, Y:{hoveredData.posY}</p>
            <hr style={styles.divider} />
            <p style={styles.adviceHeader}>GEOTECHNICAL ADVICE:</p>
            <p style={styles.adviceText}>{hoveredData.ai_advice || "Analyzing foundation stability..."}</p>
          </div>
        </div>
      )}

      {/* --- SITE DIMENSION CONTROLS --- */}
      <div style={styles.inputOverlay}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ margin: 0, fontSize: '14px' }}>Site Boundary</h4>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isSyncing ? '#4dff88' : '#718096' }}></div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div>
            <label style={styles.miniLabel}>Length (X)</label>
            <input 
              type="number" 
              value={siteArea.length} 
              onChange={(e) => setSiteArea({ ...siteArea, length: e.target.value })} 
              style={styles.miniInput}
            />
          </div>
          <div>
            <label style={styles.miniLabel}>Width (Y)</label>
            <input 
              type="number" 
              value={siteArea.width} 
              onChange={(e) => setSiteArea({ ...siteArea, width: e.target.value })} 
              style={styles.miniInput}
            />
          </div>
        </div>
        <button onClick={fetchData} style={styles.syncBtn}>Refresh Data</button>
      </div>

      {/* --- 3D ENVIRONMENT --- */}
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[15, 12, 15]} fov={50} />
        <OrbitControls makeDefault minDistance={5} maxDistance={50} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 15, 10]} intensity={1.5} castShadow />
        <spotLight position={[-10, 20, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

        {/* Site Surface Plane */}
        <Plane 
          args={[parseFloat(siteArea.length), parseFloat(siteArea.width)]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[parseFloat(siteArea.length)/2, -0.01, parseFloat(siteArea.width)/2]}
          receiveShadow
        >
          <meshStandardMaterial color="#2d3748" transparent opacity={0.5} />
        </Plane>

        <Grid 
          infiniteGrid 
          fadeDistance={40} 
          cellColor="#4a5568" 
          sectionColor="#2d3748" 
          position={[0, -0.02, 0]}
        />

        {points.map((pt, index) => (
          <FoundationPoint 
            key={index} 
            data={pt} 
            onHover={setHoveredData} 
            onLeave={() => setHoveredData(null)} 
          />
        ))}
      </Canvas>

      {/* --- LEGEND --- */}
      <div style={styles.legend}>
        <div style={styles.legendRow}><div style={{...styles.dot, background: '#4dff88'}}></div> Safe (FS &gt; 1.2)</div>
        <div style={styles.legendRow}><div style={{...styles.dot, background: '#ff4d4d'}}></div> Critical (FS &lt; 1.2)</div>
      </div>
    </div>
  );
};

const styles = {
  container: { width: '100%', height: '100vh', background: '#0f172a', position: 'relative', overflow: 'hidden' },
  tooltip: {
    position: 'absolute', top: '20px', left: '20px', zIndex: 100, width: '320px',
    background: 'rgba(15, 23, 42, 0.95)', color: 'white', padding: '18px',
    borderRadius: '12px', border: '1px solid #334155', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    pointerEvents: 'none'
  },
  tooltipHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  divider: { borderColor: '#334155', margin: '15px 0' },
  adviceHeader: { fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '5px' },
  adviceText: { fontSize: '13px', lineHeight: '1.5', color: '#e2e8f0' },
  inputOverlay: {
    position: 'absolute', top: '20px', right: '20px', zIndex: 10,
    background: 'rgba(30, 41, 59, 0.9)', padding: '15px', borderRadius: '10px',
    color: 'white', border: '1px solid #4a5568'
  },
  miniLabel: { display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' },
  miniInput: { 
    width: '85px', background: '#0f172a', border: '1px solid #4a5568', 
    color: 'white', padding: '6px', borderRadius: '4px', outline: 'none'
  },
  syncBtn: {
    width: '100%', marginTop: '12px', padding: '8px', background: '#3b82f6', 
    border: 'none', color: 'white', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
  },
  legend: { 
    position: 'absolute', bottom: '20px', left: '20px', padding: '12px',
    background: 'rgba(15, 23, 42, 0.7)', borderRadius: '8px', border: '1px solid #334155'
  },
  legendRow: { display: 'flex', alignItems: 'center', gap: '10px', color: 'white', fontSize: '12px', marginBottom: '5px' },
  dot: { width: '10px', height: '10px', borderRadius: '2px' }
};

export default Visualizer;