import { T } from "../constants/theme";
import { Ic, IBox } from "./Ic";

function ProgressBar({ pct, color = T.purple, h = 6 }) {
  return (
    <div style={{ height: h, borderRadius: h / 2, background: T.elevated, overflow: "hidden" }}>
      <div style={{
        height: "100%",
        width: `${Math.min(pct, 100)}%`,
        background: `linear-gradient(90deg, ${color}, ${color}CC)`,
        borderRadius: h / 2,
        transition: "width 0.5s ease",
      }} />
    </div>
  );
}

export default function StatCard({ label, value, sub, subColor, color, icon, progress }) {
  return (
    <div style={{
      background: `linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0)), ${T.card}`,
      border: `1px solid ${T.border}`,
      borderRadius: 16,
      padding: 20,
      boxShadow: "0 12px 30px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.05)",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>{label}</div>
        <IBox icon={icon} color={color} size={36} />
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: T.text, marginBottom: 6 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: subColor || T.textMuted }}>{sub}</div>}
      {progress !== undefined && (
        <div style={{ marginTop: 8 }}>
          <ProgressBar pct={progress} color={color} />
        </div>
      )}
    </div>
  );
}
