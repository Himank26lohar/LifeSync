import { useMemo, useState } from "react";
import { T } from "../constants/theme";
import { P } from "../constants/icons";
import { Ic, Badge, Btn, Inp, Sel, Lbl, Spinner } from "../components/Ic";
import Card from "../components/Card";
import { createTask, updateTask, deleteTask } from "../api/tasks";

const toISODate = (d) => new Date(d).toLocaleDateString("en-CA"); // YYYY-MM-DD
const LS = {
  get: (k,d) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):d; } catch { return d; } },
  set: (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} },
};
const parseTags = (s) =>
  (s || "")
    .split(",")
    .map(t => t.trim())
    .filter(Boolean)
    .slice(0, 10);
const uniq = (arr) => Array.from(new Set((arr||[]).map(s=>String(s||"").trim()).filter(Boolean)));
const priorityRank = (p) => (p==="high" ? 0 : p==="medium" ? 1 : p==="low" ? 2 : 3);
const hashStr = (s) => {
  const str = String(s || "");
  let h = 0;
  for (let i=0;i<str.length;i++) h = ((h<<5)-h) + str.charCodeAt(i);
  return Math.abs(h);
};
const TAG_COLORS = [
  // exclude red/orange (reserved for priority)
  T.blue,
  T.green,
  T.purple,
  T.pink,
  T.cyan,
  T.purpleLight,
];
const tagColor = (tag) => TAG_COLORS[hashStr(tag) % TAG_COLORS.length];
const monthKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}`;
};
const startOfMonth = (year, monthIdx0) => new Date(year, monthIdx0, 1, 0, 0, 0, 0);
const addMonths = (d, delta) => new Date(d.getFullYear(), d.getMonth()+delta, 1, 0, 0, 0, 0);
const monthLabel = (d) => d.toLocaleDateString("en", { month:"long", year:"numeric" });

export default function Tasks({ tasks, setTasks, loading }) {
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState("active");
  const [saving, setSaving] = useState(false);
  const [form,   setForm]   = useState({ title:"", desc:"", priority:"medium", due:"", tags:"" });
  const pC = { high:T.red, medium:T.amber, low:T.green };
  const accentBrown = T.purpleGrad;

  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date().getFullYear(), new Date().getMonth()));
  const [savedTags, setSavedTags] = useState(() => LS.get("task_tags", []));

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const newTags = parseTags(form.tags);
      const payload = {
        title: form.title,
        desc: form.desc,
        priority: form.priority,
        // Use "due" as the date column (YYYY-MM-DD). Defaults to today.
        due: form.due || toISODate(new Date()),
        tags: newTags,
      };
      const created = await createTask(payload);
      setTasks(prev => [...prev, created]);
      if (newTags.length) {
        const merged = uniq([...(savedTags||[]), ...newTags]).slice(0, 50);
        setSavedTags(merged);
        LS.set("task_tags", merged);
      }
      setForm({ title:"", desc:"", priority:"medium", due:toISODate(new Date()), tags:"" });
      setAdding(false);
    } catch { alert("Error saving task."); }
    setSaving(false);
  };

  const toggle = async (task) => {
    try {
      const updated = await updateTask(task.id, {
        completed: !task.completed,
        completed_at: !task.completed ? new Date().toISOString() : null,
      });
      setTasks(prev => prev.map(t => t.id===task.id ? updated : t));
    } catch { alert("Error updating task."); }
  };

  const del = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this task?");
    if (!ok) return;
    try { await deleteTask(id); setTasks(prev=>prev.filter(t=>t.id!==id)); }
    catch { alert("Error deleting task."); }
  };

  const monthTasks = useMemo(() => {
    const mk = monthKey(monthCursor);
    return tasks.filter(t => {
      // Prefer explicit date field (due) for grouping by day in table
      const d = t.due || t.created_at || null;
      if (!d) return false;
      return monthKey(d) === mk;
    });
  }, [tasks, monthCursor]);

  const filtered = useMemo(() => (
    monthTasks.filter(t => filter==="all" ? true : filter==="active" ? !t.completed : t.completed)
  ), [monthTasks, filter]);

  const byDay = useMemo(() => {
    // group tasks by date column (due), fallback to created_at
    const map = {};
    filtered.forEach(t => {
      const d = t.due || t.created_at || new Date();
      const iso = toISODate(d);
      (map[iso] ||= []).push(t);
    });
    // sort tasks inside each day:
    // 1) active first, completed last
    // 2) higher priority first (high -> medium -> low)
    // 3) then by created_at
    Object.values(map).forEach(arr => {
      arr.sort((a,b) => {
        if (!!a.completed !== !!b.completed) return a.completed ? 1 : -1;
        const pr = priorityRank(a.priority) - priorityRank(b.priority);
        if (pr !== 0) return pr;
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return ta - tb;
      });
    });
    // return sorted day keys desc (latest first) within month
    const days = Object.keys(map).sort((a,b)=> b.localeCompare(a));
    return { map, days };
  }, [filtered]);

  const monthStats = useMemo(() => {
    const total = monthTasks.length;
    const completed = monthTasks.filter(t=>t.completed).length;
    const pending = total - completed;
    const dayMap = {};
    monthTasks.forEach((task) => {
      const iso = toISODate(task.due || task.created_at || new Date());
      if (!dayMap[iso]) dayMap[iso] = { total: 0, completed: 0 };
      dayMap[iso].total += 1;
      if (task.completed) dayMap[iso].completed += 1;
    });
    const rates = Object.values(dayMap).map((day) => (day.completed / day.total) * 100);
    const completionRate = rates.length ? Math.round(rates.reduce((sum, value) => sum + value, 0) / rates.length) : 0;
    return { total, pending, completed, completionRate };
  }, [monthTasks]);

  if (loading) return <Spinner/>;

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4, flexWrap:"wrap", gap:10 }}>
        <div>
          <div className="page-title" style={{ fontSize:24, fontWeight:700 }}>Task Manager</div>
          <div className="page-subtitle" style={{ fontSize:13, color:T.textMuted, marginTop:2 }}>
            Organize and prioritize your tasks
          </div>
        </div>
        <Btn onClick={()=>{
          setAdding(v=>!v);
          setForm(f=>({ ...f, due: f.due || toISODate(new Date()) }));
        }} color={accentBrown}>
          <Ic d={P.plus} size={14} color={T.white}/> Add Task
        </Btn>
      </div>

      {/* Summary */}
      <div style={{ display:"flex", gap:12, alignItems:"center", margin:"16px 0", flexWrap:"wrap" }}>
        {[
          ["Total (month)",     monthStats.total,     T.text ],
          ["Pending (month)",   monthStats.pending,   T.amber],
          ["Completed (month)", monthStats.completed, T.green],
          ["Daily completion",  `${monthStats.completionRate}%`, accentBrown],
        ].map(([l,v,c])=>(
          <Card key={l} style={{ padding:"12px 18px", display:"flex", gap:10, alignItems:"center", background:T.elevated }}>
            <div style={{ fontSize:22, fontWeight:700, color:c }}>{v}</div>
            <div style={{ fontSize:12, color:T.textMuted }}>{l}</div>
          </Card>
        ))}
        <div style={{ display:"flex", gap:6, marginLeft:"auto", flexWrap:"wrap" }}>
          {["all","active","completed"].map(f=>(
            <Btn key={f} onClick={()=>setFilter(f)} color={accentBrown} outline={filter!==f}
              style={{ padding:"6px 14px", textTransform:"capitalize", fontSize:12 }}>
              {f}
            </Btn>
          ))}
        </div>
      </div>

      {/* Add form */}
      {adding && (
        <Card style={{ marginBottom:16, borderColor:`${accentBrown}55`, background:T.elevated }}>
          <div className="grid-2" style={{ marginBottom:12 }}>
            <div><Lbl>Task Title *</Lbl><Inp placeholder="What needs to be done?" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
            <div><Lbl>Description</Lbl><Inp placeholder="Add details..." value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})}/></div>
            <div><Lbl>Priority</Lbl>
              <Sel value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} style={{ borderColor:`${accentBrown}40` }}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Sel>
            </div>
            <div><Lbl>Date (defaults to today)</Lbl><Inp type="date" value={form.due} onChange={e=>setForm({...form,due:e.target.value})}/></div>
            <div><Lbl>Tags (comma separated)</Lbl><Inp placeholder="e.g. DSA, TOC, Prac" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/></div>
          </div>
          {savedTags?.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:12, color:T.textMuted, marginBottom:8 }}>Saved tags</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {savedTags.slice(0, 16).map(tag=>(
                  <div
                    key={tag}
                    style={{
                      display:"inline-flex",
                      alignItems:"center",
                      gap:6,
                      background:`${T.bg}`,
                      border:`1px solid ${T.border}`,
                      color:T.textMuted,
                      borderRadius:999,
                      padding:"4px 10px",
                      fontSize:12,
                    }}
                  >
                    <button
                      onClick={()=>{
                        const existing = parseTags(form.tags);
                        if (existing.includes(tag)) return;
                        const merged = [...existing, tag].slice(0, 10);
                        setForm(f=>({ ...f, tags: merged.join(", ") }));
                      }}
                      style={{
                        background:"transparent",
                        border:"none",
                        color:"inherit",
                        cursor:"pointer",
                        padding:0,
                        fontSize:12,
                      }}
                      title="Add tag"
                    >
                      + {tag}
                    </button>
                    <button
                      onClick={(e)=>{
                        e.preventDefault();
                        e.stopPropagation();
                        const next = (savedTags || []).filter(t => t !== tag);
                        setSavedTags(next);
                        LS.set("task_tags", next);
                      }}
                      style={{
                        width:16,
                        height:16,
                        borderRadius:8,
                        display:"inline-flex",
                        alignItems:"center",
                        justifyContent:"center",
                        background:"transparent",
                        border:`1px solid ${T.border}`,
                        color:T.textDim,
                        cursor:"pointer",
                        lineHeight:1,
                        fontSize:11,
                        padding:0,
                      }}
                      title="Delete saved tag"
                      aria-label={`Delete tag ${tag}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <Btn onClick={save} color={saving?T.green:accentBrown}>{saving?"Saving...":"Save Task"}</Btn>
            <Btn onClick={()=>setAdding(false)} color={accentBrown} outline>Cancel</Btn>
          </div>
        </Card>
      )}

      {/* Monthly Table */}
      <Card style={{ padding:0, overflow:"hidden" }}>
        {/* Table header */}
        <div style={{
          display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"12px 14px", borderBottom:`1px solid ${T.border}`, background:`${T.bg}`
        }}>
          <div style={{ display:"flex", flexDirection:"column" }}>
            <div style={{ fontWeight:700, fontSize:14 }}>{monthLabel(monthCursor)}</div>
            <div style={{ fontSize:12, color:T.textMuted }}>One table per month · grouped by date</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {/* Tag completion pie (small)
            {tagPie.length > 0 && (
              <div className="tag-pie" style={{ width:120, height:54 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, fontSize:12, color:T.text }}
                      formatter={(v, name, props)=> {
                        const p = props?.payload;
                        return [`${p?.done}/${p?.total} (${p?.pct}%)`, p?.name];
                      }}
                    />
                    <Pie data={tagPie} dataKey="value" nameKey="name" innerRadius={14} outerRadius={24} paddingAngle={2}>
                      {tagPie.map((_, i)=> <Cell key={i} fill={tagColors[i % tagColors.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )} */}
            <div style={{ display:"flex", gap:8 }}>
              <Btn outline onClick={()=>setMonthCursor(d=>addMonths(d,-1))} style={{ padding:"6px 10px" }}>◀</Btn>
              <Btn outline onClick={()=>setMonthCursor(d=>addMonths(d, 1))} style={{ padding:"6px 10px" }}>▶</Btn>
            </div>
          </div>
        </div>

        {/* Column header */}
        <div style={{
          display:"grid",
          gridTemplateColumns:"170px 1fr 90px",
          gap:0,
          padding:"10px 14px",
          borderBottom:`1px solid ${T.border}`,
          color:T.textDim,
          fontSize:12,
          background:`${T.card}`
        }}>
          <div style={{ fontWeight:600 }}>DATE</div>
          <div style={{ fontWeight:600 }}>TASKS</div>
          <div style={{ fontWeight:600, textAlign:"right" }}>%</div>
        </div>

        {/* Rows */}
        <div style={{ maxHeight:520, overflow:"auto" }}>
          {byDay.days.length === 0 && (
            <div style={{ padding:28, textAlign:"center", color:T.textMuted }}>
              No tasks for {monthLabel(monthCursor)}. {filter==="active"?"Add one above!":""}
            </div>
          )}

          {byDay.days.map(dayIso => {
            const dayTasks = byDay.map[dayIso] || [];
            const done = dayTasks.filter(t=>t.completed).length;
            const pct = dayTasks.length ? Math.round((done/dayTasks.length)*100) : 0;
            const prettyDate = new Date(dayIso).toLocaleDateString("en", { day:"2-digit", month:"short" });

            return (
              <div
                key={dayIso}
                className="task-day-row"
                style={{
                  display:"grid",
                  gridTemplateColumns:"170px 1fr 90px",
                  padding:"12px 14px",
                  borderBottom:`1px solid ${T.border}`,
                  alignItems:"flex-start",
                  gap:12,
                }}
              >
                {/* DATE (single entry) */}
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  <div style={{ fontWeight:800, color:T.text }}>{prettyDate}</div>
                  <div style={{ fontSize:12, color:T.textDim }}>{dayTasks.length} tasks</div>
                  <div style={{ fontSize:12, color:T.textMuted }}>{done}/{dayTasks.length} done</div>
                </div>

                {/* TASKS for that date */}
                <div style={{ display:"flex", flexDirection:"column", gap:8, minWidth:0 }}>
                  {dayTasks.map(task => (
                    <div
                      key={task.id}
                      style={{
                        display:"flex",
                        alignItems:"flex-start",
                        gap:10,
                        padding:"8px 10px",
                        border:`1px solid ${T.border}`,
                        borderRadius:10,
                        background:task.completed?`${T.bg}`:T.card,
                        opacity:task.completed?0.7:1,
                      }}
                    >
                      <div onClick={()=>toggle(task)}
                        style={{ width:20,height:20,borderRadius:6,flexShrink:0,marginTop:2,cursor:"pointer",
                          border:`2px solid ${task.completed?T.green:T.border}`,
                          background:task.completed?T.green:"transparent",
                          display:"flex",alignItems:"center",justifyContent:"center" }}>
                        {task.completed && <Ic d={P.check} size={12} color={T.white} sw={3}/>}
                      </div>

                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                          <span style={{
                            fontWeight:650,
                            textDecoration:task.completed?"line-through":"none",
                            whiteSpace:"nowrap",
                            overflow:"hidden",
                            textOverflow:"ellipsis",
                            maxWidth:"100%",
                          }}>
                            {task.title}
                          </span>
                          <Badge label={task.priority} color={pC[task.priority]}/>
                          {(task.tags||[]).slice(0,4).map(tag => (
                            <span key={tag} style={{
                              fontSize:11,
                              padding:"2px 8px",
                              borderRadius:999,
                              border:`1px solid ${tagColor(tag)}55`,
                              color:tagColor(tag),
                              background:`${tagColor(tag)}22`,
                            }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                        {task.desc && (
                          <div style={{ fontSize:12, color:T.textMuted, marginTop:4, wordBreak:"break-word" }}>
                            {task.desc}
                          </div>
                        )}
                      </div>

                      <button onClick={()=>del(task.id)}
                        style={{ background:"none",border:"none",color:T.textDim,cursor:"pointer",padding:4,flexShrink:0 }}>
                        <Ic d={P.trash} size={15} color={T.textDim}/>
                      </button>
                    </div>
                  ))}
                </div>

                {/* % completed */}
                <div style={{
                  textAlign:"right",
                  fontWeight:900,
                  fontSize:14,
                  color: pct>=70?T.green:pct>=35?T.amber:T.textDim
                }}>
                  {pct}%
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <style>{`
        /* Mobile optimization for the monthly table */
        @media (max-width: 560px) {
          .tag-pie { display: none; }
          .task-day-row {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .task-day-row > div:last-child {
            text-align: left !important;
          }
        }
      `}</style>
    </div>
  );
}
