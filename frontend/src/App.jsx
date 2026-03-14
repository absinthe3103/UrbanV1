// App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import Visualizer from "./components/Visualizer";
import DataCollector from "./pages/DataCollector";

const NavLink = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      style={{
        textDecoration: "none",
        padding: "6px 16px",
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.03em",
        color: isActive ? "#ffffff" : "#94a3b8",
        background: isActive ? "rgba(59,130,246,0.2)" : "transparent",
        border: isActive
          ? "1px solid rgba(59,130,246,0.4)"
          : "1px solid transparent",
        transition: "all 0.15s",
      }}
    >
      {children}
    </Link>
  );
};

function App() {
  return (
    <Router>
      <div
        style={{
          fontFamily: "'Segoe UI', Tahoma, sans-serif",
          minHeight: "100vh",
          background: "#1a3a5c",
        }}
      >
        {/* ── Nav ── */}
        <nav
          style={{
            padding: "16px 40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#0d1f3c",
            borderBottom: "1px solid #2563eb",
            position: "sticky",
            top: 0,
            zIndex: 200,
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 18 }}>🏗️</div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#f1f5f9",
                  letterSpacing: "0.04em",
                }}
              >
                Urban Foundation Guardian
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: "#a2a4a8",
                  letterSpacing: "0.1em",
                }}
              >
                城市地基守护者
              </div>
            </div>
          </div>

          {/* Nav links */}
          <div style={{ display: "flex", gap: 6 }}>
            <NavLink to="/">📊 Dashboard</NavLink>
            <NavLink to="/collect">📝 Data Entry</NavLink>
          </div>
        </nav>

        {/* ── Routes ── */}
        <Routes>
          <Route path="/" element={<Visualizer />} />
          <Route path="/collect" element={<DataCollector />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
