// Visualizer.jsx
import React, { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  PerspectiveCamera,
  Text,
  Plane,
  Float,
} from "@react-three/drei";

// ── Format AI Advice ──────────────────────────────────────────────────────────
const renderBold = (text) => {
  if (!text || !text.includes("**")) return text;
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, idx) =>
    idx % 2 === 1 ? (
      <strong key={idx} style={{ color: "#f1f5f9" }}>
        {part}
      </strong>
    ) : (
      part
    ),
  );
};

const FormatAdvice = ({ text }) => {
  if (!text) return <p style={{ color: "#475569" }}>No AI advice available.</p>;

  const cleanText = text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, inner) =>
      inner
        .trim()
        .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, "($1) / ($2)")
        .replace(/\\times/g, "×")
        .replace(/\\tan/g, "tan")
        .replace(/\\text\{(.*?)\}/g, "$1")
        .replace(/\\phi'/g, "φ'")
        .replace(/\\phi/g, "φ")
        .replace(/\\sigma/g, "σ")
        .replace(/\\tau/g, "τ")
        .replace(/\\[a-zA-Z]+/g, "")
        .trim(),
    )
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, inner) =>
      inner
        .trim()
        .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, "($1) / ($2)")
        .replace(/\\times/g, "×")
        .replace(/\\tan/g, "tan")
        .replace(/\\text\{(.*?)\}/g, "$1")
        .replace(/\\phi'/g, "φ'")
        .replace(/\\phi/g, "φ")
        .replace(/\\sigma/g, "σ")
        .replace(/\\tau/g, "τ")
        .replace(/\\[a-zA-Z]+/g, "")
        .trim(),
    )
    .replace(/\\boxed\{([\s\S]*?)\}/g, (_, inner) => inner.trim())
    .replace(/\\text\{(.*?)\}/g, "$1")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/\{/g, "")
    .replace(/\}/g, "")
    .replace(/\n{3,}/g, "\n\n");

  const lines = cleanText.split("\n");
  const elements = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") {
      elements.push(<div key={key++} style={{ height: "4px" }} />);
      continue;
    }
    if (line.trim() === "---") {
      elements.push(
        <hr key={key++} style={{ borderColor: "#1e293b", margin: "8px 0" }} />,
      );
      continue;
    }
    if (line.startsWith("### ")) {
      elements.push(
        <p
          key={key++}
          style={{
            color: "#60a5fa",
            fontWeight: "bold",
            fontSize: "12px",
            marginTop: "12px",
            marginBottom: "4px",
            letterSpacing: "0.5px",
          }}
        >
          {line.replace(/^###\s*/, "").replace(/\*\*/g, "")}
        </p>,
      );
      continue;
    }
    if (line.startsWith("#### ") || line.match(/^[A-Z]\.\s+[A-Z]/)) {
      elements.push(
        <p
          key={key++}
          style={{
            color: "#94a3b8",
            fontWeight: "bold",
            fontSize: "11px",
            marginTop: "10px",
            marginBottom: "3px",
          }}
        >
          {line.replace(/^####\s*/, "").replace(/\*\*/g, "")}
        </p>,
      );
      continue;
    }
    if (line.match(/^\d+\.\s/)) {
      const num = line.match(/^(\d+)\./)[1];
      const content = line.replace(/^\d+\.\s/, "");
      elements.push(
        <div
          key={key++}
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "4px",
            paddingLeft: "4px",
          }}
        >
          <span
            style={{
              color: "#3b82f6",
              flexShrink: 0,
              fontWeight: "bold",
              fontSize: "11px",
              minWidth: "14px",
            }}
          >
            {num}.
          </span>
          <span
            style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: "1.5" }}
          >
            {renderBold(content)}
          </span>
        </div>,
      );
      continue;
    }
    if (line.match(/^\s*[-•*]\s/)) {
      const content = line.replace(/^\s*[-•*]\s/, "");
      const indent = line.match(/^(\s+)/);
      elements.push(
        <div
          key={key++}
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "3px",
            paddingLeft: indent ? "16px" : "4px",
          }}
        >
          <span
            style={{
              color: "#3b82f6",
              flexShrink: 0,
              fontSize: "10px",
              marginTop: "3px",
            }}
          >
            ▸
          </span>
          <span
            style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: "1.5" }}
          >
            {renderBold(content)}
          </span>
        </div>,
      );
      continue;
    }
    elements.push(
      <p
        key={key++}
        style={{
          fontSize: "12px",
          color: "#cbd5e1",
          lineHeight: "1.6",
          marginBottom: "3px",
        }}
      >
        {renderBold(line)}
      </p>,
    );
  }
  return <div>{elements}</div>;
};

// ── Data Row helper ───────────────────────────────────────────────────────────
const DataRow = ({ label, value, valueColor }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      fontSize: "12px",
      marginBottom: "4px",
      color: "#e2e8f0",
    }}
  >
    <span style={{ color: "#94a3b8", fontSize: "11px" }}>{label}</span>
    <span
      style={{
        color: valueColor || "#e2e8f0",
        fontWeight: valueColor ? "bold" : "normal",
      }}
    >
      {value}
    </span>
  </div>
);

const SectionLabel = ({ text }) => (
  <div
    style={{
      fontSize: "10px",
      color: "#94a3b8",
      letterSpacing: "1px",
      marginBottom: "6px",
      marginTop: "4px",
      fontWeight: "bold",
    }}
  >
    {text}
  </div>
);

// ── 3D Block ──────────────────────────────────────────────────────────────────
const FoundationPoint = ({ data, isSelected, onClick }) => {
  const position = [
    parseFloat(data.posX),
    -parseFloat(data.depth),
    parseFloat(data.posY),
  ];
  const isUnstable = parseFloat(data.fs) < 1.2;

  return (
    <group position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick(data);
        }}
      >
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial
          color={isSelected ? "#ffffff" : isUnstable ? "#ff4d4d" : "#4dff88"}
          emissive={isSelected ? "#ffffff" : isUnstable ? "#ff0000" : "#00ff00"}
          emissiveIntensity={isSelected ? 0.8 : 0.3}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
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

// ── Main ──────────────────────────────────────────────────────────────────────
const Visualizer = () => {
  const [points, setPoints] = useState([]);
  const [siteArea, setSiteArea] = useState({ length: 20, width: 20 });
  const [selectedData, setSelectedData] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [panelSize, setPanelSize] = useState({ width: 400, height: 560 });
  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const fetchData = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("http://localhost:8000/api/get-foundation-data");
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
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const onResizeMouseDown = (e) => {
    e.preventDefault();
    isResizing.current = true;
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      w: panelSize.width,
      h: panelSize.height,
    };
    const onMove = (e) => {
      if (!isResizing.current) return;
      setPanelSize({
        width: Math.max(
          340,
          resizeStart.current.w + (e.clientX - resizeStart.current.x),
        ),
        height: Math.max(
          240,
          resizeStart.current.h + (e.clientY - resizeStart.current.y),
        ),
      });
    };
    const onUp = () => {
      isResizing.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleClick = (data) => {
    if (
      selectedData &&
      selectedData.posX === data.posX &&
      selectedData.posY === data.posY
    ) {
      setSelectedData(null);
    } else {
      setSelectedData(data);
    }
  };

  const critical = points.filter((p) => parseFloat(p.fs) < 1.2).length;
  const stable = points.length - critical;

  const fsColor = selectedData
    ? parseFloat(selectedData.fs) < 1.2
      ? "#ef4444"
      : "#22c55e"
    : "#22c55e";

  const safeBC = selectedData ? parseFloat(selectedData.allowable_bc || 0) : 0;
  const applied = selectedData ? parseFloat(selectedData.appliedLoad || 0) : 0;
  const bcSafe = applied === 0 || safeBC >= applied;

  return (
    <div style={styles.container}>
      {/* ── AI + Data Panel ── */}
      {selectedData && (
        <div
          style={{
            ...styles.panel,
            width: panelSize.width,
            height: panelSize.height,
          }}
        >
          <div style={styles.panelHeader}>
            <div>
              <h3 style={{ margin: 0, fontSize: "14px", color: "#f1f5f9" }}>
                Ground Risk Report
              </h3>
              <span
                style={{
                  fontSize: "9px",
                  color: "#4dff88",
                  letterSpacing: "1.5px",
                }}
              >
                ● AI POWERED
              </span>
            </div>
            <button
              onClick={() => setSelectedData(null)}
              style={styles.closeBtn}
            >
              ✕
            </button>
          </div>

          <div style={styles.panelBody}>
            <div style={styles.statsRow}>
              <div style={styles.statBox}>
                <div style={styles.statLabel}>BUILDING</div>
                <div
                  style={{
                    ...styles.statValue,
                    fontSize: "11px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {selectedData.buildingType}
                </div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statLabel}>FACTOR OF SAFETY</div>
                <div
                  style={{
                    ...styles.statValue,
                    color: fsColor,
                    fontSize: "20px",
                  }}
                >
                  {selectedData.fs}
                </div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statLabel}>STATUS</div>
                <div style={{ ...styles.statValue, color: fsColor }}>
                  {parseFloat(selectedData.fs) < 1.2
                    ? "🔴 Critical"
                    : "🟢 Stable"}
                </div>
              </div>
            </div>

            <div style={styles.section}>
              <DataRow label="Soil Type" value={selectedData.soilType || "—"} />
              <DataRow label="SPT N-Value" value={selectedData.sptN || "—"} />
              <DataRow
                label="Coords"
                value={`X:${selectedData.posX}  Y:${selectedData.posY}  Z:${selectedData.depth}`}
              />
            </div>

            <hr style={styles.divider} />

            <div style={styles.section}>
              <SectionLabel text="MOHR-COULOMB" />
              <DataRow
                label="Factor of Safety"
                value={selectedData.fs}
                valueColor={fsColor}
              />
              <DataRow
                label="Cohesion c'"
                value={`${selectedData.cohesion} kPa`}
              />
              <DataRow
                label="Friction φ'"
                value={`${selectedData.frictionAngle}°`}
              />
              <DataRow
                label="Pore Pressure"
                value={`${selectedData.porePressure} kPa`}
              />
              <DataRow
                label="Normal Stress"
                value={`${selectedData.normalStress} kPa`}
              />
              <DataRow
                label="Shear Stress"
                value={`${selectedData.shearStress} kPa`}
              />
            </div>

            <hr style={styles.divider} />

            <div style={styles.section}>
              <SectionLabel text="TERZAGHI BEARING CAPACITY" />
              <DataRow
                label="Ultimate qu"
                value={`${selectedData.ultimate_bc || "—"} kN/m²`}
                valueColor="#60a5fa"
              />
              <DataRow
                label="Allowable qa"
                value={`${selectedData.allowable_bc || "—"} kN/m²`}
                valueColor={bcSafe ? "#22c55e" : "#f59e0b"}
              />
              {applied > 0 && (
                <DataRow
                  label="Applied Load"
                  value={`${applied} kN/m²  ${bcSafe ? "✓ Safe" : "⚠ Exceeds qa"}`}
                  valueColor={bcSafe ? "#22c55e" : "#f59e0b"}
                />
              )}
              <DataRow
                label="Foundation"
                value={`B=${selectedData.foundationWidth || "—"}m  Df=${selectedData.foundationDepth || "—"}m`}
              />
              <DataRow
                label="Groundwater"
                value={`${selectedData.groundwaterDepth || "—"}m`}
              />
              <DataRow
                label="Unit Weight"
                value={`${selectedData.unitWeight || "—"} kN/m³`}
              />
            </div>

            <hr style={styles.divider} />

            <SectionLabel text="⚙ GEOTECHNICAL ADVICE" />
            <FormatAdvice text={selectedData.ai_advice} />
          </div>

          <div
            onMouseDown={onResizeMouseDown}
            style={styles.resizeHandle}
            title="Drag to resize"
          >
            ⤡
          </div>
        </div>
      )}

      {!selectedData && points.length > 0 && (
        <div style={styles.hint}>🖱️ Click a block to view AI analysis</div>
      )}

      {/* ── Site Controls ── */}
      <div style={styles.inputOverlay}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <h4 style={{ margin: 0, fontSize: "13px" }}>Site Boundary</h4>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: isSyncing ? "#4dff88" : "#718096",
              }}
            />
            <span style={{ fontSize: "10px", color: "#94a3b8" }}>
              {isSyncing ? "Syncing..." : "Idle"}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", marginBottom: 12 }}>
          <div>
            <label style={styles.miniLabel}>Length (X)</label>
            <input
              type="number"
              value={siteArea.length}
              onChange={(e) =>
                setSiteArea({ ...siteArea, length: e.target.value })
              }
              style={styles.miniInput}
            />
          </div>
          <div>
            <label style={styles.miniLabel}>Width (Y)</label>
            <input
              type="number"
              value={siteArea.width}
              onChange={(e) =>
                setSiteArea({ ...siteArea, width: e.target.value })
              }
              style={styles.miniInput}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={styles.statBox2}>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#4dff88" }}>
              {stable}
            </div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>Stable</div>
          </div>
          <div style={styles.statBox2}>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#ff4d4d" }}>
              {critical}
            </div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>Critical</div>
          </div>
          <div style={styles.statBox2}>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#60a5fa" }}>
              {points.length}
            </div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>Total</div>
          </div>
        </div>

        <button onClick={fetchData} style={styles.syncBtn}>
          ↺ Refresh Data
        </button>
      </div>

      {/* ── 3D Scene ── */}
      <Canvas shadows style={{ background: "#1a3a5c" }}>
        <PerspectiveCamera makeDefault position={[15, 12, 15]} fov={50} />
        <OrbitControls makeDefault minDistance={5} maxDistance={50} />
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 15, 10]} intensity={1.5} castShadow />
        <spotLight
          position={[-10, 20, 10]}
          angle={0.15}
          penumbra={1}
          intensity={1}
          castShadow
        />
        <directionalLight
          position={[0, 10, 0]}
          intensity={0.5}
          color="#93c5fd"
        />

        <Plane
          args={[parseFloat(siteArea.length), parseFloat(siteArea.width)]}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[
            parseFloat(siteArea.length) / 2,
            -0.01,
            parseFloat(siteArea.width) / 2,
          ]}
          receiveShadow
        >
          <meshStandardMaterial color="#836539" transparent opacity={0.5} />
        </Plane>

        {/* Infinite ground grid */}
        <Grid
          infiniteGrid
          cellSize={1}
          cellThickness={0.5}
          cellColor="#1e3a5c"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#2563eb"
          fadeDistance={60}
          fadeStrength={1.5}
          position={[0, -0.01, 0]}
        />

        {/* Site boundary grid on top — brighter */}
        <Grid
          args={[parseFloat(siteArea.length), parseFloat(siteArea.width)]}
          cellSize={1}
          cellThickness={1}
          cellColor="#2563eb"
          sectionSize={5}
          sectionThickness={1.5}
          sectionColor="#60a5fa"
          fadeDistance={50}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid={false}
          position={[
            parseFloat(siteArea.length) / 2,
            -0.005,
            parseFloat(siteArea.width) / 2,
          ]}
        />

        {/* Vertical Y lines under each block */}
        {points.map((pt, index) => (
          <line key={`yline-${index}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={
                  new Float32Array([
                    parseFloat(pt.posX),
                    0,
                    parseFloat(pt.posY),
                    parseFloat(pt.posX),
                    -parseFloat(pt.depth),
                    parseFloat(pt.posY),
                  ])
                }
                count={2}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#60a5fa" opacity={0.6} transparent />
          </line>
        ))}

        {points.map((pt, index) => (
          <FoundationPoint
            key={index}
            data={pt}
            isSelected={
              selectedData &&
              selectedData.posX === pt.posX &&
              selectedData.posY === pt.posY
            }
            onClick={handleClick}
          />
        ))}
      </Canvas>

      {/* ── Legend ── */}
      <div style={styles.legend}>
        <div style={styles.legendRow}>
          <div style={{ ...styles.dot, background: "#4dff88" }} /> Safe (FS ≥
          1.2)
        </div>
        <div style={styles.legendRow}>
          <div style={{ ...styles.dot, background: "#ff4d4d" }} /> Critical (FS
          &lt; 1.2)
        </div>
        <div style={styles.legendRow}>
          <div style={{ ...styles.dot, background: "#ffffff" }} /> Selected
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: "100%",
    height: "100vh",
    background: "#1a3a5c",
    position: "relative",
    overflow: "hidden",
  },
  panel: {
    position: "absolute",
    top: "20px",
    left: "20px",
    zIndex: 100,
    background: "rgba(13, 20, 36, 0.97)",
    color: "white",
    borderRadius: "12px",
    border: "1px solid #1e293b",
    boxShadow: "0 10px 40px rgba(0,0,0,0.7)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minWidth: "340px",
    minHeight: "240px",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    borderBottom: "1px solid #1e293b",
    background: "rgba(30, 41, 59, 0.6)",
    flexShrink: 0,
  },
  closeBtn: {
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#94a3b8",
    borderRadius: "6px",
    width: "26px",
    height: "26px",
    cursor: "pointer",
    fontSize: "11px",
  },
  panelBody: { flex: 1, overflowY: "auto", padding: "12px 16px 28px" },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "0.7fr 1fr 1fr",
    gap: "8px",
    marginBottom: "12px",
  },
  statBox: {
    background: "#0f172a",
    borderRadius: "8px",
    padding: "8px",
    textAlign: "center",
    border: "1px solid #1e293b",
  },
  statBox2: {
    flex: 1,
    background: "rgba(0,0,0,0.3)",
    borderRadius: "6px",
    padding: "8px 4px",
    textAlign: "center",
    border: "1px solid #334155",
  },
  statLabel: {
    fontSize: "8px",
    color: "#475569",
    letterSpacing: "0.8px",
    marginBottom: "4px",
  },
  statValue: { fontSize: "13px", fontWeight: "bold", color: "#f1f5f9" },
  section: { marginBottom: "8px" },
  divider: { borderColor: "#1e293b", margin: "10px 0" },
  resizeHandle: {
    position: "absolute",
    bottom: "0px",
    right: "0px",
    width: "20px",
    height: "20px",
    background: "rgba(30, 41, 59, 0.95)",
    borderTop: "1px solid #334155",
    borderLeft: "1px solid #334155",
    borderRadius: "4px 0 12px 0",
    color: "#ffffff",
    cursor: "nwse-resize",
    fontSize: "12px",
    userSelect: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    flexShrink: 0,
  },
  hint: {
    position: "absolute",
    bottom: "70px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(30, 41, 59, 0.8)",
    color: "#94a3b8",
    fontSize: "12px",
    padding: "8px 16px",
    borderRadius: "20px",
    border: "1px solid #334155",
    zIndex: 10,
    pointerEvents: "none",
  },
  inputOverlay: {
    position: "absolute",
    top: "20px",
    right: "20px",
    zIndex: 10,
    background: "rgba(30, 41, 59, 0.9)",
    padding: "15px",
    borderRadius: "10px",
    color: "white",
    border: "1px solid #4a5568",
    minWidth: 180,
  },
  miniLabel: {
    display: "block",
    fontSize: "10px",
    color: "#94a3b8",
    marginBottom: "4px",
  },
  miniInput: {
    width: "80px",
    background: "#0f172a",
    border: "1px solid #4a5568",
    color: "white",
    padding: "6px",
    borderRadius: "4px",
    outline: "none",
  },
  syncBtn: {
    width: "100%",
    padding: "8px",
    background: "#3b82f6",
    border: "none",
    color: "white",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px",
  },
  legend: {
    position: "absolute",
    bottom: "60px",
    left: "20px",
    padding: "12px",
    background: "rgba(15, 23, 42, 0.7)",
    borderRadius: "8px",
    border: "1px solid #334155",
  },
  legendRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "white",
    fontSize: "12px",
    marginBottom: "5px",
  },
  dot: { width: "10px", height: "10px", borderRadius: "2px" },
};

export default Visualizer;
