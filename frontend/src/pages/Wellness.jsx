import { useState, useEffect, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { T } from "../constants/theme";
import { P } from "../constants/icons";
import { IBox, Btn, Lbl, Spinner } from "../components/Ic";
import Card from "../components/Card";
import { logWellness, deleteWellness } from "../api/wellness";

const TT = { contentStyle: { background:T.card, border:`1px solid ${T.border}`, borderRadius:8, fontSize:12, color:T.text } };
const MOOD_LABELS = ["","😞 Very Low","😕 Low","😐 Okay","🙂 Good","😄 Great"];
const MOOD_COLORS = ["", T.red, T.amber, T.cyan, T.purpleLight, T.green];

const EMOTION_TAGS = [
  { label:"😰 Anxious",      key:"Anxious",      color:"#f97316" },
  { label:"🌀 Overthinking", key:"Overthinking",  color:"#8b5cf6" },
  { label:"😤 Stressed",     key:"Stressed",      color:"#ef4444" },
  { label:"😴 Fatigued",     key:"Fatigued",      color:"#64748b" },
  { label:"🎯 Focused",      key:"Focused",       color:"#06b6d4" },
  { label:"😄 Motivated",    key:"Motivated",     color:"#22c55e" },
  { label:"😢 Low",          key:"Low",           color:"#3b82f6" },
  { label:"🧘 Calm",         key:"Calm",          color:"#10b981" },
];

const WORKOUT_TYPES    = ["Cardio","Strength","Yoga","HIIT","Walking","Cycling","Swimming","Stretching"];
const INTENSITIES      = ["Low","Medium","High"];
const INTERVAL_OPTIONS = [15,30,45,60,90,120];

const LS = {
  get: (k,d) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):d; } catch { return d; } },
  set: (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} },
};
const todayStr = () => new Date().toLocaleDateString("en-CA");

const WEEK = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const startOfWeekMon = (d=new Date()) => {
  const x = new Date(d);
  const dow = (x.getDay()+6)%7; // Mon=0..Sun=6
  x.setDate(x.getDate()-dow);
  x.setHours(0,0,0,0);
  return x;
};
const toISODate = (d) => new Date(d).toLocaleDateString("en-CA");

let swRegistration = null;
async function initSW() {
  if (!("serviceWorker" in navigator)) return;
  try { swRegistration = await navigator.serviceWorker.register("/sw.js"); await navigator.serviceWorker.ready; }
  catch(e) { console.warn("SW failed:", e); }
}
async function requestPermission() {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return await Notification.requestPermission();
}
async function sendNotification(title, body, tag) {
  const perm = await requestPermission();
  if (perm !== "granted") return false;
  try {
    const reg = swRegistration || await navigator.serviceWorker.ready;
    if (reg?.showNotification) { await reg.showNotification(title, { body, tag, icon:"/logo192.png", vibrate:[200,100,200] }); return true; }
  } catch(e) { console.warn("SW notification failed:", e); }
  try { new Notification(title, { body, tag, icon:"/logo192.png" }); return true; }
  catch(e) { return false; }
}

const WeekTick = ({ x, y, payload, index, weekData }) => {
  const d = weekData?.[index];
  const fill = d?.hasData ? T.textMuted : T.textDim;
  const fw = d?.isToday ? 700 : 500;
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={12} textAnchor="middle" fill={fill} fontSize={10} fontWeight={fw}>
        {payload.value}
      </text>
    </g>
  );
};

export default function Wellness({ wellness, setWellness, loading }) {
  const [mood,     setMood]     = useState(3);
  const [sleep,    setSleep]    = useState(7);
  const [energy,   setEnergy]   = useState(3);
  const [stress,   setStress]   = useState(3);
  const [tags,     setTags]     = useState([]);
  const [note,     setNote]     = useState("");
  const [saved,    setSaved]    = useState(false);
  const [tab,      setTab]      = useState("overview");

  const [weightLog,   setWeightLog]   = useState(() => LS.get("wt_log", []));
  const [weightInput, setWeightInput] = useState("");
  const [weightNote,  setWeightNote]  = useState("");

  const [workouts,    setWorkouts]    = useState(() => LS.get("wo_log", []));
  const [woType,      setWoType]      = useState("Cardio");
  const [woDur,       setWoDur]       = useState(30);
  const [woIntensity, setWoIntensity] = useState("Medium");

  const [notifPerm,       setNotifPerm]       = useState(() => typeof Notification !== "undefined" ? Notification.permission : "default");
  const [postureOn,       setPostureOn]       = useState(() => LS.get("posture_on", false));
  const [postureInterval, setPostureInterval] = useState(() => LS.get("posture_int", 30));
  const [stretchOn,       setStretchOn]       = useState(() => LS.get("stretch_on", false));
  const [stretchInterval, setStretchInterval] = useState(() => LS.get("stretch_int", 45));
  const [postureAlert,    setPostureAlert]    = useState(false);
  const [stretchAlert,    setStretchAlert]    = useState(false);
  const postureRef = useRef(null);
  const stretchRef = useRef(null);

  useEffect(() => { initSW(); }, []);

  useEffect(() => {
    clearInterval(postureRef.current);
    LS.set("posture_on", postureOn); LS.set("posture_int", postureInterval);
    if (postureOn) {
      postureRef.current = setInterval(async () => {
        const sent = await sendNotification("🪑 Posture Check!", "Sit up straight and take a deep breath.", "posture");
        if (!sent) setPostureAlert(true);
      }, postureInterval * 60 * 1000);
    }
    return () => clearInterval(postureRef.current);
  }, [postureOn, postureInterval]);

  useEffect(() => {
    clearInterval(stretchRef.current);
    LS.set("stretch_on", stretchOn); LS.set("stretch_int", stretchInterval);
    if (stretchOn) {
      stretchRef.current = setInterval(async () => {
        const sent = await sendNotification("🧘 Time to Stretch!", "Stand up and take a short break!", "stretch");
        if (!sent) setStretchAlert(true);
      }, stretchInterval * 60 * 1000);
    }
    return () => clearInterval(stretchRef.current);
  }, [stretchOn, stretchInterval]);

  const askPermission = async () => { const r=await requestPermission(); setNotifPerm(r); return r==="granted"; };
  const togglePosture = async () => {
    if (!postureOn) { const g=await askPermission(); if (!g) { alert("Allow notifications first."); return; } }
    setPostureOn(v=>!v);
  };
  const toggleStretch = async () => {
    if (!stretchOn) { const g=await askPermission(); if (!g) { alert("Allow notifications first."); return; } }
    setStretchOn(v=>!v);
  };
  const toggleTag = (key) => setTags(prev=>prev.includes(key)?prev.filter(t=>t!==key):[...prev,key]);

  const log = async () => {
    const todayDate = new Date().toLocaleDateString();
    if (wellness.some(w=>w.date===todayDate)) { alert("Already logged today. Delete today's entry first to re-log."); return; }
    const entry = { mood, sleep, energy, stress, tags, note, date:todayDate, day:new Date().toLocaleDateString("en",{weekday:"short"}) };
    try {
      const created = await logWellness(entry);
      setWellness(prev=>[...prev,created]);
      setSaved(true); setTimeout(()=>setSaved(false),2000);
      setNote(""); setTags([]);
    } catch(e) {
      if (e?.response?.status===400) alert("Already logged today.");
      else alert("Error logging wellness.");
    }
  };

  const logWeight = () => {
    const w=parseFloat(weightInput);
    if (!w||w<=0) return;
    const now=new Date(); const dow=(now.getDay()+6)%7;
    const ws=new Date(now); ws.setDate(now.getDate()-dow); ws.setHours(0,0,0,0);
    if (weightLog.some(e=>e.date>=ws.toLocaleDateString("en-CA"))) { alert("Already logged this week."); return; }
    const updated=[...weightLog,{date:todayStr(),weight:w,note:weightNote}];
    setWeightLog(updated); LS.set("wt_log",updated);
    setWeightInput(""); setWeightNote("");
  };

  const logWorkout = () => {
    const updated=[...workouts,{date:todayStr(),type:woType,duration:woDur,intensity:woIntensity}];
    setWorkouts(updated); LS.set("wo_log",updated);
  };

  const deleteEntry = async (id) => {
    try { await deleteWellness(id); setWellness(prev=>prev.filter(x=>x.id!==id)); }
    catch { alert("Error deleting entry."); }
  };

  // Build a fixed Mon→Sun week for charts, using logged_at when available
  const weekStart = startOfWeekMon(new Date());
  const weekDays = WEEK.map((label, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate()+i);
    const iso = toISODate(date);
    return { label, iso };
  });

  // Pick the latest entry per day (by logged_at), if any
  const byIso = {};
  wellness.forEach(w => {
    const when = w.logged_at ? new Date(w.logged_at) : (w.date ? new Date(w.date) : null);
    if (!when || Number.isNaN(when.getTime())) return;
    const iso = toISODate(when);
    const prev = byIso[iso];
    const prevT = prev?.logged_at ? new Date(prev.logged_at).getTime() : -1;
    const curT  = w.logged_at ? new Date(w.logged_at).getTime() : when.getTime();
    if (!prev || curT >= prevT) byIso[iso] = w;
  });

  const todayIso = todayStr();
  const weekData = weekDays.map(d => {
    const w = byIso[d.iso];
    const hasData = !!w;
    return {
      day: d.label,
      iso: d.iso,
      hasData,
      isToday: d.iso === todayIso,
      mood: hasData ? w.mood : null,
      energy: hasData ? (w.energy ?? null) : null,
      stress: hasData ? (w.stress ?? null) : null,
      sleep: hasData ? (w.sleep ?? null) : null,
      tags: hasData ? (w.tags || []) : [],
    };
  });

  const weekLogged = weekData.filter(d => d.hasData);
  const avgMood   = weekLogged.length ? weekLogged.reduce((a,b)=>a+(b.mood||0),0)/weekLogged.length : 0;
  const avgSleep  = weekLogged.length ? weekLogged.reduce((a,b)=>a+(b.sleep||0),0)/weekLogged.length : 0;
  const avgEnergy = weekLogged.filter(w=>w.energy!=null).length ? weekLogged.filter(w=>w.energy!=null).reduce((a,b)=>a+(b.energy||0),0)/weekLogged.filter(w=>w.energy!=null).length : 0;
  const avgStress = weekLogged.filter(w=>w.stress!=null).length ? weekLogged.filter(w=>w.stress!=null).reduce((a,b)=>a+(b.stress||0),0)/weekLogged.filter(w=>w.stress!=null).length : 0;

  const chartData = weekData.map(d=>({day:d.day,mood:d.mood,energy:d.energy,stress:d.stress,tags:d.tags,hasData:d.hasData,isToday:d.isToday}));
  const tagFreq   = {};
  weekLogged.forEach(w=>(w.tags||[]).forEach(t=>{tagFreq[t]=(tagFreq[t]||0)+1;}));
  const sleepData = weekData.map(d=>({day:d.day,sleep:d.sleep,hasData:d.hasData,isToday:d.isToday}));

  const today           = todayStr();
  const todayWorkout    = workouts.filter(w=>w.date===today);
  const weekWorkouts    = workouts.filter(w=>{
    const d=new Date(w.date); const n=new Date();
    const ws=new Date(n); ws.setDate(n.getDate()-((n.getDay()+6)%7)); ws.setHours(0,0,0,0);
    return d>=ws;
  });
  const weekWorkoutMins     = weekWorkouts.reduce((a,b)=>a+b.duration,0);
  const weightLast7         = weightLog.slice(-7);
  const weightChange        = weightLast7.length>=2?(weightLast7[weightLast7.length-1].weight-weightLast7[0].weight).toFixed(1):null;
  const alreadyLoggedToday  = wellness.some(w=>w.date===new Date().toLocaleDateString());

  const TABS = ["overview","weight","workout","reminders"];
  if (loading) return <Spinner/>;

  // ── Slider component ──────────────────────────────────────────────────────
  const SliderRow = ({ label, value, onChange, color, min=1, max=5, labels }) => (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <Lbl>{label}</Lbl>
        <span style={{ fontSize:12, color, fontWeight:600 }}>{value}{max===12?"h":"/5"}</span>
      </div>
      <input type="range" min={min} max={max} step={1} value={value}
        onChange={e=>onChange(parseInt(e.target.value))}
        style={{ width:"100%", accentColor:color, cursor:"pointer" }}/>
      {labels && (
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.textDim, marginTop:2 }}>
          {labels.map((l,i)=><span key={i}>{l}</span>)}
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:8 }}>
        <div>
          <div className="page-title" style={{ fontSize:24, fontWeight:700 }}>Wellness</div>
          <div className="page-subtitle" style={{ fontSize:13, color:T.textMuted, marginTop:2 }}>Track your emotional and physical well-being</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
          {postureAlert && (
            <div style={{ background:"#f97316", color:"#fff", borderRadius:10, padding:"8px 14px",
              fontSize:12, fontWeight:600, display:"flex", gap:8, alignItems:"center" }}>
              🪑 Check your posture!
              <button onClick={()=>setPostureAlert(false)} style={{ background:"none",border:"none",color:"#fff",cursor:"pointer",fontSize:16 }}>✕</button>
            </div>
          )}
          {stretchAlert && (
            <div style={{ background:"#22c55e", color:"#fff", borderRadius:10, padding:"8px 14px",
              fontSize:12, fontWeight:600, display:"flex", gap:8, alignItems:"center" }}>
              🧘 Time to stretch!
              <button onClick={()=>setStretchAlert(false)} style={{ background:"none",border:"none",color:"#fff",cursor:"pointer",fontSize:16 }}>✕</button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="tab-bar" style={{ display:"flex", gap:6, marginBottom:18,
        borderBottom:`1px solid ${T.border}`, paddingBottom:12, overflowX:"auto" }}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{ padding:"7px 14px", borderRadius:8, border:"none", cursor:"pointer",
              fontSize:12, fontWeight:500, whiteSpace:"nowrap", flexShrink:0,
              background:tab===t?T.purple:"transparent", color:tab===t?"#fff":T.textMuted }}>
            {t==="overview"?"📊 Overview":t==="weight"?"⚖️ Weight":t==="workout"?"💪 Workout":"🔔 Reminders"}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div>

          {/* Fix 1: Stats cards — smaller icon, compact on mobile */}
          <div className="grid-wellness-stats">
          
            {[
              { icon:P.wellness, color:T.pink,    label:"Avg Mood",   value:avgMood   ?`${avgMood.toFixed(1)}/5`  :"—" },
              { icon:P.moon,     color:T.blue,    label:"Avg Sleep",  value:avgSleep  ?`${avgSleep.toFixed(1)}h`  :"—" },
              { icon:P.zap,      color:T.amber,   label:"Avg Energy", value:avgEnergy ?`${avgEnergy.toFixed(1)}/5`:"—" },
              { icon:P.activity, color:"#ef4444", label:"Avg Stress", value:avgStress ?`${avgStress.toFixed(1)}/5`:"—" },
            ].map(s=>(
              <Card key={s.label} style={{ display:"flex", gap:10, alignItems:"center", padding:"12px 14px" }}>
                {/* Fix 1: smaller icon */}
                <IBox icon={s.icon} color={s.color} size={32}/>
                <div>
                  <div style={{ fontSize:10, color:T.textMuted }}>{s.label}</div>
                  <div style={{ fontSize:18, fontWeight:700 }}>{s.value}</div>
                </div>
              </Card>
            ))}
          </div>

          {/* Fix 2: Emotional Trends — reduced height on mobile */}
          <Card style={{ marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4, flexWrap:"wrap", gap:6 }}>
              <div style={{ fontWeight:600 }}>Emotional Trends</div>
              <div style={{ display:"flex", gap:10, fontSize:11 }}>
                <span style={{ color:T.pink }}>● Mood</span>
                <span style={{ color:T.amber }}>● Energy</span>
                <span style={{ color:"#ef4444" }}>● Stress</span>
              </div>
            </div>
            {/* Fix 2: hide verbose legend on mobile */}
            <div className="hide-mobile" style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:10 }}>
              <span style={{ fontSize:11, color:T.textDim }}>Dot colors:</span>
              <span style={{ fontSize:11, color:"#ef4444" }}>🔴 Anxious/Stressed/Low</span>
              <span style={{ fontSize:11, color:"#22c55e" }}>🟢 Focused/Motivated/Calm</span>
            </div>
            {chartData.length === 0
              ? <div style={{ textAlign:"center", padding:32, color:T.textMuted, fontSize:13 }}>Log wellness to see trends</div>
              : <ResponsiveContainer width="100%" height={172}>
                  <LineChart data={chartData}>
                    <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false}/>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={(p)=><WeekTick {...p} weekData={chartData}/>}
                    />
                    <YAxis domain={[0,5]} tick={{fill:T.textMuted,fontSize:9}} axisLine={false} tickLine={false} width={20}/>
                    <Tooltip {...TT} content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload;
                      return (
                        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:"8px 12px", fontSize:11 }}>
                          <div style={{ fontWeight:600, marginBottom:4 }}>{label}</div>
                          {payload.map(p=>(
                            <div key={p.dataKey} style={{ color:p.color, marginBottom:2 }}>
                              {p.dataKey.charAt(0).toUpperCase()+p.dataKey.slice(1)}: {p.value}
                            </div>
                          ))}
                          {d?.tags?.length > 0 && (
                            <div style={{ marginTop:4, paddingTop:4, borderTop:`1px solid ${T.border}` }}>
                              <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
                                {d.tags.map(t=>{
                                  const et=EMOTION_TAGS.find(e=>e.key===t);
                                  return <span key={t} style={{ background:`${et?.color}22`, color:et?.color, padding:"1px 5px", borderRadius:4, fontSize:10 }}>{t}</span>;
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }}/>
                    <Line type="natural" dataKey="mood" stroke="#9b6dff" strokeWidth={3} dot={{fill:"#9b6dff",r:4.5,stroke:T.card,strokeWidth:2}} activeDot={{r:6,fill:"#9b6dff",stroke:T.card,strokeWidth:2}} connectNulls/>
                    <Line type="natural" dataKey="energy" stroke="#d38a42" strokeWidth={2.6} dot={{fill:"#d38a42",r:4,stroke:T.card,strokeWidth:2}} activeDot={{r:5.5,fill:"#d38a42",stroke:T.card,strokeWidth:2}} connectNulls/>
                    <Line type="natural" dataKey="stress" stroke="#e36d5b" strokeWidth={2.6} dot={{fill:"#e36d5b",r:4,stroke:T.card,strokeWidth:2}} activeDot={{r:5.5,fill:"#e36d5b",stroke:T.card,strokeWidth:2}} connectNulls/>
                  </LineChart>
                </ResponsiveContainer>
            }
          </Card>

          {/* Fix 3: Emotion frequency + Sleep — stack vertically (grid-chart stacks on mobile) */}
          <div className="grid-chart" style={{ marginBottom:16 }}>
            <Card>
              <div style={{ fontWeight:600, marginBottom:2 }}>Emotion Frequency</div>
              <div style={{ fontSize:12, color:T.textMuted, marginBottom:12 }}>This week's emotional patterns</div>
              {Object.keys(tagFreq).length === 0
                ? <div style={{ textAlign:"center", padding:20, color:T.textMuted, fontSize:13 }}>Log emotional tags to see patterns</div>
                : <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {Object.entries(tagFreq).sort((a,b)=>b[1]-a[1]).map(([key,count])=>{
                      const et=EMOTION_TAGS.find(e=>e.key===key);
                      return (
                        <div key={key}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}>
                            <span style={{ color:et?.color }}>{et?.label||key}</span>
                            <span style={{ color:T.textMuted }}>{count}x</span>
                          </div>
                          <div style={{ height:5, borderRadius:3, background:T.border, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${(count/7)*100}%`, background:et?.color, borderRadius:3 }}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
              }
            </Card>
            <Card>
              <div style={{ fontWeight:600, marginBottom:2 }}>Sleep Pattern</div>
              <div style={{ fontSize:12, color:T.textMuted, marginBottom:12 }}>Last 7 entries</div>
              {sleepData.length === 0
                ? <div style={{ textAlign:"center", padding:20, color:T.textMuted, fontSize:13 }}>Log sleep to see patterns</div>
                : <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={sleepData}>
                      <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false}/>
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={(p)=><WeekTick {...p} weekData={sleepData}/>}
                      />
                      <YAxis domain={[0,12]} tick={{fill:T.textMuted,fontSize:9}} axisLine={false} tickLine={false} width={20}/>
                      <Tooltip {...TT}/>
                      <Bar dataKey="sleep" radius={[10,10,4,4]}>
                        {sleepData.map((d,i)=>(
                          <Cell key={i} fill={d.hasData ? "#8d7ac8" : "rgba(141, 122, 200, 0.24)"}/>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
              }
            </Card>
          </div>

          {/* Log form */}
          <Card style={{ marginBottom:16 }}>
            <div style={{ fontWeight:600, marginBottom:14, fontSize:15 }}>Log Today's Wellness</div>

            {/* Mood */}
            <div style={{ marginBottom:16 }}>
              <Lbl>How are you feeling? — {MOOD_LABELS[mood]}</Lbl>
              <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
                {[1,2,3,4,5].map(m=>(
                  <div key={m} onClick={()=>setMood(m)}
                    style={{ width:40, height:40, borderRadius:999, display:"flex", alignItems:"center",
                      justifyContent:"center", cursor:"pointer", fontSize:18,
                      background:mood===m?`${MOOD_COLORS[m]}22`:T.bg,
                      border:`2px solid ${mood===m?MOOD_COLORS[m]:T.border}` }}>
                    {["😞","😕","😐","🙂","😄"][m-1]}
                  </div>
                ))}
              </div>
            </div>

            {/* Fix 4 & 5: Sliders always stacked vertically */}
            <div className="grid-3" style={{ marginBottom:16 }}>
              <SliderRow label="Sleep Duration" value={sleep} onChange={setSleep} color={T.blue} min={1} max={12}
                labels={["1h","4h","6h","8h","10h","12h"]}/>
              <SliderRow label="Energy Level" value={energy} onChange={setEnergy} color={T.amber}
                labels={["Drained","Low","Okay","Good","Peak"]}/>
              <SliderRow label="Stress Level" value={stress} onChange={setStress} color="#ef4444"
                labels={["None","Low","Moderate","High","Extreme"]}/>
            </div>

            {/* Emotion tags */}
            <div style={{ marginBottom:14 }}>
              <Lbl>How are you feeling emotionally?</Lbl>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:8 }}>
                {EMOTION_TAGS.map(et=>(
                  <button key={et.key} onClick={()=>toggleTag(et.key)}
                    style={{ padding:"6px 10px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:500,
                      border:`1.5px solid ${tags.includes(et.key)?et.color:T.border}`,
                      background:tags.includes(et.key)?`${et.color}22`:"transparent",
                      color:tags.includes(et.key)?et.color:T.textMuted }}>
                    {et.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div style={{ marginBottom:14 }}>
              <Lbl>Journal Note (Optional)</Lbl>
              <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="How was your day?"
                style={{ width:"100%", background:T.bg, border:`1px solid ${T.border}`, borderRadius:8,
                  padding:"10px 12px", color:T.text, fontSize:14, outline:"none",
                  resize:"vertical", minHeight:60, boxSizing:"border-box" }}/>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <Btn onClick={log} color={saved?T.green:alreadyLoggedToday?T.border:T.purple}
                style={{ opacity:alreadyLoggedToday?0.5:1, cursor:alreadyLoggedToday?"not-allowed":"pointer" }}>
                {saved?"✓ Logged!":alreadyLoggedToday?"✓ Already Logged Today":"Log Today"}
              </Btn>
              {alreadyLoggedToday && <span style={{ fontSize:12, color:T.textMuted }}>Delete today's entry to re-log</span>}
            </div>
          </Card>

          {/* Recent entries */}
          {wellness.length > 0 && (
            <Card style={{ marginBottom:16 }}>
              <div style={{ fontWeight:600, marginBottom:12 }}>Recent Entries</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {wellness.slice(-7).reverse().map((w,i)=>(
                  <div key={w.id||i} style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"center", padding:"10px 12px", background:T.bg, borderRadius:10 }}>
                    <div style={{ display:"flex", gap:10, alignItems:"center", flex:1, minWidth:0 }}>
                      <span style={{ fontSize:18, flexShrink:0 }}>{["😞","😕","😐","🙂","😄"][w.mood-1]}</span>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:500 }}>{w.date} — {w.day}</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginTop:1 }}>
                          Sleep: {w.sleep}h{w.energy?` · E:${w.energy}/5`:""}{w.stress?` · S:${w.stress}/5`:""}
                        </div>
                        {w.tags?.length > 0 && (
                          <div style={{ display:"flex", gap:4, marginTop:3, flexWrap:"wrap" }}>
                            {w.tags.map(t=>{
                              const et=EMOTION_TAGS.find(e=>e.key===t);
                              return <span key={t} style={{ fontSize:10, padding:"1px 5px", borderRadius:4,
                                background:`${et?.color}22`, color:et?.color }}>{t}</span>;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={()=>deleteEntry(w.id)}
                      style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:6,
                        color:"#ef4444", cursor:"pointer", padding:"4px 8px", fontSize:11, flexShrink:0, marginLeft:8 }}>
                      Del
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── WEIGHT ── */}
      {tab === "weight" && (
        <div>
          {weightChange !== null && (
            <Card style={{ marginBottom:14,
              background:parseFloat(weightChange)<=0?`${T.green}18`:`${T.amber}18`,
              borderColor:parseFloat(weightChange)<=0?T.green:T.amber }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:13, color:T.textMuted }}>Weekly Change</div>
                <div style={{ fontSize:24, fontWeight:800, color:parseFloat(weightChange)<=0?T.green:T.amber }}>
                  {parseFloat(weightChange)>0?"+":""}{weightChange} kg
                </div>
              </div>
            </Card>
          )}
          <Card style={{ marginBottom:14 }}>
            <div style={{ fontWeight:600, marginBottom:2 }}>Weight Trend</div>
            <div style={{ fontSize:12, color:T.textMuted, marginBottom:12 }}>Last 7 entries</div>
            {weightLast7.length < 2
              ? <div style={{ textAlign:"center", padding:32, color:T.textMuted, fontSize:13 }}>Log at least 2 entries to see trend</div>
              : <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={weightLast7}>
                    <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false}/>
                    <XAxis dataKey="date" tick={{fill:T.textMuted,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={d=>d.slice(5)}/>
                    <YAxis tick={{fill:T.textMuted,fontSize:9}} axisLine={false} tickLine={false} domain={["auto","auto"]} width={30}/>
                    <Tooltip {...TT} formatter={v=>[`${v} kg`,"Weight"]}/>
                    <Line type="monotone" dataKey="weight" stroke={T.purple} strokeWidth={2.5} dot={{fill:T.purple,r:4}}/>
                  </LineChart>
                </ResponsiveContainer>
            }
          </Card>
          <Card>
            <div style={{ fontWeight:600, marginBottom:14 }}>Log Weight</div>
            <div className="grid-2" style={{ marginBottom:12 }}>
              <div>
                <Lbl>Weight (kg)</Lbl>
                <input type="number" step="0.1" value={weightInput} onChange={e=>setWeightInput(e.target.value)}
                  placeholder="e.g. 72.5"
                  style={{ width:"100%", background:T.bg, border:`1px solid ${T.border}`, borderRadius:8,
                    color:T.text, padding:"8px 10px", fontSize:13, boxSizing:"border-box" }}/>
              </div>
              <div>
                <Lbl>Note (optional)</Lbl>
                <input type="text" value={weightNote} onChange={e=>setWeightNote(e.target.value)}
                  placeholder="e.g. after workout"
                  style={{ width:"100%", background:T.bg, border:`1px solid ${T.border}`, borderRadius:8,
                    color:T.text, padding:"8px 10px", fontSize:13, boxSizing:"border-box" }}/>
              </div>
            </div>
            {(()=>{
              const now=new Date(); const dow=(now.getDay()+6)%7;
              const ws=new Date(now); ws.setDate(now.getDate()-dow); ws.setHours(0,0,0,0);
              const loggedThisWeek=weightLog.some(e=>e.date>=ws.toLocaleDateString("en-CA"));
              return (
                <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                  <Btn onClick={logWeight} style={{ opacity:loggedThisWeek?0.5:1, cursor:loggedThisWeek?"not-allowed":"pointer" }}>
                    {loggedThisWeek?"✓ Logged This Week":"Save Weight"}
                  </Btn>
                  {loggedThisWeek && <span style={{ fontSize:12, color:T.textMuted }}>Next entry on Monday</span>}
                </div>
              );
            })()}
            {weightLog.length > 0 && (
              <div style={{ marginTop:14 }}>
                <div style={{ fontSize:12, color:T.textMuted, marginBottom:8 }}>Recent Entries</div>
                {weightLog.slice(-5).reverse().map((w,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:13,
                    padding:"6px 10px", background:T.bg, borderRadius:8, marginBottom:4 }}>
                    <span style={{ color:T.textMuted }}>{w.date}</span>
                    <span style={{ fontWeight:600 }}>{w.weight} kg</span>
                    {w.note && <span style={{ color:T.textMuted, fontSize:11 }}>{w.note}</span>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── WORKOUT ── */}
      {tab === "workout" && (
        <div>
        <div className="grid-workout-stats">
          {[
            { label:"This Week", value:`${weekWorkoutMins}m`, sub:"Total workout time" },
              { label:"Sessions",  value:`${weekWorkouts.length}`,  sub:"This week" },
              { label:"Today",     value:`${todayWorkout.reduce((a,b)=>a+b.duration,0)}m`, sub:`${todayWorkout.length} session${todayWorkout.length!==1?"s":""}` },
            ].map(s=>(
              <Card key={s.label}>
                <div style={{ fontSize:12, color:T.textMuted }}>{s.label}</div>
                <div style={{ fontSize:26, fontWeight:700, marginTop:4 }}>{s.value}</div>
                <div style={{ fontSize:12, color:T.textMuted }}>{s.sub}</div>
              </Card>
            ))}
          </div>
          <Card style={{ marginBottom:14 }}>
            <div style={{ fontWeight:600, marginBottom:12 }}>Quick Log Workout</div>
            <Lbl>Type</Lbl>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:6, marginBottom:14 }}>
              {WORKOUT_TYPES.map(t=>(
                <button key={t} onClick={()=>setWoType(t)}
                  style={{ padding:"6px 12px", borderRadius:8,
                    border:`1.5px solid ${woType===t?T.purple:T.border}`,
                    background:woType===t?`${T.purple}22`:"transparent",
                    color:woType===t?T.purple:T.textMuted, cursor:"pointer", fontSize:12, fontWeight:500 }}>
                  {t}
                </button>
              ))}
            </div>
            <div className="grid-2" style={{ marginBottom:14 }}>
              <div>
                <Lbl>Duration — {woDur} minutes</Lbl>
                <input type="range" min="5" max="120" step="5" value={woDur}
                  onChange={e=>setWoDur(parseInt(e.target.value))}
                  style={{ width:"100%", accentColor:T.purple, marginTop:8 }}/>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:T.textDim }}>
                  <span>5m</span><span>120m</span>
                </div>
              </div>
              <div>
                <Lbl>Intensity</Lbl>
                <div style={{ display:"flex", gap:8, marginTop:8 }}>
                  {INTENSITIES.map(i=>{
                    const c=i==="Low"?T.green:i==="Medium"?T.amber:T.red;
                    return (
                      <button key={i} onClick={()=>setWoIntensity(i)}
                        style={{ flex:1, padding:"8px 0", borderRadius:8,
                          border:`1.5px solid ${woIntensity===i?c:T.border}`,
                          background:woIntensity===i?`${c}22`:"transparent",
                          color:woIntensity===i?c:T.textMuted, cursor:"pointer", fontSize:12, fontWeight:500 }}>
                        {i}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <Btn onClick={logWorkout}>Log Workout</Btn>
          </Card>
          {workouts.length > 0 && (
            <Card>
              <div style={{ fontWeight:600, marginBottom:12 }}>Recent Workouts</div>
              {workouts.slice(-6).reverse().map((w,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"8px 12px", background:T.bg, borderRadius:8, marginBottom:6, flexWrap:"wrap", gap:6 }}>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <div style={{ width:8,height:8,borderRadius:"50%",background:w.intensity==="Low"?T.green:w.intensity==="Medium"?T.amber:T.red }}/>
                    <span style={{ fontWeight:500 }}>{w.type}</span>
                  </div>
                  <span style={{ fontSize:12, color:T.textMuted }}>{w.duration}m · {w.intensity}</span>
                  <span style={{ fontSize:11, color:T.textDim }}>{w.date}</span>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* ── REMINDERS ── */}
      {tab === "reminders" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Card style={{
            background:notifPerm==="granted"?`${T.green}18`:notifPerm==="denied"?`#ef444418`:`${T.amber}18`,
            borderColor:notifPerm==="granted"?T.green:notifPerm==="denied"?"#ef4444":T.amber }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
              <div>
                <div style={{ fontWeight:600, fontSize:14 }}>
                  {notifPerm==="granted"?"✅ Notifications Enabled":notifPerm==="denied"?"❌ Notifications Blocked":"⚠️ Permission Required"}
                </div>
                <div style={{ fontSize:12, color:T.textMuted, marginTop:4 }}>
                  {notifPerm==="granted"?"Notifications fire even when tab is in background."
                    :notifPerm==="denied"?"Enable in browser Settings → Notifications"
                    :"Click Enable Now to allow notifications."}
                </div>
              </div>
              {notifPerm!=="granted"&&notifPerm!=="denied"&&<Btn onClick={askPermission}>Enable Now</Btn>}
            </div>
          </Card>

          {[
            { label:"Posture Reminder", sub:"Get notified to sit up straight", emoji:"🪑", on:postureOn, toggle:togglePosture, interval:postureInterval, setInt:setPostureInterval, color:T.purple },
            { label:"Stretch & Break Alert", sub:"Reminder to stretch or take a break", emoji:"🧘", on:stretchOn, toggle:toggleStretch, interval:stretchInterval, setInt:setStretchInterval, color:T.green },
          ].map(r=>(
            <Card key={r.label}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                  <div style={{ fontSize:28 }}>{r.emoji}</div>
                  <div>
                    <div style={{ fontWeight:600 }}>{r.label}</div>
                    <div style={{ fontSize:12, color:T.textMuted }}>{r.sub}</div>
                  </div>
                </div>
                <div onClick={r.toggle}
                  style={{ width:48,height:26,borderRadius:13,cursor:"pointer",transition:"background 0.2s",
                    background:r.on?r.color:T.border,position:"relative",flexShrink:0 }}>
                  <div style={{ position:"absolute",top:3,left:r.on?24:3,transition:"left 0.2s",
                    width:20,height:20,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.3)" }}/>
                </div>
              </div>
              <div style={{ opacity:r.on?1:0.4, pointerEvents:r.on?"auto":"none" }}>
                <Lbl>Interval — every {r.interval} minutes</Lbl>
                <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
                  {INTERVAL_OPTIONS.map(v=>(
                    <button key={v} onClick={()=>r.setInt(v)}
                      style={{ padding:"6px 12px", borderRadius:8, cursor:"pointer", fontSize:12,
                        border:`1.5px solid ${r.interval===v?r.color:T.border}`,
                        background:r.interval===v?`${r.color}22`:"transparent",
                        color:r.interval===v?r.color:T.textMuted }}>
                      {v}m
                    </button>
                  ))}
                </div>
              </div>
              {r.on && <div style={{ marginTop:10, fontSize:12, color:T.green }}>✓ Active — fires every {r.interval} minutes</div>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
