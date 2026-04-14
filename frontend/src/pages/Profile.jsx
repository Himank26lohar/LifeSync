import { useEffect, useMemo, useRef, useState } from "react";
import { T } from "../constants/theme";
import { P } from "../constants/icons";
import { Btn, Ic, ProgressBar } from "../components/Ic";
import Card from "../components/Card";
import { getProfile, saveProfile } from "../api/profile";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAILY_QUOTES = [
  "Dream big and dare to fail.",
  "Success is the sum of small efforts repeated daily.",
  "Do what you can, with what you have, where you are.",
  "Action is the foundational key to all success.",
  "Great things are done by a series of small things brought together.",
  "Discipline is choosing between what you want now and what you want most.",
  "The future depends on what you do today.",
  "Start where you are. Use what you have. Do what you can.",
  "Small progress is still progress.",
  "Well done is better than well said.",
  "The secret of getting ahead is getting started.",
  "What we think, we become.",
  "You don’t have to see the whole staircase, just take the first step.",
];

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function monthProgress(targets) {
  if (!targets.length) return 0;
  const done = targets.filter((target) => target.done).length;
  return Math.round((done / targets.length) * 100);
}

function normalizeGoal(goal) {
  if (typeof goal === "string") {
    return { id: makeId("goal"), title: goal, description: "", done: false };
  }
  return {
    id: goal?.id || makeId("goal"),
    title: goal?.title || goal?.text || "",
    description: goal?.description || "",
    done: Boolean(goal?.done),
  };
}

function normalizeTarget(target) {
  if (typeof target === "string") {
    return { id: makeId("target"), title: target, description: "", done: false };
  }
  return {
    id: target?.id || makeId("target"),
    title: target?.title || target?.text || "",
    description: target?.description || "",
    done: Boolean(target?.done),
  };
}

function normalizeMilestone(item) {
  return {
    id: item?.id || makeId("achievement"),
    title: item?.title || "Untitled achievement",
    date: item?.date || `${CURRENT_YEAR}-01-01`,
    description: item?.description || "",
  };
}

function defaultMonth(month) {
  return {
    month,
    targets: [],
    notes: "",
  };
}

function createDefaults() {
  const goalsByYear = YEARS.reduce((acc, year) => {
    acc[year] = {
      yearlyGoals: [],
      months: MONTHS.map((month) => defaultMonth(month)),
    };
    return acc;
  }, {});

  return {
    profile: {
      name: "",
      bio: "",
      location: "",
      cover: T.elevated,
    },
    selectedYear: CURRENT_YEAR,
    goalsByYear,
    milestones: [],
  };
}

function normalizeProfile(data) {
  const base = createDefaults();
  if (!data) return base;

  const normalizedGoals = YEARS.reduce((acc, year) => {
    const incomingYear = data.goalsByYear?.[year] || data.goalsByYear?.[String(year)] || {};
    const incomingMonths = Array.isArray(incomingYear.months) ? incomingYear.months : [];
    acc[year] = {
      yearlyGoals: Array.isArray(incomingYear.yearlyGoals) ? incomingYear.yearlyGoals.map(normalizeGoal) : [],
      months: MONTHS.map((month) => {
        const savedMonth = incomingMonths.find((item) => item.month === month) || {};
        return {
          month,
          targets: Array.isArray(savedMonth.targets) ? savedMonth.targets.map(normalizeTarget) : [],
          notes: savedMonth.notes || "",
        };
      }),
    };
    return acc;
  }, {});

  return {
    profile: {
      ...base.profile,
      ...(data.profile || {}),
    },
    selectedYear: YEARS.includes(data.selectedYear) ? data.selectedYear : CURRENT_YEAR,
    goalsByYear: normalizedGoals,
    milestones: Array.isArray(data.milestones) ? data.milestones.map(normalizeMilestone) : [],
  };
}

function modalInputStyle() {
  return {
    width: "100%",
    border: `1px solid ${T.border}`,
    borderRadius: 16,
    padding: "12px 14px",
    background: T.elevated,
    color: "inherit",
    fontSize: 14,
    outline: "none",
    resize: "vertical",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
  };
}

function monthCheckStyle(accent, checked) {
  return {
    width: 18,
    height: 18,
    marginTop: 1,
    accentColor: accent,
    cursor: "pointer",
    flexShrink: 0,
    filter: checked ? "drop-shadow(0 0 8px rgba(255,255,255,0.12))" : "none",
  };
}

function dailyQuote() {
  const today = new Date().toLocaleDateString("en-CA");
  const hash = today.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return DAILY_QUOTES[hash % DAILY_QUOTES.length];
}

export default function Profile({ theme = "light", setTheme = () => {} }) {
  const [state, setState] = useState(() => createDefaults());
  const [editOpen, setEditOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setSaveState] = useState("idle");
  const [showYearGoalComposer, setShowYearGoalComposer] = useState(false);
  const [yearGoalDraft, setYearGoalDraft] = useState({ title: "", description: "" });
  const [achievementDraftOpen, setAchievementDraftOpen] = useState(false);
  const [achievementDraft, setAchievementDraft] = useState({
    title: "",
    description: "",
    date: new Date().toLocaleDateString("en-CA"),
  });
  const [expandedAchievement, setExpandedAchievement] = useState(null);
  const [monthDraft, setMonthDraft] = useState({ title: "", description: "" });
  const hydratedRef = useRef(false);
  const lastSavedRef = useRef("");

  useEffect(() => {
    let active = true;
    getProfile()
      .then((data) => {
        if (!active) return;
        const normalized = normalizeProfile(data);
        if (data) {
          setState(normalized);
          lastSavedRef.current = JSON.stringify(normalized);
        } else {
          setState(normalized);
          lastSavedRef.current = "";
        }
        hydratedRef.current = true;
      })
      .catch(() => {
        const fallback = createDefaults();
        setState(fallback);
        lastSavedRef.current = "";
        hydratedRef.current = true;
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current || loading) return;
    const payload = JSON.stringify(state);
    if (payload === lastSavedRef.current) return;
    setSaveState("saving");
    const timeout = setTimeout(() => {
      saveProfile(state)
        .then(() => {
          lastSavedRef.current = payload;
          setSaveState("saved");
          setTimeout(() => setSaveState("idle"), 1200);
        })
        .catch(() => {
          setSaveState("error");
        });
    }, 500);
    return () => clearTimeout(timeout);
  }, [state, loading]);

  const palette = {
    page: T.bg,
    surface: T.card,
    surfaceAlt: T.elevated,
    border: T.border,
    text: T.text,
    muted: T.textMuted,
    soft: T.text,
  };

  const yearData = state.goalsByYear[state.selectedYear];
  const quote = useMemo(() => dailyQuote(), []);
  const activeMonth = yearData.months.find((month) => month.month === monthOpen) || null;
  const initials = useMemo(() => {
    const parts = String(state.profile.name || "").trim().split(/\s+/).filter(Boolean);
    return `${(parts[0] || "?")[0]}${(parts[1] || "")[0] || ""}`.toUpperCase();
  }, [state.profile.name]);

  const setProfile = (patch) => setState((current) => ({ ...current, profile: { ...current.profile, ...patch } }));
  const setSelectedYear = (year) => setState((current) => ({ ...current, selectedYear: year }));

  const addYearlyGoal = () => {
    if (!yearGoalDraft.title.trim()) return;
    setState((current) => ({
      ...current,
      goalsByYear: {
        ...current.goalsByYear,
        [current.selectedYear]: {
          ...current.goalsByYear[current.selectedYear],
          yearlyGoals: [
            ...current.goalsByYear[current.selectedYear].yearlyGoals,
            {
              id: makeId("goal"),
              title: yearGoalDraft.title.trim(),
              description: yearGoalDraft.description.trim(),
              done: false,
            },
          ],
        },
      },
    }));
    setYearGoalDraft({ title: "", description: "" });
    setShowYearGoalComposer(false);
  };

  const removeYearlyGoal = (goalId) => {
    const ok = window.confirm("Are you sure you want to delete this yearly goal?");
    if (!ok) return;
    setState((current) => ({
      ...current,
      goalsByYear: {
        ...current.goalsByYear,
        [current.selectedYear]: {
          ...current.goalsByYear[current.selectedYear],
          yearlyGoals: current.goalsByYear[current.selectedYear].yearlyGoals.filter((goal) => goal.id !== goalId),
        },
      },
    }));
  };

  const toggleYearGoal = (goalId) => {
    setState((current) => ({
      ...current,
      goalsByYear: {
        ...current.goalsByYear,
        [current.selectedYear]: {
          ...current.goalsByYear[current.selectedYear],
          yearlyGoals: current.goalsByYear[current.selectedYear].yearlyGoals.map((goal) => goal.id === goalId ? { ...goal, done: !goal.done } : goal),
        },
      },
    }));
  };

  const updateMonth = (monthName, updater) => {
    setState((current) => ({
      ...current,
      goalsByYear: {
        ...current.goalsByYear,
        [current.selectedYear]: {
          ...current.goalsByYear[current.selectedYear],
          months: current.goalsByYear[current.selectedYear].months.map((month) => month.month === monthName ? updater(month) : month),
        },
      },
    }));
  };

  const toggleMonthTarget = (monthName, targetId) => {
    updateMonth(monthName, (month) => ({
      ...month,
      targets: month.targets.map((target) => target.id === targetId ? { ...target, done: !target.done } : target),
    }));
  };

  const addMilestone = () => {
    if (!achievementDraft.title.trim()) return;
    const nextItem = {
      id: makeId("achievement"),
      title: achievementDraft.title.trim(),
      date: achievementDraft.date,
      description: achievementDraft.description.trim(),
    };
    setState((current) => ({
      ...current,
      milestones: [nextItem, ...current.milestones],
    }));
    setExpandedAchievement(nextItem.id);
    setAchievementDraft({
      title: "",
      description: "",
      date: new Date().toLocaleDateString("en-CA"),
    });
    setAchievementDraftOpen(false);
  };

  const removeMilestone = (id) => {
    const ok = window.confirm("Are you sure you want to delete this milestone?");
    if (!ok) return;
    setState((current) => ({
      ...current,
      milestones: current.milestones.filter((item) => item.id !== id),
    }));
  };

  const updateMonthTarget = (monthName, targetId, patch) => {
    updateMonth(monthName, (month) => ({
      ...month,
      targets: month.targets.map((target) => target.id === targetId ? { ...target, ...patch } : target),
    }));
  };

  const removeMonthTarget = (monthName, targetId) => {
    const ok = window.confirm("Are you sure you want to delete this monthly plan?");
    if (!ok) return;
    updateMonth(monthName, (month) => ({
      ...month,
      targets: month.targets.filter((target) => target.id !== targetId),
    }));
  };

  const addMonthTarget = () => {
    if (!monthOpen || !monthDraft.title.trim()) return;
    updateMonth(monthOpen, (month) => ({
      ...month,
      targets: [
        ...month.targets,
        {
          id: makeId("target"),
          title: monthDraft.title.trim(),
          description: monthDraft.description.trim(),
          done: false,
        },
      ],
    }));
    setMonthDraft({ title: "", description: "" });
  };

  return (
    <div style={{ color: palette.text }}>
      <div className="profile-shell" style={{ background: palette.page, border: `1px solid ${palette.border}`, borderRadius: 30, padding:18, overflow: "hidden" }}>
        <div className="profile-sticky-header" style={{ position: "sticky", top: 0, zIndex: 10, background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 24, padding: 16, marginBottom: 18 }}>
          <div className="profile-topbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div className="profile-topbar-main" style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: state.profile.cover, border: `1px solid ${palette.border}`, display: "grid", placeItems: "center", color: T.text, fontSize: 24, fontWeight: 900, flexShrink: 0 }}>
                {initials}
              </div>
              <div className="profile-topbar-copy" style={{ minWidth: 0 }}>
                <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.1 }}>{state.profile.name}</div>
                <div style={{ fontSize: 14, color: palette.soft, marginTop: 6, lineHeight: 1.6 }}>{state.profile.bio}</div>
                <div style={{ fontSize: 13, color: palette.muted, marginTop: 8 }}>{state.profile.location}</div>
              </div>
            </div>
            <div className="profile-topbar-actions" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 999,
                  border: `1px solid ${palette.border}`,
                  background: palette.surfaceAlt,
                  color: palette.text,
                  cursor: "pointer",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
                }}
              >
                <Ic d={theme === "dark" ? P.sun : P.moon} size={15} color={palette.text} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </span>
              </button>
              <Btn onClick={() => setEditOpen(true)} color={T.purple} style={{ borderRadius: 999, padding: "10px 18px" }}>
                <Ic d={P.edit} size={14} color="#fff" />
                Edit profile
              </Btn>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", placeItems: "center", textAlign: "center", minHeight: 170, padding: "16px 12px 28px", marginBottom: 18 }}>
          <div style={{ maxWidth: 760 }}>
            <div style={{ fontSize: 12, color: palette.muted, marginBottom: 14, letterSpacing: 1.2, textTransform: "uppercase" }}>Today&apos;s quote</div>
            <div style={{ fontSize: 24, lineHeight: 1.45, color: palette.text, fontFamily: '"Cormorant Garamond", "Georgia", serif', fontWeight: 600 }}>
              "{quote}"
            </div>
          </div>
        </div>

        <div className="profile-main-split" style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr", gap: 10, alignItems: "start" }}>
          <div>
            <Card style={{ background: palette.surface, border: `1px solid ${palette.border}`, boxShadow: "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: palette.text }}>Yearly Goals</div>
                </div>
                <div className="profile-year-controls" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={() => setSelectedYear(Math.max(YEARS[0], state.selectedYear - 1))} style={{ width: 40, height: 40, borderRadius: "50%", border: `1px solid ${palette.border}`, background: palette.surfaceAlt, display: "grid", placeItems: "center", cursor: "pointer" }}>
                    <Ic d={P.chevronL} size={18} color={palette.text} />
                  </button>
                  <div className="profile-year-rail" style={{ display: "flex", gap: 10, overflowX: "auto" }}>
                    {YEARS.map((year) => (
                      <button key={year} onClick={() => setSelectedYear(year)} style={{ padding: "10px 16px", borderRadius: 999, border: `1px solid ${year === state.selectedYear ? `${T.purple}44` : palette.border}`, background: year === state.selectedYear ? `${T.purple}18` : palette.surfaceAlt, color: year === state.selectedYear ? T.text : palette.muted, fontWeight: 800, cursor: "pointer" }}>
                        {year}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setSelectedYear(Math.min(CURRENT_YEAR, state.selectedYear + 1))} disabled={state.selectedYear >= CURRENT_YEAR} style={{ width: 40, height: 40, borderRadius: "50%", border: `1px solid ${palette.border}`, background: state.selectedYear >= CURRENT_YEAR ? "transparent" : palette.surfaceAlt, display: "grid", placeItems: "center", cursor: state.selectedYear >= CURRENT_YEAR ? "not-allowed" : "pointer", opacity: state.selectedYear >= CURRENT_YEAR ? 0.45 : 1 }}>
                    <Ic d={P.chevronR} size={18} color={palette.text} />
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
                {yearData.yearlyGoals.length === 0 ? (
                  <div style={{ padding: 18, borderRadius: 18, border: `1px dashed ${palette.border}`, color: palette.muted, fontSize: 13 }}>
                    No saved yearly goals yet.
                  </div>
                ) : (
                  yearData.yearlyGoals.map((goal) => (
                    <div key={goal.id} style={{ padding: 16, borderRadius: 20, background: palette.surfaceAlt, border: `1px solid ${palette.border}`, display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start" }}>
                      <div style={{ display: "flex", gap: 12, flex: 1 }}>
                        <input type="checkbox" checked={goal.done} onChange={() => toggleYearGoal(goal.id)} style={{ marginTop: 4 }} />
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: palette.text, textDecoration: goal.done ? "line-through" : "none" }}>{goal.title}</div>
                          {goal.description ? <div style={{ fontSize: 13, color: palette.muted, marginTop: 6, lineHeight: 1.6 }}>{goal.description}</div> : null}
                        </div>
                      </div>
                      <button onClick={() => removeYearlyGoal(goal.id)} style={{ border: "none", background: "transparent", color: "#fda4af", cursor: "pointer", fontSize: 12 }}>
                        Remove
                      </button>
                    </div>
                  ))
                )}

                {showYearGoalComposer ? (
                  <div style={{ padding: 16, borderRadius: 20, background: "rgba(155,92,255,0.08)", border: `1px solid ${palette.border}`, display: "grid", gap: 10 }}>
                    <input value={yearGoalDraft.title} placeholder="Goal title" onChange={(e) => setYearGoalDraft((current) => ({ ...current, title: e.target.value }))} style={modalInputStyle()} />
                    <textarea value={yearGoalDraft.description} placeholder="Goal description" rows={3} onChange={(e) => setYearGoalDraft((current) => ({ ...current, description: e.target.value }))} style={modalInputStyle()} />
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Btn onClick={addYearlyGoal} color={T.purple}>Save yearly goal</Btn>
                      <Btn onClick={() => { setShowYearGoalComposer(false); setYearGoalDraft({ title: "", description: "" }); }} outline>Cancel</Btn>
                    </div>
                  </div>
                ) : null}
                <Btn onClick={() => setShowYearGoalComposer(true)} color={T.purple} style={{ width: "fit-content", marginTop: 4 }}>Add new goal</Btn>
              </div>

              <div className="profile-goals-grid" style={{ marginTop: 22 }}>
                {yearData.months.map((month, index) => {
                  const progress = monthProgress(month.targets);
                  const monthColor = [T.blue, T.green, T.purple, T.amber][index % 4];
                  return (
                    <div key={`${state.selectedYear}-${month.month}`} className="profile-goal-card" style={{ padding: 16, borderRadius: 22, border: `1px solid ${palette.border}`, background: palette.surfaceAlt, color: palette.text }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: monthColor }}>{month.month}</div>
                        <button onClick={() => { setMonthOpen(month.month); setMonthDraft({ title: "", description: "" }); }} style={{ border: "none", background: "transparent", color: palette.muted, cursor: "pointer", fontSize: 12 }}>
                          Edit
                        </button>
                      </div>
                      <div style={{ display: "grid", gap: 8 }}>
                        {month.targets.length === 0 ? (
                          <div style={{ fontSize: 12, color: palette.muted }}>No saved plans yet.</div>
                        ) : (
                          month.targets.slice(0, 3).map((target) => (
                            <label
                              key={target.id}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 10,
                                fontSize: 13,
                                color: target.done ? palette.text : palette.soft,
                                cursor: "pointer",
                                padding: "6px 8px",
                                marginInline: -8,
                                borderRadius: 12,
                                background: target.done ? `${monthColor}14` : "transparent",
                                transition: "background 0.18s ease",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={target.done}
                                onChange={() => toggleMonthTarget(month.month, target.id)}
                                style={monthCheckStyle(monthColor, target.done)}
                              />
                              <div>
                                <div style={{ textDecoration: target.done ? "line-through" : "none", fontWeight: target.done ? 700 : 500 }}>
                                  {target.title}
                                </div>
                                {target.description ? <div style={{ fontSize: 11, color: palette.muted, marginTop: 4 }}>{target.description}</div> : null}
                              </div>
                            </label>
                          ))
                        )}
                        {month.targets.length > 3 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setMonthOpen(month.month);
                              setMonthDraft({ title: "", description: "" });
                            }}
                            style={{
                              border: "none",
                              background: "transparent",
                              color: monthColor,
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 700,
                              padding: 0,
                              textAlign: "left",
                            }}
                          >
                            View {month.targets.length - 3} more
                          </button>
                        ) : null}
                      </div>
                      <div style={{ marginTop: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: palette.muted, marginBottom: 6 }}>
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <ProgressBar pct={progress} color={monthColor} h={7} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <div>
            <Card style={{ background: palette.surface, border: `1px solid ${palette.border}`, boxShadow: "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: palette.text }}>Achievements</div>
                  <div style={{ fontSize: 13, color: palette.muted, marginTop: 4 }}>Saved achievements show only the heading until you open them.</div>
                </div>
                <Btn onClick={() => setAchievementDraftOpen((open) => !open)} color={T.green}>Add achievement</Btn>
              </div>

              {achievementDraftOpen ? (
                <div style={{ display: "grid", gap: 10, marginTop: 18, padding: 16, borderRadius: 20, background: "rgba(74,222,128,0.08)", border: `1px solid ${palette.border}` }}>
                  <input value={achievementDraft.title} placeholder="Achievement heading" onChange={(e) => setAchievementDraft((current) => ({ ...current, title: e.target.value }))} style={modalInputStyle()} />
                  <textarea value={achievementDraft.description} placeholder="Achievement description" rows={4} onChange={(e) => setAchievementDraft((current) => ({ ...current, description: e.target.value }))} style={modalInputStyle()} />
                  <input type="date" value={achievementDraft.date} onChange={(e) => setAchievementDraft((current) => ({ ...current, date: e.target.value }))} style={modalInputStyle()} />
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Btn onClick={addMilestone} color={T.green}>Save achievement</Btn>
                    <Btn onClick={() => setAchievementDraftOpen(false)} outline>Cancel</Btn>
                  </div>
                </div>
              ) : null}

              <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
                {state.milestones.length === 0 ? (
                  <div style={{ padding: 18, borderRadius: 18, border: `1px dashed ${palette.border}`, color: palette.muted, fontSize: 13 }}>
                    No achievements saved yet.
                  </div>
                ) : (
                  state.milestones.map((item, index) => {
                    const expanded = expandedAchievement === item.id;
                    return (
                      <div key={item.id} style={{ display: "grid", gridTemplateColumns: "20px 1fr", gap: 12 }}>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <div style={{ width: 12, minHeight: "100%", position: "relative" }}>
                            <div style={{ width: 12, height: 12, borderRadius: "50%", background: T.green, marginTop: 8 }} />
                            {index !== state.milestones.length - 1 ? <div style={{ position: "absolute", left: 5, top: 28, bottom: -12, width: 2, background: `${T.green}40` }} /> : null}
                          </div>
                        </div>
                        <div style={{ padding: 14, borderRadius: 18, background: palette.surfaceAlt, border: `1px solid ${palette.border}` }}>
                          <button onClick={() => setExpandedAchievement(expanded ? null : item.id)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: "transparent", border: "none", color: palette.text, padding: 0, textAlign: "left" }}>
                            <div>
                              <div style={{ fontSize: 11, color: palette.muted, textTransform: "uppercase", letterSpacing: 1 }}>Achievement</div>
                              <div style={{ fontSize: 16, fontWeight: 800, marginTop: 6 }}>{item.title}</div>
                            </div>
                            <div style={{ fontSize: 12, color: palette.muted }}>{expanded ? "Hide" : "Open"}</div>
                          </button>

                          {expanded ? (
                            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                              <div style={{ fontSize: 13, color: palette.muted, lineHeight: 1.7 }}>{item.description || "No description added."}</div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                <div style={{ fontSize: 12, color: palette.muted }}>{new Date(item.date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</div>
                                <button onClick={() => removeMilestone(item.id)} style={{ border: "none", background: "transparent", color: "#fda4af", cursor: "pointer", fontSize: 12 }}>
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {editOpen ? (
        <div className="profile-modal-backdrop" onClick={() => setEditOpen(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()} style={{ background: palette.surface, border: `1px solid ${palette.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: palette.text }}>Edit profile</div>
                <div style={{ fontSize: 13, color: palette.muted, marginTop: 4 }}>Update the left-side profile information.</div>
              </div>
              <button onClick={() => setEditOpen(false)} style={{ background: "transparent", border: "none", color: palette.muted, cursor: "pointer", fontSize: 24 }}>x</button>
            </div>
            <div className="profile-edit-grid">
              <label className="profile-field">
                <span>Name</span>
                <input value={state.profile.name} onChange={(e) => setProfile({ name: e.target.value })} style={modalInputStyle()} />
              </label>
              <label className="profile-field">
                <span>Location</span>
                <input value={state.profile.location} onChange={(e) => setProfile({ location: e.target.value })} style={modalInputStyle()} />
              </label>
              <label className="profile-field profile-field-wide">
                <span>Bio</span>
                <textarea value={state.profile.bio} onChange={(e) => setProfile({ bio: e.target.value })} rows={4} style={modalInputStyle()} />
              </label>
            </div>
            <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Btn outline onClick={() => setEditOpen(false)} color={palette.muted}>Close</Btn>
              <Btn onClick={() => setEditOpen(false)} color={T.purple}>Save changes</Btn>
            </div>
          </div>
        </div>
      ) : null}

      {monthOpen && activeMonth ? (
        <div className="profile-modal-backdrop" onClick={() => setMonthOpen(null)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()} style={{ background: palette.surface, border: `1px solid ${palette.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: palette.text }}>{monthOpen} plans</div>
                <div style={{ fontSize: 13, color: palette.muted, marginTop: 4 }}>Add a plan with details, then save it to this month.</div>
              </div>
              <button onClick={() => setMonthOpen(null)} style={{ background: "transparent", border: "none", color: palette.muted, cursor: "pointer", fontSize: 24 }}>x</button>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              {activeMonth.targets.length === 0 ? (
                <div style={{ padding: 16, borderRadius: 18, border: `1px dashed ${palette.border}`, color: palette.muted, fontSize: 13 }}>
                  No saved monthly plans yet.
                </div>
              ) : (
                activeMonth.targets.map((target) => (
                  <div key={target.id} style={{ display: "grid", gap: 10, borderRadius: 18, padding: 14, background: palette.surfaceAlt, border: `1px solid ${palette.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: palette.text }}>
                        <input type="checkbox" checked={target.done} onChange={() => toggleMonthTarget(monthOpen, target.id)} />
                        <span>{target.done ? "Completed" : "In progress"}</span>
                      </label>
                      <button onClick={() => removeMonthTarget(monthOpen, target.id)} style={{ border: "none", background: "transparent", color: "#fda4af", cursor: "pointer", fontSize: 12 }}>
                        Remove
                      </button>
                    </div>
                    <input value={target.title} onChange={(e) => updateMonthTarget(monthOpen, target.id, { title: e.target.value })} placeholder="Plan title" style={modalInputStyle()} />
                    <textarea value={target.description} onChange={(e) => updateMonthTarget(monthOpen, target.id, { description: e.target.value })} placeholder="Plan description" rows={3} style={modalInputStyle()} />
                  </div>
                ))
              )}

              <div style={{ display: "grid", gap: 10, borderRadius: 18, padding: 16, background: "rgba(96,165,250,0.08)", border: `1px solid ${palette.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Add new plan</div>
                <input value={monthDraft.title} onChange={(e) => setMonthDraft((current) => ({ ...current, title: e.target.value }))} placeholder="Plan title" style={modalInputStyle()} />
                <textarea value={monthDraft.description} onChange={(e) => setMonthDraft((current) => ({ ...current, description: e.target.value }))} placeholder="Plan description" rows={3} style={modalInputStyle()} />
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Btn onClick={addMonthTarget} color={T.purple}>Save plan</Btn>
                  <Btn onClick={() => setMonthDraft({ title: "", description: "" })} outline>Clear</Btn>
                </div>
              </div>

              <label className="profile-field" style={{ marginTop: 10 }}>
                <span>Month notes</span>
                <textarea value={activeMonth.notes} onChange={(e) => {
                  updateMonth(monthOpen, (month) => ({ ...month, notes: e.target.value }));
                }} rows={4} style={modalInputStyle()} />
              </label>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
