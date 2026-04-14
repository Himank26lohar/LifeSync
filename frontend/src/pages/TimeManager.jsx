import { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line
} from "recharts";
import { createFocusSession } from "../api/time";
import { T } from "../constants/theme";
import { Btn, Lbl } from "../components/Ic";
import Card from "../components/Card";

const pad = (n) => String(n).padStart(2, "0");
const fmtSec = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
const fmtMin = (m) => { if (m < 1) return "0m"; const h = Math.floor(m / 60); const mn = Math.round(m % 60); return h > 0 ? (mn > 0 ? `${h}h ${mn}m` : `${h}h`) : `${mn}m`; };
const toHrs = (m) => parseFloat((m / 60).toFixed(2));
const localDate = () => new Date().toLocaleDateString("en-CA");

const TT = {
  contentStyle: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, color: T.text },
  cursor: { fill: "rgba(108, 124, 240, 0.08)" },
};

const PRESETS = [
  { key: "pomodoro", label: "Pomodoro", focus: 25, breakT: 5 },
  { key: "deepwork", label: "Deep Work", focus: 50, breakT: 10 },
  { key: "quick", label: "Quick", focus: 15, breakT: 3 },
  { key: "custom", label: "Custom", focus: 25, breakT: 5 },
];

const modernInputStyle = {
  width: "100%",
  background: `linear-gradient(180deg, ${T.elevated}, ${T.card})`,
  border: `1px solid ${T.border}`,
  borderRadius: 16,
  color: T.text,
  padding: "12px 14px",
  fontSize: 13,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 24px rgba(0,0,0,0.08)",
};

export default function TimeManager({ focusSessions, setFocusSessions, tasks = [] }) {
  const [allSlots, setAllSlots] = useState([]);
  const [manualMode, setManualMode] = useState(false);
  const [manualForm, setManualForm] = useState({ task_id: "", date: localDate(), start: "", end: "" });
  const [manualErr, setManualErr] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [preset, setPreset] = useState("pomodoro");
  const [customFocus, setCustomFocus] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);
  const [phase, setPhase] = useState("focus");
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessionStart, setSessionStart] = useState(null);
  const [linkedTask, setLinkedTask] = useState("");
  const [cycles, setCycles] = useState(0);
  const [showCustom, setShowCustom] = useState(false);
  const tickRef = useRef(null);

  const currentPreset = PRESETS.find((p) => p.key === preset);
  const focusMins = preset === "custom" ? customFocus : currentPreset.focus;
  const breakMins = preset === "custom" ? customBreak : currentPreset.breakT;
  const totalSecs = (phase === "focus" ? focusMins : breakMins) * 60;
  const pct = ((totalSecs - remaining) / totalSecs) * 100;

  useEffect(() => {
    if (focusSessions?.length) setAllSlots(focusSessions);
  }, []);

  useEffect(() => {
    if (running) {
      tickRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            clearInterval(tickRef.current);
            handlePhaseEnd();
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else {
      clearInterval(tickRef.current);
    }
    return () => clearInterval(tickRef.current);
  }, [running, phase]);

  const saveSession = async (durMin) => {
    if (!sessionStart) return;
    const start = new Date(sessionStart);
    const end = new Date();
    const slot = {
      task_id: linkedTask || "",
      date: localDate(),
      start_time: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
      end_time: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
      duration: durMin,
      type: "focus",
    };
    const saved = await createFocusSession(slot).catch(() => null);
    const entry = saved || { ...slot, id: Date.now().toString() };
    setAllSlots((prev) => [...prev, entry]);
    setFocusSessions((prev) => [...prev, entry]);
  };

  const handlePhaseEnd = async () => {
    setRunning(false);
    if (phase === "focus") {
      await saveSession(focusMins);
      setCycles((c) => c + 1);
      setPhase("break");
      setRemaining(breakMins * 60);
      setSessionStart(null);
    } else {
      setPhase("focus");
      setRemaining(focusMins * 60);
    }
  };

  const handleStart = () => {
    setSessionStart(new Date().toISOString());
    setRunning(true);
  };

  const handleReset = () => {
    clearInterval(tickRef.current);
    setRunning(false);
    setPhase("focus");
    setRemaining(focusMins * 60);
    setSessionStart(null);
  };

  const handleFinishEarly = async () => {
    clearInterval(tickRef.current);
    setRunning(false);
    if (phase === "focus" && sessionStart) {
      const elapsed = focusMins - Math.ceil(remaining / 60);
      if (elapsed > 0) await saveSession(elapsed);
    }
    setPhase("focus");
    setRemaining(focusMins * 60);
    setSessionStart(null);
  };

  const selectPreset = (key) => {
    if (running) return;
    setPreset(key);
    setShowCustom(key === "custom");
    setPhase("focus");
    const p = PRESETS.find((x) => x.key === key);
    setRemaining((key === "custom" ? customFocus : p.focus) * 60);
    setSessionStart(null);
  };

  const applyCustom = () => {
    setRemaining(customFocus * 60);
    setPhase("focus");
    setSessionStart(null);
    setShowCustom(false);
  };

  const handleManualAdd = async () => {
    setManualErr("");
    const { task_id, date, start, end } = manualForm;
    if (!start || !end) { setManualErr("Please enter start and end time."); return; }
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const durMin = (eh * 60 + em) - (sh * 60 + sm);
    if (durMin <= 0) { setManualErr("End time must be after start time."); return; }
    if (manualForm.date > localDate()) { setManualErr("Cannot add entries for future dates."); return; }
    const slot = { task_id: task_id || "", date: date || localDate(), start_time: start, end_time: end, duration: durMin, type: "focus" };
    const saved = await createFocusSession(slot).catch(() => null);
    const entry = saved || { ...slot, id: Date.now().toString() };
    setAllSlots((prev) => [...prev, entry]);
    setFocusSessions((prev) => [...prev, entry]);
    setManualForm({ task_id: "", date: localDate(), start: "", end: "" });
    setManualMode(false);
  };

  const today = localDate();
  const todaySlots = allSlots.filter((s) => s.date === today);
  const todayMins = todaySlots.reduce((a, b) => a + (b.duration || 0), 0);
  const todayByTask = {};
  todaySlots.forEach((s) => {
    const key = s.task_id || "__no_task__";
    if (!todayByTask[key]) todayByTask[key] = { slots: [], total: 0 };
    todayByTask[key].slots.push(s);
    todayByTask[key].total += s.duration || 0;
  });

  const yd = new Date();
  yd.setDate(yd.getDate() - 1);
  const yesterday = yd.toLocaleDateString("en-CA");
  const yesterdayMins = allSlots.filter((s) => s.date === yesterday).reduce((a, b) => a + (b.duration || 0), 0);
  const diffToday = todayMins - yesterdayMins;

  const getWeekMins = (offsetWeeks) => {
    const now = new Date();
    const dow = (now.getDay() + 6) % 7;
    const ws = new Date(now);
    ws.setDate(now.getDate() - dow - offsetWeeks * 7);
    const we = new Date(ws);
    we.setDate(ws.getDate() + 7);
    const toYMD = (d) => d.toLocaleDateString("en-CA");
    return allSlots.filter((s) => s.date >= toYMD(ws) && s.date < toYMD(we)).reduce((a, b) => a + (b.duration || 0), 0);
  };

  const thisWeekMins = getWeekMins(0);
  const lastWeekMins = getWeekMins(1);
  const diffWeek = thisWeekMins - lastWeekMins;

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const now = new Date();
    const dow = (now.getDay() + 6) % 7;
    const wb = new Date(now);
    wb.setDate(now.getDate() - dow + weekOffset * 7);
    const d = new Date(wb);
    d.setDate(wb.getDate() + i);
    const ds = d.toLocaleDateString("en-CA");
    return { day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i], date: ds, hours: toHrs(allSlots.filter((s) => s.date === ds).reduce((a, b) => a + (b.duration || 0), 0)) };
  });

  const weekLabel = weeklyData.length === 7
    ? `${new Date(weeklyData[0].date).toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" })} - ${new Date(weeklyData[6].date).toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" })}`
    : "";

  const now2 = new Date();
  const monthDate = new Date(now2.getFullYear(), now2.getMonth() + monthOffset, 1);
  const dim = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const monthlyData = Array.from({ length: dim }, (_, i) => {
    const d = new Date(monthDate.getFullYear(), monthDate.getMonth(), i + 1);
    const ds = d.toLocaleDateString("en-CA");
    return { day: i + 1, hours: toHrs(allSlots.filter((s) => s.date === ds).reduce((a, b) => a + (b.duration || 0), 0)) };
  });
  const monthTotal = monthlyData.reduce((a, b) => a + b.hours, 0);
  const monthAvg = parseFloat((monthTotal / dim).toFixed(2));
  const monthLabel = monthDate.toLocaleDateString("en", { month: "long", year: "numeric" });
  const taskName = (id) => tasks.find((t) => t.id === id)?.title || (id ? "Unknown Task" : "No Task");

  const ringTrack = T.elevated;
  const ringColor = T.purpleLight;
  const focusFill = T.purple;
  const r = 90;
  const circ = 2 * Math.PI * r;
  const strokeDash = circ - (pct / 100) * circ;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div className="page-title" style={{ fontSize: 24, fontWeight: 700 }}>Time Dashboard</div>
          <div className="page-subtitle" style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>Log and track your focus sessions</div>
        </div>
        <Btn onClick={() => setManualMode((v) => !v)} outline style={{ background: manualMode ? T.elevated : "transparent" }}>
          + Manual Entry
        </Btn>
      </div>

        <Card style={{ background: T.card, border: `1px solid ${T.border}`, padding: "28px 24px", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => selectPreset(p.key)}
              disabled={running}
              style={{
                padding: "6px 14px",
                borderRadius: 10,
                border: `1px solid ${preset === p.key ? `${T.purple}55` : T.border}`,
                cursor: running ? "not-allowed" : "pointer",
                fontSize: 12,
                fontWeight: 600,
                background: preset === p.key ? "rgba(143, 115, 183, 0.16)" : T.elevated,
                color: preset === p.key ? T.purpleLight : T.textMuted,
                opacity: running && preset !== p.key ? 0.4 : 1
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {showCustom && !running && (
          <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Focus (min)</div>
              <input type="number" min="1" max="120" value={customFocus} onChange={(e) => setCustomFocus(Math.max(1, parseInt(e.target.value, 10) || 1))} style={{ width: 70, background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "6px 10px", fontSize: 14, textAlign: "center" }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Break (min)</div>
              <input type="number" min="1" max="60" value={customBreak} onChange={(e) => setCustomBreak(Math.max(1, parseInt(e.target.value, 10) || 1))} style={{ width: 70, background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "6px 10px", fontSize: 14, textAlign: "center" }} />
            </div>
            <Btn onClick={applyCustom}>Apply</Btn>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, marginTop: 24 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
            {["focus", "break"].map((p) => (
              <div key={p} style={{ padding: "4px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: phase === p ? (p === "focus" ? "rgba(143, 115, 183, 0.16)" : "rgba(34, 197, 94, 0.14)") : T.elevated, color: phase === p ? (p === "focus" ? T.purpleLight : T.green) : T.textMuted, border: `1px solid ${phase === p ? (p === "focus" ? `${T.purple}44` : `${T.green}44`) : T.border}` }}>
                {p === "focus" ? "Focus" : "Break"}
              </div>
            ))}
            {cycles > 0 && (
              <div style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, background: T.elevated, color: T.textMuted, border: `1px solid ${T.border}` }}>
                Cycles {cycles}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", width: 232, height: 232 }}>
            <div
              style={{
                position: "absolute",
                inset: 2,
                borderRadius: "60%",
                background: phase === "focus"
                  ? "radial-gradient(circle, rgba(189, 168, 222, 0.24) 0%, rgba(143, 115, 183, 0.12) 48%, transparent 78%)"
                  : "radial-gradient(circle, rgba(182, 255, 208, 1) 10%, rgba(7, 89, 170, 0.94) 40%, transparent 78%)",
                filter: "blur(15px)",
                boxShadow: phase === "focus"
                  ? "0 0 38px rgba(143,115,183,0.18)"
                  : "0 0 34px rgba(74,222,128,0.18)",
              }}
            />
            <svg width="200" height="200" style={{ position: "absolute", top: 16, left: 16, transform: "rotate(-90deg)" }}>
              <circle cx="100" cy="100" r={r} fill="none" stroke={ringTrack} strokeWidth="5" />
              <circle cx="100" cy="100" r={r} fill="none" stroke={ringColor} strokeWidth="10" strokeDasharray={circ} strokeDashoffset={strokeDash} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }} />
            </svg>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", padding: "50px 20px", borderRadius: 1000, background: "rgba(255, 255, 255, 0)", border: "1px solid rgba(195, 157, 255, 0)", backdropFilter: "blur(14px)", minWidth: 140 }}>
              <div style={{ fontSize: 42, fontWeight: 800, color: T.text, fontVariantNumeric: "tabular-nums", letterSpacing: 1, lineHeight: 1 }}>
                {fmtSec(remaining)}
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>
                {phase === "focus" ? `${focusMins}m focus` : `${breakMins}m break`}
              </div>
            </div>
          </div>

          <select value={linkedTask} onChange={(e) => setLinkedTask(e.target.value)} disabled={running} className="ls-select" style={{ ...modernInputStyle, maxWidth: 340, borderRadius: 999 }}>
            <option value="" style={{ background: T.card }}>Link to task</option>
            {tasks.filter((t) => !t.completed).map((t) => (
              <option key={t.id} value={t.id} style={{ background: T.card }}>{t.title}</option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            {!running && !sessionStart && <Btn onClick={handleStart} color={focusFill}>Start</Btn>}
            {running && <Btn onClick={() => setRunning(false)} outline style={{ background: T.elevated }}>Pause</Btn>}
            {!running && sessionStart && <Btn onClick={() => setRunning(true)} color={focusFill}>Resume</Btn>}
            {sessionStart && <Btn onClick={handleFinishEarly} color={focusFill}>Finish & Save</Btn>}
            {(running || sessionStart) && <Btn onClick={handleReset} outline>Reset</Btn>}
          </div>

          <div style={{ fontSize: 12, color: T.textMuted }}>
            {running ? (phase === "focus" ? "Focus session in progress..." : "Break time") : sessionStart ? "Paused" : "Select a preset and start your session"}
          </div>
        </div>
      </Card>

      {manualMode && (
        <Card style={{ borderColor: T.border, background: T.card }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Add Manual Time Slot</div>
          <div className="grid-2" style={{ marginBottom: 12 }}>
            <div>
              <Lbl>Task</Lbl>
              <select value={manualForm.task_id} onChange={(e) => setManualForm({ ...manualForm, task_id: e.target.value })} className="ls-select" style={modernInputStyle}>
                <option value="">No task</option>
                {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <div>
              <Lbl>Date</Lbl>
              <input type="date" value={manualForm.date} onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })} className="ls-input" style={modernInputStyle} />
            </div>
            <div>
              <Lbl>Start Time</Lbl>
              <input type="time" value={manualForm.start} onChange={(e) => setManualForm({ ...manualForm, start: e.target.value })} className="ls-input" style={modernInputStyle} />
            </div>
            <div>
              <Lbl>End Time</Lbl>
              <input type="time" value={manualForm.end} onChange={(e) => setManualForm({ ...manualForm, end: e.target.value })} className="ls-input" style={modernInputStyle} />
            </div>
          </div>
          {manualErr && <div style={{ color: T.red, fontSize: 12, marginBottom: 8 }}>{manualErr}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={handleManualAdd}>Save Slot</Btn>
            <Btn onClick={() => setManualMode(false)} outline>Cancel</Btn>
          </div>
        </Card>
      )}

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 13, color: T.textMuted }}>Today's Total</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: T.text }}>{fmtMin(todayMins)}</div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ textAlign: "center", padding: "10px 14px", borderRadius: 10, background: diffToday >= 0 ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)", border: `1px solid ${diffToday >= 0 ? `${T.green}44` : `${T.red}44`}` }}>
              <div style={{ fontSize: 11, color: T.textMuted }}>vs Yesterday</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: diffToday >= 0 ? T.green : T.red }}>{diffToday >= 0 ? "+" : "-"}{fmtMin(Math.abs(diffToday))}</div>
            </div>
            <div style={{ textAlign: "center", padding: "10px 14px", borderRadius: 10, background: diffWeek >= 0 ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)", border: `1px solid ${diffWeek >= 0 ? `${T.green}44` : `${T.red}44`}` }}>
              <div style={{ fontSize: 11, color: T.textMuted }}>vs Last Week</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: diffWeek >= 0 ? T.green : T.red }}>{diffWeek >= 0 ? "+" : "-"}{fmtMin(Math.abs(diffWeek))}</div>
            </div>
          </div>
        </div>

        {Object.keys(todayByTask).length === 0 ? (
          <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>
            No sessions logged today. Start a timer or add a manual entry.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.entries(todayByTask).sort((a, b) => b[1].total - a[1].total).map(([tid, data]) => (
              <div key={tid} style={{ background: T.bg, borderRadius: 10, padding: 14, border: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.purple }} />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{taskName(tid === "__no_task__" ? "" : tid)}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 12, color: T.textMuted }}>
                    <span>Total: <strong style={{ color: T.text }}>{fmtMin(data.total)}</strong></span>
                    <span>Slots: <strong style={{ color: T.text }}>{data.slots.length}</strong></span>
                  </div>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: T.elevated, marginBottom: 10, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, (data.total / todayMins) * 100)}%`, background: `linear-gradient(90deg, ${T.purple}, ${T.purpleLight})`, borderRadius: 2 }} />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {data.slots.sort((a, b) => a.start_time?.localeCompare(b.start_time)).map((slot, i) => (
                    <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 10px", fontSize: 12, color: T.textMuted }}>
                      <span style={{ color: T.text, fontWeight: 500 }}>{slot.start_time} - {slot.end_time}</span>
                      <span style={{ marginLeft: 6, color: T.purpleLight }}>({fmtMin(slot.duration)})</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid-2" style={{ gap: 14 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 6 }}>
            <div style={{ fontWeight: 600 }}>Weekly Focus Hours</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={() => setWeekOffset((w) => w - 1)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 18 }}>‹</button>
              <span style={{ fontSize: 11, color: T.textMuted, minWidth: 120, textAlign: "center" }}>{weekLabel}</span>
              <button onClick={() => setWeekOffset((w) => Math.min(0, w + 1))} style={{ background: "none", border: "none", color: weekOffset === 0 ? T.textDim : T.textMuted, cursor: weekOffset === 0 ? "not-allowed" : "pointer", fontSize: 18 }}>›</button>
            </div>
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>{weekOffset === 0 ? "This week" : "Previous week"}</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData} barSize={24}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} unit="h" />
              <Tooltip {...TT} formatter={(v) => [`${v}h`, "Hours"]} />
              <Bar dataKey="hours" radius={[5, 5, 0, 0]} fill={T.purple} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, flexWrap: "wrap", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ fontWeight: 600 }}>Monthly Overview</div>
              <button onClick={() => setMonthOffset((m) => m - 1)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 18 }}>‹</button>
              <span style={{ fontSize: 11, color: T.textMuted }}>{monthLabel}</span>
              <button onClick={() => setMonthOffset((m) => Math.min(0, m + 1))} style={{ background: "none", border: "none", color: monthOffset === 0 ? T.textDim : T.textMuted, cursor: monthOffset === 0 ? "not-allowed" : "pointer", fontSize: 18 }}>›</button>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: T.textMuted }}>Total</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.purpleLight }}>{fmtMin(monthTotal * 60)}</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>Avg/day: {fmtMin(monthAvg * 60)}</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthlyData}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} unit="h" />
              <Tooltip {...TT} formatter={(v) => [`${v}h`, "Hours"]} />
              <Line type="monotone" dataKey="hours" stroke={T.purple} strokeWidth={2.7} dot={false} activeDot={{ r: 5, fill: T.purpleLight }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
