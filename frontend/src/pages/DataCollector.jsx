// DataCollector.jsx
import React, { useState } from "react";

const BUILDING_OPTIONS = [
  "Residential",
  "Commercial",
  "Industrial",
  "Infrastructure (Bridge/Dam)",
  "Temporary Structure",
];

const SOIL_TYPES = [
  "Clay",
  "Sandy Clay",
  "Sand",
  "Gravel",
  "Silt",
  "Loam",
  "Rock",
  "Peat",
];

const initialRow = {
  // identification
  buildingType: "Residential",
  soilType: "Clay",
  sptN: "",
  // mohr-coulomb
  cohesion: "",
  normalStress: "",
  frictionAngle: "",
  shearStress: "",
  porePressure: "",
  // terzaghi extras
  unitWeight: "",
  foundationWidth: "",
  foundationDepth: "",
  groundwaterDepth: "",
  appliedLoad: "",
  // spatial
  posX: "",
  posY: "",
  depth: "",
};

// ── Field metadata ─────────────────────────────────────────────────────────
const MOHR_FIELDS = [
  { key: "cohesion", label: "Cohesion c' (kPa)", hint: "e.g. 25" },
  { key: "normalStress", label: "Normal Stress σ' (kPa)", hint: "e.g. 100" },
  { key: "frictionAngle", label: "Friction Angle φ' (°)", hint: "e.g. 30" },
  { key: "shearStress", label: "Shear Stress τ (kPa)", hint: "e.g. 60" },
  { key: "porePressure", label: "Pore Pressure u (kPa)", hint: "e.g. 0" },
];

const TERZAGHI_FIELDS = [
  { key: "unitWeight", label: "Unit Weight γ (kN/m³)", hint: "e.g. 18" },
  { key: "foundationWidth", label: "Foundation Width B (m)", hint: "e.g. 1.5" },
  {
    key: "foundationDepth",
    label: "Foundation Depth Df (m)",
    hint: "e.g. 1.5",
  },
  { key: "groundwaterDepth", label: "Groundwater Depth (m)", hint: "e.g. 3.8" },
  { key: "appliedLoad", label: "Applied Load (kN/m²)", hint: "e.g. 150" },
];

const SPATIAL_FIELDS = [
  { key: "posX", label: "Position X (m)", hint: "e.g. 5" },
  { key: "posY", label: "Position Y (m)", hint: "e.g. 10" },
  { key: "depth", label: "Depth (m)", hint: "e.g. 1.5" },
];

// ── Mohr-Coulomb FS (client-side preview) ─────────────────────────────────
function calcFsPreview(row) {
  const { cohesion, normalStress, frictionAngle, shearStress, porePressure } =
    row;
  if (!cohesion || !normalStress || !frictionAngle || !shearStress) return null;
  const phi = (parseFloat(frictionAngle) * Math.PI) / 180;
  const u = parseFloat(porePressure) || 0;
  const fs =
    (parseFloat(cohesion) + (parseFloat(normalStress) - u) * Math.tan(phi)) /
    parseFloat(shearStress);
  return fs.toFixed(2);
}

// ── Sub-components ─────────────────────────────────────────────────────────
function SectionHeader({ label, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: "bold",
          letterSpacing: 1,
          color: "#4a5568",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: "#a0aec0", marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function NumInput({ label, fieldKey, value, onChange, hint }) {
  return (
    <div style={styles.inputGroup}>
      <label style={styles.label}>{label}</label>
      <input
        style={styles.input}
        type="number"
        placeholder={hint || "0.00"}
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
      />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
const DataCollector = () => {
  const [rows, setRows] = useState([]);
  const [current, setCurrent] = useState(initialRow);
  const [pushing, setPushing] = useState(false);

  const handleChange = (key, val) => setCurrent((c) => ({ ...c, [key]: val }));

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split("\n");
      const newRows = [];
      // CSV column order:
      // buildingType,soilType,sptN,cohesion,normalStress,frictionAngle,shearStress,
      // porePressure,unitWeight,foundationWidth,foundationDepth,groundwaterDepth,
      // appliedLoad,posX,posY,depth
      for (let i = 1; i < lines.length; i++) {
        const c = lines[i].split(",");
        if (c.length >= 16) {
          const row = {
            buildingType: c[0].trim(),
            soilType: c[1].trim(),
            sptN: c[2].trim(),
            cohesion: c[3].trim(),
            normalStress: c[4].trim(),
            frictionAngle: c[5].trim(),
            shearStress: c[6].trim(),
            porePressure: c[7].trim(),
            unitWeight: c[8].trim(),
            foundationWidth: c[9].trim(),
            foundationDepth: c[10].trim(),
            groundwaterDepth: c[11].trim(),
            appliedLoad: c[12].trim(),
            posX: c[13].trim(),
            posY: c[14].trim(),
            depth: c[15].trim(),
          };
          row.fs = calcFsPreview(row);
          row.id = Date.now() + i;
          newRows.push(row);
        }
      }
      setRows((prev) => [...prev, ...newRows]);
    };
    reader.readAsText(file);
  };

  const addRow = () => {
    const fs = calcFsPreview(current);
    setRows((prev) => [...prev, { ...current, fs, id: Date.now() }]);
    setCurrent(initialRow);
  };

  const pushToBackend = async () => {
    if (rows.length === 0) return;
    setPushing(true);
    try {
      const res = await fetch("http://localhost:8000/api/data-ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows),
      });
      if (res.ok) {
        const data = await res.json();
        alert(
          `✅ Successfully pushed ${data.processed_count} records!\n\nLatest AI advice:\n${data.latest_ai_advice}`,
        );
      } else {
        alert("❌ Server returned an error.");
      }
    } catch (err) {
      alert(
        `❌ Backend not found. Make sure Python server is running on port 8000.\n${err.message}`,
      );
    } finally {
      setPushing(false);
    }
  };

  const fsPreview = calcFsPreview(current);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={styles.title}>Foundation Data Entry</h2>
        <p style={styles.subtitle}>
          Enter soil parameters for Mohr-Coulomb FS and Terzaghi bearing
          capacity analysis
        </p>
      </header>

      {/* CSV Import */}
      <div style={styles.csvBox}>
        <label style={styles.label}>Import Dataset (.csv)</label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          style={{ marginTop: 8, display: "block" }}
        />
        <div style={{ fontSize: 11, color: "#a0aec0", marginTop: 6 }}>
          CSV columns: buildingType, soilType, sptN, cohesion, normalStress,
          frictionAngle, shearStress, porePressure, unitWeight, foundationWidth,
          foundationDepth, groundwaterDepth, appliedLoad, posX, posY, depth
        </div>
      </div>

      <div style={styles.inputCard}>
        {/* ── Identification ── */}
        <div
          style={{
            marginBottom: 24,
            paddingBottom: 20,
            borderBottom: "1px solid #edf2f7",
          }}
        >
          <SectionHeader label="Identification" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
            }}
          >
            <div style={styles.inputGroup}>
              <label style={styles.label}>Building Category</label>
              <select
                style={{ ...styles.input, cursor: "pointer" }}
                value={current.buildingType}
                onChange={(e) => handleChange("buildingType", e.target.value)}
              >
                {BUILDING_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Soil Type</label>
              <select
                style={{ ...styles.input, cursor: "pointer" }}
                value={current.soilType}
                onChange={(e) => handleChange("soilType", e.target.value)}
              >
                {SOIL_TYPES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <NumInput
              label="SPT N-Value"
              fieldKey="sptN"
              value={current.sptN}
              onChange={handleChange}
              hint="e.g. 22"
            />
          </div>
        </div>

        {/* ── Mohr-Coulomb ── */}
        <div
          style={{
            marginBottom: 24,
            paddingBottom: 20,
            borderBottom: "1px solid #edf2f7",
          }}
        >
          <SectionHeader
            label="Mohr-Coulomb Parameters"
            sub="Used to calculate Factor of Safety (FS)"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 20,
            }}
          >
            {MOHR_FIELDS.map((f) => (
              <NumInput
                key={f.key}
                label={f.label}
                fieldKey={f.key}
                value={current[f.key]}
                onChange={handleChange}
                hint={f.hint}
              />
            ))}
          </div>
          {/* Live FS preview */}
          {fsPreview && (
            <div
              style={{
                marginTop: 12,
                padding: "10px 16px",
                borderRadius: 6,
                background: parseFloat(fsPreview) < 1.2 ? "#fff5f5" : "#f0fff4",
                border: `1px solid ${parseFloat(fsPreview) < 1.2 ? "#feb2b2" : "#9ae6b4"}`,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 12, color: "#4a5568" }}>
                Live FS Preview (Mohr-Coulomb):
              </span>
              <strong
                style={{
                  color: parseFloat(fsPreview) < 1.2 ? "#c53030" : "#276749",
                  fontSize: 16,
                }}
              >
                {fsPreview}
              </strong>
              <span
                style={{
                  fontSize: 11,
                  color: parseFloat(fsPreview) < 1.2 ? "#c53030" : "#276749",
                }}
              >
                {parseFloat(fsPreview) < 1.2 ? "⚠ Critical" : "✓ Stable"}
              </span>
            </div>
          )}
        </div>

        {/* ── Terzaghi ── */}
        <div
          style={{
            marginBottom: 24,
            paddingBottom: 20,
            borderBottom: "1px solid #edf2f7",
          }}
        >
          <SectionHeader
            label="Bearing Capacity Parameters"
            sub="Used for Terzaghi ultimate & allowable bearing capacity"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 20,
            }}
          >
            {TERZAGHI_FIELDS.map((f) => (
              <NumInput
                key={f.key}
                label={f.label}
                fieldKey={f.key}
                value={current[f.key]}
                onChange={handleChange}
                hint={f.hint}
              />
            ))}
          </div>
        </div>

        {/* ── Spatial ── */}
        <div style={{ marginBottom: 20 }}>
          <SectionHeader
            label="Spatial Coordinates"
            sub="3D position for the visualizer"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
            }}
          >
            {SPATIAL_FIELDS.map((f) => (
              <NumInput
                key={f.key}
                label={f.label}
                fieldKey={f.key}
                value={current[f.key]}
                onChange={handleChange}
                hint={f.hint}
              />
            ))}
          </div>
        </div>

        <button onClick={addRow} style={styles.addButton}>
          + Add Row to Dataset
        </button>
      </div>

      {/* Table */}
      {rows.length > 0 && (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                {[
                  "Type",
                  "Soil",
                  "SPT",
                  "c' (kPa)",
                  "σ' (kPa)",
                  "φ' (°)",
                  "τ (kPa)",
                  "u (kPa)",
                  "γ",
                  "B",
                  "Df",
                  "GW",
                  "Load",
                  "X / Y / Z",
                  "FS",
                  "Status",
                ].map((h) => (
                  <th key={h} style={styles.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={styles.tr}>
                  <td style={styles.td}>{r.buildingType}</td>
                  <td style={styles.td}>{r.soilType}</td>
                  <td style={styles.td}>{r.sptN}</td>
                  <td style={styles.td}>{r.cohesion}</td>
                  <td style={styles.td}>{r.normalStress}</td>
                  <td style={styles.td}>{r.frictionAngle}°</td>
                  <td style={styles.td}>{r.shearStress}</td>
                  <td style={styles.td}>{r.porePressure}</td>
                  <td style={styles.td}>{r.unitWeight}</td>
                  <td style={styles.td}>{r.foundationWidth}</td>
                  <td style={styles.td}>{r.foundationDepth}</td>
                  <td style={styles.td}>{r.groundwaterDepth}</td>
                  <td style={styles.td}>{r.appliedLoad}</td>
                  <td style={styles.td}>
                    {r.posX}, {r.posY}, {r.depth}
                  </td>
                  <td
                    style={{
                      ...styles.td,
                      fontWeight: "bold",
                      color: parseFloat(r.fs) < 1.2 ? "#d32f2f" : "#2e7d32",
                    }}
                  >
                    {r.fs}
                  </td>
                  <td style={styles.td}>
                    <span
                      style={
                        parseFloat(r.fs) < 1.2
                          ? styles.badgeDanger
                          : styles.badgeSuccess
                      }
                    >
                      {parseFloat(r.fs) < 1.2 ? "Critical" : "Stable"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        onClick={pushToBackend}
        disabled={pushing || rows.length === 0}
        style={{
          ...styles.submitButton,
          opacity: pushing || rows.length === 0 ? 0.6 : 1,
          cursor: pushing || rows.length === 0 ? "not-allowed" : "pointer",
        }}
      >
        {pushing
          ? "⟳ Pushing..."
          : `Push ${rows.length} Records to Python Engine`}
      </button>
    </div>
  );
};

const styles = {
  container: {
    padding: "40px",
    maxWidth: "1400px",
    margin: "0 auto",
    fontFamily: '"Segoe UI", Tahoma, sans-serif',
    backgroundColor: "#f9fafb",
  },
  header: { marginBottom: 30 },
  title: { margin: 0, color: "#1a202c", fontSize: 24 },
  subtitle: { color: "#718096", marginTop: 5, fontSize: 14 },
  csvBox: {
    marginBottom: 20,
    padding: 15,
    border: "1px dashed #cbd5e0",
    borderRadius: 8,
  },
  inputCard: {
    background: "#fff",
    padding: 25,
    borderRadius: 12,
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
    marginBottom: 30,
  },
  inputGroup: { display: "flex", flexDirection: "column", gap: 8 },
  label: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#4a5568",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  input: {
    padding: 10,
    borderRadius: 6,
    border: "1px solid #e2e8f0",
    fontSize: 14,
    outline: "none",
    backgroundColor: "#fff",
  },
  addButton: {
    width: "100%",
    padding: 12,
    background: "#3182ce",
    color: "white",
    border: "none",
    borderRadius: 6,
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: 14,
  },
  tableWrapper: {
    background: "#fff",
    borderRadius: 12,
    overflow: "auto",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
    marginBottom: 20,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    minWidth: 1200,
  },
  th: {
    padding: "12px 10px",
    background: "#edf2f7",
    color: "#4a5568",
    fontSize: 11,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px 10px",
    borderBottom: "1px solid #edf2f7",
    fontSize: 12,
    color: "#2d3748",
    whiteSpace: "nowrap",
  },
  tr: { transition: "background 0.2s" },
  badgeSuccess: {
    background: "#c6f6d5",
    color: "#22543d",
    padding: "3px 7px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: "bold",
  },
  badgeDanger: {
    background: "#fed7d7",
    color: "#822727",
    padding: "3px 7px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: "bold",
  },
  submitButton: {
    width: "100%",
    padding: 15,
    background: "#2d3748",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontSize: 16,
    fontWeight: "bold",
  },
};

export default DataCollector;
