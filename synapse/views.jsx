/* ========================================================
   SYNAPSE — All other views (Today, Stream, Notes, Tasks,
   Projects, Board, Calendar, Digest, Inbox, Settings)
   + Capture modal + Detail panel + Command palette
   ======================================================== */
window.Views = (function () {
  const { useState, useEffect, useRef, useMemo, useCallback } = React;
  const { Ic, Chip, Dot, Kbd, Button, Card, Toggle, StatusPill, PriorityDot, AreaSwatch, AiTag, Bar, Sparkline } = UI;
  const H = SY.helpers;
  const T = SY.tables;

  /* ---------------- CAPTURE MODAL (Mind Dump) ---------------- */
  function CaptureModal({ data, onCommit, onClose }) {
    const [text, setText] = useState('');
    const [phase, setPhase] = useState('writing'); // 'writing' | 'thinking' | 'review'
    const [extracted, setExtracted] = useState([]);
    const ref = useRef(null);
    useEffect(() => { ref.current?.focus(); }, []);

    const simulateAI = (raw) => {
      // Fake AI extraction — split by lines/sentences and create tasks
      const lines = raw.split(/\n|(?<=\.\s)|(?<=\?)\s|(?<=\!)\s/).map(s => s.trim()).filter(s => s.length > 5);
      const now = Date.now();
      return lines.slice(0,8).map((l, i) => {
        const hasDate = /today|tomorrow|monday|tuesday|wednesday|thursday|friday|weekend|friday|tonight|next week/i.test(l);
        const hasUrgent = /urgent|asap|critical|immediately|today/i.test(l);
        const area = data.areas.find(a => new RegExp(a.name, 'i').test(l)) ||
                     (/work|meeting|report|email|board|hire/i.test(l) ? data.areas[0] :
                      /home|kitchen|bill|pay|renovate/i.test(l) ? data.areas[1] :
                      /run|marathon|gym|health|diet/i.test(l) ? data.areas[2] :
                      /read|learn|study|book|chapter/i.test(l) ? data.areas[3] :
                      /idea|blog|write|explore/i.test(l) ? data.areas[4] : data.areas[0]);
        return {
          _id: 'tmp_' + now + '_' + i,
          name: l.replace(/^[-*•]\s?/, '').replace(/[.?!]+$/, ''),
          priority: hasUrgent ? 'Critical' : i < 2 ? 'High' : 'Medium',
          effort: l.length > 80 ? 'L' : l.length > 40 ? 'M' : 'S',
          areaId: area.id,
          due: hasDate ? H.todayStr() : null,
          confidence: 0.6 + Math.random() * 0.35,
          sourceSpan: l.slice(0, 90),
          _selected: true,
        };
      });
    };

    const commit = () => {
      if (!text.trim()) return;
      setPhase('thinking');
      setTimeout(() => {
        const items = simulateAI(text);
        setExtracted(items);
        setPhase('review');
      }, 1100);
    };

    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); commit(); }
      if (e.key === 'Escape' && phase === 'writing') onClose();
    };

    const toggleItem = (id) => setExtracted(x => x.map(i => i._id === id ? {...i, _selected: !i._selected} : i));
    const editItem = (id, field, val) => setExtracted(x => x.map(i => i._id === id ? {...i, [field]: val} : i));

    const accept = () => {
      const sel = extracted.filter(i => i._selected);
      onCommit({ rawText: text, extracted: sel });
    };

    return (
      <div onClick={phase === 'writing' ? onClose : null} style={{
        position:'fixed', inset:0, zIndex:5000,
        background:'color-mix(in oklch, var(--bg-deep) 85%, transparent)',
        backdropFilter:'blur(10px)',
        display:'flex', alignItems:'flex-start', justifyContent:'center',
        paddingTop:'10vh',
      }}>
        <div onClick={e => e.stopPropagation()} className="fade-in" style={{
          width:'min(640px, 92vw)',
          background:'var(--surface)', border:'1px solid var(--line-strong)',
          borderRadius:'var(--radius-xl)',
          boxShadow:'0 40px 80px rgba(0,0,0,.35), 0 0 0 1px var(--line)',
          overflow:'hidden',
        }}>
          {/* header */}
          <div style={{display:'flex', alignItems:'center', gap:10, padding:'14px 18px', borderBottom:'1px solid var(--line)'}}>
            <div style={{width:8, height:8, borderRadius:'50%', background:phase==='writing'?'var(--focus)':phase==='thinking'?'var(--info)':'var(--pos)', animation: phase==='thinking'?'pulse 1s infinite':'none'}}/>
            <span style={{fontSize:13, fontWeight:600}} className="display">
              {phase === 'writing' && 'Mind dump'}
              {phase === 'thinking' && 'Cortex is reading…'}
              {phase === 'review' && `Found ${extracted.length} things to track`}
            </span>
            <span style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:6}}>
              {phase === 'writing' && <><Kbd>⌘</Kbd><Kbd>↵</Kbd><span style={{fontSize:11, color:'var(--text-4)'}}>to commit</span></>}
              <button onClick={onClose} style={{width:26, height:26, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-3)'}}><Ic.close size={14}/></button>
            </span>
          </div>

          {phase === 'writing' && (
            <textarea
              ref={ref}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type anything. A project, an idea, a worry, a list — Cortex will sort it."
              style={{
                width:'100%', minHeight:180, padding:'18px 20px',
                fontSize:15, lineHeight:1.65, resize:'vertical',
                fontFamily:'var(--font-ui)', color:'var(--text)',
              }}
            />
          )}

          {phase === 'thinking' && (
            <div style={{padding:'48px 20px', textAlign:'center'}}>
              <div style={{display:'inline-flex', gap:6, marginBottom:14}}>
                {[0,1,2].map(i => <div key={i} style={{
                  width:10, height:10, borderRadius:'50%', background:'var(--focus)',
                  animation:`breath 1.1s var(--ease) ${i*.15}s infinite`,
                }}/>)}
              </div>
              <div style={{fontSize:13, color:'var(--text-3)'}}>Parsing your thoughts. Linking to areas and projects.</div>
            </div>
          )}

          {phase === 'review' && (
            <div style={{maxHeight:'58vh', overflowY:'auto'}}>
              <div style={{padding:'10px 18px', borderBottom:'1px solid var(--line)', fontSize:12, color:'var(--text-3)'}}>
                Uncheck anything you don't want saved. Click to edit.
              </div>
              {extracted.map(item => {
                const area = data.areas.find(a => a.id === item.areaId);
                return (
                  <div key={item._id} style={{
                    display:'flex', gap:10, padding:'12px 18px',
                    borderBottom:'1px solid var(--line)',
                    opacity: item._selected ? 1 : 0.4,
                    transition:'opacity .15s',
                  }}>
                    <button onClick={() => toggleItem(item._id)} style={{
                      width:18, height:18, borderRadius:5, marginTop:2, flexShrink:0,
                      border:`1.5px solid ${item._selected?'var(--focus)':'var(--line-strong)'}`,
                      background: item._selected ? 'var(--focus)' : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color: 'oklch(0.15 0.01 60)', cursor:'pointer',
                    }}>{item._selected && <Ic.check size={12}/>}</button>
                    <div style={{flex:1, minWidth:0}}>
                      <input value={item.name} onChange={e => editItem(item._id, 'name', e.target.value)} style={{
                        width:'100%', fontSize:14, fontWeight:500, marginBottom:6,
                      }}/>
                      <div style={{display:'flex', gap:6, alignItems:'center', flexWrap:'wrap'}}>
                        {area && <Chip color={SY.helpers.areaColor(area)}><AreaSwatch area={area} size={7}/>{area.name}</Chip>}
                        <Chip color={T.priorityColor[item.priority]}><PriorityDot priority={item.priority}/>{item.priority}</Chip>
                        <Chip>{item.effort}</Chip>
                        {item.due && <Chip color="var(--focus)">{item.due === H.todayStr() ? 'today' : H.fmtDate(item.due)}</Chip>}
                        <span className="mono" style={{marginLeft:'auto', fontSize:10.5, color:'var(--text-4)'}}>{Math.round(item.confidence*100)}% conf</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 18px', borderTop:'1px solid var(--line)'}}>
            <span className="mono" style={{fontSize:11, color:'var(--text-4)'}}>
              {phase === 'writing' && `${text.trim().split(/\s+/).filter(Boolean).length} words`}
              {phase === 'review' && `${extracted.filter(i=>i._selected).length} selected`}
            </span>
            <div style={{display:'flex', gap:8}}>
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              {phase === 'writing' && <Button variant="focus" size="sm" onClick={commit} disabled={!text.trim()}>Commit<Ic.sparkle size={12}/></Button>}
              {phase === 'review' && <Button variant="focus" size="sm" onClick={accept}>Save {extracted.filter(i=>i._selected).length} items</Button>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- DETAIL PANEL ---------------- */
  function DetailPanel({ type, item, data, onClose, onSave, onDelete }) {
    const [f, setF] = useState({...item});
    useEffect(() => { setF({...item}); }, [item?.id]);
    const area = data.areas.find(a => a.id === f.areaId);
    const project = type === 'task' && f.projectId ? data.projects.find(p => p.id === f.projectId) : null;
    const linkedTasks = type === 'project' ? data.tasks.filter(t => t.projectId === f.id) : [];
    const done = linkedTasks.filter(t => t.status === 'Complete').length;

    const set = (k, v) => { const nf = {...f, [k]: v, touchedAt: new Date().toISOString()}; setF(nf); onSave(nf); };

    return (
      <>
        <div onClick={onClose} style={{position:'fixed', inset:0, background:'color-mix(in oklch, var(--bg-deep) 40%, transparent)', backdropFilter:'blur(6px)', zIndex:900}}/>
        <div className="fade-in" style={{
          position:'fixed', right:0, top:0, bottom:0, width:'min(460px, 95vw)',
          background:'var(--surface)', borderLeft:'1px solid var(--line)',
          boxShadow:'-20px 0 40px rgba(0,0,0,.2)',
          zIndex:910, display:'flex', flexDirection:'column',
        }}>
          <div style={{display:'flex', alignItems:'center', gap:10, padding:'14px 20px', borderBottom:'1px solid var(--line)'}}>
            {area && <><AreaSwatch area={area} size={10}/><span style={{fontSize:12, color:'var(--text-3)'}}>{area.name}</span></>}
            <span style={{color:'var(--text-4)'}}>·</span>
            <span style={{fontSize:12, color:'var(--text-3)', textTransform:'capitalize'}}>{type}</span>
            <button onClick={onClose} style={{marginLeft:'auto', width:28, height:28, borderRadius:6, background:'var(--surface-2)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-3)'}}><Ic.close/></button>
          </div>

          <div style={{padding:'18px 20px', flex:1, overflowY:'auto'}}>
            <input value={f.name} onChange={e => set('name', e.target.value)} style={{
              width:'100%', fontSize:22, fontWeight:700, marginBottom:14, letterSpacing:'-0.01em',
            }} className="display"/>

            {/* Status chips */}
            <div style={{display:'flex', flexWrap:'wrap', gap:6, marginBottom:18}}>
              {T.STATUSES.map(s => (
                <button key={s} onClick={() => set('status', s)} style={{
                  padding:'5px 12px', borderRadius:999, fontSize:12,
                  border: f.status === s ? `1px solid ${T.statusColor[s]}` : '1px solid var(--line)',
                  background: f.status === s ? `color-mix(in oklch, ${T.statusColor[s]} 12%, transparent)` : 'transparent',
                  color: f.status === s ? T.statusColor[s] : 'var(--text-3)',
                  display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer',
                }}>
                  {f.status === s && <Dot color={T.statusColor[s]}/>}
                  {s}
                </button>
              ))}
            </div>

            {/* Meta grid */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18}}>
              <Field label="Priority">
                <div style={{display:'flex', gap:4}}>
                  {T.PRIORITIES.map(p => (
                    <button key={p} onClick={() => set('priority', p)} title={p} style={{
                      flex:1, padding:'6px 0', borderRadius:6,
                      border: f.priority === p ? `1px solid ${T.priorityColor[p]}` : '1px solid var(--line)',
                      background: f.priority === p ? `color-mix(in oklch, ${T.priorityColor[p]} 12%, transparent)` : 'transparent',
                      display:'flex', justifyContent:'center', cursor:'pointer',
                    }}><Dot color={T.priorityColor[p]}/></button>
                  ))}
                </div>
              </Field>
              <Field label="Effort">
                <div style={{display:'flex', gap:4}}>
                  {T.EFFORTS.map(e => (
                    <button key={e} onClick={() => set('effort', e)} style={{
                      flex:1, padding:'5px 0', borderRadius:6,
                      border: f.effort === e ? '1px solid var(--focus)' : '1px solid var(--line)',
                      color: f.effort === e ? 'var(--focus)' : 'var(--text-3)',
                      background: f.effort === e ? 'color-mix(in oklch, var(--focus) 10%, transparent)' : 'transparent',
                      fontSize:12, fontWeight:600, cursor:'pointer',
                    }} className="mono">{e}</button>
                  ))}
                </div>
              </Field>
              <Field label="Area">
                <select value={f.areaId || ''} onChange={e => set('areaId', e.target.value)} style={inputStyle}>
                  {data.areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </Field>
              <Field label="Due">
                <input type="date" value={f.due || ''} onChange={e => set('due', e.target.value)} style={inputStyle}/>
              </Field>
              {type === 'task' && (
                <Field label="Project" full>
                  <select value={f.projectId || ''} onChange={e => set('projectId', e.target.value || null)} style={inputStyle}>
                    <option value="">— None —</option>
                    {data.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </Field>
              )}
            </div>

            <Field label="Notes">
              <textarea value={f.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Add context…" rows={4} style={{...inputStyle, resize:'vertical', lineHeight:1.6}}/>
            </Field>

            {type === 'project' && linkedTasks.length > 0 && (
              <div style={{marginTop:18}}>
                <div style={{fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8}}>Tasks ({done}/{linkedTasks.length})</div>
                <Bar value={done/linkedTasks.length*100} color={area ? SY.helpers.areaColor(area) : 'var(--focus)'} height={3}/>
                <div style={{marginTop:10}}>
                  {linkedTasks.slice(0,6).map(t => (
                    <div key={t.id} style={{display:'flex', alignItems:'center', gap:8, padding:'6px 0', fontSize:13, color: t.status==='Complete'?'var(--text-4)':'var(--text)', textDecoration: t.status==='Complete'?'line-through':'none'}}>
                      <Dot color={T.statusColor[t.status]}/>{t.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {f.aiConfidence && (
              <div style={{marginTop:18, padding:'10px 12px', background:'color-mix(in oklch, var(--focus) 6%, transparent)', border:'1px solid color-mix(in oklch, var(--focus) 20%, transparent)', borderRadius:10, display:'flex', alignItems:'center', gap:10}}>
                <AiTag>extracted</AiTag>
                <span style={{fontSize:12, color:'var(--text-2)'}}>Cortex captured this from a mind dump with {Math.round(f.aiConfidence*100)}% confidence.</span>
              </div>
            )}
          </div>

          <div style={{display:'flex', justifyContent:'space-between', padding:'12px 20px', borderTop:'1px solid var(--line)'}}>
            <Button variant="danger" size="sm" onClick={() => { onDelete(f.id); onClose(); }}>Delete</Button>
            <Button variant="secondary" size="sm" onClick={onClose}>Done</Button>
          </div>
        </div>
      </>
    );
  }

  const inputStyle = {
    width:'100%', padding:'8px 10px', fontSize:13,
    background:'var(--surface-2)', border:'1px solid var(--line)',
    borderRadius:8, color:'var(--text)',
  };
  function Field({ label, children, full }) {
    return <div style={full ? {gridColumn:'1/3'} : {}}>
      <div style={{fontSize:11, color:'var(--text-3)', marginBottom:5, textTransform:'uppercase', letterSpacing:'.08em'}}>{label}</div>
      {children}
    </div>;
  }

  /* ---------------- PAGE HEADER ---------------- */
  function PageHeader({ title, sub, children }) {
    return (
      <div style={{display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:22, flexWrap:'wrap', gap:12}}>
        <div>
          <h1 className="display" style={{fontSize:'clamp(24px, 2.4vw, 34px)', fontWeight:600, letterSpacing:'-0.02em', lineHeight:1.15}}>{title}</h1>
          {sub && <p style={{color:'var(--text-3)', fontSize:14, marginTop:4}}>{sub}</p>}
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>{children}</div>
      </div>
    );
  }

  /* ---------------- TODAY (priority queue for the day) ---------------- */
  function Today({ data, actions }) {
    const today = H.todayStr();
    const overdue = data.tasks.filter(t => t.due && t.due < today && t.status !== 'Complete');
    const scheduled = data.tasks.filter(t => t.due === today && t.status !== 'Complete');
    const done = data.tasks.filter(t => t.status === 'Complete' && t.due === today);

    const Section = ({ title, items, tone }) => items.length > 0 && (
      <div style={{marginBottom:24}}>
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
          <span style={{fontSize:12, fontWeight:600, color:tone||'var(--text-2)', textTransform:'uppercase', letterSpacing:'.08em'}}>{title}</span>
          <span className="mono" style={{fontSize:11, color:'var(--text-4)'}}>{items.length}</span>
          <div style={{flex:1, height:1, background:'var(--line)', marginLeft:8}}/>
        </div>
        <Card style={{padding:4}}>
          {items.map((t, i) => <TaskRow key={t.id} t={t} data={data} actions={actions} isLast={i === items.length - 1}/>)}
        </Card>
      </div>
    );

    return (
      <div>
        <PageHeader title={new Date().toLocaleDateString('en-GB', { weekday:'long' })} sub={new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}>
          <Button variant="focus" size="sm" onClick={actions.openCapture}><Ic.capture size={14}/>Capture<Kbd style={{background:'color-mix(in oklch, black 10%, transparent)', color:'inherit', borderColor:'transparent'}}>⌘K</Kbd></Button>
        </PageHeader>

        <Section title="Overdue" items={overdue} tone="var(--neg)"/>
        <Section title="Today" items={scheduled}/>
        <Section title="Completed today" items={done} tone="var(--pos)"/>

        {!overdue.length && !scheduled.length && !done.length && (
          <Card style={{padding:48, textAlign:'center'}}>
            <div className="display" style={{fontSize:24, fontWeight:600, marginBottom:6}}>Nothing on today.</div>
            <div style={{color:'var(--text-3)'}}>A rare and beautiful thing.</div>
          </Card>
        )}
      </div>
    );
  }

  /* ---------------- TASK ROW (reused) ---------------- */
  function TaskRow({ t, data, actions, isLast }) {
    const area = data.areas.find(a => a.id === t.areaId);
    const proj = data.projects.find(p => p.id === t.projectId);
    const overdue = t.due && t.due < H.todayStr() && t.status !== 'Complete';
    const forgotten = H.isForgotten(t);

    return (
      <div onClick={() => actions.openTask(t)} style={{
        display:'flex', alignItems:'center', gap:12,
        padding:'10px 12px', borderRadius:8, cursor:'pointer',
        borderBottom: isLast ? 'none' : '1px solid var(--line)',
        transition:'background .12s',
      }}
        onMouseEnter={e => e.currentTarget.style.background='var(--surface-2)'}
        onMouseLeave={e => e.currentTarget.style.background='transparent'}
      >
        <button onClick={e => { e.stopPropagation(); actions.toggleComplete(t); }} style={{
          width:18, height:18, borderRadius:'50%',
          border:`1.5px solid ${T.statusColor[t.status]}`,
          background: t.status === 'Complete' ? T.statusColor[t.status] : 'transparent',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'oklch(0.15 0 0)', flexShrink:0,
        }}>{t.status === 'Complete' && <Ic.check size={11}/>}</button>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontSize:14, fontWeight:500,
            color: t.status==='Complete' ? 'var(--text-4)' : 'var(--text)',
            textDecoration: t.status==='Complete' ? 'line-through' : 'none',
            marginBottom: 3,
          }}>{t.name}</div>
          <div style={{display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--text-3)', flexWrap:'wrap'}}>
            {area && <span style={{display:'inline-flex', alignItems:'center', gap:5}}><AreaSwatch area={area} size={7}/>{area.name}</span>}
            {proj && <><span style={{color:'var(--text-4)'}}>·</span><span>{proj.name}</span></>}
            {t.due && <><span style={{color:'var(--text-4)'}}>·</span><span className="mono" style={{color: overdue ? 'var(--neg)' : 'var(--text-3)'}}>{overdue ? `${H.daysSince(t.due)}d overdue` : t.due === H.todayStr() ? 'today' : H.fmtDate(t.due)}</span></>}
            {forgotten && !overdue && <Chip color="var(--warn)"><Dot color="var(--warn)"/>forgotten</Chip>}
          </div>
        </div>
        <PriorityDot priority={t.priority}/>
        <span className="mono" style={{fontSize:11, color:'var(--text-4)', width:20, textAlign:'right'}}>{t.effort}</span>
      </div>
    );
  }

  /* ---------------- TASKS ---------------- */
  function Tasks({ data, actions }) {
    const [filter, setFilter] = useState('all'); // all | active | complete | forgotten
    const list = useMemo(() => {
      let xs = [...data.tasks];
      if (filter === 'active') xs = xs.filter(t => t.status !== 'Complete');
      if (filter === 'complete') xs = xs.filter(t => t.status === 'Complete');
      if (filter === 'forgotten') xs = xs.filter(t => H.isForgotten(t));
      return xs.sort((a,b) => {
        if (a.status === 'Complete' && b.status !== 'Complete') return 1;
        if (b.status === 'Complete' && a.status !== 'Complete') return -1;
        const ad = a.due || '9999'; const bd = b.due || '9999';
        if (ad !== bd) return ad.localeCompare(bd);
        return T.PRIORITIES.indexOf(a.priority) - T.PRIORITIES.indexOf(b.priority);
      });
    }, [data.tasks, filter]);

    return (
      <div>
        <PageHeader title="Tasks" sub={`${data.tasks.filter(t=>t.status!=='Complete').length} active`}>
          <Toggle value={filter} onChange={setFilter} options={[
            {value:'all', label:'All'},
            {value:'active', label:'Active'},
            {value:'forgotten', label:'Forgotten'},
            {value:'complete', label:'Done'},
          ]}/>
          <Button variant="primary" size="sm" onClick={() => actions.newTask()}><Ic.plus/>New</Button>
        </PageHeader>

        <Card style={{padding:4}}>
          {list.map((t, i) => <TaskRow key={t.id} t={t} data={data} actions={actions} isLast={i === list.length - 1}/>)}
        </Card>
      </div>
    );
  }

  /* ---------------- PROJECTS ---------------- */
  function Projects({ data, actions }) {
    return (
      <div>
        <PageHeader title="Projects" sub={`${data.projects.filter(p=>p.status!=='Complete').length} active`}>
          <Button variant="primary" size="sm" onClick={() => actions.newProject()}><Ic.plus/>New project</Button>
        </PageHeader>

        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14}}>
          {data.projects.map(p => {
            const area = data.areas.find(a => a.id === p.areaId);
            const linked = data.tasks.filter(t => t.projectId === p.id);
            const done = linked.filter(t => t.status === 'Complete').length;
            const pct = linked.length ? Math.round(done/linked.length*100) : 0;
            const c = SY.helpers.areaColor(area);
            return (
              <Card key={p.id} onClick={() => actions.openProject(p)} style={{padding:18, position:'relative', overflow:'hidden'}}>
                <div style={{position:'absolute', top:0, left:0, right:0, height:3, background:c}}/>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:10}}>
                  <div style={{fontSize:15, fontWeight:600, lineHeight:1.3, textWrap:'pretty'}}>{p.name}</div>
                  <StatusPill status={p.status}/>
                </div>
                {area && <div style={{display:'inline-flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text-3)', marginBottom:12}}>
                  <AreaSwatch area={area} size={8}/>{area.name}
                </div>}
                {p.notes && <div style={{fontSize:13, color:'var(--text-2)', lineHeight:1.5, marginBottom:12, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{p.notes}</div>}
                <Bar value={pct} color={c}/>
                <div style={{display:'flex', justifyContent:'space-between', marginTop:8, fontSize:11, color:'var(--text-3)'}}>
                  <span className="mono">{done}/{linked.length} tasks · {pct}%</span>
                  {p.due && <span className="mono">due {H.fmtDate(p.due)}</span>}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  /* ---------------- BOARD ---------------- */
  function Board({ data, actions }) {
    return (
      <div>
        <PageHeader title="Board" sub="Kanban view — drag to change status"/>
        <div style={{display:'grid', gridTemplateColumns:`repeat(${T.STATUSES.length}, 1fr)`, gap:12, minHeight:'60vh'}}>
          {T.STATUSES.map(status => {
            const items = data.tasks.filter(t => t.status === status);
            return (
              <div key={status}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { const id = e.dataTransfer.getData('taskId'); if (id) actions.moveTask(id, status); }}
                style={{
                  background:'var(--bg-deep)', borderRadius:'var(--radius-lg)',
                  border:'1px solid var(--line)', padding:12,
                }}>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:12, padding:'2px 4px'}}>
                  <Dot color={T.statusColor[status]}/>
                  <span style={{fontSize:13, fontWeight:600}}>{status}</span>
                  <span className="mono" style={{fontSize:11, color:'var(--text-4)', marginLeft:'auto'}}>{items.length}</span>
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:6}}>
                  {items.map(t => {
                    const area = data.areas.find(a => a.id === t.areaId);
                    return (
                      <div key={t.id}
                        draggable
                        onDragStart={e => e.dataTransfer.setData('taskId', t.id)}
                        onClick={() => actions.openTask(t)}
                        style={{
                          padding:'10px 12px', background:'var(--surface)',
                          border:'1px solid var(--line)', borderRadius:10, cursor:'grab',
                          transition:'transform .15s, border-color .15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--line-strong)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; }}
                      >
                        <div style={{fontSize:13, fontWeight:500, marginBottom:6, textWrap:'pretty'}}>{t.name}</div>
                        <div style={{display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text-3)'}}>
                          <PriorityDot priority={t.priority}/>
                          {area && <span style={{display:'inline-flex', alignItems:'center', gap:4}}><AreaSwatch area={area} size={6}/>{area.name}</span>}
                          {t.due && <span className="mono" style={{marginLeft:'auto'}}>{H.fmtDate(t.due)}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ---------------- CALENDAR ---------------- */
  function Calendar({ data, actions }) {
    const [cur, setCur] = useState(new Date());
    const yr = cur.getFullYear(), mo = cur.getMonth();
    const fd = new Date(yr, mo, 1).getDay();
    const dim = new Date(yr, mo+1, 0).getDate();
    const sp = (fd + 6) % 7;
    const today = H.todayStr();
    const cells = [];
    for (let i=0;i<sp;i++) cells.push(null);
    for (let i=1;i<=dim;i++) cells.push(i);
    while (cells.length % 7) cells.push(null);

    return (
      <div>
        <PageHeader title={cur.toLocaleDateString('en-GB',{month:'long', year:'numeric'})}>
          <div style={{display:'flex', gap:4}}>
            <Button variant="secondary" size="sm" onClick={() => setCur(new Date(yr, mo-1, 1))}>←</Button>
            <Button variant="secondary" size="sm" onClick={() => setCur(new Date())}>Today</Button>
            <Button variant="secondary" size="sm" onClick={() => setCur(new Date(yr, mo+1, 1))}>→</Button>
          </div>
        </PageHeader>

        <Card style={{overflow:'hidden', padding:0}}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', background:'var(--surface-2)'}}>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
              <div key={d} style={{padding:10, fontSize:11, fontWeight:600, textAlign:'center', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.08em'}}>{d}</div>
            ))}
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)'}}>
            {cells.map((d, i) => {
              if (!d) return <div key={i} style={{minHeight:96, background:'var(--bg-deep)', borderRight:'1px solid var(--line)', borderBottom:'1px solid var(--line)'}}/>;
              const iso = `${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
              const isToday = iso === today;
              const items = data.tasks.filter(t => t.due === iso && t.status !== 'Complete');
              return (
                <div key={i} style={{
                  minHeight:96, padding:8,
                  background: isToday ? 'color-mix(in oklch, var(--focus) 6%, var(--surface))' : 'var(--surface)',
                  borderRight: (i+1)%7 ? '1px solid var(--line)' : 'none',
                  borderBottom:'1px solid var(--line)',
                }}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6}}>
                    <span className="mono" style={{
                      fontSize:12, fontWeight: isToday ? 700 : 400,
                      color: isToday ? 'var(--focus)' : 'var(--text-3)',
                      ...(isToday ? { background:'var(--focus)', color:'var(--bg)', borderRadius:'50%', width:22, height:22, display:'inline-flex', alignItems:'center', justifyContent:'center' } : {}),
                    }}>{d}</span>
                    {items.length > 0 && <span className="mono" style={{fontSize:10, color:'var(--text-4)'}}>{items.length}</span>}
                  </div>
                  {items.slice(0,3).map(t => {
                    const area = data.areas.find(a => a.id === t.areaId);
                    return (
                      <div key={t.id} onClick={() => actions.openTask(t)} style={{
                        fontSize:11, padding:'3px 6px', borderRadius:4, marginBottom:2,
                        background: `color-mix(in oklch, ${SY.helpers.areaColor(area)} 18%, transparent)`,
                        borderLeft: `2px solid ${SY.helpers.areaColor(area)}`,
                        color:'var(--text-2)', cursor:'pointer',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                      }}>{t.name}</div>
                    );
                  })}
                  {items.length > 3 && <div style={{fontSize:10, color:'var(--text-4)', marginTop:2}}>+{items.length-3}</div>}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  /* ---------------- STREAM ---------------- */
  function Stream({ data, actions }) {
    const items = [...data.notes.map(n => ({...n, _type:'note', _ts:n.createdAt})),
      ...data.tasks.map(t => ({...t, _type:'task', _ts:t.createdAt})),
      ...data.projects.map(p => ({...p, _type:'project', _ts:p.createdAt})),
    ].sort((a,b) => new Date(b._ts) - new Date(a._ts));

    const grouped = {};
    items.forEach(x => {
      const key = new Date(x._ts).toDateString();
      (grouped[key] = grouped[key] || []).push(x);
    });

    return (
      <div>
        <PageHeader title="Stream" sub="Chronological log of your thinking"/>
        {Object.entries(grouped).map(([day, its]) => {
          const label = day === new Date().toDateString() ? 'Today' : day === new Date(Date.now()-86400e3).toDateString() ? 'Yesterday' : day;
          return (
            <div key={day} style={{marginBottom:28}}>
              <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:12}}>
                <span className="display" style={{fontSize:14, fontWeight:600, color:'var(--text-2)'}}>{label}</span>
                <div style={{flex:1, height:1, background:'var(--line)'}}/>
              </div>
              <div style={{position:'relative'}}>
                <div style={{position:'absolute', left:12, top:8, bottom:8, width:1, background:'var(--line)'}}/>
                {its.map(x => {
                  const area = data.areas.find(a => a.id === x.areaId || (x.areaIds||[]).includes(a.id));
                  const color = x._type==='note'?'var(--text-3)':x._type==='task'?'var(--info)':'var(--focus)';
                  return (
                    <div key={x.id} onClick={() => x._type!=='note' && (x._type==='task'?actions.openTask(x):actions.openProject(x))} style={{
                      display:'flex', gap:14, padding:'10px 0 10px 32px', position:'relative',
                      cursor: x._type !== 'note' ? 'pointer' : 'default',
                    }}>
                      <div style={{
                        position:'absolute', left:6, top:16, width:14, height:14, borderRadius:'50%',
                        background:'var(--bg)', border:`2px solid ${color}`,
                      }}/>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                          <span className="mono" style={{fontSize:11, color:'var(--text-4)'}}>{H.fmtTime(x._ts)}</span>
                          <Chip color={color}>{x._type}</Chip>
                          {area && <Chip color={SY.helpers.areaColor(area)}><AreaSwatch area={area} size={7}/>{area.name}</Chip>}
                        </div>
                        <div style={{fontSize:14, color:'var(--text)', textWrap:'pretty', lineHeight:1.55}}>
                          {x._type==='note' ? x.rawText.slice(0,240) : x.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ---------------- NOTES ---------------- */
  function Notes({ data, actions }) {
    const [q, setQ] = useState('');
    const xs = data.notes.filter(n => !q || n.rawText.toLowerCase().includes(q.toLowerCase()));
    return (
      <div>
        <PageHeader title="Notes" sub="Raw captures, linked to what they became">
          <div style={{position:'relative'}}>
            <span style={{position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-4)'}}><Ic.search/></span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" style={{
              padding:'7px 10px 7px 32px', fontSize:13,
              background:'var(--surface)', border:'1px solid var(--line)', borderRadius:8, width:240,
            }}/>
          </div>
        </PageHeader>

        <div style={{columnCount: 2, columnGap: 14}}>
          {xs.map(n => (
            <Card key={n.id} style={{padding:18, marginBottom:14, breakInside:'avoid'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
                <span className="mono" style={{fontSize:11, color:'var(--text-4)'}}>{H.rel(n.createdAt)}</span>
                {n.extractedIds.length > 0 && <AiTag>{n.extractedIds.length} task{n.extractedIds.length>1?'s':''}</AiTag>}
              </div>
              <div style={{fontSize:13.5, lineHeight:1.7, color:'var(--text)', textWrap:'pretty', whiteSpace:'pre-wrap'}}>{n.rawText}</div>
              {n.extractedIds.length > 0 && (
                <div style={{marginTop:10, paddingTop:10, borderTop:'1px solid var(--line)'}}>
                  {data.tasks.filter(t => n.extractedIds.includes(t.id)).map(t => (
                    <div key={t.id} onClick={() => actions.openTask(t)} style={{fontSize:12, color:'var(--focus)', padding:'2px 0', cursor:'pointer', display:'flex', alignItems:'center', gap:6}}>
                      <Ic.chev size={10}/>{t.name}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    );
  }

  /* ---------------- DIGEST ---------------- */
  function Digest({ data, actions }) {
    const today = H.todayStr();
    const overdue = data.tasks.filter(t => t.due && t.due < today && t.status !== 'Complete');
    const focus = data.tasks.filter(t => t.due === today && t.status !== 'Complete').slice(0,4);
    const forgotten = data.tasks.filter(t => H.isForgotten(t));
    const incoming = data.tasks.filter(t => t.due && t.due > today && t.due <= H.dayStr(3) && t.status !== 'Complete');
    const wins = data.tasks.filter(t => t.status === 'Complete' && t.touchedAt > H.dayStr(-7) ? true : false).slice(0,5);

    const Section = ({ title, tone, icon, children }) => (
      <div className="fade-in" style={{marginBottom:14}}>
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
          <span style={{color: tone || 'var(--text-2)'}}>{icon}</span>
          <span style={{fontSize:12, fontWeight:600, color:tone||'var(--text-2)', textTransform:'uppercase', letterSpacing:'.1em'}}>{title}</span>
        </div>
        <Card style={{padding:'14px 18px'}}>{children}</Card>
      </div>
    );

    return (
      <div style={{maxWidth:720, margin:'0 auto'}}>
        <PageHeader title="Morning briefing" sub={new Date().toLocaleDateString('en-GB',{weekday:'long', day:'numeric', month:'long'})}>
          <Button variant="secondary" size="sm">Regenerate</Button>
        </PageHeader>

        <Card style={{padding:22, marginBottom:22, background:'linear-gradient(135deg, color-mix(in oklch, var(--focus) 8%, var(--surface)), var(--surface))'}}>
          <AiTag style={{marginBottom:10}}>cortex</AiTag>
          <div className="display" style={{fontSize:18, fontWeight:500, lineHeight:1.5, color:'var(--text)', textWrap:'pretty'}}>
            {overdue.length > 0
              ? `You have ${overdue.length} overdue. The one that matters most is "${overdue[0].name}" — either move it, or let's finish it this morning.`
              : focus.length > 3
              ? `${focus.length} on today's plate. I'd lean into "${focus[0].name}" first while you have energy.`
              : `A lighter day. Good window to revive something that's gone quiet — I counted ${forgotten.length}.`}
          </div>
        </Card>

        <div style={{marginBottom:22}}>
          <Quotes.BriefingQuote/>
        </div>

        {overdue.length > 0 && (
          <Section title="Slipped" tone="var(--neg)" icon={<Ic.dot/>}>
            {overdue.map(t => (
              <div key={t.id} style={{display:'flex', alignItems:'center', gap:10, padding:'6px 0', fontSize:13.5}}>
                <span style={{flex:1}}>{t.name}</span>
                <span className="mono" style={{fontSize:11, color:'var(--neg)'}}>{H.daysSince(t.due)}d late</span>
                <Button variant="ghost" size="xs" onClick={() => actions.touch(t)}>Today</Button>
              </div>
            ))}
          </Section>
        )}
        <Section title="Today's focus" tone="var(--focus)" icon={<Ic.bolt/>}>
          {focus.map(t => (
            <div key={t.id} style={{display:'flex', alignItems:'center', gap:10, padding:'6px 0', fontSize:13.5}}>
              <PriorityDot priority={t.priority}/>
              <span style={{flex:1}}>{t.name}</span>
              <span className="mono" style={{fontSize:11, color:'var(--text-4)'}}>{t.effort}</span>
            </div>
          ))}
        </Section>
        {forgotten.length > 0 && <Section title="Gone quiet" tone="var(--warn)" icon={<Ic.wave/>}>
          {forgotten.slice(0,5).map(t => (
            <div key={t.id} style={{display:'flex', alignItems:'center', gap:10, padding:'6px 0', fontSize:13.5}}>
              <span style={{flex:1}}>{t.name}</span>
              <span className="mono" style={{fontSize:11, color:'var(--warn)'}}>{H.daysSince(t.touchedAt || t.createdAt)}d</span>
              <Button variant="ghost" size="xs" onClick={() => actions.touch(t)}>Revive</Button>
            </div>
          ))}
        </Section>}
        {incoming.length > 0 && <Section title="Incoming" tone="var(--info)" icon={<Ic.calendar size={14}/>}>
          {incoming.map(t => (
            <div key={t.id} style={{display:'flex', alignItems:'center', gap:10, padding:'6px 0', fontSize:13.5}}>
              <span style={{flex:1}}>{t.name}</span>
              <span className="mono" style={{fontSize:11, color:'var(--text-3)'}}>{H.fmtDate(t.due)}</span>
            </div>
          ))}
        </Section>}
        {wins.length > 0 && <Section title="Recent wins" tone="var(--pos)" icon={<Ic.check/>}>
          {wins.map(t => (
            <div key={t.id} style={{display:'flex', alignItems:'center', gap:10, padding:'6px 0', fontSize:13.5, color:'var(--text-2)'}}>
              <Ic.check size={12}/><span style={{flex:1}}>{t.name}</span>
              <span className="mono" style={{fontSize:11, color:'var(--text-4)'}}>{H.rel(t.touchedAt)}</span>
            </div>
          ))}
        </Section>}
      </div>
    );
  }

  /* ---------------- INBOX (proposals) ---------------- */
  function Inbox({ data, actions }) {
    const pending = data.proposals.filter(p => p.status === 'pending');
    return (
      <div>
        <PageHeader title="Inbox" sub="Patterns Cortex noticed. Decide what to keep."/>
        {pending.length === 0 && (
          <Card style={{padding:48, textAlign:'center', color:'var(--text-3)'}}>
            <div className="display" style={{fontSize:20, fontWeight:600, marginBottom:6, color:'var(--text-2)'}}>Nothing to decide.</div>
            <div>When a theme repeats across captures, I'll surface it here.</div>
          </Card>
        )}
        <div style={{display:'grid', gap:14}}>
          {pending.map(p => {
            const area = data.areas.find(a => a.id === p.areaId);
            return (
              <Card key={p.id} style={{padding:22, maxWidth:640}}>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
                  <AiTag>proposal</AiTag>
                  <span className="mono" style={{fontSize:11, color:'var(--text-4)', marginLeft:'auto'}}>{Math.round(p.confidence*100)}% confidence</span>
                </div>
                <div className="display" style={{fontSize:22, fontWeight:600, letterSpacing:'-0.01em', marginBottom:6}}>{p.suggestedName}</div>
                {area && <div style={{display:'inline-flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text-3)', marginBottom:12}}><AreaSwatch area={area} size={8}/>{area.name}</div>}
                <div style={{fontSize:14, color:'var(--text-2)', lineHeight:1.6, marginBottom:16}}>{p.themeSummary}</div>
                <div style={{display:'flex', gap:8}}>
                  <Button variant="focus" size="sm" onClick={() => actions.acceptProposal(p)}>Create project</Button>
                  <Button variant="ghost" size="sm" onClick={() => actions.dismissProposal(p)}>Not right</Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  /* ---------------- SETTINGS ---------------- */
  const HUE_PRESETS = [0, 25, 62, 100, 140, 165, 200, 235, 265, 305, 340];

  function AreaRow({ area, taskCount, projectCount, onSave, onDelete }) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(area.name);
    const [hue, setHue] = useState(area.hue);

    const commit = () => {
      onSave({ ...area, name: name.trim() || area.name, hue });
      setEditing(false);
    };

    if (!editing) {
      return (
        <div style={{display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:'1px solid var(--line)'}}>
          <div style={{width:14, height:14, borderRadius:'50%', background:`oklch(0.72 0.12 ${area.hue})`, flexShrink:0}}/>
          <span style={{flex:1, fontSize:14}}>{area.name}</span>
          <span className="mono" style={{fontSize:11, color:'var(--text-4)'}}>{taskCount} open · {projectCount} proj</span>
          <button onClick={() => setEditing(true)} style={{padding:'4px 10px', fontSize:12, borderRadius:6, border:'1px solid var(--line)', color:'var(--text-3)', background:'transparent'}}>Edit</button>
          <button onClick={() => { if (window.confirm(`Delete "${area.name}"? Tasks in this area won't be deleted.`)) onDelete(area.id); }} style={{padding:'4px 8px', fontSize:12, borderRadius:6, border:'1px solid var(--line)', color:'var(--neg)', background:'transparent'}}>✕</button>
        </div>
      );
    }

    return (
      <div style={{padding:'12px 0', borderBottom:'1px solid var(--line)'}}>
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
          <div style={{width:14, height:14, borderRadius:'50%', background:`oklch(0.72 0.12 ${hue})`, flexShrink:0}}/>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            autoFocus
            style={{flex:1, fontSize:14, padding:'6px 10px', background:'var(--surface-2)', border:'1px solid var(--focus)', borderRadius:7, color:'var(--text)'}}
          />
          <button onClick={commit} style={{padding:'5px 12px', fontSize:12, borderRadius:6, background:'var(--focus)', color:'oklch(0.15 0.01 60)', fontWeight:600, border:'none'}}>Save</button>
          <button onClick={() => { setName(area.name); setHue(area.hue); setEditing(false); }} style={{padding:'5px 8px', fontSize:12, borderRadius:6, border:'1px solid var(--line)', color:'var(--text-3)', background:'transparent'}}>Cancel</button>
        </div>
        <div style={{display:'flex', gap:6, flexWrap:'wrap', paddingLeft:22}}>
          {HUE_PRESETS.map(h => (
            <button key={h} onClick={() => setHue(h)} style={{
              width:22, height:22, borderRadius:'50%',
              background:`oklch(0.72 0.12 ${h})`,
              border: hue === h ? '2px solid var(--text)' : '2px solid transparent',
              outline: hue === h ? '1px solid var(--line-strong)' : 'none',
              outlineOffset: 2,
            }}/>
          ))}
          <div style={{display:'flex', alignItems:'center', gap:6, marginLeft:4}}>
            <span style={{fontSize:11, color:'var(--text-4)'}}>or hue</span>
            <input type="range" min={0} max={360} value={hue} onChange={e => setHue(Number(e.target.value))} style={{width:80}}/>
            <span className="mono" style={{fontSize:11, color:'var(--text-3)', width:26}}>{hue}</span>
          </div>
        </div>
      </div>
    );
  }

  function Settings({ data, actions, state }) {
    const [addingArea, setAddingArea] = useState(false);
    const [newName, setNewName] = useState('');
    const [newHue, setNewHue] = useState(200);

    const addArea = () => {
      if (!newName.trim()) return;
      actions.addArea({ id: 'a_' + Date.now(), name: newName.trim(), hue: newHue, icon: '●' });
      setNewName('');
      setNewHue(200);
      setAddingArea(false);
    };

    return (
      <div style={{maxWidth:640}}>
        <PageHeader title="Settings"/>

        <Card style={{padding:22, marginBottom:14}}>
          <div style={{display:'flex', alignItems:'center', marginBottom:14}}>
            <span style={{fontSize:15, fontWeight:600, flex:1}}>Areas of mind</span>
            <button onClick={() => setAddingArea(a => !a)} style={{
              padding:'5px 12px', fontSize:12, borderRadius:6,
              background: addingArea ? 'var(--surface-2)' : 'var(--focus)',
              color: addingArea ? 'var(--text-3)' : 'oklch(0.15 0.01 60)',
              border: addingArea ? '1px solid var(--line)' : 'none', fontWeight:600,
            }}>{addingArea ? 'Cancel' : '+ Add area'}</button>
          </div>

          {addingArea && (
            <div style={{padding:'12px 0', marginBottom:8, borderBottom:'1px solid var(--line)'}}>
              <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
                <div style={{width:14, height:14, borderRadius:'50%', background:`oklch(0.72 0.12 ${newHue})`, flexShrink:0}}/>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addArea(); if (e.key === 'Escape') setAddingArea(false); }}
                  autoFocus
                  placeholder="Area name…"
                  style={{flex:1, fontSize:14, padding:'6px 10px', background:'var(--surface-2)', border:'1px solid var(--focus)', borderRadius:7, color:'var(--text)'}}
                />
                <button onClick={addArea} style={{padding:'5px 12px', fontSize:12, borderRadius:6, background:'var(--focus)', color:'oklch(0.15 0.01 60)', fontWeight:600, border:'none'}}>Add</button>
              </div>
              <div style={{display:'flex', gap:6, flexWrap:'wrap', paddingLeft:22}}>
                {HUE_PRESETS.map(h => (
                  <button key={h} onClick={() => setNewHue(h)} style={{
                    width:22, height:22, borderRadius:'50%',
                    background:`oklch(0.72 0.12 ${h})`,
                    border: newHue === h ? '2px solid var(--text)' : '2px solid transparent',
                    outline: newHue === h ? '1px solid var(--line-strong)' : 'none',
                    outlineOffset: 2,
                  }}/>
                ))}
                <div style={{display:'flex', alignItems:'center', gap:6, marginLeft:4}}>
                  <input type="range" min={0} max={360} value={newHue} onChange={e => setNewHue(Number(e.target.value))} style={{width:80}}/>
                  <span className="mono" style={{fontSize:11, color:'var(--text-3)', width:26}}>{newHue}</span>
                </div>
              </div>
            </div>
          )}

          {data.areas.map(a => (
            <AreaRow
              key={a.id}
              area={a}
              taskCount={data.tasks.filter(t => t.areaId === a.id && t.status !== 'Complete').length}
              projectCount={data.projects.filter(p => p.areaId === a.id).length}
              onSave={actions.saveArea}
              onDelete={actions.deleteArea}
            />
          ))}
        </Card>

        <Card style={{padding:22, marginBottom:14}}>
          <div style={{fontSize:15, fontWeight:600, marginBottom:6}}>Brain hygiene</div>
          <div style={{fontSize:13, color:'var(--text-3)', marginBottom:14}}>How Cortex decides something has "gone quiet"</div>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <span style={{fontSize:13}}>Flag as forgotten after</span>
            <input type="number" defaultValue={10} style={{...inputStyle, width:70}}/>
            <span style={{fontSize:13, color:'var(--text-3)'}}>days untouched</span>
          </div>
        </Card>

        <Card style={{padding:22}}>
          <div style={{fontSize:15, fontWeight:600, marginBottom:14}}>Data</div>
          <div style={{display:'flex', gap:8}}>
            <Button variant="secondary" size="sm" onClick={() => {
              const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
              a.download = 'cortex-export.json'; a.click();
            }}>Export JSON</Button>
            <Button variant="danger" size="sm" onClick={() => { if (window.confirm('Wipe all data?')) { localStorage.removeItem('cortex-v1-data'); location.reload(); } }}>Wipe all data</Button>
          </div>
        </Card>
      </div>
    );
  }

  /* ---------------- HEALTH VIEW (Whoop) ---------------- */
  function Health({ whoopData, whoopConnected, onConnect, onRefresh, loading }) {
    const fmt = (ms) => {
      if (!ms) return '—';
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      return `${h}h ${m}m`;
    };
    const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '—';
    const recoveryColor = (score) => {
      if (!score) return 'var(--text-3)';
      if (score >= 67) return 'oklch(0.72 0.14 140)';
      if (score >= 34) return 'oklch(0.78 0.14 62)';
      return 'oklch(0.68 0.16 25)';
    };
    const strainColor = (s) => {
      if (!s) return 'var(--text-3)';
      if (s >= 14) return 'oklch(0.68 0.16 25)';
      if (s >= 7) return 'oklch(0.78 0.14 62)';
      return 'oklch(0.72 0.12 200)';
    };

    const StatCard = ({ label, value, sub, color }) => (
      <Card style={{ padding: 20, flex: 1, minWidth: 140 }}>
        <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: color || 'var(--text)', lineHeight: 1, marginBottom: 4 }}>{value ?? '—'}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{sub}</div>}
      </Card>
    );

    if (!whoopConnected) {
      return (
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Health</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 32 }}>Connect your Whoop to see recovery, sleep, and strain in Cortex.</div>
          <Card style={{ padding: 32, maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic.health size={24} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Connect Whoop</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Authorize Cortex to read your recovery score, HRV, sleep stages, and daily strain.</div>
            </div>
            <Button variant="primary" onClick={onConnect}>Connect Whoop →</Button>
          </Card>
        </div>
      );
    }

    const r = whoopData?.recovery;
    const s = whoopData?.sleep;
    const c = whoopData?.cycle;
    const fetchedAt = whoopData?.fetchedAt ? new Date(whoopData.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Health</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            {fetchedAt && <span style={{ fontSize: 12, color: 'var(--text-4)' }}>updated {fetchedAt}</span>}
            <Button variant="secondary" size="sm" onClick={onRefresh} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>Today's metrics from Whoop</div>

        {loading && !whoopData && (
          <div style={{ color: 'var(--text-3)', fontSize: 13, padding: 24 }}>Loading Whoop data…</div>
        )}

        {/* Recovery row */}
        <div style={{ fontSize: 12, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Recovery</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <StatCard label="Recovery Score" value={r?.score ? `${r.score}%` : '—'} color={recoveryColor(r?.score)} sub={r?.score >= 67 ? 'Green — good to go' : r?.score >= 34 ? 'Yellow — moderate' : r?.score ? 'Red — take it easy' : null} />
          <StatCard label="HRV" value={r?.hrv_rmssd_milli ? `${Math.round(r.hrv_rmssd_milli)}ms` : '—'} sub="rMSSD" />
          <StatCard label="Resting HR" value={r?.resting_heart_rate ? `${r.resting_heart_rate}bpm` : '—'} />
          <StatCard label="SpO₂" value={r?.spo2_percentage ? `${r.spo2_percentage.toFixed(1)}%` : '—'} />
        </div>

        {/* Sleep row */}
        <div style={{ fontSize: 12, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Sleep</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <StatCard label="Sleep Performance" value={s?.sleep_performance_percentage ? `${Math.round(s.sleep_performance_percentage)}%` : '—'} />
          <StatCard label="Total Sleep" value={fmt(s?.total_in_bed_time_milli ? s.total_in_bed_time_milli - (s.total_awake_time_milli || 0) : null)} />
          <StatCard label="REM" value={fmt(s?.total_rem_sleep_time_milli)} />
          <StatCard label="Deep (SWS)" value={fmt(s?.total_slow_wave_sleep_time_milli)} />
          <StatCard label="Bedtime" value={fmtTime(s?.start)} sub={`up ${fmtTime(s?.end)}`} />
        </div>

        {/* Strain row */}
        <div style={{ fontSize: 12, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Strain</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <StatCard label="Day Strain" value={c?.strain ? c.strain.toFixed(1) : '—'} color={strainColor(c?.strain)} sub="/ 21.0 max" />
          <StatCard label="Avg HR" value={c?.average_heart_rate ? `${c.average_heart_rate}bpm` : '—'} />
          <StatCard label="Max HR" value={c?.max_heart_rate ? `${c.max_heart_rate}bpm` : '—'} />
          <StatCard label="Calories" value={c?.kilojoule ? `${Math.round(c.kilojoule / 4.184)} kcal` : '—'} />
        </div>
      </div>
    );
  }

  return { CaptureModal, DetailPanel, Today, Tasks, Projects, Board, Calendar, Stream, Notes, Digest, Inbox, Settings, Health };
})();
