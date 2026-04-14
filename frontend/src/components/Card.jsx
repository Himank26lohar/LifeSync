import { T } from "../constants/theme";

export default function Card({ children, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      className="ls-card"
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 20,
        padding: 20,
        cursor: onClick ? "pointer" : "default",
        backgroundImage: "none",
        boxShadow: "var(--surface-shadow), inset 0 1px 0 rgba(255,255,255,0.12)",
        transition: "background-color 0.18s ease, border-color 0.18s ease, transform 0.22s ease, box-shadow 0.22s ease",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
