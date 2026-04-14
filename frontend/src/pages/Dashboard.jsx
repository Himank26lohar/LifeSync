import {
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { T } from "../constants/theme";
import { P } from "../constants/icons";
import { Ic } from "../components/Ic";
import Card from "../components/Card";

const TT = { contentStyle: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, color: T.text } };
const todayISO = () => new Date().toISOString().split("T")[0];
const todayLocale = () => new Date().toLocaleDateString();
const fmtMins = (m) => m >= 60 ? `${(m / 60).toFixed(1)}h` : `${m}m`;

function calcJournalStreak(entries) {
  const dates = [...new Set(entries.map((e) => e.date))].sort();
  if (!dates.length) return 0;
  const last = new Date(dates[dates.length - 1]);
  const now = new Date(todayISO());
  if ((now - last) / 86400000 > 1) return 0;
  let streak = 1;
  for (let i = dates.length - 2; i >= 0; i -= 1) {
    if ((new Date(dates[i + 1]) - new Date(dates[i])) / 86400000 === 1) streak += 1;
    else break;
  }
  return streak;
}

export default function Dashboard({ tasks, habits, wellness, focusSessions, entries, setPage }) {
  const today = todayLocale();
  const todayIS = todayISO();
  const doneTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const prod = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const habitsDone = habits.filter((h) => h.completed_today).length;
  const totalHabits = habits.length;
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0);
  const bestHabit = habits.find((h) => h.streak === bestStreak);
  const recent = wellness.slice(-7);
  const avgMood = recent.length ? recent.reduce((a, b) => a + b.mood, 0) / recent.length : null;
  const avgSleep = recent.length ? recent.reduce((a, b) => a + b.sleep, 0) / recent.length : null;
  const avgEnergy = recent.filter((w) => w.energy).length
    ? recent.filter((w) => w.energy).reduce((a, b) => a + (b.energy || 0), 0) / recent.filter((w) => w.energy).length
    : null;
  const avgStress = recent.filter((w) => w.stress).length
    ? recent.filter((w) => w.stress).reduce((a, b) => a + (b.stress || 0), 0) / recent.filter((w) => w.stress).length
    : null;
  const wScore = avgMood ? Math.round((avgMood / 5) * 100) : 0;
  const loggedToday = wellness.some((w) => w.date === today);
  const todayStr = new Date().toLocaleDateString("en-CA");
  const focusToday = focusSessions.filter((s) => s.date === today || s.date === todayStr).reduce((a, b) => a + (b.duration || 0), 0);
  const journalStreak = entries ? calcJournalStreak(entries) : 0;
  const todayJournal = entries ? entries.filter((e) => e.date === todayIS).length : 0;

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const locale = d.toLocaleDateString();
    const ca = d.toLocaleDateString("en-CA");
    const entry = wellness.find((w) => w.date === locale || w.date === ca);
    return {
      day: d.toLocaleDateString("en", { weekday: "short" }),
      mood: entry ? Math.round((entry.mood / 5) * 100) : null,
      sleep: entry ? entry.sleep * 10 : null,
      energy: entry?.energy ? entry.energy * 20 : null,
    };
  });
  const hasWellnessData = last7.some((d) => d.mood !== null);

  const bData = [
    { subject: "Work", A: totalTasks ? Math.min(100, Math.round((doneTasks / totalTasks) * 100)) : 0 },
    { subject: "Exercise", A: Math.min(100, (habits.find((h) => h.name?.toLowerCase().match(/exercise|workout|gym|run/))?.streak || 0) * 10 + Math.min(30, totalHabits * 5)) },
    { subject: "Sleep", A: avgSleep ? Math.min(100, Math.round((avgSleep / 9) * 100)) : 0 },
    { subject: "Social", A: Math.min(100, wellness.length * 5) },
    { subject: "Mindfulness", A: avgMood ? Math.min(100, Math.round((avgMood / 5) * 100)) : 0 },
    { subject: "Learning", A: Math.min(100, (entries?.length || 0) * 4 + totalHabits * 8) },
  ];

  const burnout = avgMood && avgMood < 2.5 && avgSleep && avgSleep < 6;

  const insights = [];
  if (avgSleep && avgSleep < 7) insights.push({ icon: P.moon, text: `Averaging ${avgSleep.toFixed(1)}h sleep. Aim for 7-8h.` });
  if (avgMood && avgMood < 3) insights.push({ icon: P.wellness, text: "Mood is trending low. A short walk or reset block could help." });
  if (avgStress && avgStress > 3.5) insights.push({ icon: P.alert, text: `Stress is ${avgStress.toFixed(1)}/5. Build in more breaks today.` });
  if (doneTasks === 0 && totalTasks > 0) insights.push({ icon: P.tasks, text: "No tasks are done yet. Start with the smallest one to build momentum." });
  insights.push({ icon: P.brain, text: "Your strongest focus window still looks like late morning. Keep deep work there." });

  const fillers = [
    { icon: P.trend, text: `${doneTasks} of ${totalTasks} tasks are complete.` },
    { icon: P.habits, text: `${habitsDone}/${totalHabits} habits are done today.` },
    { icon: P.wellness, text: `Wellness is at ${wScore}%. Daily logs make this more useful.` },
  ];
  let fi = 0;
  while (insights.length < 3) insights.push(fillers[fi++]);

  const insightCards = [
    { page: "tasks", label: "TASKS", color: T.blue, icon: "✓", big: `${doneTasks}/${totalTasks}`, sub: doneTasks === totalTasks && totalTasks > 0 ? "All done" : `${totalTasks - doneTasks} remaining`, extra: `${prod}% completion`, pct: totalTasks ? (doneTasks / totalTasks) * 100 : 0 },
    { page: "habits", label: "HABITS", color: T.green, icon: "★", big: `${habitsDone}/${totalHabits}`, sub: `${bestStreak} day streak`, extra: bestHabit ? bestHabit.name.slice(0, 14) + (bestHabit.name.length > 14 ? "..." : "") : "no habits yet", pct: totalHabits ? (habitsDone / totalHabits) * 100 : 0 },
    { page: "wellness", label: "WELLNESS", color: T.purple, icon: "◉", big: avgMood ? `${avgMood.toFixed(1)}/5` : "-", sub: loggedToday ? "logged today" : "not logged today", extra: avgSleep ? `avg ${avgSleep.toFixed(1)}h sleep` : "log to see avg", pct: wScore },
    { page: "time", label: "FOCUS", color: T.blue, icon: "◔", big: focusToday > 0 ? fmtMins(focusToday) : "0m", sub: `${focusSessions.filter((s) => s.date === today || s.date === todayStr).length} slots today`, extra: null, pct: null },
    { page: "journal", label: "JOURNAL", color: T.cyan, icon: "✎", big: `${journalStreak}d`, sub: todayJournal > 0 ? `${todayJournal} entries today` : "no entry today", extra: null, pct: null },
    { page: "ai", label: "PRODUCTIVITY", color: T.amber, icon: "◫", big: `${prod}%`, sub: prod >= 80 ? "Excellent" : prod >= 50 ? "On track" : "Keep going", extra: avgEnergy ? `energy ${avgEnergy.toFixed(1)}/5` : "log wellness", pct: prod },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div className="page-title" style={{ fontSize: 26, fontWeight: 700 }}>Welcome back, Himank!</div>
          <div className="page-subtitle" style={{ fontSize: 14, color: T.textMuted, marginTop: 4 }}>Here&apos;s your overview for today</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div className="hide-mobile" style={{ fontSize: 12, color: T.textMuted }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
          <div style={{ background: burnout ? T.red : T.green, color: "#fff", borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.65)" }} />
            {burnout ? "Rest needed" : "On track"}
          </div>
        </div>
      </div>

      <div className="grid-insights" style={{ marginBottom: 20 }}>
        {insightCards.map((c) => (
          <Card
            key={c.label}
            onClick={() => setPage(c.page)}
            style={{ cursor: "pointer", padding: "16px 18px", borderColor: T.border, background: T.card, borderLeft: `3px solid ${c.color}` }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{c.label}</div>
              <div style={{ fontSize: 18, color: c.color }}>{c.icon}</div>
            </div>
            <div style={{ fontSize: 35, fontWeight: 900, color: c.color, lineHeight: 1, marginBottom: 4 }}>{c.big}</div>
            <div style={{ fontSize: 12, color: T.text, marginBottom: 2 }}>{c.sub}</div>
            {c.extra && <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10 }}>{c.extra}</div>}
            {c.pct !== null && (
              <div style={{ height: 4, borderRadius: 2, background: T.elevated, overflow: "hidden", marginTop: c.extra ? 0 : 10 }}>
                <div style={{ height: "100%", width: `${Math.min(100, c.pct)}%`, background: `linear-gradient(90deg, ${c.color}, ${c.color}CC)`, borderRadius: 2 }} />
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="grid-chart" style={{ marginBottom: 16 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Wellness Trend</div>
            <div style={{ display: "flex", gap: 10, fontSize: 11, flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 12, height: 3, borderRadius: 2, background: T.purple }} /> Mood</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 12, height: 3, borderRadius: 2, background: T.blue }} /> Sleep</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 12, height: 3, borderRadius: 2, background: T.amber }} /> Energy</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>Last 7 days, scaled to 0-100</div>
          {!hasWellnessData ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 180, gap: 8 }}>
              <div style={{ fontSize: 32, color: T.purple }}>◉</div>
              <div style={{ fontSize: 14, color: T.textMuted, fontWeight: 500 }}>No wellness data yet</div>
              <div style={{ fontSize: 12, color: T.textDim }}>Log your mood and sleep to see trends</div>
              <button onClick={() => setPage("wellness")} style={{ marginTop: 4, background: T.purple, border: "1px solid transparent", borderRadius: 8, color: "#fff", padding: "7px 16px", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
                Log today&apos;s wellness
              </button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={last7}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...TT} />
                <Line type="monotone" dataKey="mood" stroke={T.purple} strokeWidth={2.5} dot={{ fill: T.purple, r: 4, strokeWidth: 0 }} connectNulls activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="sleep" stroke={T.blue} strokeWidth={2} dot={{ fill: T.blue, r: 3, strokeWidth: 0 }} connectNulls strokeDasharray="4 2" />
                <Line type="monotone" dataKey="energy" stroke={T.amber} strokeWidth={2} dot={{ fill: T.amber, r: 3, strokeWidth: 0 }} connectNulls strokeDasharray="2 2" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Life Balance</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4 }}>A quick read on the main parts of your routine</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            {bData.map((d) => (
              <div key={d.subject} style={{ fontSize: 10, color: T.textDim }}>
                <span style={{ color: T.text, fontWeight: 600 }}>{d.subject}</span> {d.A}%
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <RadarChart data={bData}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: T.textMuted, fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="A" stroke={T.cyan} fill={T.blue} fillOpacity={0.22} strokeWidth={2} />
              <Tooltip {...TT} formatter={(v) => [`${v}%`, "Score"]} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card style={{ background: T.elevated, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.purple}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Ic d={P.brain} size={18} color={T.purple} />
          <span style={{ fontWeight: 700, fontSize: 16, color: T.text }}>AI-Powered Insights</span>
        </div>
        <div className="grid-3" style={{ gap: 10 }}>
          {insights.slice(0, 3).map((x, i) => (
            <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
              <Ic d={x.icon} size={16} color={T.purple} />
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6, marginTop: 8 }}>{x.text}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
