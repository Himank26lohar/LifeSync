import { useState } from "react";
import { T } from "../constants/theme";
import { P } from "../constants/icons";
import { Ic, IBox, Badge, Btn } from "../components/Ic";
import Card from "../components/Card";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

const TT = { contentStyle: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, color: T.text } };
const pC = { high: T.red, medium: T.amber, low: T.green };

function buildPrompt(tasks, habits, wellness, focusSessions, entries) {
  const done = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const overdue = tasks.filter((t) => t.due && !t.completed && new Date(t.due) < new Date()).length;
  const habitsDone = habits.filter((h) => h.completed_today).length;
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0);
  const bestHabit = habits.find((h) => h.streak === bestStreak)?.name || "none";
  const recent7 = wellness.slice(-7);
  const avgMood = recent7.length ? (recent7.reduce((a, b) => a + b.mood, 0) / recent7.length).toFixed(1) : "N/A";
  const avgSleep = recent7.length ? (recent7.reduce((a, b) => a + b.sleep, 0) / recent7.length).toFixed(1) : "N/A";
  const totalFocus = focusSessions.reduce((a, b) => a + (b.duration || 0), 0);
  const focusToday = focusSessions.filter((s) => s.date === new Date().toLocaleDateString("en-CA")).reduce((a, b) => a + (b.duration || 0), 0);
  const journalCount = entries?.length || 0;

  return `You are a personal wellness coach AI. Analyze this user's lifestyle data and provide actionable insights.

USER DATA SUMMARY:
- Tasks: ${done}/${total} completed, ${overdue} overdue
- Habits: ${habitsDone}/${habits.length} done today, best streak: ${bestStreak} days (${bestHabit})
- Wellness (last 7 days): avg mood ${avgMood}/5, avg sleep ${avgSleep}h
- Focus: ${totalFocus}min total, ${focusToday}min today, ${focusSessions.length} sessions
- Journal: ${journalCount} entries

Respond ONLY with a valid JSON object in the expected schema.`;
}

async function fetchAIInsights(prompt) {
  const res = await fetch("http://localhost:8000/api/ai/insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const detail = data?.detail ? (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail)) : (data ? JSON.stringify(data) : "");
    throw new Error(detail || `API call failed (${res.status})`);
  }
  const text = data?.content?.[0]?.text || "";
  return JSON.parse(text);
}

const TYPE_ICON = { pattern: "Inspect", warning: "Warning", achievement: "Win", tip: "Tip" };
const CAT_COLOR = { habit: T.green, task: T.blue, wellness: T.purple, focus: T.cyan };
const DIFF_COLOR = { easy: T.green, medium: T.amber, hard: T.red };

export default function AIInsights({ tasks, habits, wellness, focusSessions, entries }) {
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRun, setLastRun] = useState(null);

  const done = tasks.filter((t) => t.completed);
  const avgSleep = wellness.length ? wellness.slice(-7).reduce((a, b) => a + b.sleep, 0) / Math.min(wellness.length, 7) : null;
  const totalFocus = focusSessions.reduce((a, b) => a + (b.duration || 0), 0);
  const prodScore = aiData?.score?.productivity ?? Math.min(99, 60 + done.length * 5 + focusSessions.length * 3);
  const goalPct = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;

  const hourData = [{ hour: "6AM", v: 42 }, { hour: "8AM", v: 74 }, { hour: "10AM", v: 96 }, { hour: "12PM", v: 63 }, { hour: "2PM", v: 80 }, { hour: "4PM", v: 68 }, { hour: "6PM", v: 50 }, { hour: "8PM", v: 29 }];
  const pieColors = [T.blue, T.green, T.amber, T.red, T.purple, T.cyan, T.pink];
  const mutedHourColors = [
    "#93aee3",
    "#9bbdd8",
    "#b2c7e6",
    "#c6c1de",
    "#b8d2d0",
    "#d5c9b7",
    "#c0b2d8",
    "#a8bfd3",
  ];

  const tagMap = {};
  tasks.forEach((t) => {
    const tags = Array.isArray(t.tags) ? t.tags : [];
    if (tags.length === 0) tagMap.Untagged = (tagMap.Untagged || 0) + 1;
    else tags.forEach((tag) => {
      const k = String(tag || "").trim() || "Untagged";
      tagMap[k] = (tagMap[k] || 0) + 1;
    });
  });
  const pieData = Object.entries(tagMap).map(([name, value], i) => ({ name, value, color: pieColors[i % pieColors.length] }));

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const prompt = buildPrompt(tasks, habits, wellness, focusSessions, entries || []);
      const result = await fetchAIInsights(prompt);
      setAiData(result);
      setLastRun(new Date().toLocaleTimeString());
    } catch (e) {
      setError(`Could not run AI analysis. Make sure your backend is running and GEMINI_API_KEY is set. ${e?.message ? `(${e.message})` : ""}`);
    }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div className="page-title" style={{ fontSize: 24, fontWeight: 700 }}>AI Insights & Analytics</div>
          <div className="page-subtitle" style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>Personalized insights from your real data</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {lastRun && <span style={{ fontSize: 11, color: T.textMuted }}>Last run: {lastRun}</span>}
          <Btn onClick={runAnalysis} color={loading ? T.elevated : T.purple} style={{ opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Analyzing..." : <><Ic d={P.ai} size={14} color={T.white} />Run AI Analysis</>}
          </Btn>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.10)", border: `1px solid ${T.red}55`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: T.red }}>
          {error}
        </div>
      )}

      <div className="grid-4" style={{ margin: "16px 0" }}>
        {[
          { icon: P.trend, color: T.blue, label: "Productivity", value: `${prodScore}%`, sub: aiData?.score ? "AI scored" : "estimated" },
          { icon: P.target, color: T.green, label: "Goal Progress", value: `${goalPct}%`, sub: goalPct >= 70 ? "On track" : "Needs focus" },
          { icon: P.time, color: T.cyan, label: "Focus Time", value: totalFocus ? `${(totalFocus / 60).toFixed(1)}h` : "0h", sub: "Total logged" },
          { icon: P.tasks, color: T.purple, label: "Completion Rate", value: tasks.length ? `${Math.round((done.length / tasks.length) * 100)}%` : "0%", sub: `${done.length}/${tasks.length} tasks` },
        ].map((s, i) => (
          <Card key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <IBox icon={s.icon} color={s.color} size={40} />
            <div>
              <div style={{ fontSize: 11, color: T.textMuted }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: s.color }}>{s.sub}</div>
            </div>
          </Card>
        ))}
      </div>

      {aiData?.score && (
        <Card style={{ marginBottom: 16, background: T.elevated, borderColor: T.border }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>AI Life Scores</span>
            <Badge label="AI Generated" color={T.purple} />
          </div>
          <div className="grid-4" style={{ gap: 12 }}>
            {[
              { label: "Productivity", val: aiData.score.productivity, color: T.blue },
              { label: "Wellness", val: aiData.score.wellness, color: T.purple },
              { label: "Consistency", val: aiData.score.consistency, color: T.green },
              { label: "Balance", val: aiData.score.balance, color: T.cyan },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: T.textMuted }}>{s.label}</span>
                  <span style={{ color: s.color, fontWeight: 700 }}>{s.val}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: T.elevated, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${s.val}%`, background: `linear-gradient(90deg, ${s.color}, ${s.color}CC)`, borderRadius: 3, transition: "width 1s" }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid-chart" style={{ marginBottom: 16 }}>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>Productivity by Time of Day</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>Estimated peak performance windows</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourData}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} />
              <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                {hourData.map((entry, i) => <Cell key={entry.hour} fill={mutedHourColors[i % mutedHourColors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>Task Tags</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>From your real task tags</div>
          {pieData.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: T.textMuted, fontSize: 13 }}>Add tasks to see breakdown</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, value }) => `${name} ${value}`} labelLine={false} fontSize={10}>
                  {pieData.map((e) => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Tooltip {...TT} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {!aiData && !loading && (
        <Card style={{ textAlign: "center", padding: "40px 20px", marginBottom: 16, background: T.elevated, borderColor: T.border, borderStyle: "dashed" }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>AI Analysis Not Run Yet</div>
          <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 16, maxWidth: 400, marginInline: "auto" }}>
            Run the analysis to get personalized insights, habit recommendations, a next-week action plan, and journal analysis based on your real data.
          </div>
          <Btn onClick={runAnalysis} style={{ margin: "0 auto" }}>
            <Ic d={P.ai} size={14} color={T.white} />Run AI Analysis Now
          </Btn>
        </Card>
      )}

      {loading && (
        <Card style={{ textAlign: "center", padding: "40px 20px", marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Analyzing your data...</div>
          <div style={{ fontSize: 13, color: T.textMuted }}>The AI is reading your tasks, habits, wellness, focus sessions, and journal entries.</div>
        </Card>
      )}

      {aiData && (
        <>
          <Card style={{ background: T.elevated, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.blue}`, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>Your Week in Summary</span>
              <Badge label="AI" color={T.blue} />
            </div>
            <div style={{ fontSize: 14, color: T.text, lineHeight: 1.7 }}>{aiData.weekly_summary}</div>
          </Card>

          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Personalized Insights</div>
          <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>
            {aiData.insights?.map((ins, i) => (
              <Card key={i} style={{ borderLeft: `3px solid ${pC[ins.priority] || T.blue}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{TYPE_ICON[ins.type] || "Insight"}</div>
                  <Badge label={ins.priority} color={pC[ins.priority]} />
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{ins.title}</div>
                <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>{ins.desc}</div>
              </Card>
            ))}
          </div>

          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Next Week Action Plan</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {aiData.next_week?.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: T.elevated, borderRadius: 12, padding: "14px 16px", border: `1px solid ${T.border}`, borderLeft: `3px solid ${CAT_COLOR[item.category] || T.blue}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.action}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>{item.reason}</div>
                </div>
                <div style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${CAT_COLOR[item.category] || T.blue}22`, color: CAT_COLOR[item.category] || T.blue, flexShrink: 0 }}>
                  {item.category}
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Recommended New Habits</div>
          <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>
            {aiData.habit_recommendations?.map((h, i) => (
              <Card key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{h.name}</div>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 600, background: `${DIFF_COLOR[h.difficulty]}22`, color: DIFF_COLOR[h.difficulty] }}>
                    {h.difficulty}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>{h.why}</div>
              </Card>
            ))}
          </div>

          {aiData.journal_insights?.length > 0 && (
            <>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Journal Analysis</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                {aiData.journal_insights.map((j, i) => (
                  <div key={i} style={{ background: T.elevated, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.amber}`, borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: T.text }}>Observation</div>
                    <div style={{ fontSize: 13, color: T.text, marginBottom: 8 }}>{j.observation}</div>
                    <div style={{ fontSize: 12, color: T.textMuted }}><span style={{ color: T.amber }}>Suggestion:</span> {j.suggestion}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {!aiData && !loading && (
        <>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Personalized Insights</div>
          <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>
            {[
              { color: T.blue, priority: "high", title: "Peak Performance Windows", desc: "Your productivity appears strongest between 9-11 AM. Put the hardest work there." },
              { color: T.amber, priority: "high", title: "Sleep Impact", desc: `Averaging ${avgSleep ? avgSleep.toFixed(1) : "?"} hours of sleep. Aim for 7-8 hours for steadier focus.` },
              { color: T.green, priority: "medium", title: "Habit Consistency", desc: "Run AI analysis to get more specific habit insights from your streak data." },
              { color: T.purple, priority: "medium", title: "Focus Patterns", desc: `You've logged ${focusSessions.length} focus sessions so far.` },
            ].map((ins, i) => (
              <Card key={i} style={{ borderLeft: `3px solid ${ins.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: T.textMuted }}>Insight</div>
                  <Badge label={ins.priority} color={pC[ins.priority]} />
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{ins.title}</div>
                <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>{ins.desc}</div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
