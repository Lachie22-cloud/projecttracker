/* ========================================================
   SYNAPSE — seed data + helpers (globals)
   ======================================================== */
window.SY = window.SY || {};

(function () {
  const NOW = Date.now();
  const hoursAgo = (h) => new Date(NOW - h * 3600e3).toISOString();
  const daysAgo = (d) => new Date(NOW - d * 86400e3).toISOString();
  const dayStr = (d) => new Date(NOW + d * 86400e3).toISOString().slice(0, 10);

  const areas = [
    { id: 'a_work',    name: 'Work',      hue: 235, icon: '◐' },
    { id: 'a_home',    name: 'Home',      hue: 62,  icon: '◑' },
    { id: 'a_health',  name: 'Health',    hue: 160, icon: '◒' },
    { id: 'a_learn',   name: 'Learning',  hue: 305, icon: '◓' },
    { id: 'a_ideas',   name: 'Ideas',     hue: 25,  icon: '●' },
  ];

  const projects = [
    { id: 'p1', name: 'Q2 planning deck',           areaId: 'a_work',   status: 'In Progress',  priority: 'High',     due: dayStr(5),  touchedAt: hoursAgo(3),  createdAt: daysAgo(14), notes: 'Board review April 30. Need financial narrative + org health.' },
    { id: 'p2', name: 'Kitchen renovation',          areaId: 'a_home',   status: 'In Progress',  priority: 'Medium',   due: dayStr(28), touchedAt: daysAgo(2),   createdAt: daysAgo(45), notes: 'Tiles ordered. Waiting on plumber quote.' },
    { id: 'p3', name: 'Marathon training block',     areaId: 'a_health', status: 'In Progress',  priority: 'High',     due: dayStr(62), touchedAt: hoursAgo(18), createdAt: daysAgo(21), notes: 'Week 4 of 12. Long run Sunday.' },
    { id: 'p4', name: 'Reading: Thinking in Systems',areaId: 'a_learn',  status: 'On Hold',      priority: 'Low',      due: null,       touchedAt: daysAgo(18),  createdAt: daysAgo(60), notes: 'Chapter 4. Pick back up.' },
    { id: 'p5', name: 'Personal site rewrite',       areaId: 'a_ideas',  status: 'Not Started',  priority: 'Low',      due: null,       touchedAt: daysAgo(4),   createdAt: daysAgo(9),  notes: '' },
    { id: 'p6', name: 'Team offsite in Lisbon',      areaId: 'a_work',   status: 'Not Started',  priority: 'Medium',   due: dayStr(40), touchedAt: daysAgo(6),   createdAt: daysAgo(8),  notes: '' },
    { id: 'p7', name: 'Hiring: senior designer',     areaId: 'a_work',   status: 'In Progress',  priority: 'Critical', due: dayStr(10), touchedAt: hoursAgo(30), createdAt: daysAgo(26), notes: '3 candidates in final round.' },
  ];

  const tasks = [
    // today / overdue
    { id: 't1',  name: 'Finalise Q2 narrative for board',     projectId: 'p1', areaId: 'a_work',   status: 'In Progress', priority: 'Critical', effort: 'L',  due: dayStr(0),  touchedAt: hoursAgo(2),  createdAt: daysAgo(4),  aiConfidence: 0.92 },
    { id: 't2',  name: 'Reply to Sofia about contract',        projectId: null, areaId: 'a_work',   status: 'Not Started', priority: 'High',     effort: 'S',  due: dayStr(0),  touchedAt: hoursAgo(22), createdAt: hoursAgo(22), aiConfidence: 0.88 },
    { id: 't3',  name: 'Long run — 18km easy',                 projectId: 'p3', areaId: 'a_health', status: 'Not Started', priority: 'High',     effort: 'M',  due: dayStr(0),  touchedAt: hoursAgo(20), createdAt: daysAgo(2),  aiConfidence: 0.95 },
    { id: 't4',  name: 'Pick up dry cleaning',                 projectId: null, areaId: 'a_home',   status: 'Not Started', priority: 'Low',      effort: 'S',  due: dayStr(0),  touchedAt: hoursAgo(19), createdAt: daysAgo(1) },
    { id: 't5',  name: 'Approve design review for roadmap',    projectId: 'p1', areaId: 'a_work',   status: 'Not Started', priority: 'High',     effort: 'S',  due: dayStr(-1), touchedAt: hoursAgo(48), createdAt: daysAgo(3) },

    // this week
    { id: 't6',  name: 'Tile supplier call',                   projectId: 'p2', areaId: 'a_home',   status: 'Not Started', priority: 'Medium',   effort: 'S',  due: dayStr(1),  touchedAt: daysAgo(2),   createdAt: daysAgo(4) },
    { id: 't7',  name: 'Reference check: L.K.',                projectId: 'p7', areaId: 'a_work',   status: 'In Progress', priority: 'High',     effort: 'M',  due: dayStr(2),  touchedAt: hoursAgo(5),  createdAt: daysAgo(3) },
    { id: 't8',  name: 'Outline blog: second-brain setup',     projectId: 'p5', areaId: 'a_ideas',  status: 'Not Started', priority: 'Low',      effort: 'M',  due: dayStr(3),  touchedAt: daysAgo(2),   createdAt: daysAgo(4) },
    { id: 't9',  name: 'Interview round — designer #3',        projectId: 'p7', areaId: 'a_work',   status: 'Not Started', priority: 'Critical', effort: 'M',  due: dayStr(3),  touchedAt: hoursAgo(30), createdAt: daysAgo(5) },
    { id: 't10', name: 'Weekly meal prep — Sunday',            projectId: null, areaId: 'a_health', status: 'Not Started', priority: 'Medium',   effort: 'M',  due: dayStr(6),  touchedAt: daysAgo(7),   createdAt: daysAgo(7),  recurrence: 'weekly' },

    // later
    { id: 't11', name: 'Draft board deck outline',             projectId: 'p1', areaId: 'a_work',   status: 'In Progress', priority: 'High',     effort: 'L',  due: dayStr(4),  touchedAt: hoursAgo(3),  createdAt: daysAgo(6) },
    { id: 't12', name: 'Book flights to Lisbon',               projectId: 'p6', areaId: 'a_work',   status: 'Not Started', priority: 'Medium',   effort: 'S',  due: dayStr(12), touchedAt: daysAgo(6),   createdAt: daysAgo(6) },
    { id: 't13', name: 'Chapter 4 — Thinking in Systems',      projectId: 'p4', areaId: 'a_learn',  status: 'On Hold',     priority: 'Low',      effort: 'M',  due: null,       touchedAt: daysAgo(18),  createdAt: daysAgo(20) },
    { id: 't14', name: 'Revisit plumber quotes',               projectId: 'p2', areaId: 'a_home',   status: 'Not Started', priority: 'Medium',   effort: 'S',  due: dayStr(8),  touchedAt: daysAgo(5),   createdAt: daysAgo(10) },
    { id: 't15', name: 'Research: note-taking systems',        projectId: null, areaId: 'a_learn',  status: 'Not Started', priority: 'Low',      effort: 'M',  due: null,       touchedAt: daysAgo(12),  createdAt: daysAgo(12) },

    // completed
    { id: 't16', name: 'Send agenda for Monday standup',       projectId: 'p1', areaId: 'a_work',   status: 'Complete',    priority: 'Medium',   effort: 'S',  due: dayStr(-2), touchedAt: daysAgo(2),   createdAt: daysAgo(4) },
    { id: 't17', name: '10k tempo run',                        projectId: 'p3', areaId: 'a_health', status: 'Complete',    priority: 'High',     effort: 'M',  due: dayStr(-3), touchedAt: daysAgo(3),   createdAt: daysAgo(5) },
    { id: 't18', name: 'Pay quarterly tax',                    projectId: null, areaId: 'a_home',   status: 'Complete',    priority: 'Critical', effort: 'S',  due: dayStr(-4), touchedAt: daysAgo(4),   createdAt: daysAgo(8) },
    { id: 't19', name: 'Lisbon offsite — build shortlist',     projectId: 'p6', areaId: 'a_work',   status: 'Complete',    priority: 'Medium',   effort: 'M',  due: dayStr(-5), touchedAt: daysAgo(5),   createdAt: daysAgo(8) },

    // forgotten
    { id: 't20', name: 'Email mentor re: 1:1',                 projectId: null, areaId: 'a_learn',  status: 'Not Started', priority: 'Medium',   effort: 'S',  due: null,       touchedAt: daysAgo(14),  createdAt: daysAgo(14) },
    { id: 't21', name: 'Renew runner\u2019s club membership',  projectId: 'p3', areaId: 'a_health', status: 'Not Started', priority: 'Low',      effort: 'S',  due: null,       touchedAt: daysAgo(22),  createdAt: daysAgo(22) },
  ];

  const notes = [
    { id: 'n1', rawText: 'Board deck: focus on (1) Q1 delivery vs plan, (2) hiring thesis — do we front-load senior? (3) risk register changes. Add appendix on infra costs.', createdAt: hoursAgo(2), extractedIds: ['t1','t11'], areaIds: ['a_work'], source: 'capture' },
    { id: 'n2', rawText: 'Really need to stop context-switching between coding and writing on the same day. Block mornings for deep work. Try two-week experiment.', createdAt: hoursAgo(27), extractedIds: [], areaIds: ['a_learn','a_work'], source: 'capture' },
    { id: 'n3', rawText: 'Kitchen: talk to Marco about backsplash — matte finish not gloss. Order extra 10% tiles for breakage.', createdAt: daysAgo(2), extractedIds: ['t6'], areaIds: ['a_home'], source: 'capture' },
    { id: 'n4', rawText: 'Idea: second-brain writeup as a public blog series. Start with the capture loop — it\u2019s the hardest to get right.', createdAt: daysAgo(4), extractedIds: ['t8'], areaIds: ['a_ideas','a_learn'], source: 'capture' },
    { id: 'n5', rawText: 'Marathon: long-run strategy — start at 5:20 pace, settle to 5:00 by km 8. Gel at km 6, 12.', createdAt: daysAgo(6), extractedIds: [], areaIds: ['a_health'], source: 'capture' },
    { id: 'n6', rawText: 'Feedback from P.: hiring process feels slow. Consider parallelising reference checks with final round.', createdAt: daysAgo(7), extractedIds: ['t7'], areaIds: ['a_work'], source: 'capture' },
    { id: 'n7', rawText: 'Re-read Meadows chapter on feedback loops. Systems always push back.', createdAt: daysAgo(11), extractedIds: [], areaIds: ['a_learn'], source: 'capture' },
  ];

  const proposals = [
    { id: 'pr1', suggestedName: 'Writing practice', areaId: 'a_ideas', confidence: 0.82, themeSummary: 'Four notes in the last two weeks mention blogging, essays, or public writing. Looks like an emerging commitment — should we give it a home?', status: 'pending', createdAt: hoursAgo(8), evidence: ['n4','n7','n2'] },
    { id: 'pr2', suggestedName: 'Deep-work routine', areaId: 'a_learn', confidence: 0.68, themeSummary: 'Recurring mentions of focus blocks, context-switching, and morning deep work. Possibly a project, possibly a habit.', status: 'pending', createdAt: daysAgo(1), evidence: ['n2'] },
  ];

  SY.seed = { areas, projects, tasks, notes, proposals };

  SY.helpers = {
    dayStr,
    daysSince: (ts) => !ts ? 999 : Math.floor((Date.now() - new Date(ts).getTime()) / 86400e3),
    fmtDate: (iso) => { if (!iso) return ''; const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); },
    fmtTime: (iso) => { if (!iso) return ''; return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); },
    todayStr: () => new Date().toISOString().slice(0, 10),
    isForgotten: (t, n=10) => t.status !== 'Complete' && (SY.helpers.daysSince(t.touchedAt || t.createdAt) > n),
    areaColor: (area, l=0.72, c=0.12) => `oklch(${l} ${c} ${area?.hue ?? 250})`,
    // relative time: "2h ago", "yesterday"
    rel: (iso) => {
      if (!iso) return '';
      const ms = Date.now() - new Date(iso).getTime();
      const m = Math.round(ms / 60000);
      if (m < 1) return 'just now';
      if (m < 60) return `${m}m ago`;
      const h = Math.round(m / 60);
      if (h < 24) return `${h}h ago`;
      const d = Math.round(h / 24);
      if (d === 1) return 'yesterday';
      if (d < 7) return `${d}d ago`;
      const w = Math.round(d / 7);
      if (w < 5) return `${w}w ago`;
      return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    },
  };

  // Status/priority/effort tables
  SY.tables = {
    STATUSES: ['Not Started','In Progress','On Hold','Complete'],
    statusColor: {
      'Not Started': 'var(--text-3)',
      'In Progress': 'var(--info)',
      'On Hold':     'var(--warn)',
      'Complete':    'var(--pos)',
    },
    PRIORITIES: ['Critical','High','Medium','Low'],
    priorityColor: {
      Critical: 'var(--neg)',
      High:     'var(--warn)',
      Medium:   'var(--info)',
      Low:      'var(--text-3)',
    },
    EFFORTS: ['S','M','L','XL'],
  };
})();
