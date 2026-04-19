/* ========================================================
   CORTEX — Quotes module
   Shared between the dashboard widget and the daily briefing.
   Persists user-added quotes in localStorage.
   ======================================================== */
window.Quotes = (function () {
  const { useState, useEffect, useMemo } = React;
  const { Ic, Button, Card, AiTag } = UI;

  const STORAGE = 'cortex-quotes-v1';

  // Original seed quotes — drawn from classical/public-domain sources.
  const SEED = [
    { id: 'q_seed_1', text: "How we spend our days is how we spend our lives.", who: "Annie Dillard",     tags: ['time','attention'],    source: 'seed' },
    { id: 'q_seed_2', text: "You have power over your mind, not outside events. Realize this, and you will find strength.", who: "Marcus Aurelius",  tags: ['stoic','focus'],        source: 'seed' },
    { id: 'q_seed_3', text: "It is not that we have a short time to live, but that we waste a lot of it.",                   who: "Seneca",            tags: ['time'],                 source: 'seed' },
    { id: 'q_seed_4', text: "The obstacle is the way.",                                                                      who: "Marcus Aurelius",   tags: ['stoic','resilience'],   source: 'seed' },
    { id: 'q_seed_5', text: "Well begun is half done.",                                                                      who: "Aristotle",         tags: ['start','craft'],        source: 'seed' },
    { id: 'q_seed_6', text: "We do not rise to the level of our goals. We fall to the level of our systems.",                who: "James Clear",       tags: ['habits','systems'],     source: 'clear' },
    { id: 'q_seed_7', text: "You do not decide your future. You decide your habits, and your habits decide your future.",    who: "James Clear",       tags: ['habits'],               source: 'clear' },
  ];

  function load() {
    try {
      const s = localStorage.getItem(STORAGE);
      if (s) return JSON.parse(s);
    } catch (e) {}
    return SEED;
  }
  function save(qs) {
    try { localStorage.setItem(STORAGE, JSON.stringify(qs)); } catch (e) {}
  }

  // Hook — any component can use this to stay in sync via storage events.
  function useQuotes() {
    const [qs, setQs] = useState(load);
    useEffect(() => {
      const onStorage = (e) => { if (e.key === STORAGE) setQs(load()); };
      window.addEventListener('storage', onStorage);
      window.addEventListener('cortex-quotes-updated', () => setQs(load()));
      return () => {
        window.removeEventListener('storage', onStorage);
      };
    }, []);
    const mutate = (updater) => {
      const next = typeof updater === 'function' ? updater(qs) : updater;
      save(next);
      setQs(next);
      window.dispatchEvent(new Event('cortex-quotes-updated'));
    };
    return [qs, mutate];
  }

  // Deterministic "quote of the day" — same index for all day-views.
  function quoteOfTheDay(qs) {
    if (!qs.length) return null;
    const d = new Date();
    const seed = d.getFullYear() * 1000 + d.getMonth() * 50 + d.getDate();
    return qs[seed % qs.length];
  }

  /* ----------- Compact card for the Briefing (one quote) ----------- */
  function BriefingQuote() {
    const [qs] = useQuotes();
    const q = useMemo(() => quoteOfTheDay(qs), [qs]);
    if (!q) return null;
    return (
      <div style={{
        padding:'18px 22px', borderRadius:'var(--radius-lg)',
        border:'1px solid var(--line)',
        background: 'linear-gradient(135deg, color-mix(in oklch, var(--focus) 6%, var(--surface)), var(--surface))',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{
          position:'absolute', top:-18, left:14, fontSize:96, lineHeight:1, fontWeight:700,
          color:'color-mix(in oklch, var(--focus) 22%, transparent)',
          fontFamily:'Georgia, serif', pointerEvents:'none', userSelect:'none',
        }}>&ldquo;</div>
        <div style={{position:'relative'}}>
          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
            <AiTag>quote for today</AiTag>
            {q.source === 'clear' && <span className="mono" style={{fontSize:10.5, color:'var(--text-4)'}}>via james clear</span>}
          </div>
          <div className="display" style={{fontSize:17, lineHeight:1.55, color:'var(--text)', marginBottom:8, textWrap:'pretty', fontStyle:'italic', fontWeight:500, paddingLeft:20}}>
            {q.text}
          </div>
          <div style={{fontSize:12, color:'var(--text-3)', paddingLeft:20}} className="mono">— {q.who}</div>
        </div>
      </div>
    );
  }

  /* ----------- Full widget for the dashboard ----------- */
  function Widget() {
    const [qs, setQs] = useQuotes();
    const [adding, setAdding] = useState(false);
    const [text, setText] = useState('');
    const [who, setWho] = useState('');
    const [idx, setIdx] = useState(() => {
      // start at quote of the day
      return qs.length ? qs.findIndex(x => x.id === quoteOfTheDay(qs)?.id) : 0;
    });
    const cur = qs[idx] || qs[0];

    const add = () => {
      if (!text.trim()) return;
      const nq = { id: 'q_' + Date.now(), text: text.trim(), who: who.trim() || 'Unknown', tags: [], source: 'user' };
      setQs([nq, ...qs]);
      setText(''); setWho(''); setAdding(false); setIdx(0);
    };
    const remove = (id) => {
      const newQs = qs.filter(x => x.id !== id);
      setQs(newQs);
      setIdx(i => Math.min(i, newQs.length - 1));
    };

    if (!cur) return null;

    return (
      <Card style={{padding:0, overflow:'hidden'}}>
        <div style={{
          padding:'14px 18px 12px', borderBottom:'1px solid var(--line)',
          display:'flex', alignItems:'center', gap:8,
        }}>
          <span style={{color:'var(--focus)', display:'flex'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 7h4v6c0 2.2-1.8 4-4 4"/>
              <path d="M15 7h4v6c0 2.2-1.8 4-4 4"/>
            </svg>
          </span>
          <span style={{fontSize:13, fontWeight:600}} className="display">Quotes to remember</span>
          <span className="mono" style={{fontSize:11, color:'var(--text-4)', marginLeft:6}}>{qs.length}</span>
          <div style={{marginLeft:'auto', display:'flex', gap:4}}>
            <button onClick={() => setIdx(i => (i - 1 + qs.length) % qs.length)}
              style={{width:26, height:26, borderRadius:6, background:'var(--surface-2)', color:'var(--text-3)', display:'flex', alignItems:'center', justifyContent:'center'}}><Ic.chev dir="left" size={12}/></button>
            <button onClick={() => setIdx(i => (i + 1) % qs.length)}
              style={{width:26, height:26, borderRadius:6, background:'var(--surface-2)', color:'var(--text-3)', display:'flex', alignItems:'center', justifyContent:'center'}}><Ic.chev dir="right" size={12}/></button>
            <button onClick={() => setAdding(a => !a)} title="Add quote"
              style={{width:26, height:26, borderRadius:6, background: adding ? 'var(--surface-2)' : 'var(--focus)', color: adding ? 'var(--text-3)' : 'oklch(0.15 0.01 60)', display:'flex', alignItems:'center', justifyContent:'center'}}>
              {adding ? <Ic.close size={12}/> : <Ic.plus size={12}/>}
            </button>
          </div>
        </div>

        {adding ? (
          <div style={{padding:'16px 18px'}}>
            <textarea autoFocus value={text} onChange={e => setText(e.target.value)}
              placeholder="Paste or write the quote…"
              style={{width:'100%', minHeight:70, padding:'10px 12px', fontSize:13.5, lineHeight:1.5,
                background:'var(--surface-2)', border:'1px solid var(--line)', borderRadius:8,
                color:'var(--text)', resize:'vertical', marginBottom:8, fontFamily:'var(--font-ui)'}}/>
            <input value={who} onChange={e => setWho(e.target.value)} placeholder="Who said it?"
              style={{width:'100%', padding:'8px 12px', fontSize:13,
                background:'var(--surface-2)', border:'1px solid var(--line)', borderRadius:8, color:'var(--text)', marginBottom:10}}/>
            <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
              <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setText(''); setWho(''); }}>Cancel</Button>
              <Button variant="focus" size="sm" onClick={add} disabled={!text.trim()}>Save</Button>
            </div>
          </div>
        ) : (
          <div style={{padding:'18px 22px', minHeight:140, display:'flex', flexDirection:'column', justifyContent:'center', position:'relative'}}>
            <div style={{
              position:'absolute', top:4, left:14, fontSize:72, lineHeight:1, fontWeight:700,
              color:'color-mix(in oklch, var(--focus) 18%, transparent)',
              fontFamily:'Georgia, serif', pointerEvents:'none', userSelect:'none',
            }}>&ldquo;</div>
            <div className="display" style={{
              fontSize:15.5, lineHeight:1.6, color:'var(--text)',
              fontStyle:'italic', fontWeight:500,
              paddingLeft:24, textWrap:'pretty', marginBottom:10,
            }}>{cur.text}</div>
            <div style={{display:'flex', alignItems:'center', gap:8, paddingLeft:24}}>
              <span className="mono" style={{fontSize:12, color:'var(--text-3)'}}>— {cur.who}</span>
              {cur.source === 'clear' && <span className="mono" style={{fontSize:10.5, color:'var(--text-4)', padding:'1px 6px', border:'1px solid var(--line)', borderRadius:999}}>james clear</span>}
              {cur.source === 'user' && (
                <button onClick={() => remove(cur.id)} title="Remove"
                  style={{marginLeft:'auto', color:'var(--text-4)', fontSize:11, padding:'2px 6px'}}>
                  remove
                </button>
              )}
            </div>
            <div style={{display:'flex', justifyContent:'center', gap:4, marginTop:14}}>
              {qs.slice(0, 9).map((_, i) => (
                <button key={i} onClick={() => setIdx(i)} style={{
                  width: i === idx ? 16 : 5, height: 5, borderRadius:999,
                  background: i === idx ? 'var(--focus)' : 'var(--line-strong)',
                  transition:'width .25s var(--ease)',
                }}/>
              ))}
              {qs.length > 9 && <span className="mono" style={{fontSize:10, color:'var(--text-4)', marginLeft:4}}>+{qs.length - 9}</span>}
            </div>
          </div>
        )}
      </Card>
    );
  }

  return { useQuotes, quoteOfTheDay, Widget, BriefingQuote };
})();
