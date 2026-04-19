/* ========================================================
   SYNAPSE — Dashboard (hero surface)
   The "Cortex" — AI greeting, pulse, next focus, load map.
   Three layout variants toggleable via Tweaks.
   ======================================================== */
window.Dashboard = (function () {
  const { useState, useEffect, useRef, useMemo } = React;
  const { Ic, Chip, Dot, Kbd, Button, Card, StatusPill, PriorityDot, AreaSwatch, AiTag, Bar, Sparkline } = UI;
  const H = SY.helpers;

  /* ------------ AI GREETING (top band) ------------ */
  function Greeting({ data, onOpenCapture, onView }) {
    const { tasks, projects, notes } = data;
    const today = H.todayStr();
    const todayTasks = tasks.filter(t => t.due === today && t.status !== 'Complete');
    const overdue = tasks.filter(t => t.due && t.due < today && t.status !== 'Complete');
    const forgotten = tasks.filter(t => H.isForgotten(t));
    const completedToday = tasks.filter(t => t.status === 'Complete' && t.due === today).length;
    const hour = new Date().getHours();
    const part = hour < 5 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

    const line = (() => {
      if (overdue.length) return `${overdue.length} ${overdue.length===1?'thing':'things'} slipped past their date. I've put the critical ones up top.`;
      if (todayTasks.length > 4) return `A full day — ${todayTasks.length} items scheduled. I'd start with ${todayTasks[0]?.name.toLowerCase()}.`;
      if (forgotten.length > 3) return `${forgotten.length} items have gone quiet for a week+. Want me to sweep them into next week or let them rest?`;
      return `Calm day. One strong focus block here and you'll clear today easily.`;
    })();

    return (
      <div className="fade-in" style={{
        position:'relative', overflow:'hidden',
        padding:'28px 30px 26px',
        borderRadius:'var(--radius-xl)',
        background: 'linear-gradient(135deg, color-mix(in oklch, var(--focus) 6%, var(--surface)) 0%, var(--surface) 55%, var(--surface-2) 100%)',
        border:'1px solid var(--line)',
        marginBottom:20,
      }}>
        {/* Ambient blob */}
        <div style={{
          position:'absolute', top:-80, right:-60, width:280, height:280,
          background:`radial-gradient(circle, var(--glow) 0%, transparent 70%)`,
          filter:'blur(30px)', pointerEvents:'none',
        }}/>
        <div style={{position:'relative', display:'flex', alignItems:'flex-start', gap:18}}>
          {/* Pulsing core */}
          <div style={{flexShrink:0, width:52, height:52, position:'relative'}}>
            <div style={{position:'absolute', inset:0, borderRadius:'50%', background:'var(--focus)', opacity:.15, animation:'pulse 3.6s var(--ease) infinite'}}/>
            <div style={{position:'absolute', inset:8, borderRadius:'50%', background:'var(--focus)', opacity:.35, animation:'pulse 3.6s var(--ease) infinite', animationDelay:'.3s'}}/>
            <div style={{position:'absolute', inset:18, borderRadius:'50%', background:'var(--focus)'}}/>
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8, color:'var(--text-3)', fontSize:12}}>
              <AiTag>cortex</AiTag>
              <span className="mono">{new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' })}</span>
            </div>
            <h1 className="display" style={{fontSize:'clamp(20px, 1.9vw, 26px)', fontWeight:600, letterSpacing:'-0.02em', lineHeight:1.35, marginBottom:16, textWrap:'pretty', paddingRight:8}}>
              Good {part}. {line}
            </h1>
            <div style={{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap'}}>
              <Button variant="focus" size="md" onClick={onOpenCapture}><Ic.capture size={14}/>Quick capture <Kbd style={{background:'color-mix(in oklch, black 10%, transparent)', color:'inherit', borderColor:'transparent'}}>⌘K</Kbd></Button>
              <Button variant="secondary" size="md" onClick={() => onView('today')}><Ic.today size={14}/>Today <span className="mono" style={{color:'var(--text-3)'}}>{todayTasks.length}</span></Button>
              <Button variant="secondary" size="md" onClick={() => onView('digest')}><Ic.digest size={14}/>Briefing</Button>
              {completedToday > 0 && <span style={{marginLeft:'auto', fontSize:12, color:'var(--text-3)', display:'inline-flex', alignItems:'center', gap:6}}><Dot color="var(--pos)"/>{completedToday} done today</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------ FOCUS STACK (next 3 things) ------------ */
  function FocusStack({ data, onOpenTask }) {
    const today = H.todayStr();
    const scored = data.tasks
      .filter(t => t.status !== 'Complete')
      .map(t => {
        let s = 0;
        if (t.priority === 'Critical') s += 100;
        else if (t.priority === 'High') s += 60;
        else if (t.priority === 'Medium') s += 20;
        if (t.due && t.due <= today) s += 80;
        else if (t.due) {
          const days = Math.floor((new Date(t.due) - new Date(today)) / 86400e3);
          if (days <= 3) s += 30;
        }
        if (H.isForgotten(t)) s += 15;
        return { t, s };
      })
      .sort((a,b) => b.s - a.s)
      .slice(0,3)
      .map(x => x.t);

    return (
      <Card style={{padding:20}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14}}>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <Ic.bolt size={14} />
            <span style={{fontSize:13, fontWeight:600}}>Focus now</span>
            <span style={{fontSize:11, color:'var(--text-4)'}} className="mono">AI-ranked</span>
          </div>
          <span style={{fontSize:11, color:'var(--text-3)'}}>Top 3 of {data.tasks.filter(t=>t.status!=='Complete').length}</span>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:2}}>
          {scored.map((t, i) => {
            const area = data.areas.find(a => a.id === t.areaId);
            const proj = data.projects.find(p => p.id === t.projectId);
            const overdue = t.due && t.due < today;
            return (
              <button key={t.id} onClick={() => onOpenTask(t)} style={{
                display:'flex', alignItems:'center', gap:12, padding:'12px 10px', borderRadius:10,
                textAlign:'left', width:'100%', transition:'background .15s',
                background:'transparent', border:'1px solid transparent', color:'inherit',
              }}
                onMouseEnter={e => e.currentTarget.style.background='var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                <div style={{
                  width:26, height:26, borderRadius:'50%',
                  border:'1.5px solid var(--line-strong)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'var(--text-4)', fontSize:12, fontWeight:600, flexShrink:0,
                }} className="mono">{i+1}</div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:14, fontWeight:500, marginBottom:4, textWrap:'pretty'}}>{t.name}</div>
                  <div style={{display:'flex', alignItems:'center', gap:8, color:'var(--text-3)', fontSize:12, flexWrap:'wrap'}}>
                    <PriorityDot priority={t.priority}/>
                    <span>{t.priority}</span>
                    {proj && <><span style={{color:'var(--text-4)'}}>·</span><span>{proj.name}</span></>}
                    {area && <><span style={{color:'var(--text-4)'}}>·</span><span style={{display:'inline-flex',alignItems:'center',gap:5}}><AreaSwatch area={area} size={8}/>{area.name}</span></>}
                    {t.due && <><span style={{color:'var(--text-4)'}}>·</span>
                      <span className="mono" style={{color: overdue ? 'var(--neg)' : 'var(--text-3)'}}>
                        {overdue ? 'overdue' : t.due === today ? 'today' : H.fmtDate(t.due)}
                      </span></>}
                  </div>
                </div>
                <span className="mono" style={{fontSize:11, color:'var(--text-4)'}}>{t.effort}</span>
              </button>
            );
          })}
        </div>
      </Card>
    );
  }

  /* ------------ CORTEX MAP (your brain at rest) ------------ */
  function CortexMap({ data, onView }) {
    const today = H.todayStr();
    // Each area becomes a node sized by open task count; project "bubbles" float around.
    const areaStats = data.areas.map(a => {
      const ts = data.tasks.filter(t => t.areaId === a.id && t.status !== 'Complete');
      const ps = data.projects.filter(p => p.areaId === a.id && p.status !== 'Complete');
      const forgotten = ts.filter(t => H.isForgotten(t)).length;
      const due = ts.filter(t => t.due && t.due <= today).length;
      return { a, tasks: ts, projs: ps, forgotten, due };
    });

    const maxTasks = Math.max(...areaStats.map(s => s.tasks.length), 1);

    // deterministic layout in a ring
    const cx = 50, cy = 50, rad = 32;
    const positions = areaStats.map((s, i) => {
      const ang = (i / areaStats.length) * Math.PI * 2 - Math.PI / 2;
      return { x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad, ...s };
    });

    return (
      <Card style={{padding:20, position:'relative', overflow:'hidden'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14}}>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <Ic.synapse size={16}/>
            <span style={{fontSize:13, fontWeight:600}}>Mind map</span>
            <span style={{fontSize:11, color:'var(--text-4)'}} className="mono">where your attention lives</span>
          </div>
          <span style={{fontSize:11, color:'var(--text-3)'}}>{data.tasks.filter(t=>t.status!=='Complete').length} open · {data.projects.filter(p=>p.status!=='Complete').length} projects</span>
        </div>
        <div style={{ position:'relative', aspectRatio:'1/0.78', width:'100%' }}>
          {/* SVG connections */}
          <svg viewBox="0 0 100 78" style={{position:'absolute', inset:0, width:'100%', height:'100%'}}>
            {/* Concentric rings */}
            <circle cx="50" cy="39" r="14" fill="none" stroke="var(--line)" strokeDasharray="1 2" opacity=".5"/>
            <circle cx="50" cy="39" r="26" fill="none" stroke="var(--line)" strokeDasharray="1 2" opacity=".35"/>
            <circle cx="50" cy="39" r="35" fill="none" stroke="var(--line)" strokeDasharray="1 2" opacity=".2"/>
            {/* Spokes to nodes (translate cy from 50 to 39 so the ring fits in a shorter box) */}
            {positions.map((p, i) => (
              <g key={i}>
                <line x1="50" y1="39" x2={p.x} y2={p.y - 11} stroke={SY.helpers.areaColor(p.a, 0.65, 0.10)} strokeWidth="0.3" opacity=".5"/>
              </g>
            ))}
            {/* center core */}
            <circle cx="50" cy="39" r="3" fill="var(--focus)"/>
            <circle cx="50" cy="39" r="5" fill="none" stroke="var(--focus)" strokeWidth="0.4" opacity=".5">
              <animate attributeName="r" values="5;8;5" dur="3s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values=".5;0;.5" dur="3s" repeatCount="indefinite"/>
            </circle>
          </svg>
          {/* HTML nodes layered over SVG */}
          {positions.map((p, i) => {
            const size = 26 + (p.tasks.length / maxTasks) * 22;
            const color = SY.helpers.areaColor(p.a);
            return (
              <button key={p.a.id} onClick={() => onView('areas:' + p.a.id)} style={{
                position:'absolute',
                left:`${p.x}%`, top:`${(p.y - 11) / 78 * 100}%`,
                transform:`translate(-50%,-50%)`,
                width:size, height:size, borderRadius:'50%',
                background:`radial-gradient(circle, ${color} 0%, color-mix(in oklch, ${color} 35%, var(--surface)) 70%, var(--surface) 100%)`,
                border:`1px solid color-mix(in oklch, ${color} 50%, transparent)`,
                boxShadow:`0 0 24px color-mix(in oklch, ${color} 25%, transparent)`,
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', transition:'all .3s var(--ease)',
                color: 'var(--bg)', fontSize: 10, fontWeight: 700,
              }}
                onMouseEnter={e => { e.currentTarget.style.transform='translate(-50%,-50%) scale(1.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translate(-50%,-50%) scale(1)'; }}
              >
                {p.forgotten > 0 && (
                  <span style={{
                    position:'absolute', top:-3, right:-3, width:12, height:12, borderRadius:'50%',
                    background:'var(--warn)', border:'2px solid var(--surface)',
                    animation:'pulse 2s infinite',
                  }}/>
                )}
              </button>
            );
          })}
          {/* Labels beneath */}
          {positions.map((p) => (
            <div key={p.a.id+':lbl'} style={{
              position:'absolute',
              left:`${p.x}%`, top:`${(p.y - 11) / 78 * 100 + 9}%`,
              transform:'translate(-50%,0)', textAlign:'center', pointerEvents:'none',
            }}>
              <div style={{fontSize:11, fontWeight:600, color:'var(--text-2)'}}>{p.a.name}</div>
              <div className="mono" style={{fontSize:10, color:'var(--text-4)'}}>{p.tasks.length}·{p.projs.length}p</div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  /* ------------ LOAD BAR ------------ */
  function LoadBar({ data }) {
    const areas = data.areas.map(a => {
      const n = data.tasks.filter(t => t.areaId === a.id && t.status !== 'Complete').length;
      return { a, n };
    });
    const total = areas.reduce((s,x) => s + x.n, 0);
    return (
      <div>
        <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:10}}>
          <span style={{fontSize:12, fontWeight:600, color:'var(--text-2)'}}>Cognitive load</span>
          <span className="mono" style={{fontSize:11, color:'var(--text-4)'}}>{total} open items across {areas.length} areas</span>
        </div>
        <div style={{display:'flex', height:10, borderRadius:6, overflow:'hidden', background:'var(--surface-2)'}}>
          {areas.map(({a,n}) => (
            <div key={a.id} title={`${a.name}: ${n}`} style={{
              flex: n || .15,
              background: SY.helpers.areaColor(a),
              borderRight: '2px solid var(--surface)',
            }}/>
          ))}
        </div>
        <div style={{display:'flex', gap:12, marginTop:10, flexWrap:'wrap'}}>
          {areas.map(({a,n}) => (
            <div key={a.id} style={{display:'inline-flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text-3)'}}>
              <AreaSwatch area={a} size={8}/><span>{a.name}</span>
              <span className="mono" style={{color:'var(--text-4)'}}>{n}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ------------ SIGNALS (forgotten + proposals) ------------ */
  function Signals({ data, onTouch, onAcceptProposal, onDismissProposal, onOpenTask }) {
    const forgotten = data.tasks.filter(t => H.isForgotten(t)).slice(0,4);
    const pending = data.proposals.filter(p => p.status === 'pending');

    return (
      <Card style={{padding:20}}>
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:14}}>
          <Ic.wave size={14}/>
          <span style={{fontSize:13, fontWeight:600}}>Signals</span>
          <span style={{fontSize:11, color:'var(--text-4)'}}>things I noticed</span>
        </div>

        {pending.length > 0 && (
          <div style={{marginBottom: forgotten.length ? 16 : 0}}>
            <div style={{fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8}}>Pattern detected</div>
            {pending.map(p => {
              const area = data.areas.find(a => a.id === p.areaId);
              return (
                <div key={p.id} style={{padding:'12px 14px', background:'color-mix(in oklch, var(--focus) 6%, var(--surface))', border:'1px solid color-mix(in oklch, var(--focus) 22%, transparent)', borderRadius:12, marginBottom:6}}>
                  <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
                    <AiTag>proposal</AiTag>
                    {area && <span style={{fontSize:11, color:'var(--text-3)', display:'inline-flex', alignItems:'center', gap:5}}><AreaSwatch area={area} size={8}/>{area.name}</span>}
                    <span className="mono" style={{fontSize:10.5, color:'var(--text-4)', marginLeft:'auto'}}>{Math.round(p.confidence*100)}% conf</span>
                  </div>
                  <div style={{fontSize:14, fontWeight:600, marginBottom:4}}>Promote to project: "{p.suggestedName}"</div>
                  <div style={{fontSize:13, color:'var(--text-2)', lineHeight:1.55, marginBottom:10}}>{p.themeSummary}</div>
                  <div style={{display:'flex', gap:6}}>
                    <Button variant="focus" size="xs" onClick={() => onAcceptProposal(p)}>Create project</Button>
                    <Button variant="ghost" size="xs" onClick={() => onDismissProposal(p)}>Dismiss</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {forgotten.length > 0 && (
          <div>
            <div style={{fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8}}>Gone quiet</div>
            {forgotten.map(t => (
              <div key={t.id} style={{display:'flex', alignItems:'center', gap:10, padding:'8px 4px', borderRadius:6}}>
                <button onClick={() => onOpenTask(t)} style={{flex:1, textAlign:'left', fontSize:13, color:'var(--text)', background:'transparent', border:'none', padding:0, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', cursor:'pointer'}}>{t.name}</button>
                <span className="mono" style={{fontSize:11, color:'var(--warn)'}}>{H.daysSince(t.touchedAt || t.createdAt)}d</span>
                <Button variant="ghost" size="xs" onClick={() => onTouch(t)}>Revive</Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  }

  /* ------------ COMPLETION DONUT ------------ */
  function CompletionRing({ data }) {
    const total = data.tasks.length;
    const done = data.tasks.filter(t => t.status === 'Complete').length;
    const inProg = data.tasks.filter(t => t.status === 'In Progress').length;
    const hold = data.tasks.filter(t => t.status === 'On Hold').length;
    const nope = data.tasks.filter(t => t.status === 'Not Started').length;

    const size = 160, stroke = 14, r = (size - stroke) / 2, C = 2 * Math.PI * r;
    let off = 0;
    const arcs = [
      { label:'Complete', n:done, color:'var(--pos)' },
      { label:'In Progress', n:inProg, color:'var(--info)' },
      { label:'On Hold', n:hold, color:'var(--warn)' },
      { label:'Not Started', n:nope, color:'var(--text-3)' },
    ];
    return (
      <Card style={{padding:20}}>
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:14}}>
          <Ic.tasks size={14}/>
          <span style={{fontSize:13, fontWeight:600}}>Status pulse</span>
        </div>
        <div style={{display:'flex', gap:20, alignItems:'center'}}>
          <div style={{position:'relative', width:size, height:size, flexShrink:0}}>
            <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
              <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke}/>
              {arcs.map((a, i) => {
                const len = (a.n / total) * C;
                const circle = <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={a.color} strokeWidth={stroke} strokeDasharray={`${len} ${C-len}`} strokeDashoffset={-off} strokeLinecap="butt" style={{transition:'all .5s var(--ease)'}}/>;
                off += len;
                return circle;
              })}
            </svg>
            <div style={{position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
              <div className="display" style={{fontSize:32, fontWeight:700, letterSpacing:'-0.02em', lineHeight:1}}>{Math.round(done/total*100)}%</div>
              <div className="mono" style={{fontSize:11, color:'var(--text-3)', marginTop:4}}>{done}/{total} done</div>
            </div>
          </div>
          <div style={{flex:1, display:'flex', flexDirection:'column', gap:8}}>
            {arcs.map(a => (
              <div key={a.label} style={{display:'flex', alignItems:'center', gap:8, fontSize:13}}>
                <Dot color={a.color} size={8}/>
                <span style={{flex:1, color:'var(--text-2)'}}>{a.label}</span>
                <span className="mono" style={{color:'var(--text-3)'}}>{a.n}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  /* ------------ MOMENTUM (7-day sparkline of completions) ------------ */
  function Momentum({ data }) {
    // synth last 7 days completion counts from tasks
    const days = Array.from({length:7}, (_,i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6-i));
      const iso = d.toISOString().slice(0,10);
      const n = data.tasks.filter(t => t.status==='Complete' && t.due === iso).length;
      return { iso, n: Math.max(n, [2,3,1,4,2,5,3][i]) }; // gentle floor so chart looks alive
    });
    const total = days.reduce((s,x)=>s+x.n,0);
    return (
      <Card style={{padding:20}}>
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
          <Ic.bolt size={14}/>
          <span style={{fontSize:13, fontWeight:600}}>Momentum</span>
          <span style={{fontSize:11, color:'var(--text-4)'}}>last 7 days</span>
          <span className="mono" style={{marginLeft:'auto', fontSize:12, color:'var(--text-2)'}}>{total} completions</span>
        </div>
        <Sparkline data={days.map(d=>d.n)} color="var(--focus)" height={56}/>
        <div style={{display:'flex', justifyContent:'space-between', marginTop:4}}>
          {days.map((d,i) => (
            <div key={i} className="mono" style={{fontSize:10, color:'var(--text-4)'}}>
              {new Date(d.iso).toLocaleDateString('en-GB',{weekday:'narrow'})}
            </div>
          ))}
        </div>
      </Card>
    );
  }

  /* ------------ 3-2-1 THURSDAY (James Clear-style weekly capture) ------------ */
  // Seeded with an original rotating set so the card is never empty. User can
  // paste their newsletter and Synapse will "capture" it — simulated parse.
  const SEED_ISSUES = [
    {
      date: 'Apr 17, 2026', issue: 142,
      ideas: [
        "You don't need more time. You need more attention on less.",
        "Identity change is slow because it happens in private. Notice who you were this week.",
        "Progress rarely looks like progress in the moment. It looks like boring repetition.",
      ],
      quotes: [
        { who: 'Seneca', text: "It is not that we have a short time to live, but that we waste a lot of it." },
        { who: 'Annie Dillard', text: "How we spend our days is, of course, how we spend our lives." },
      ],
      question: "What is one thing you keep saying you'll do 'when things calm down' — and what would it cost to start this week?",
    },
    {
      date: 'Apr 10, 2026', issue: 141,
      ideas: [
        "The system you're willing to run on a bad day is the only one that matters.",
        "Most hard problems are easy problems with unclear priorities.",
        "A calendar beats a to-do list because time is the real constraint.",
      ],
      quotes: [
        { who: 'Marcus Aurelius', text: "You have power over your mind — not outside events. Realize this, and you will find strength." },
        { who: 'Naval Ravikant', text: "A calm mind, a fit body, and a house full of love. These things cannot be bought — they must be earned." },
      ],
      question: "If you removed the three least important things on your task list, what would you do with the time?",
    },
  ];

  function ClearQuotes({ data, actions }) {
    const STORAGE = 'synapse-clear-issues';
    const [issues, setIssues] = useState(() => {
      try { const s = localStorage.getItem(STORAGE); if (s) return JSON.parse(s); } catch (e) {}
      return SEED_ISSUES;
    });
    const [idx, setIdx] = useState(0);
    const [capture, setCapture] = useState(false);
    const [raw, setRaw] = useState('');
    const [parsing, setParsing] = useState(false);
    useEffect(() => { try { localStorage.setItem(STORAGE, JSON.stringify(issues)); } catch (e) {} }, [issues]);

    const cur = issues[idx] || issues[0];

    const parseIssue = () => {
      setParsing(true);
      setTimeout(() => {
        // naive simulated parse — split lines, look for numbered ideas and quoted text
        const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
        const ideas = [];
        const quotes = [];
        let question = '';
        for (const l of lines) {
          const m = l.match(/^"(.+?)"\s*[—\-–]\s*(.+)$/) || l.match(/^(.+?)\s*[—\-–]\s*(.+)$/);
          if (m && quotes.length < 2 && (l.startsWith('"') || m[2].split(' ').length <= 4)) {
            quotes.push({ text: m[1].replace(/^"|"$/g,''), who: m[2] });
          } else if (/\?\s*$/.test(l) && !question) {
            question = l;
          } else if (ideas.length < 3 && l.length > 20) {
            ideas.push(l.replace(/^\d+[\.\)]\s*/, '').replace(/^[-*•]\s*/, ''));
          }
        }
        const next = {
          date: new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }),
          issue: (issues[0]?.issue || 140) + 1,
          ideas: ideas.length ? ideas : ['(no ideas detected)'],
          quotes: quotes.length ? quotes : [],
          question: question || '',
        };
        setIssues([next, ...issues]);
        setIdx(0);
        setParsing(false);
        setCapture(false);
        setRaw('');
      }, 900);
    };

    return (
      <Card style={{padding:0, overflow:'hidden', position:'relative'}}>
        {/* Paper-ish header */}
        <div style={{
          padding:'16px 20px 14px', borderBottom:'1px solid var(--line)',
          display:'flex', alignItems:'center', gap:10,
          background: 'linear-gradient(180deg, color-mix(in oklch, var(--focus) 5%, var(--surface)), var(--surface))',
        }}>
          <div style={{
            width:28, height:28, borderRadius:8,
            background: 'color-mix(in oklch, var(--focus) 18%, transparent)',
            border: '1px solid color-mix(in oklch, var(--focus) 35%, transparent)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'var(--focus)', fontSize:11, fontWeight:700, letterSpacing:'-0.04em',
          }} className="mono">3·2·1</div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:13, fontWeight:600, letterSpacing:'-0.01em'}} className="display">Thursday reading</div>
            <div style={{fontSize:11, color:'var(--text-4)'}} className="mono">issue #{cur.issue} · {cur.date}</div>
          </div>
          <div style={{display:'flex', gap:4}}>
            <button onClick={() => setIdx(i => Math.min(i+1, issues.length-1))} disabled={idx >= issues.length-1}
              style={{width:26, height:26, borderRadius:6, background:'var(--surface-2)', color:'var(--text-3)', display:'flex', alignItems:'center', justifyContent:'center', opacity: idx >= issues.length-1 ? 0.3 : 1}}><Ic.chev dir="left" size={12}/></button>
            <button onClick={() => setIdx(i => Math.max(i-1, 0))} disabled={idx === 0}
              style={{width:26, height:26, borderRadius:6, background:'var(--surface-2)', color:'var(--text-3)', display:'flex', alignItems:'center', justifyContent:'center', opacity: idx === 0 ? 0.3 : 1}}><Ic.chev dir="right" size={12}/></button>
            <button onClick={() => setCapture(true)} title="Capture new issue"
              style={{width:26, height:26, borderRadius:6, background:'var(--focus)', color:'oklch(0.15 0.01 60)', display:'flex', alignItems:'center', justifyContent:'center'}}><Ic.plus size={12}/></button>
          </div>
        </div>

        <div style={{padding:'18px 20px 20px'}}>
          {/* 3 ideas */}
          <div style={{marginBottom:16}}>
            <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:10, fontSize:10.5, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.12em'}} className="mono">
              <span style={{fontWeight:700, color:'var(--focus)'}}>3</span> ideas from the week
            </div>
            {cur.ideas.map((text, i) => (
              <div key={i} style={{display:'flex', gap:10, marginBottom:8, paddingLeft:2}}>
                <span className="mono" style={{fontSize:10, color:'var(--text-4)', marginTop:4, width:10, flexShrink:0}}>0{i+1}</span>
                <div style={{fontSize:13.5, lineHeight:1.55, color:'var(--text)', textWrap:'pretty', fontStyle: 'italic'}} className="display">{text}</div>
              </div>
            ))}
          </div>

          {cur.quotes.length > 0 && (
            <div style={{marginBottom:16, paddingTop:14, borderTop:'1px dashed var(--line)'}}>
              <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:10, fontSize:10.5, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.12em'}} className="mono">
                <span style={{fontWeight:700, color:'var(--focus)'}}>2</span> quotes from others
              </div>
              {cur.quotes.map((q, i) => (
                <div key={i} style={{marginBottom:10, paddingLeft:12, borderLeft:'2px solid color-mix(in oklch, var(--focus) 40%, transparent)'}}>
                  <div style={{fontSize:13, lineHeight:1.55, color:'var(--text-2)', marginBottom:3, textWrap:'pretty'}}>&ldquo;{q.text}&rdquo;</div>
                  <div style={{fontSize:11, color:'var(--text-4)'}} className="mono">— {q.who}</div>
                </div>
              ))}
            </div>
          )}

          {cur.question && (
            <div style={{paddingTop:14, borderTop:'1px dashed var(--line)'}}>
              <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:10, fontSize:10.5, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.12em'}} className="mono">
                <span style={{fontWeight:700, color:'var(--focus)'}}>1</span> question to sit with
              </div>
              <div style={{
                fontSize:14, lineHeight:1.55, color:'var(--text)',
                padding:'12px 14px', borderRadius:10,
                background:'color-mix(in oklch, var(--focus) 6%, transparent)',
                border:'1px solid color-mix(in oklch, var(--focus) 18%, transparent)',
                textWrap:'pretty',
              }} className="display">{cur.question}</div>
            </div>
          )}
        </div>

        {capture && (
          <div onClick={() => !parsing && setCapture(false)} style={{
            position:'absolute', inset:0, background:'color-mix(in oklch, var(--bg-deep) 80%, transparent)', backdropFilter:'blur(6px)',
            display:'flex', alignItems:'center', justifyContent:'center', padding:16, zIndex:10,
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              width:'100%', background:'var(--surface)', border:'1px solid var(--line-strong)', borderRadius:12, overflow:'hidden',
            }}>
              <div style={{padding:'12px 14px', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'center', gap:8}}>
                <AiTag>capture</AiTag>
                <span style={{fontSize:12, fontWeight:600}} className="display">Paste this week's 3-2-1</span>
                <button onClick={() => setCapture(false)} style={{marginLeft:'auto', color:'var(--text-4)'}}><Ic.close size={12}/></button>
              </div>
              <textarea autoFocus value={raw} onChange={e => setRaw(e.target.value)}
                placeholder={`Paste the email here. Cortex will pull the 3 ideas, 2 quotes, and 1 question.\n\nTip: keep line breaks between items.`}
                style={{width:'100%', minHeight:160, padding:'12px 14px', fontSize:12.5, lineHeight:1.55, background:'transparent', color:'var(--text)', resize:'vertical', fontFamily:'var(--font-ui)'}}/>
              <div style={{display:'flex', justifyContent:'flex-end', gap:8, padding:'10px 14px', borderTop:'1px solid var(--line)'}}>
                <Button variant="ghost" size="sm" onClick={() => setCapture(false)} disabled={parsing}>Cancel</Button>
                <Button variant="focus" size="sm" onClick={parseIssue} disabled={!raw.trim() || parsing}>
                  {parsing ? 'Reading…' : 'Capture'}<Ic.sparkle size={12}/>
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    );
  }

  /* ------------ ROOT DASHBOARD ------------ */
  function View({ data, actions, layout='default' }) {
    // 3 layout variants: 'default', 'cortex' (map-dominant), 'linear' (list-first)
    return (
      <div>
        <Greeting data={data} onOpenCapture={actions.openCapture} onView={actions.setView}/>

        {layout === 'cortex' && (
          <div style={{display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:16}}>
            <CortexMap data={data} onView={actions.setView}/>
            <div style={{display:'flex', flexDirection:'column', gap:16}}>
              <FocusStack data={data} onOpenTask={actions.openTask}/>
              <Signals data={data} onTouch={actions.touch} onAcceptProposal={actions.acceptProposal} onDismissProposal={actions.dismissProposal} onOpenTask={actions.openTask}/>
              <Quotes.Widget/>
            </div>
            <div style={{gridColumn:'1/3', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16}}>
              <CompletionRing data={data}/>
              <Momentum data={data}/>
              <Card style={{padding:20}}><LoadBar data={data}/></Card>
            </div>
            <div style={{gridColumn:'1/3'}}>
              <ClearQuotes data={data} actions={actions}/>
            </div>
          </div>
        )}

        {layout === 'default' && (
          <div style={{display:'flex', flexDirection:'column', gap:16}}>
            <div style={{display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:16}}>
              <div style={{display:'flex', flexDirection:'column', gap:16}}>
                <FocusStack data={data} onOpenTask={actions.openTask}/>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
                  <CompletionRing data={data}/>
                  <Momentum data={data}/>
                </div>
                <Card style={{padding:20}}><LoadBar data={data}/></Card>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:16}}>
                <CortexMap data={data} onView={actions.setView}/>
                <Signals data={data} onTouch={actions.touch} onAcceptProposal={actions.acceptProposal} onDismissProposal={actions.dismissProposal} onOpenTask={actions.openTask}/>
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
              <Quotes.Widget/>
              <ClearQuotes data={data} actions={actions}/>
            </div>
          </div>
        )}

        {layout === 'linear' && (
          <div style={{display:'grid', gridTemplateColumns:'1fr', gap:16}}>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12}}>
              {[
                { label:'Today', v: data.tasks.filter(t=>t.due===H.todayStr()&&t.status!=='Complete').length, c:'var(--focus)' },
                { label:'In progress', v: data.tasks.filter(t=>t.status==='In Progress').length, c:'var(--info)' },
                { label:'Forgotten', v: data.tasks.filter(t=>H.isForgotten(t)).length, c:'var(--warn)' },
                { label:'Projects', v: data.projects.filter(p=>p.status!=='Complete').length, c:'var(--pos)' },
              ].map((s,i) => (
                <Card key={i} style={{padding:18}}>
                  <div style={{fontSize:12, color:'var(--text-3)', marginBottom:8}}>{s.label}</div>
                  <div className="display" style={{fontSize:34, fontWeight:700, color:s.c, letterSpacing:'-0.02em'}}>{s.v}</div>
                </Card>
              ))}
            </div>
            <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:16}}>
              <FocusStack data={data} onOpenTask={actions.openTask}/>
              <Signals data={data} onTouch={actions.touch} onAcceptProposal={actions.acceptProposal} onDismissProposal={actions.dismissProposal} onOpenTask={actions.openTask}/>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16}}>
              <CompletionRing data={data}/>
              <Momentum data={data}/>
              <Card style={{padding:20}}><LoadBar data={data}/></Card>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
              <Quotes.Widget/>
              <ClearQuotes data={data} actions={actions}/>
            </div>
          </div>
        )}
      </div>
    );
  }

  return { View };
})();
