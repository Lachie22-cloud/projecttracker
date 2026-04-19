/* ========================================================
   SYNAPSE â€” shared UI primitives + icons (global window.UI)
   ======================================================== */
window.UI = (function () {
  const { useState, useEffect, useRef, useMemo, useCallback } = React;

  /* ------- Icons ------- */
  const S = { viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:1.6, strokeLinecap:'round', strokeLinejoin:'round' };
  const Ic = {
    synapse: ({size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
      <circle cx="5"  cy="6"  r="1.6" fill="currentColor" opacity=".7"/>
      <circle cx="19" cy="7"  r="1.6" fill="currentColor" opacity=".7"/>
      <circle cx="5"  cy="18" r="1.6" fill="currentColor" opacity=".7"/>
      <circle cx="19" cy="17" r="1.6" fill="currentColor" opacity=".7"/>
      <path d="M12 12 L5 6 M12 12 L19 7 M12 12 L5 18 M12 12 L19 17" stroke="currentColor" strokeWidth="1" opacity=".5"/>
    </svg>,
    capture:   ({size=18}) => <svg width={size} height={size} {...S}><path d="M12 3v18M3 12h18"/></svg>,
    today:     ({size=18}) => <svg width={size} height={size} {...S}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
    stream:    ({size=18}) => <svg width={size} height={size} {...S}><path d="M4 6h16M4 12h10M4 18h16"/></svg>,
    notes:     ({size=18}) => <svg width={size} height={size} {...S}><path d="M5 4h11l4 4v12a0 0 0 0 1 0 0H5z"/><path d="M16 4v4h4"/></svg>,
    tasks:     ({size=18}) => <svg width={size} height={size} {...S}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 12l3 3 7-7"/></svg>,
    projects:  ({size=18}) => <svg width={size} height={size} {...S}><path d="M3 6h7l2 2h9v11a1 1 0 0 1-1 1H3z"/></svg>,
    board:     ({size=18}) => <svg width={size} height={size} {...S}><rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="10" rx="1"/><rect x="17" y="4" width="4" height="13" rx="1"/></svg>,
    calendar:  ({size=18}) => <svg width={size} height={size} {...S}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>,
    inbox:     ({size=18}) => <svg width={size} height={size} {...S}><path d="M3 13h5l2 3h4l2-3h5"/><path d="M5 6h14l2 7v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z"/></svg>,
    digest:    ({size=18}) => <svg width={size} height={size} {...S}><path d="M12 3v3M12 18v3M4.2 4.2l2 2M17.8 17.8l2 2M3 12h3M18 12h3M4.2 19.8l2-2M17.8 6.2l2-2"/><circle cx="12" cy="12" r="4"/></svg>,
    search:    ({size=16}) => <svg width={size} height={size} {...S}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>,
    settings:  ({size=18}) => <svg width={size} height={size} {...S}><circle cx="12" cy="12" r="3"/><path d="M19.4 14.5a7.6 7.6 0 0 0 0-5l1.6-1.2-1.8-3.1-1.9.6a7.6 7.6 0 0 0-4.3-2.5L12.4 1h-3.6l-.6 2.3a7.6 7.6 0 0 0-4.3 2.5L2 5.2.2 8.3l1.6 1.2a7.6 7.6 0 0 0 0 5L.2 15.7 2 18.8l1.9-.6a7.6 7.6 0 0 0 4.3 2.5l.6 2.3h3.6l.6-2.3a7.6 7.6 0 0 0 4.3-2.5l1.9.6 1.8-3.1z"/></svg>,
    close:     ({size=16}) => <svg width={size} height={size} {...S}><path d="M6 6l12 12M18 6L6 18"/></svg>,
    plus:      ({size=14}) => <svg width={size} height={size} {...S}><path d="M12 4v16M4 12h16"/></svg>,
    chev:      ({size=14, dir='right'}) => { const r = {right:0,down:90,left:180,up:270}[dir]; return <svg width={size} height={size} {...S} style={{transform:`rotate(${r}deg)`, transition:'transform .2s'}}><path d="M9 6l6 6-6 6"/></svg>; },
    sparkle:   ({size=14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z"/><circle cx="19" cy="5" r="1.3"/><circle cx="5" cy="19" r="1.3"/></svg>,
    bolt:      ({size=14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-2 8 10-12h-7l1-8z"/></svg>,
    check:     ({size=14}) => <svg width={size} height={size} {...S} strokeWidth={2}><path d="M5 12l5 5L20 7"/></svg>,
    dot:       ({size=8}) => <svg width={size} height={size} viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>,
    command:   ({size=12}) => <svg width={size} height={size} {...S}><path d="M7 7h10v10H7zM7 7a2 2 0 1 1-2-2 2 2 0 0 1 2 2zM17 7a2 2 0 1 0 2-2 2 2 0 0 0-2 2zM7 17a2 2 0 1 0-2 2 2 2 0 0 0 2-2zM17 17a2 2 0 1 1 2 2 2 2 0 0 1-2-2z"/></svg>,
    wave:      ({size=16}) => <svg width={size} height={size} {...S}><path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/></svg>,
    health:    ({size=18}) => <svg width={size} height={size} {...S}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  };

  /* ------- Small atoms ------- */
  const Chip = ({ children, color, style, onClick }) => (
    <span className="chip" onClick={onClick} style={{
      color: color || 'var(--text-2)',
      borderColor: color ? `color-mix(in oklch, ${color} 35%, transparent)` : 'var(--line)',
      background: color ? `color-mix(in oklch, ${color} 10%, transparent)` : 'transparent',
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>{children}</span>
  );

  const Dot = ({ color='currentColor', size=6, style }) => (
    <span style={{ width:size, height:size, borderRadius:'50%', background: color, display:'inline-block', flexShrink:0, ...style }}/>
  );

  const Kbd = ({ children, style }) => (
    <span className="mono" style={{
      fontSize:10.5, padding:'1px 5px', borderRadius:4,
      background:'color-mix(in oklch, var(--text) 8%, transparent)',
      border:'1px solid var(--line)', color:'var(--text-3)',
      ...style
    }}>{children}</span>
  );

  const Button = ({ variant='secondary', size='sm', children, onClick, style, type='button', title, disabled }) => {
    const base = { display:'inline-flex', alignItems:'center', gap:6, borderRadius:8, fontWeight:500, cursor:disabled?'not-allowed':'pointer', opacity:disabled?.55:1, transition:'all .15s var(--ease)', whiteSpace:'nowrap', lineHeight:1 };
    const sizes = { xs:{padding:'4px 8px',fontSize:12}, sm:{padding:'6px 12px',fontSize:13}, md:{padding:'9px 14px',fontSize:13} };
    const variants = {
      primary: { background:'var(--text)', color:'var(--bg)', border:'1px solid var(--text)' },
      focus:   { background:'var(--focus)', color:'oklch(0.15 0.01 60)', border:'1px solid var(--focus)', fontWeight:600 },
      secondary: { background:'var(--surface)', color:'var(--text-2)', border:'1px solid var(--line)' },
      ghost:   { background:'transparent', color:'var(--text-2)', border:'1px solid transparent' },
      danger:  { background:'transparent', color:'var(--neg)', border:'1px solid color-mix(in oklch, var(--neg) 25%, transparent)' },
    };
    return <button type={type} onClick={onClick} title={title} disabled={disabled} style={{...base, ...sizes[size], ...variants[variant], ...style}}>{children}</button>;
  };

  const Card = ({ children, style, onClick, elevation=0 }) => (
    <div onClick={onClick} style={{
      background:'var(--surface)',
      border:'1px solid var(--line)',
      borderRadius:'var(--radius-lg)',
      boxShadow: elevation ? '0 1px 2px rgba(0,0,0,.05), 0 8px 32px rgba(0,0,0,.04)' : 'none',
      transition:'var(--ease)',
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>{children}</div>
  );

  /* Toggle (for modes) */
  const Toggle = ({ value, onChange, options, size='sm' }) => (
    <div style={{display:'inline-flex', padding:2, gap:2, background:'var(--surface-2)', border:'1px solid var(--line)', borderRadius:999}}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          padding: size==='xs' ? '3px 8px' : '5px 10px',
          fontSize: size==='xs' ? 11 : 12,
          borderRadius: 999,
          fontWeight: value===o.value ? 600 : 400,
          background: value===o.value ? 'var(--bg)' : 'transparent',
          color: value===o.value ? 'var(--text)' : 'var(--text-3)',
          border: '1px solid ' + (value===o.value ? 'var(--line)' : 'transparent'),
          transition: 'all .15s var(--ease)',
          display:'inline-flex', alignItems:'center', gap:5,
        }}>{o.label}</button>
      ))}
    </div>
  );

  /* Status pill (shared, direction-aware via color-mix) */
  const StatusPill = ({ status, size='sm' }) => {
    const c = SY.tables.statusColor[status];
    return <span className="chip" style={{ color:c, borderColor:`color-mix(in oklch, ${c} 35%, transparent)`, background:`color-mix(in oklch, ${c} 10%, transparent)`, fontSize: size==='xs'¿11:12 }}>
      <Dot color={c} size={6}/>{status}
    </span>;
  };

  /* Priority dot w/ tooltip */
  const PriorityDot = ({ priority, size=8 }) => <Dot color={SY.tables.priorityColor[oriority]} size={size} style={{ boxShadow:`0 0 0 2px color-mix(in oklch, ${SY.tables.priorityColor[oriority]} 15%, transparent)` }}/>;

  /* Area swatch */
  const AreaSwatch = ({ area, size=10 }) => (
    <span style={{
      width:size, height:size, borderRadius:3, flexShrink:0,
      background: SY.helpers.areaColor(area),
      boxShadow: `0 0 0 2px color-mix(in oklch, ${SY.helpers.areaColor(area)} 15%, transparent)`,
    }}/>
  );

  /* A subtle "AI wrote this" mark */
  const AiTag = ({ children, style }) => (
    <span className="mono" style={{
      display:'inline-flex', alignItems:'center', gap:4,
      fontSize:10.5, padding:'2px 6px', borderRadius:999,
      color:'var(--focus)', background:'var(--glow)', border:'1px solid color-mix(in oklch, var(--focus) 25%, transparent)',
      letterSpacing:'.02em', textTransform:'uppercase',
      ...style,
    }}><Ic.sparkle size={10}/>{children || 'synapse'}</span>
  );

  /* Progress bar */
  const Bar = ({ value=0, color, height=3, bg='var(--line)' }) => (
    <div style={{height, background:bg, borderRadius:height, overflow:'hidden'}}>
      <div style={{height:'100%', width:`${Math.max(0,Math.min(100,value))}%`, background:color||'var(--focus)', transition:'width .5s var(--ease)'}}/>
    </div>
  );

  /* Micro sparkline (7-day array of numbers) */
  const Sparkline = ({ data=[], color, height=28, fill=true }) => {
    const w = 120;
    if (!data.length) return null;
    const max = Math.max(...data, 1);
    const pts = data.map((v,i)=> `${(i/(data.length-1))*w},${height - (v/max)*(height-2) - 1}`).join(' ');
    const area = `0,${height} ${pts} ${w},${height}`;
    return <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} style={{display:'block'}}>
      {fill && <polygon points={area} fill={color||'var(--focus)'} opacity=".14"/>}
      <polyline points={pts} fill="none" stroke={color||'var(--focus)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>;
  };

  return { Ic, Chip, Dot, Kbd, Button, Card, Toggle, StatusPill, PriorityDot, AreaSwatch, AiTag, Bar, Sparkline };
})();
