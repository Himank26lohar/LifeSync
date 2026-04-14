import { T } from "../constants/theme";

// SVG Icon renderer
export function Ic({ d, size = 18, color = "currentColor", sw = 1.8 }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {Array.isArray(d)
        ? d.map((p, i) => <path key={i} d={p} />)
        : <path d={d} />
      }
    </svg>
  );
}

// Colored square box with icon inside
export function IBox({ icon, color, size = 38 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: 14,
      background: T.elevated,
      border: `1px solid ${T.border}`,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 18px rgba(0,0,0,0.12)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color, flexShrink: 0,
    }}>
      <Ic d={icon} size={size * 0.42} color={color} />
    </div>
  );
}

// Small colored pill badge
export function Badge({ label, color }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700,
      padding: "2px 8px", borderRadius: 20,
      background: `${color}14`, color,
      border: `1px solid ${color}2A`,
      textTransform: "uppercase", letterSpacing: 0.5,
    }}>
      {label}
    </span>
  );
}

// Button
export function Btn({ children, onClick, color = T.purple, outline = false, style = {} }) {
  return (
    <button onClick={onClick} className="ls-btn-core" style={{
      padding: "8px 16px", borderRadius: 12, cursor: "pointer",
      fontSize: 13, fontWeight: 600,
      display: "inline-flex", alignItems: "center", gap: 6,
      border: `1px solid ${outline ? T.border : T.borderSoft || T.border}`,
      background: outline ? "transparent" : color,
      color: outline ? T.text : "#fff",
      boxShadow: outline
        ? "none"
        : "0 8px 18px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)",
      transition: "background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease",
      ...style,
    }}>
      {children}
    </button>
  );
}

// Text input
export function Inp({ style = {}, ...props }) {
  return (
    <input className="ls-input" style={{
      width: "100%", background: T.elevated,
      border: `1px solid ${T.borderSoft || T.border}`,
      borderRadius: 12, padding: "10px 12px",
      color: T.text, fontSize: 14, outline: "none",
      boxSizing: "border-box",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
      transition: "border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease",
      ...style,
    }} {...props} />
  );
}

// Select dropdown
export function Sel({ children, style = {}, ...props }) {
  return (
    <select className="ls-select" style={{
      width: "100%", background: T.elevated,
      border: `1px solid ${T.borderSoft || T.border}`,
      borderRadius: 12, padding: "10px 12px",
      color: T.text, fontSize: 14, outline: "none",
      boxSizing: "border-box",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
      transition: "border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease",
      ...style,
    }} {...props}>
      {children}
    </select>
  );
}

// Small label above inputs
export function Lbl({ children }) {
  return (
    <div style={{
      fontSize: 11, color: T.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1, marginBottom: 6,
    }}>
      {children}
    </div>
  );
}

// Progress bar
export function ProgressBar({ pct, color = T.purple, h = 6 }) {
  return (
    <div style={{ height: h, borderRadius: h / 2, background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${Math.min(pct, 100)}%`,
        background: color, borderRadius: h / 2,
        transition: "width 0.5s ease",
      }} />
    </div>
  );
}

// Loading spinner
export function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        border: `3px solid ${T.border}`,
        borderTop: `3px solid ${T.blue}`,
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
