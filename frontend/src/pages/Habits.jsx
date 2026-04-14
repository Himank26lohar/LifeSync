import { useState, useEffect } from "react";
import { T } from "../constants/theme";
import { P } from "../constants/icons";
import { Ic, Btn, Inp, Lbl, ProgressBar, Spinner } from "../components/Ic";
import Card from "../components/Card";
import { createHabit, updateHabit, deleteHabit } from "../api/habits";

const DAYS_W = ["M","T","W","T","F","S","S"];
const I_OPTS = [["flame",P.flame],["droplet",P.droplet],["book",P.book],["brain",P.brain],["sun",P.sun],["moon",P.moon],["zap",P.zap],["activity",P.activity]];
const C_OPTS = [T.purple, T.pink, T.cyan, T.green, T.amber, T.orange, T.blue, T.red];
const todayIdx    = () => (new Date().getDay() + 6) % 7;
const daysInMonth = () => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

export default function Habits({ habits, setHabits, loading }) {
  const [adding, setAdding] = useState(false);
  const [view,   setView]   = useState("weekly");
  const [form,   setForm]   = useState({ name:"", icon:"flame", color:T.purple });
  const iMap = Object.fromEntries(I_OPTS);

  useEffect(() => {
    const resetIfNewDay = async () => {
      const lastDate = localStorage.getItem("habits_last_date");
      const today    = new Date().toLocaleDateString("en-CA");
      if (lastDate && lastDate !== today) {
        for (const h of habits) {
          if (h.completed_today) {
            await updateHabit(h.id, { completed_today:false, week_progress:h.week_progress, month_progress:h.month_progress, streak:h.streak }).catch(()=>{});
          }
        }
        setHabits(prev => prev.map(h => ({ ...h, completed_today: false })));
      }
      localStorage.setItem("habits_last_date", today);
    };
    if (habits.length > 0) resetIfNewDay();
  }, [habits.length]);

  const toggle = async (h) => {
    const nowDone = !h.completed_today;
    const ti = todayIdx();
    const dim = daysInMonth();
    const todayOfMonth = new Date().getDate() - 1;
    const wp = Array.isArray(h.week_progress) && h.week_progress.length===7 ? [...h.week_progress] : [false,false,false,false,false,false,false];
    wp[ti] = nowDone;
    const mp = Array.isArray(h.month_progress) && h.month_progress.length>0
      ? [...h.month_progress, ...Array(Math.max(0,dim-h.month_progress.length)).fill(false)]
      : Array(dim).fill(false);
    mp[todayOfMonth] = nowDone;
    const newStreak = nowDone ? h.streak+1 : Math.max(0,h.streak-1);
    try {
      const updated = await updateHabit(h.id, { completed_today:nowDone, streak:newStreak, week_progress:wp, month_progress:mp });
      setHabits(prev => prev.map(x => x.id===h.id ? updated : x));
    } catch { alert("Error updating habit."); }
  };

  const add = async () => {
    if (!form.name.trim()) return;
    try {
      const dim = daysInMonth();
      const created = await createHabit({ name:form.name, icon:form.icon, color:form.color, streak:0, completed_today:false, week_progress:[false,false,false,false,false,false,false], month_progress:Array(dim).fill(false) });
      setHabits(prev => [...prev, created]);
      setForm({ name:"", icon:"flame", color:T.purple });
      setAdding(false);
    } catch { alert("Error creating habit."); }
  };

  const del = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this habit?");
    if (!ok) return;
    try { await deleteHabit(id); setHabits(prev=>prev.filter(h=>h.id!==id)); }
    catch { alert("Error deleting habit."); }
  };

  const done    = habits.filter(h=>h.completed_today).length;
  const best    = habits.reduce((m,h)=>Math.max(m,h.streak),0);
  const bestH   = habits.find(h=>h.streak===best);
  const daysElapsedWeek = todayIdx() + 1;
  const weekAvg = habits.length
    ? parseFloat((habits.reduce((a,h)=>{
        const wp=Array.isArray(h.week_progress)?h.week_progress:[];
        return a+wp.filter(Boolean).length;
      },0)/(habits.length*daysElapsedWeek)*100).toFixed(2)) : 0;

  if (loading) return <Spinner/>;
  const ti = todayIdx();
  const dim = daysInMonth();

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4, flexWrap:"wrap", gap:10 }}>
        <div>
          <div className="page-title" style={{ fontSize:24, fontWeight:700 }}>Habit Tracker</div>
          <div className="page-subtitle" style={{ fontSize:13, color:T.textMuted, marginTop:2 }}>Build consistency and track your daily habits</div>
        </div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <div style={{ display:"flex", border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden" }}>
            {["weekly","monthly"].map(v=>(
              <button key={v} onClick={()=>setView(v)}
                style={{ padding:"7px 14px", fontSize:12, fontWeight:500, border:"none", cursor:"pointer",
                  background:view===v?T.purple:"transparent", color:view===v?"#fff":T.textMuted }}>
                {v==="weekly"?"Weekly":"Monthly"}
              </button>
            ))}
          </div>
          <Btn onClick={()=>setAdding(!adding)}>
            <Ic d={P.plus} size={14} color={T.white}/> Add Habit
          </Btn>
        </div>
      </div>

      {/* Summary */}
      <div className="grid-insights" style={{ margin:"16px 0" }}>
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <div style={{ fontSize:12, color:T.textMuted }}>Today's Progress</div>
            <Ic d={P.trend} size={16} color={T.green}/>
          </div>
          <div style={{ fontSize:24, fontWeight:700, margin:"8px 0" }}>{done}/{habits.length} completed</div>
          <ProgressBar pct={habits.length?(done/habits.length)*100:0} color={T.green}/>
          <div style={{ fontSize:12, color:T.textMuted, marginTop:6 }}>
            {habits.length?Math.round((done/habits.length)*100):0}% completion rate
          </div>
        </Card>
        <Card style={{ background:`${T.amber}11`, borderColor:`${T.amber}44`, }}>
          <div style={{ fontSize:12, color:T.textMuted, marginBottom:8 }}>🔥 Best Streak</div>
          <div style={{ fontSize:24, fontWeight:700, color:T.amber }}>{best} days</div>
          <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>{bestH?.name||"No habits yet"}</div>
        </Card>
        <Card>
          {view === "weekly" ? (
            <>
              <div style={{ fontSize:24, fontWeight:700, color:T.purple }}>{weekAvg}%</div>
              <div style={{ fontSize:12, color:T.textMuted, marginTop:2, marginBottom:10 }}>Consistency score</div>
              <div style={{ fontSize:12, color:T.textMuted }}>
                Completions: <strong style={{ color:T.text }}>{habits.reduce((a,h)=>a+(Array.isArray(h.week_progress)?h.week_progress.filter(Boolean).length:0),0)}</strong> / {habits.length*daysElapsedWeek}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize:24, fontWeight:700, color:T.purple }}>
                {habits.length?parseFloat((habits.reduce((a,h)=>{const mp=Array.isArray(h.month_progress)?h.month_progress:[];return a+mp.filter(Boolean).length;},0)/(habits.length*new Date().getDate())*100).toFixed(2)):0}%
              </div>
              <div style={{ fontSize:12, color:T.textMuted, marginTop:2, marginBottom:10 }}>Monthly consistency</div>
              <div style={{ fontSize:12, color:T.textMuted }}>
                Completions: <strong style={{ color:T.text }}>{habits.reduce((a,h)=>a+(Array.isArray(h.month_progress)?h.month_progress.filter(Boolean).length:0),0)}</strong> / {habits.length*new Date().getDate()}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Add form */}
      {adding && (
        <Card style={{ marginBottom:16, borderColor:`${T.purple}55` }}>
          <div style={{ marginBottom:12 }}>
            <Lbl>Habit Name</Lbl>
            <Inp placeholder="e.g. Morning Meditation" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
          </div>
          <div style={{ display:"flex", gap:16, marginBottom:14, flexWrap:"wrap" }}>
            <div>
              <Lbl>Icon</Lbl>
              <div style={{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap" }}>
                {I_OPTS.map(([k,d])=>(
                  <div key={k} onClick={()=>setForm({...form,icon:k})}
                    style={{ width:36,height:36,borderRadius:8,border:`2px solid ${form.icon===k?T.purple:T.border}`,
                      display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
                    <Ic d={d} size={15} color={form.icon===k?T.purple:T.textMuted}/>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Lbl>Color</Lbl>
              <div style={{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap" }}>
                {C_OPTS.map(c=>(
                  <div key={c} onClick={()=>setForm({...form,color:c})}
                    style={{ width:28,height:28,borderRadius:"50%",background:c,cursor:"pointer",
                      border:`3px solid ${form.color===c?T.white:"transparent"}`,boxSizing:"border-box" }}/>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={add}>Save Habit</Btn>
            <Btn onClick={()=>setAdding(false)} color={T.purple} outline>Cancel</Btn>
          </div>
        </Card>
      )}

      {/* Habit cards */}
      <div className="grid-habits">
        {habits.length===0 && (
          <Card style={{ gridColumn:"1/-1", textAlign:"center", padding:48, color:T.textMuted }}>
            No habits yet. Add your first habit!
          </Card>
        )}
        {habits.map(h=>{
          const wp = Array.isArray(h.week_progress)&&h.week_progress.length===7 ? h.week_progress : Array(7).fill(false);
          const mp = Array.isArray(h.month_progress)&&h.month_progress.length>0
            ? [...h.month_progress,...Array(Math.max(0,dim-h.month_progress.length)).fill(false)]
            : Array(dim).fill(false);
          const weekDone=wp.filter(Boolean).length;
          const monthDone=mp.filter(Boolean).length;
          return (
            <Card key={h.id}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8 }}>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ width:38,height:38,borderRadius:10,background:`${h.color}22`,display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <Ic d={iMap[h.icon]||P.flame} size={17} color={h.color}/>
                  </div>
                  <div>
                    <div style={{ fontWeight:600,fontSize:14 }}>{h.name}</div>
                    <div style={{ fontSize:12,color:T.textMuted }}>🔥 {h.streak} day streak</div>
                  </div>
                </div>
                <div style={{ display:"flex",gap:6 }}>
                  <Btn onClick={()=>toggle(h)} color={h.completed_today?T.green:T.border} outline={!h.completed_today}
                    style={{ padding:"5px 12px",fontSize:12,color:h.completed_today?T.white:T.textMuted }}>
                    {h.completed_today?"✓ Done":"Mark"}
                  </Btn>
                  <button onClick={()=>del(h.id)} style={{ background:"none",border:"none",cursor:"pointer" }}>
                    <Ic d={P.trash} size={14} color={T.textDim}/>
                  </button>
                </div>
              </div>
              {view==="weekly" && (
                <>
                  <div style={{ display:"flex",gap:4,marginBottom:6 }}>
                    {DAYS_W.map((d,i)=>(
                      <div key={i} style={{ flex:1,textAlign:"center" }}>
                        <div style={{ fontSize:10,marginBottom:4,color:i===ti?h.color:T.textDim,fontWeight:i===ti?700:400 }}>{d}</div>
                        <div style={{ height:6,borderRadius:3,background:wp[i]?h.color:T.border,outline:i===ti?`2px solid ${h.color}88`:"none",outlineOffset:1 }}/>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize:12,color:T.textMuted }}>This week: <strong style={{ color:T.text }}>{weekDone}/7</strong></div>
                </>
              )}
              {view==="monthly" && (
                <>
                  <div style={{ display:"flex",flexWrap:"wrap",gap:3,marginBottom:6 }}>
                    {Array.from({length:dim},(_,i)=>{
                      const isToday=i===new Date().getDate()-1;
                      const isFuture=i>=new Date().getDate();
                      return (
                        <div key={i} title={`Day ${i+1}`}
                          style={{ width:16,height:16,borderRadius:3,background:mp[i]?h.color:T.border,
                            outline:isToday?`2px solid ${h.color}`:"none",outlineOffset:1,opacity:isFuture?0.3:1 }}/>
                      );
                    })}
                  </div>
                  <div style={{ fontSize:12,color:T.textMuted }}>
                    This month: <strong style={{ color:T.text }}>{monthDone}/{dim}</strong>
                    <span style={{ marginLeft:8,color:T.textDim }}>({Math.round((monthDone/new Date().getDate())*100)}% so far)</span>
                  </div>
                </>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
