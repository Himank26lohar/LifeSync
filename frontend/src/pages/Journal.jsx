import { useState, useRef } from "react";
import { T } from "../constants/theme";
import { P } from "../constants/icons";
import { Ic, Btn, Inp, Lbl, Spinner } from "../components/Ic";
import Card from "../components/Card";
import { createEntry, updateEntry, deleteEntry } from "../api/journal";

const TAGS  = ["All","Personal","Work","Study","Gratitude","Health","Reflection","Productivity"];
const TAG_C = {
  Personal:"#a855f7", Work:"#3b82f6", Study:"#06b6d4", Gratitude:"#ec4899",
  Health:"#22c55e", Reflection:"#f59e0b", Productivity:"#f97316", All:"#64748b"
};

const PROMPTS = [
  { cat:"Gratitude",    icon:"🙏", text:"What are 3 things I'm grateful for today?" },
  { cat:"Gratitude",    icon:"🙏", text:"Who made a positive impact on my day?" },
  { cat:"Reflection",   icon:"🪞", text:"What did I learn today?" },
  { cat:"Reflection",   icon:"🪞", text:"What challenged me today and how did I handle it?" },
  { cat:"Reflection",   icon:"🪞", text:"What would I do differently if I could redo today?" },
  { cat:"Productivity", icon:"🎯", text:"What were my top 3 accomplishments today?" },
  { cat:"Productivity", icon:"🎯", text:"What distracted me most today?" },
  { cat:"Productivity", icon:"🎯", text:"What's my main focus for tomorrow?" },
  { cat:"Wellbeing",    icon:"💚", text:"What made me happy today?" },
  { cat:"Wellbeing",    icon:"💚", text:"How is my energy and mood right now?" },
  { cat:"Wellbeing",    icon:"💚", text:"What do I need more of this week?" },
  { cat:"Growth",       icon:"🌱", text:"What's one thing I want to improve about myself?" },
  { cat:"Growth",       icon:"🌱", text:"What fear did I face or avoid today?" },
  { cat:"Growth",       icon:"🌱", text:"What inspired me recently?" },
  { cat:"Creativity",   icon:"✨", text:"What's something beautiful I noticed today?" },
  { cat:"Creativity",   icon:"✨", text:"If today were a movie scene, what would it be?" },
];

const PROMPT_CATS = ["All","Gratitude","Reflection","Productivity","Wellbeing","Growth","Creativity"];
const PROMPT_CAT_C = {
  Gratitude:"#ec4899", Reflection:"#f59e0b", Productivity:"#f97316",
  Wellbeing:"#22c55e", Growth:"#a855f7", Creativity:"#06b6d4", All:"#64748b"
};

const LS = {
  get: (k,d) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):d; } catch { return d; } },
  set: (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} },
};

const todayISO = () => new Date().toISOString().split("T")[0];
const fmtDate  = d => new Date(d).toLocaleDateString("en",{weekday:"long",month:"long",day:"numeric",year:"numeric"});

function calcStreaks(entries) {
  const dates = [...new Set(entries.map(e=>e.date))].sort();
  if (!dates.length) return { current:0, longest:0 };
  let longest=1, temp=1;
  for (let i=1; i<dates.length; i++) {
    const diff=(new Date(dates[i])-new Date(dates[i-1]))/86400000;
    if (diff===1) { temp++; longest=Math.max(longest,temp); } else temp=1;
  }
  const last=new Date(dates[dates.length-1]);
  const now=new Date(todayISO());
  const daysSince=(now-last)/86400000;
  let current=0;
  if (daysSince<=1) {
    current=1;
    for (let i=dates.length-2;i>=0;i--) {
      if ((new Date(dates[i+1])-new Date(dates[i]))/86400000===1) current++;
      else break;
    }
  }
  return { current, longest };
}

export default function Journal({ entries, setEntries, loading }) {
  const [mobileSearch, setMobileSearch] = useState(false);
  const [tab,         setTab]        = useState("journal");
  const [selected,    setSelected]   = useState(todayISO());
  const [writing,     setWriting]    = useState(false);
  const [editingId,   setEditingId]  = useState(null);
  const [form,        setForm]       = useState({ title:"", body:"", tag:"Personal", media:[] });
  const [search,      setSearch]     = useState("");
  const [filterTag,   setFilterTag]  = useState("All");
  const [viewMonth,   setViewMonth]  = useState(new Date());
  const [promptCat,   setPromptCat]  = useState("All");
  const [favPrompts,  setFavPrompts] = useState(() => LS.get("fav_prompts",[]));
  const [showPrompts, setShowPrompts]= useState(false);
  const [recording,   setRecording]  = useState(false);
  const [mediaRec,    setMediaRec]   = useState(null);
  const fileRef = useRef(null);

  const yr         = viewMonth.getFullYear();
  const mo         = viewMonth.getMonth();
  const firstDay   = new Date(yr,mo,1).getDay();
  const daysInMo   = new Date(yr,mo+1,0).getDate();
  const entryDates = new Set(entries.map(e=>e.date));
  const dayEntries = entries.filter(e=>e.date===selected);
  const { current:streak, longest:bestStreak } = calcStreaks(entries);

  const filtered = entries.filter(e=>
    (filterTag==="All"||e.tag===filterTag) &&
    (!search||e.title?.toLowerCase().includes(search.toLowerCase())||e.body?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleFileAdd = (e) => {
    Array.from(e.target.files).forEach(file=>{
      const url=URL.createObjectURL(file);
      const type=file.type.startsWith("video")?"video":"image";
      setForm(f=>({...f,media:[...f.media,{type,url,name:file.name}]}));
    });
  };

  const startRecording = async () => {
    try {
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const rec=new MediaRecorder(stream);
      const chunks=[];
      rec.ondataavailable=e=>chunks.push(e.data);
      rec.onstop=()=>{
        const blob=new Blob(chunks,{type:"audio/webm"});
        const url=URL.createObjectURL(blob);
        setForm(f=>({...f,media:[...f.media,{type:"audio",url,name:`Voice note ${new Date().toLocaleTimeString()}`}]}));
        stream.getTracks().forEach(t=>t.stop());
      };
      rec.start(); setMediaRec(rec); setRecording(true);
    } catch { alert("Microphone access required."); }
  };

  const stopRecording = () => { mediaRec?.stop(); setRecording(false); setMediaRec(null); };
  const removeMedia   = (i) => setForm(f=>({...f,media:f.media.filter((_,idx)=>idx!==i)}));

  const save = async () => {
    if (!form.body.trim()) return;
    const now=new Date();
    const time=`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    const data={
      title: form.title||`Journal – ${selected} ${time}`,
      body:  form.body, tag:form.tag, date:selected, time, media:form.media
    };
    try {
      if (editingId) {
        const u=await updateEntry(editingId,data);
        setEntries(prev=>prev.map(e=>e.id===editingId?u:e));
        setEditingId(null);
      } else {
        const c=await createEntry(data);
        setEntries(prev=>[...prev,c]);
      }
      setWriting(false);
      setForm({title:"",body:"",tag:"Personal",media:[]});
    } catch { alert("Error saving entry."); }
  };

  const del = async (id) => {
    try { await deleteEntry(id); setEntries(prev=>prev.filter(e=>e.id!==id)); }
    catch { alert("Error deleting entry."); }
  };

  const startEdit = (entry) => {
    setForm({title:entry.title,body:entry.body,tag:entry.tag,media:entry.media||[]});
    setEditingId(entry.id); setWriting(true);
  };

  const applyPrompt = (prompt) => {
    setForm(f=>({...f,body:f.body?f.body+"\n\n"+prompt.text+"\n":prompt.text+"\n"}));
    setTab("journal"); setWriting(true); setShowPrompts(false);
  };

  const toggleFav = (text) => {
    const u=favPrompts.includes(text)?favPrompts.filter(p=>p!==text):[...favPrompts,text];
    setFavPrompts(u); LS.set("fav_prompts",u);
  };

  const cancelWrite = () => {
    setWriting(false); setEditingId(null);
    setForm({title:"",body:"",tag:"Personal",media:[]});
  };

  if (loading) return <Spinner/>;

  const todayPrompt = PROMPTS[new Date().getDate() % PROMPTS.length];

  return (
    <div>

      {/* HEADER */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div>
          <div className="page-title display-serif" style={{ fontSize:24, fontWeight:700 }}>Daily Journal</div>
          <div style={{ fontSize:13, color:T.textMuted, marginTop:2 }}>Capture your thoughts, moments, and memories</div>
        </div>
        <Card style={{ background:`${T.orange}11`, borderColor:`${T.orange}33`, padding:"12px 18px" }}>
          <div style={{ display:"flex", gap:24, alignItems:"center" }}>
            <div>
              <div style={{ fontSize:12, fontWeight:600 }}>🔥 Journaling Streak</div>
              <div style={{ fontSize:26, fontWeight:800, color:T.orange, lineHeight:1.2 }}>{streak} days</div>
              <div style={{ fontSize:11, color:T.textMuted }}>Best: {bestStreak} days</div>
            </div>
            <div>
              <div style={{ fontSize:11, color:T.textMuted, textAlign:"right" }}>{entries.length} total</div>
              <div style={{ width:80, height:5, borderRadius:3, background:T.border, marginTop:6, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${Math.min(100,(streak/Math.max(bestStreak,1))*100)}%`,
                  background:T.orange, borderRadius:3 }}/>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* TAB BAR */}
      <div style={{ display:"flex", gap:6, marginBottom:16, borderBottom:`1px solid ${T.border}`, paddingBottom:12, alignItems:"center" }}>
        {[["journal","📓 Journal"],["prompts","💡 Prompts"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)}
            style={{ padding:"7px 18px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:500,
              background:tab===k?T.purple:"transparent", color:tab===k?"#fff":T.textMuted }}>
            {l}
          </button>
        ))}
        <button onClick={()=>setSelected(todayISO())}
          style={{ padding:"7px 14px", borderRadius:8, border:`1px solid ${T.border}`,
            background:"transparent", color:T.textMuted, cursor:"pointer", fontSize:12 }}>
          📅 Today
        </button>

        {/* Mobile search icon — only visible on mobile */}
        <button className="mobile-search-btn"
        onClick={()=>setMobileSearch(true)}
          style={{ marginLeft:"auto", padding:"7px 12px", borderRadius:8,
            border:`1px solid ${T.border}`, background:"transparent",
            color:T.textMuted, cursor:"pointer" }}>
          <Ic d={P.search} size={15} color={T.textMuted}/>
        </button>
      </div>

      {/* PROMPTS TAB */}
      {tab === "prompts" && (
        <div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
            {PROMPT_CATS.map(c=>(
              <button key={c} onClick={()=>setPromptCat(c)}
                style={{ padding:"6px 14px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:500,
                  border:`1.5px solid ${promptCat===c?PROMPT_CAT_C[c]:T.border}`,
                  background:promptCat===c?`${PROMPT_CAT_C[c]}22`:"transparent",
                  color:promptCat===c?PROMPT_CAT_C[c]:T.textMuted }}>
                {c}
              </button>
            ))}
          </div>

          {favPrompts.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.amber, marginBottom:8 }}>⭐ Saved Prompts</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {PROMPTS.filter(p=>favPrompts.includes(p.text)).map((p,i)=>(
                  <Card key={i} style={{ borderColor:`${PROMPT_CAT_C[p.cat]}44` }}>
                    <div style={{ display:"flex", gap:8 }}>
                      <div style={{ fontSize:22 }}>{p.icon}</div>
                      <div style={{ flex:1, fontSize:13, color:T.text, lineHeight:1.5 }}>{p.text}</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                        <button onClick={()=>toggleFav(p.text)}
                          style={{ background:"none",border:"none",cursor:"pointer",fontSize:16 }}>⭐</button>
                        <Btn onClick={()=>applyPrompt(p)}
                          style={{ padding:"4px 10px",fontSize:11,background:PROMPT_CAT_C[p.cat] }}>Use</Btn>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {PROMPTS.filter(p=>promptCat==="All"||p.cat===promptCat).map((p,i)=>(
              <Card key={i} style={{ borderColor:`${PROMPT_CAT_C[p.cat]}33` }}>
                <div style={{ display:"flex", gap:8 }}>
                  <div style={{ fontSize:22, flexShrink:0 }}>{p.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, color:PROMPT_CAT_C[p.cat], fontWeight:600, marginBottom:4,
                      textTransform:"uppercase", letterSpacing:0.5 }}>{p.cat}</div>
                    <div style={{ fontSize:13, color:T.text, lineHeight:1.5, marginBottom:10 }}>{p.text}</div>
                    <div style={{ display:"flex", gap:6 }}>
                      <Btn onClick={()=>applyPrompt(p)}
                        style={{ padding:"5px 12px",fontSize:11,background:PROMPT_CAT_C[p.cat] }}>
                        ✍️ Write
                      </Btn>
                      <button onClick={()=>toggleFav(p.text)}
                        style={{ background:"none",border:`1px solid ${T.border}`,borderRadius:6,
                          cursor:"pointer",padding:"5px 8px",fontSize:13,
                          color:favPrompts.includes(p.text)?T.amber:T.textMuted }}>
                        {favPrompts.includes(p.text)?"⭐":"☆"}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Mobile search overlay */}
        {mobileSearch && (
          <div className="mobile-search-overlay"
          style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:500,
            background:T.bg, padding:16, overflowY:"auto", display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:8 }}>
            <div style={{ position:"relative", flex:1 }}>
              <div style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T.textMuted }}>
                <Ic d={P.search} size={13}/>
              </div>
              <input autoFocus placeholder="Search entries..." value={search}
                onChange={e=>setSearch(e.target.value)}
                style={{ width:"100%", background:T.card, border:`1px solid ${T.border}`,
                  borderRadius:10, color:T.text, padding:"10px 10px 10px 32px",
                  fontSize:13, outline:"none", boxSizing:"border-box" }}/>
            </div>
            <button onClick={()=>{ setMobileSearch(false); setSearch(""); }}
              style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8,
                color:T.text, cursor:"pointer", padding:"10px 14px", fontSize:13 }}>
              Cancel
            </button>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {TAGS.map(t=>(
              <div key={t} onClick={()=>setFilterTag(t)}
                style={{ padding:"4px 10px", borderRadius:20, fontSize:11, cursor:"pointer",
                  background:filterTag===t?TAG_C[t]:`${TAG_C[t]}22`,
                  color:filterTag===t?"#fff":TAG_C[t], border:`1px solid ${TAG_C[t]}44`, fontWeight:600 }}>
                {t}
              </div>
            ))}
          </div>
          {(search ? filtered : entries).length === 0 ? (
          <div style={{ textAlign:"center", padding:40, color:T.textDim }}>No entries yet</div>
              ) : (
            (search ? filtered : entries).slice().sort((a,b)=>b.date.localeCompare(a.date)).map(e=>(
              <div key={e.id} onClick={()=>{ setSelected(e.date); setWriting(false); setSearch(""); setMobileSearch(false); }}
                style={{ padding:14, borderRadius:10, cursor:"pointer",
                  background:T.card, border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:13,fontWeight:600,marginBottom:4 }}>{e.title}</div>
                <div style={{ fontSize:12,color:T.textMuted,marginBottom:6 }}>{e.body?.slice(0,80)}...</div>
                <div style={{ display:"flex",justifyContent:"space-between" }}>
                  <span style={{ fontSize:11,padding:"2px 8px",borderRadius:10,
                    background:`${TAG_C[e.tag]||T.purple}22`,color:TAG_C[e.tag]||T.purple }}>{e.tag}</span>
                  <span style={{ fontSize:11,color:T.textDim }}>{e.date}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* JOURNAL TAB — 3 column layout */}
      {tab === "journal" && (
        <div className="grid-journal">

          {/* COL 1 — Calendar + prompt */}
          <div style={{ display:"flex", flexDirection:"column", gap:12, order:2 }}>

            <Card>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div style={{ fontWeight:600, fontSize:13 }}>
                  {viewMonth.toLocaleDateString("en",{month:"long",year:"numeric"})}
                </div>
                <div style={{ display:"flex", gap:2 }}>
                  <button onClick={()=>setViewMonth(m=>new Date(m.getFullYear(),m.getMonth()-1))}
                    style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:18}}>‹</button>
                  <button onClick={()=>setViewMonth(m=>new Date(m.getFullYear(),m.getMonth()+1))}
                    style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:18}}>›</button>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1, marginBottom:4 }}>
                {["S","M","T","W","T","F","S"].map((d,i)=>(
                  <div key={i} style={{textAlign:"center",fontSize:10,color:T.textMuted,fontWeight:600,padding:"3px 0"}}>{d}</div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1 }}>
                {Array.from({length:firstDay},(_,i)=><div key={`e${i}`}/>)}
                {Array.from({length:daysInMo},(_,i)=>{
                  const day=i+1;
                  const ds=`${yr}-${String(mo+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                  const isToday=ds===todayISO();
                  const isSel=ds===selected;
                  const has=entryDates.has(ds);
                  const count=entries.filter(e=>e.date===ds).length;
                  return (
                    <div key={day} onClick={()=>{setSelected(ds);setWriting(false);}}
                      style={{ textAlign:"center",fontSize:11,padding:"5px 2px",borderRadius:6,cursor:"pointer",
                        background:isSel?T.purple:isToday?`${T.purple}22`:"transparent",
                        color:isSel?"#fff":isToday?T.purpleLight:T.text,
                        fontWeight:isSel||isToday?700:400 }}>
                      {day}
                      {has && (
                        <div style={{ display:"flex",justifyContent:"center",gap:1,marginTop:1 }}>
                          {Array.from({length:Math.min(count,3)},(_,j)=>(
                            <div key={j} style={{ width:3,height:3,borderRadius:"50%",
                              background:isSel?"rgba(255,255,255,0.7)":T.purpleLight }}/>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card style={{ borderColor:`${T.purple}33`, background:`${T.purple}08` }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.purple, marginBottom:8 }}>💡 Today's Prompt</div>
              <div style={{ fontSize:13, color:T.text, lineHeight:1.6, marginBottom:10 }}>
                {todayPrompt.icon} {todayPrompt.text}
              </div>
              <Btn onClick={()=>applyPrompt(todayPrompt)}
                style={{ padding:"5px 12px", fontSize:11, background:T.purple, width:"100%" }}>
                ✍️ Write to this prompt
              </Btn>
            </Card>

          </div>

          {/* COL 2 — Main writing / viewing area */}
          <div style={{ display:"flex", flexDirection:"column", gap:12, order:1 }}>

            {writing ? (
              /* WRITE / EDIT FORM — inline, no sub-component to avoid re-render focus loss */
              <Card style={{ borderColor:`${T.purple}55` }}>
                <div style={{ fontWeight:600, fontSize:15, marginBottom:14 }}>
                  {editingId ? "Edit Entry" : `New Entry — ${fmtDate(selected)}`}
                </div>

                <div style={{ marginBottom:12 }}>
                  <Lbl>Title (Optional)</Lbl>
                  <Inp placeholder="Give your entry a title..." value={form.title}
                    onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
                </div>

                <div style={{ marginBottom:12 }}>
                  <Lbl>Tag</Lbl>
                  <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap" }}>
                    {TAGS.filter(t=>t!=="All").map(t=>(
                      <div key={t} onClick={()=>setForm(f=>({...f,tag:t}))}
                        style={{ padding:"4px 10px", borderRadius:20, fontSize:11, cursor:"pointer",
                          background:form.tag===t?TAG_C[t]:`${TAG_C[t]}22`,
                          color:form.tag===t?"#fff":TAG_C[t], fontWeight:600,
                          border:`1px solid ${TAG_C[t]}44` }}>
                        {t}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom:12 }}>
                  <button onClick={()=>setShowPrompts(v=>!v)}
                    style={{ background:`${T.purple}18`, border:`1px solid ${T.purple}44`, borderRadius:8,
                      color:T.purple, cursor:"pointer", padding:"6px 14px", fontSize:12, fontWeight:500 }}>
                    💡 {showPrompts?"Hide":"Use a"} Prompt
                  </button>
                  {showPrompts && (
                    <div style={{ marginTop:10, display:"flex", flexWrap:"wrap", gap:6 }}>
                      {PROMPTS.slice(0,8).map((p,i)=>(
                        <button key={i} onClick={()=>applyPrompt(p)}
                          style={{ padding:"5px 12px", borderRadius:8, fontSize:11, cursor:"pointer",
                            border:`1px solid ${PROMPT_CAT_C[p.cat]}44`,
                            background:`${PROMPT_CAT_C[p.cat]}18`,
                            color:PROMPT_CAT_C[p.cat] }}>
                          {p.icon} {p.text.slice(0,28)}...
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom:12 }}>
                  <Lbl>Write your thoughts...</Lbl>
                  <textarea
                    value={form.body}
                    onChange={e=>setForm(f=>({...f,body:e.target.value}))}
                    placeholder="How was your day? What are you grateful for? What did you learn?"
                    style={{ width:"100%", background:T.bg, border:`1px solid ${T.border}`, borderRadius:8,
                      padding:"12px", color:T.text, fontSize:14, outline:"none",
                      resize:"vertical", minHeight:200, boxSizing:"border-box", lineHeight:1.7 }}
                  />
                </div>

                <div style={{ display:"flex", gap:8, marginBottom:12, alignItems:"center" }}>
                  <span style={{ fontSize:12, color:T.textMuted }}>Attach:</span>
                  <input ref={fileRef} type="file" accept="image/*,video/*" multiple
                    style={{ display:"none" }} onChange={handleFileAdd}/>
                  <button onClick={()=>fileRef.current?.click()}
                    style={{ padding:"5px 12px", borderRadius:8, border:`1px solid ${T.border}`,
                      background:"transparent", color:T.textMuted, cursor:"pointer", fontSize:12 }}>
                    📷 Image/Video
                  </button>
                  <button onClick={recording?stopRecording:startRecording}
                    style={{ padding:"5px 12px", borderRadius:8,
                      border:`1px solid ${recording?"#ef4444":T.border}`,
                      background:recording?"#ef444422":"transparent",
                      color:recording?"#ef4444":T.textMuted, cursor:"pointer", fontSize:12 }}>
                    {recording?"⏹ Stop":"🎤 Voice Note"}
                  </button>
                  {recording && <span style={{ fontSize:11, color:"#ef4444" }}>● Recording...</span>}
                </div>

                {form.media.length > 0 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
                    {form.media.map((m,i)=>(
                      <div key={i} style={{ position:"relative", borderRadius:8, overflow:"hidden",
                        border:`1px solid ${T.border}` }}>
                        {m.type==="image" && <img src={m.url} alt={m.name}
                          style={{ width:80,height:80,objectFit:"cover",display:"block" }}/>}
                        {m.type==="video" && <video src={m.url}
                          style={{ width:80,height:80,objectFit:"cover",display:"block" }}/>}
                        {m.type==="audio" && (
                          <div style={{ padding:"8px 12px", background:T.bg, minWidth:140 }}>
                            <div style={{ fontSize:11, color:T.textMuted, marginBottom:4 }}>🎤 {m.name}</div>
                            <audio controls src={m.url} style={{ width:"100%", height:28 }}/>
                          </div>
                        )}
                        <button onClick={()=>removeMedia(i)}
                          style={{ position:"absolute",top:2,right:2,background:"rgba(0,0,0,0.6)",
                            border:"none",borderRadius:"50%",color:"#fff",cursor:"pointer",
                            width:18,height:18,fontSize:11,display:"flex",
                            alignItems:"center",justifyContent:"center" }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display:"flex", gap:8 }}>
                  <Btn onClick={save}>{editingId?"Update Entry":"Save Entry"}</Btn>
                  <Btn onClick={cancelWrite}
                    style={{ background:"transparent", border:`1px solid ${T.border}`, color:T.textMuted }}>
                    Cancel
                  </Btn>
                </div>
              </Card>

            ) : (

              /* VIEW entries for selected day */
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div style={{ fontSize:15, fontWeight:600 }}>{fmtDate(selected)}</div>
                  <Btn onClick={()=>{setWriting(true);setForm({title:"",body:"",tag:"Personal",media:[]});setEditingId(null);}}>
                    <Ic d={P.plus} size={13} color="#fff"/> Add Entry
                  </Btn>
                </div>

                {dayEntries.length === 0 ? (
                  <Card>
                    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",
                      justifyContent:"center",minHeight:300,gap:12 }}>
                      <div style={{ fontSize:40 }}>📝</div>
                      <div style={{ fontSize:15, fontWeight:600, color:T.textMuted }}>No entries for this day</div>
                      <div style={{ fontSize:13, color:T.textDim }}>Start writing about your day</div>
                      <div style={{ display:"flex", gap:8, marginTop:4 }}>
                        <Btn onClick={()=>setWriting(true)}>
                          <Ic d={P.plus} size={13} color="#fff"/> Write Entry
                        </Btn>
                        <Btn onClick={()=>setTab("prompts")}
                          style={{ background:`${T.purple}22`,color:T.purple,border:`1px solid ${T.purple}44` }}>
                          💡 Use a Prompt
                        </Btn>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    {dayEntries.map(entry=>(
                      <Card key={entry.id}>
                        <div style={{ display:"flex",justifyContent:"space-between",
                          alignItems:"flex-start",marginBottom:12 }}>
                          <div>
                            <div style={{ fontSize:16,fontWeight:700,marginBottom:6 }}>{entry.title}</div>
                            <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                              <div style={{ padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,
                                background:`${TAG_C[entry.tag]||T.purple}22`,
                                color:TAG_C[entry.tag]||T.purple }}>
                                {entry.tag}
                              </div>
                              {entry.time && <span style={{ fontSize:11,color:T.textMuted }}>🕐 {entry.time}</span>}
                              <span style={{ fontSize:11,color:T.textDim }}>{entry.date}</span>
                            </div>
                          </div>
                          <div style={{ display:"flex",gap:6 }}>
                            <Btn onClick={()=>startEdit(entry)}
                              style={{ padding:"5px 12px",fontSize:12,background:"transparent",
                                border:`1px solid ${T.border}`,color:T.textMuted }}>Edit</Btn>
                            <button onClick={()=>del(entry.id)}
                              style={{ background:"none",border:`1px solid ${T.border}`,borderRadius:8,
                                color:"#ef4444",cursor:"pointer",padding:"5px 10px" }}>
                              <Ic d={P.trash} size={13} color="#ef4444"/>
                            </button>
                          </div>
                        </div>
                        <div style={{ fontSize:14,lineHeight:1.8,color:T.text,whiteSpace:"pre-wrap",
                          marginBottom:entry.media?.length?16:0 }}>
                          {entry.body}
                        </div>
                        {entry.media?.length > 0 && (
                          <div style={{ display:"flex",flexWrap:"wrap",gap:10,marginTop:8 }}>
                            {entry.media.map((m,i)=>(
                              <div key={i} style={{ borderRadius:10,overflow:"hidden",
                                border:`1px solid ${T.border}` }}>
                                {m.type==="image" && (
                                  <img src={m.url} alt={m.name}
                                    style={{ maxWidth:220,maxHeight:160,objectFit:"cover",
                                      display:"block",cursor:"pointer" }}
                                    onClick={()=>window.open(m.url,"_blank")}/>
                                )}
                                {m.type==="video" && (
                                  <video controls src={m.url}
                                    style={{ maxWidth:280,maxHeight:180,display:"block" }}/>
                                )}
                                {m.type==="audio" && (
                                  <div style={{ padding:"10px 14px",background:T.bg,minWidth:200 }}>
                                    <div style={{ fontSize:12,color:T.textMuted,marginBottom:6 }}>🎤 {m.name}</div>
                                    <audio controls src={m.url} style={{ width:"100%" }}/>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* COL 3 — Search + Recents */}
          {/* COL 3 — Search + Recents: hidden on mobile, shown on desktop */}
<div className="journal-right-col" style={{ display:"flex", flexDirection:"column", gap:12 }}>
  <div>
    <div style={{ position:"relative", marginBottom: search ? 8 : 0 }}>
      <div style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T.textMuted,zIndex:1 }}>
        <Ic d={P.search} size={13}/>
      </div>
      <input placeholder="Search entries..." value={search}
        onChange={e=>setSearch(e.target.value)}
        style={{ width:"100%", background:T.card, border:`1px solid ${T.border}`,
          borderRadius:10, color:T.text, padding:"9px 10px 9px 32px",
          fontSize:13, outline:"none", boxSizing:"border-box" }}/>
    </div>
    {search && (
      <div style={{ display:"flex", flexWrap:"wrap", gap:5, padding:"6px 0" }}>
        {TAGS.map(t=>(
          <div key={t} onClick={()=>setFilterTag(t)}
            style={{ padding:"3px 8px", borderRadius:20, fontSize:10, cursor:"pointer",
              background:filterTag===t?TAG_C[t]:`${TAG_C[t]}22`,
              color:filterTag===t?"#fff":TAG_C[t],
              border:`1px solid ${TAG_C[t]}44`, fontWeight:600 }}>
            {t}
          </div>
        ))}
        <button onClick={()=>{setSearch("");setFilterTag("All");}}
          style={{ background:"none",border:`1px solid ${T.border}`,borderRadius:6,
            color:T.textMuted,cursor:"pointer",padding:"3px 7px",fontSize:10 }}>✕</button>
      </div>
    )}
  </div>
  <Card style={{ flex:1, padding:12, maxHeight:"calc(100vh - 300px)", overflowY:"auto" }}>
    <div style={{ fontSize:12, color:T.textMuted, marginBottom:10, fontWeight:600 }}>
      {search ? `${filtered.length} result${filtered.length!==1?"s":""}` : "Recent Entries"}
    </div>
    {(search ? filtered : entries).length === 0 ? (
      <div style={{ textAlign:"center", padding:"20px 0", color:T.textDim, fontSize:12 }}>
        {search ? "No entries found" : "No entries yet"}
      </div>
    ) : (
      (search ? filtered : entries).slice().reverse().map(e=>(
        <div key={e.id} onClick={()=>{setSelected(e.date);setWriting(false);}}
          style={{ padding:"10px", borderRadius:8, cursor:"pointer", marginBottom:6,
            background:e.date===selected?`${T.purple}18`:"transparent",
            border:`1px solid ${e.date===selected?T.purple:T.border}` }}>
          <div style={{ fontSize:12,fontWeight:600,marginBottom:3,overflow:"hidden",
            textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{e.title}</div>
          <div style={{ fontSize:11,color:T.textMuted,marginBottom:4,overflow:"hidden",
            textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{e.body?.slice(0,50)}...</div>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:10,padding:"2px 6px",borderRadius:10,
              background:`${TAG_C[e.tag]||T.purple}22`,
              color:TAG_C[e.tag]||T.purple,fontWeight:600 }}>{e.tag}</span>
            <span style={{ fontSize:10,color:T.textDim }}>{e.date}</span>
          </div>
        </div>
      ))
    )}
  </Card>
</div>

        </div>
      )}

    </div>
  );
}
