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
  buildingType: "Residential",
  soilType: "Clay",
  sptN: "",
  cohesion: "",
  normalStress: "",
  frictionAngle: "",
  shearStress: "",
  porePressure: "",
  unitWeight: "",
  foundationWidth: "",
  foundationDepth: "",
  groundwaterDepth: "",
  appliedLoad: "",
  posX: "",
  posY: "",
  depth: "",
};

const MOHR_FIELDS = [
  { key: "cohesion", label: "Cohesion c'", unit: "kPa", hint: "25" },
  { key: "normalStress", label: "Normal Stress σ'", unit: "kPa", hint: "100" },
  { key: "frictionAngle", label: "Friction Angle φ'", unit: "°", hint: "30" },
  { key: "shearStress", label: "Shear Stress τ", unit: "kPa", hint: "60" },
  { key: "porePressure", label: "Pore Pressure u", unit: "kPa", hint: "0" },
];

const TERZAGHI_FIELDS = [
  { key: "unitWeight", label: "Unit Weight γ", unit: "kN/m³", hint: "18" },
  {
    key: "foundationWidth",
    label: "Foundation Width B",
    unit: "m",
    hint: "1.5",
  },
  {
    key: "foundationDepth",
    label: "Foundation Depth Df",
    unit: "m",
    hint: "1.5",
  },
  {
    key: "groundwaterDepth",
    label: "Groundwater Depth",
    unit: "m",
    hint: "3.8",
  },
  { key: "appliedLoad", label: "Applied Load", unit: "kN/m²", hint: "150" },
];

const SPATIAL_FIELDS = [
  { key: "posX", label: "Position X", unit: "m", hint: "5" },
  { key: "posY", label: "Position Y", unit: "m", hint: "10" },
  { key: "depth", label: "Depth", unit: "m", hint: "1.5" },
];

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

function SectionHeader({ icon, label, sub }) {
  return (
    <div
      style={{
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 3,
          height: 28,
          background: "linear-gradient(to bottom, #3b82f6, #93c5fd)",
          borderRadius: 2,
          flexShrink: 0,
        }}
      />
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
            color: "#374151",
            textTransform: "uppercase",
          }}
        >
          {icon} {label}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function NumInput({ label, unit, fieldKey, value, onChange, hint }) {
  return (
    <div style={s.inputGroup}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 5,
        }}
      >
        <label style={s.label}>{label}</label>
        <span style={s.unit}>{unit}</span>
      </div>
      <input
        style={s.input}
        type="number"
        placeholder={hint || "0"}
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        onFocus={(e) => {
          e.target.style.borderColor = "#3b82f6";
          e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#e2e8f0";
          e.target.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

function SelectInput({ label, fieldKey, value, onChange, options }) {
  return (
    <div style={s.inputGroup}>
      <label style={{ ...s.label, marginBottom: 5, display: "block" }}>
        {label}
      </label>
      <select
        style={{ ...s.input, cursor: "pointer" }}
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        onFocus={(e) => {
          e.target.style.borderColor = "#3b82f6";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#e2e8f0";
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function Card({ children, style }) {
  return <div style={{ ...s.card, ...style }}>{children}</div>;
}

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
          `✅ Successfully pushed ${data.processed_count} records! Head to the Dashboard to view the 3D analysis.`,
        );
        window.location.href = "/";
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
  const fsStable = fsPreview && parseFloat(fsPreview) >= 1.2;
  const totalRows = rows.length;
  const critCount = rows.filter((r) => parseFloat(r.fs) < 1.2).length;
  const stabCount = totalRows - critCount;

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <div style={s.header}>
        <div>
          <div style={s.eyebrow}>URBAN FOUNDATION GUARDIAN</div>
          <h1 style={s.title}>Foundation Data Entry</h1>
          <p style={s.subtitle}>
            Mohr-Coulomb FS · Terzaghi Bearing Capacity · AI Analysis
          </p>
        </div>
        {totalRows > 0 && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div
              style={{
                ...s.chip,
                background: "#dcfce7",
                border: "1px solid #86efac",
                color: "#166534",
              }}
            >
              🟢 {stabCount} Stable
            </div>
            <div
              style={{
                ...s.chip,
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                color: "#991b1b",
              }}
            >
              🔴 {critCount} Critical
            </div>
            <div
              style={{
                ...s.chip,
                background: "#dbeafe",
                border: "1px solid #93c5fd",
                color: "#1e40af",
              }}
            >
              📊 {totalRows} Total
            </div>
          </div>
        )}
      </div>

      {/* ── Top Row: CSV + FS Preview ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* CSV Import */}
        <Card>
          <SectionHeader
            icon="📂"
            label="Import Dataset"
            sub="Upload a .csv file to batch import"
          />
          <div style={s.csvDropzone}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>📁</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
              Drop CSV file or click to browse
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: "none" }}
              id="csvInput"
            />
            <label htmlFor="csvInput" style={s.csvBtn}>
              Choose File
            </label>
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#9ca3af",
              marginTop: 10,
              lineHeight: 1.7,
            }}
          >
            Columns: buildingType, soilType, sptN, cohesion, normalStress,
            frictionAngle, shearStress, porePressure, unitWeight,
            foundationWidth, foundationDepth, groundwaterDepth, appliedLoad,
            posX, posY, depth
          </div>
        </Card>

        {/* FS Preview */}
        <Card
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background: fsPreview
              ? fsStable
                ? "#f0fdf4"
                : "#fff5f5"
              : "#f8fafc",
            border: fsPreview
              ? `1px solid ${fsStable ? "#86efac" : "#fca5a5"}`
              : "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#9ca3af",
              letterSpacing: 2,
              marginBottom: 8,
            }}
          >
            LIVE FS PREVIEW
          </div>
          {fsPreview ? (
            <>
              <div
                style={{
                  fontSize: 60,
                  fontWeight: 900,
                  color: fsStable ? "#16a34a" : "#dc2626",
                  lineHeight: 1,
                  fontFamily: "monospace",
                }}
              >
                {fsPreview}
              </div>
              <div
                style={{
                  marginTop: 14,
                  padding: "6px 24px",
                  borderRadius: 20,
                  background: fsStable ? "#dcfce7" : "#fee2e2",
                  color: fsStable ? "#166534" : "#991b1b",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 1,
                }}
              >
                {fsStable ? "✓ STABLE" : "⚠ CRITICAL"}
              </div>
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 10 }}>
                Fs = (c' + (σ−u)·tanφ') / τ
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  fontSize: 60,
                  fontWeight: 900,
                  color: "#d1d5db",
                  lineHeight: 1,
                }}
              >
                —
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  marginTop: 12,
                  textAlign: "center",
                }}
              >
                Fill in Mohr-Coulomb
                <br />
                parameters to preview
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── Input Form ── */}
      <Card style={{ marginBottom: 16 }}>
        {/* Identification */}
        <div style={s.section}>
          <SectionHeader icon="🏷️" label="Identification" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
          >
            <SelectInput
              label="Building Category"
              fieldKey="buildingType"
              value={current.buildingType}
              onChange={handleChange}
              options={BUILDING_OPTIONS}
            />
            <SelectInput
              label="Soil Type"
              fieldKey="soilType"
              value={current.soilType}
              onChange={handleChange}
              options={SOIL_TYPES}
            />
            <NumInput
              label="SPT N-Value"
              unit="N"
              fieldKey="sptN"
              value={current.sptN}
              onChange={handleChange}
              hint="22"
            />
          </div>
        </div>

        <div style={s.divider} />

        {/* Mohr-Coulomb */}
        <div style={s.section}>
          <SectionHeader
            icon="⚖️"
            label="Mohr-Coulomb Parameters"
            sub="Used to calculate Factor of Safety (FS)"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 16,
            }}
          >
            {MOHR_FIELDS.map((f) => (
              <NumInput
                key={f.key}
                label={f.label}
                unit={f.unit}
                fieldKey={f.key}
                value={current[f.key]}
                onChange={handleChange}
                hint={f.hint}
              />
            ))}
          </div>
        </div>

        <div style={s.divider} />

        {/* Terzaghi */}
        <div style={s.section}>
          <SectionHeader
            icon="🏛️"
            label="Bearing Capacity Parameters"
            sub="Terzaghi ultimate & allowable bearing capacity"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 16,
            }}
          >
            {TERZAGHI_FIELDS.map((f) => (
              <NumInput
                key={f.key}
                label={f.label}
                unit={f.unit}
                fieldKey={f.key}
                value={current[f.key]}
                onChange={handleChange}
                hint={f.hint}
              />
            ))}
          </div>
        </div>

        <div style={s.divider} />

        {/* Spatial */}
        <div style={s.section}>
          <SectionHeader
            icon="📍"
            label="Spatial Coordinates"
            sub="3D position for the visualizer"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
          >
            {SPATIAL_FIELDS.map((f) => (
              <NumInput
                key={f.key}
                label={f.label}
                unit={f.unit}
                fieldKey={f.key}
                value={current[f.key]}
                onChange={handleChange}
                hint={f.hint}
              />
            ))}
          </div>
        </div>

        <button onClick={addRow} style={s.addBtn}>
          + Add Row to Dataset
        </button>
      </Card>

      {/* ── Table ── */}
      {rows.length > 0 && (
        <Card style={{ marginBottom: 16, padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #f1f5f9",
              background: "#f8fafc",
            }}
          >
            <SectionHeader
              icon="📋"
              label="Dataset Preview"
              sub={`${rows.length} record${rows.length !== 1 ? "s" : ""} ready to push`}
            />
          </div>
          <div style={{ overflowX: "auto", padding: "5px 5px" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {[
                    "Type",
                    "Soil",
                    "SPT",
                    "c'",
                    "σ'",
                    "φ'",
                    "τ",
                    "u",
                    "γ",
                    "B",
                    "Df",
                    "GW",
                    "Load",
                    "X/Y/Z",
                    "FS",
                    "Status",
                  ].map((h) => (
                    <th key={h} style={s.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const stable = parseFloat(r.fs) >= 1.2;
                  return (
                    <tr
                      key={r.id}
                      style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}
                    >
                      <td style={s.td}>{r.buildingType}</td>
                      <td style={s.td}>{r.soilType}</td>
                      <td style={s.td}>{r.sptN}</td>
                      <td style={s.td}>{r.cohesion}</td>
                      <td style={s.td}>{r.normalStress}</td>
                      <td style={s.td}>{r.frictionAngle}°</td>
                      <td style={s.td}>{r.shearStress}</td>
                      <td style={s.td}>{r.porePressure}</td>
                      <td style={s.td}>{r.unitWeight}</td>
                      <td style={s.td}>{r.foundationWidth}</td>
                      <td style={s.td}>{r.foundationDepth}</td>
                      <td style={s.td}>{r.groundwaterDepth}</td>
                      <td style={s.td}>{r.appliedLoad}</td>
                      <td style={s.td}>
                        {r.posX},{r.posY},{r.depth}
                      </td>
                      <td
                        style={{
                          ...s.td,
                          fontWeight: "bold",
                          color: stable ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {r.fs}
                      </td>
                      <td style={s.td}>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 10,
                            fontSize: 10,
                            fontWeight: 700,
                            background: stable ? "#dcfce7" : "#fee2e2",
                            color: stable ? "#166534" : "#991b1b",
                          }}
                        >
                          {stable ? "Stable" : "Critical"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Push Button ── */}
      <button
        onClick={pushToBackend}
        disabled={pushing || rows.length === 0}
        style={{
          ...s.pushBtn,
          opacity: pushing || rows.length === 0 ? 0.5 : 1,
          cursor: pushing || rows.length === 0 ? "not-allowed" : "pointer",
        }}
      >
        {pushing
          ? "⟳ Pushing to Python Engine..."
          : `🚀 Push ${rows.length} Records to Python Engine`}
      </button>

      {/* ── Loading bar ── */}
      {pushing && (
        <div
          style={{
            marginTop: 10,
            borderRadius: 6,
            overflow: "hidden",
            height: 4,
            background: "#e2e8f0",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #2563eb, #60a5fa, #2563eb)",
              backgroundSize: "200% 100%",
              animation: "slide 1.2s linear infinite",
            }}
          />
          <style>{`@keyframes slide { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        </div>
      )}
      {pushing && (
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "#64748b",
            marginTop: 8,
          }}
        >
          ⏳ AI analysis in progress... this may take a minute
        </p>
      )}

      {/* ── Go to Dashboard button ── */}
      <button
        onClick={() => (window.location.href = "/")}
        style={{
          width: "100%",
          marginTop: 12,
          padding: "12px",
          background: "transparent",
          border: "1px solid #cbd5e1",
          borderRadius: 10,
          color: "#64748b",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
          marginBottom: 40,
        }}
      >
        📊 Go to Dashboard
      </button>
    </div>
  );
};

const s = {
  page: {
    padding: "48px 40px 64px 40px",
    maxWidth: "1400px",
    margin: "0.1px auto 20px auto",
    fontFamily: "'Segoe UI', Tahoma, sans-serif",
    background: "#f1f5f9",
    minHeight: "100vh",
    color: "#1e293b",
  },
  header: {
    marginBottom: 24,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 3,
    color: "#3b82f6",
    marginBottom: 4,
  },
  title: { margin: 0, fontSize: 26, fontWeight: 700, color: "#0f172a" },
  subtitle: { color: "#64748b", marginTop: 4, fontSize: 13 },
  chip: {
    padding: "5px 14px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "20px 24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  section: { marginBottom: 4 },
  divider: { borderTop: "1px solid #f1f5f9", margin: "18px 0" },
  inputGroup: { display: "flex", flexDirection: "column" },
  label: {
    fontSize: 9,
    fontWeight: 700,
    color: "#64748b",
    letterSpacing: "1.2px",
    textTransform: "uppercase",
  },
  unit: { fontSize: 9, color: "#94a3b8" },
  input: {
    marginTop: 4,
    padding: "9px 11px",
    borderRadius: 7,
    border: "1px solid #e2e8f0",
    fontSize: 13,
    outline: "none",
    background: "#f8fafc",
    color: "#0f172a",
    transition: "border-color 0.15s, box-shadow 0.15s",
    width: "100%",
    boxSizing: "border-box",
  },
  csvDropzone: {
    border: "2px dashed #cbd5e1",
    borderRadius: 10,
    padding: "24px",
    textAlign: "center",
    background: "#f8fafc",
  },
  csvBtn: {
    padding: "8px 20px",
    background: "#fff",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    color: "#374151",
    fontSize: 12,
    cursor: "pointer",
    display: "inline-block",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  addBtn: {
    width: "100%",
    marginTop: 20,
    padding: "12px",
    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: "0.05em",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(59,130,246,0.3)",
  },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  th: {
    padding: "10px 9px",
    background: "#f8fafc",
    color: "#64748b",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    whiteSpace: "nowrap",
    borderBottom: "2px solid #e2e8f0",
  },
  td: {
    padding: "9px 9px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 11,
    color: "#374151",
    whiteSpace: "nowrap",
  },
  pushBtn: {
    width: "100%",
    padding: "15px",
    background: "linear-gradient(135deg, #1e40af, #2563eb)",
    border: "none",
    borderRadius: 10,
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: "0.05em",
    boxShadow: "0 4px 12px rgba(37,99,235,0.35)",
    marginBottom: 40,
  },
};

export default DataCollector;
