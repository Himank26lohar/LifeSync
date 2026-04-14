import { useEffect, useState } from "react";
import { T } from "../constants/theme";
import { P } from "../constants/icons";
import { Ic } from "./Ic";
import { logout } from "../api/auth";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: P.dashboard },
  { id: "tasks", label: "Tasks", icon: P.tasks },
  { id: "habits", label: "Habits", icon: P.habits },
  { id: "wellness", label: "Wellness", icon: P.wellness },
  { id: "time", label: "Time", icon: P.time },
  { id: "journal", label: "Journal", icon: P.journal },
  { id: "ai", label: "AI Insights", icon: P.ai },
];

const MOBILE_NAV = [
  { id: "dashboard", label: "Home", icon: P.dashboard },
  { id: "tasks", label: "Tasks", icon: P.tasks },
  { id: "habits", label: "Habits", icon: P.habits },
  { id: "wellness", label: "Wellness", icon: P.wellness },
  { id: "time", label: "Time", icon: P.time },
  { id: "journal", label: "Journal", icon: P.journal },
  { id: "ai", label: "AI", icon: P.ai },
  { id: "profile", label: "Profile", icon: P.user },
];

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  return width;
}

export default function Sidebar({ page, setPage, open, setOpen, session, onSignOut }) {
  const width = useWindowWidth();
  const isMobile = width <= 768;

  const handleLogout = async () => {
    await logout();
    if (onSignOut) {
      onSignOut();
    }
  };

  useEffect(() => {
    if (isMobile) setOpen(false);
    else setOpen(true);
  }, [isMobile, setOpen]);

  if (isMobile) {
    return (
      <div className="bottom-nav">
        {MOBILE_NAV.map((n) => {
          const active = page === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setPage(n.id)}
              className={`bottom-nav__item${active ? " is-active" : ""}`}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                padding: "8px 10px",
                color: active ? T.text : T.textMuted,
                flexShrink: 0,
                minWidth: 64,
              }}
            >
              <Ic d={n.icon} size={20} color={active ? T.text : T.textMuted} />
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 400 }}>{n.label}</span>
              {active && <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.purple }} />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          top: "55%",
          transform: "translateY(-50%)",
          left: open ? 242 : 16,
          zIndex: 260,
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "var(--sidebar-strong)",
          border: `1px solid ${T.border}`,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 18px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
          transition: "left 0.3s ease, transform 0.18s ease, box-shadow 0.18s ease",
        }}
      >
        <span style={{ color: T.text, fontSize: 20, lineHeight: 1 }}>{open ? "<" : ">"}</span>
      </button>

      <div
        className="sidebar-desktop"
        style={{
          width: open ? 254 : 0,
          background: "var(--sidebar)",
          border: `1px solid ${T.border}`,
          display: "flex",
          flexDirection: "column",
          padding: open ? "22px 0" : 0,
          flexShrink: 0,
          position: "fixed",
          top: 20,
          left: 18,
          zIndex: 240,
          height: "calc(100vh - 40px)",
          overflow: "hidden",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          borderRadius: 30,
          boxShadow: "0 14px 28px rgba(82, 65, 39, 0.12), 8px 0 18px rgba(0, 0, 0, 0.06), inset 1px 0 0 rgba(255,255,255,0.14)",
          transform: open ? "translateX(0)" : "translateX(-18px)",
          transition: "width 0.3s ease, opacity 0.3s ease, padding 0.3s ease, transform 0.3s ease",
        }}
      >
        <div style={{ padding: "0 18px 22px", borderBottom: `1px solid ${T.borderSoft}`, whiteSpace: "nowrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: "#d97706",
                border: `1px solid ${T.border}`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 10px 18px rgba(74,56,30,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Ic d={P.ai} size={16} color={T.white} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text, fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", "Inter", sans-serif', letterSpacing: "-0.02em" }}>
                LifeSync AI
              </div>
              <div style={{ fontSize: 10, color: T.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Your wellness companion
              </div>
            </div>
          </div>
        </div>

        <nav style={{ padding: "14px 10px", flex: 1, whiteSpace: "nowrap" }}>
          {NAV.map((n) => {
            const active = page === n.id;
            return (
              <button
                key={n.id}
                type="button"
                className={`sidebar-nav-item${active ? " is-active" : ""}`}
                onClick={() => setPage(n.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderRadius: 16,
                  cursor: "pointer",
                  marginBottom: 8,
                  background: active ? "var(--accent-dark)" : "transparent",
                  color: active ? T.white : T.text,
                  fontWeight: active ? 600 : 400,
                  fontSize: 13.5,
                  border: active ? `1px solid ${T.purple}` : "1px solid transparent",
                  boxShadow: active
                    ? "0 10px 18px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255,255,255,0.14)"
                    : "none",
                  transition: "all 0.18s ease",
                  textAlign: "left",
                  appearance: "none",
                  outline: "none",
                }}
              >
                <Ic d={n.icon} size={16} color={active ? T.white : T.text} />
                {n.label}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          className="sidebar-profile-button"
          onClick={() => setPage("profile")}
          style={{
            padding: "14px 16px",
            borderTop: `1px solid ${T.borderSoft}`,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 10,
            whiteSpace: "nowrap",
            width: "100%",
            background: "transparent",
            color: T.text,
            textAlign: "left",
            borderLeft: "none",
            borderRight: "none",
            borderBottom: "none",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#ec8a18",
              border: `1px solid ${T.border}`,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 14px rgba(74,56,30,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: T.text,
              flexShrink: 0,
            }}
          >
            HL
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{session?.user?.username || "Guest User"}</div>
            <div style={{ fontSize: 11, color: T.textMuted, letterSpacing: "0.05em", textTransform: "uppercase" }}>Signed in</div>
          </div>
        </button>
        <button
          onClick={handleLogout}
          style={{
            margin: "0 16px 4px",
            padding: "10px 14px",
            borderRadius: 14,
            border: `1px solid ${T.borderSoft}`,
            background: "rgba(61, 48, 32, 0.04)",
            color: T.textMuted,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          Sign out
        </button>
      </div>
    </>
  );
}
