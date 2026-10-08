/* ================================================================
   0. UTILITIES
   ================================================================ */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const pad = n => String(n).padStart(2, '0');
const isoOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => isoOf(new Date());
const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (isoStr, n) => { const d = parseISO(isoStr); d.setDate(d.getDate() + n); return isoOf(d); };
const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DOW_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function fmtLong(isoStr) {
  const d = parseISO(isoStr);
  return `${DOW_FULL[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtShort(isoStr) {
  const d = parseISO(isoStr);
  const t = todayISO();
  if (isoStr === t) return 'Today';
  if (isoStr === addDays(t, 1)) return 'Tomorrow';
  if (isoStr === addDays(t, -1)) return 'Yesterday';
  return `${DOW[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}
function fmtTime(hhmm) {
  if (!hhmm) return '';
  let [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${pad(m)} ${ap}`;
}
function nowHM() { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function minutesOf(hhmm) { if (!hhmm) return 0; const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; }
function humanMinutes(mins) {
  if (!mins) return '0m';
  const h = Math.floor(mins / 60), m = mins % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

function toast(msg, ms = 2200) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), ms);
}

/* ================================================================
   1. CONSTANTS
   ================================================================ */
const CATEGORIES = {
  study:      { label: 'Study',      icon: '📚', color: '#6c8cff' },
  coding:     { label: 'Coding',     icon: '💻', color: '#06b6d4' },
  assignment: { label: 'Assignment', icon: '📝', color: '#f59e0b' },
  college:    { label: 'College',    icon: '🎓', color: '#8b5cf6' },
  health:     { label: 'Health',     icon: '🏃', color: '#22c55e' },
  personal:   { label: 'Personal',   icon: '👤', color: '#ec4899' },
  career:     { label: 'Career',     icon: '💼', color: '#14b8a6' },
};
const PRIORITIES = { high: '🔴 High', medium: '🟡 Medium', low: '🟢 Low' };

/* ================================================================
   2. STATE
   ================================================================ */
const STORAGE_KEY = 'studymate.v1';

function defaultState() {
  return {
    user: { name: '', email: '', course: '', year: '', mainGoal: '', avatar: '🎓', onboarded: false },
    tasks: [], routines: [], goals: [], reminders: [],
    subjects: [], sessions: [], notes: [],
    routineLog: {},
    activity: {},
    fired: {},
    achievements: [],
    settings: {
      theme: 'dark',
      notify: false,
      sound: true,
      dayStart: '06:00',
      dayEnd: '23:00',
      weekStart: 1,
    },
  };
}

let S = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return Object.assign(defaultState(), JSON.parse(raw));
  } catch { return defaultState(); }
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); }
  catch (e) { console.warn('Save failed', e); }
}

const ui = {
  taskFilter: 'today',
  taskSearch: '',
  taskSort: 'date',
  taskQuickFilter: '',
  bulkMode: false,
  selectedTasks: [],
  calMonth: new Date().getMonth(),
  calYear: new Date().getFullYear(),
  calSelected: todayISO(),
  noteQuery: '',
  expandedSubjects: {},
  goalExpanded: {},
};

/* ================================================================
   3. SAMPLE DATA
   ================================================================ */
function seedSampleData() {
  const t = todayISO();
  S.tasks = [
    { id: uid(), title: 'DAA — Dijkstra Algorithm', desc: 'Revise + solve 3 problems', date: t, time: '14:00', priority: 'high',   category: 'study',      repeat: 'none', remind: '15', done: false, goalId: '', subjectId: '', pinned: false, createdAt: Date.now() },
    { id: uid(), title: 'HTML Practice',            desc: 'Build a landing page',     date: t, time: '16:00', priority: 'medium', category: 'coding',     repeat: 'none', remind: '15', done: false, goalId: '', subjectId: '', pinned: false, createdAt: Date.now() },
    { id: uid(), title: 'CN Revision — Unit 3',     desc: 'Transport layer notes',    date: t, time: '19:00', priority: 'high',   category: 'study',      repeat: 'none', remind: '15', done: false, goalId: '', subjectId: '', pinned: false, createdAt: Date.now() },
    { id: uid(), title: 'Submit DAA Assignment',    desc: 'Upload on portal',         date: t, time: '21:00', priority: 'high',   category: 'assignment', repeat: 'none', remind: '30', done: false, goalId: '', subjectId: '', pinned: false, createdAt: Date.now() },
  ];
  S.routines = [
    { id: uid(), title: 'Wake Up',   start: '06:30', end: '06:45', icon: '🌅', category: 'personal', days: [0,1,2,3,4,5,6] },
    { id: uid(), title: 'Breakfast', start: '08:00', end: '08:30', icon: '🍳', category: 'personal', days: [0,1,2,3,4,5,6] },
    { id: uid(), title: 'College',   start: '09:00', end: '13:00', icon: '🎓', category: 'college',  days: [1,2,3,4,5] },
    { id: uid(), title: 'Study',     start: '14:00', end: '16:00', icon: '📚', category: 'study',    days: [0,1,2,3,4,5,6] },
    { id: uid(), title: 'Sleep',     start: '23:00', end: '23:30', icon: '😴', category: 'personal', days: [0,1,2,3,4,5,6] },
  ];
  S.goals = [
    {
      id: uid(), title: 'Learn Java', desc: 'Java from basics to project',
      deadline: `${new Date().getFullYear()}-12-30`, dailyTarget: 45, color: '#6c8cff',
      milestones: [
        { id: uid(), title: 'Java Basics', done: false },
        { id: uid(), title: 'OOP',         done: false },
        { id: uid(), title: 'Collections', done: false },
        { id: uid(), title: 'Project',     done: false },
      ],
    },
  ];
  S.reminders = [
    { id: uid(), title: 'Start Coding', time: '16:00', date: t, repeat: 'daily', days: [], enabled: true },
  ];
  S.subjects = [
    {
      id: uid(), name: 'DAA', color: '#6c8cff',
      units: [
        { id: uid(), name: 'Unit 1 — Foundations', topics: [
          { id: uid(), name: 'Asymptotic Notation', done: false },
          { id: uid(), name: 'Recurrence Relations', done: false },
        ]},
      ],
    },
  ];
  S.notes = [
    { id: uid(), title: 'Welcome to StudyMate!', content: 'Yeh sample data hai.\nAap apne tasks, goals aur notes add kar sakte ho.', pinned: true, tags: [], createdAt: Date.now() },
  ];
  save();
}

/* ================================================================
   4. DERIVED / HELPERS
   ================================================================ */
const getTask     = id => S.tasks.find(t => t.id === id);
const getRoutine  = id => S.routines.find(r => r.id === id);
const getGoal     = id => S.goals.find(g => g.id === id);
const getReminder = id => S.reminders.find(r => r.id === id);
const getSubject  = id => S.subjects.find(s => s.id === id);
const getNote     = id => S.notes.find(n => n.id === id);

function goalProgress(goal) {
  if (!goal.milestones?.length) return goal.progress || 0;
  const done = goal.milestones.filter(m => m.done).length;
  return Math.round((done / goal.milestones.length) * 100);
}
function subjectProgress(subject) {
  let total = 0, done = 0;
  subject.units.forEach(u => u.topics.forEach(t => { total++; if (t.done) done++; }));
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}
function tasksOn(dateISO) { return S.tasks.filter(t => t.date === dateISO); }
function studyMinutesOn(dateISO) {
  return S.sessions.filter(s => s.date === dateISO).reduce((a, s) => a + s.minutes, 0);
}
function routineForDay(dateISO) {
  const dow = parseISO(dateISO).getDay();
  return S.routines
    .filter(r => !r.days || r.days.length === 0 || r.days.includes(dow))
    .sort((a, b) => a.start.localeCompare(b.start));
}
function isRoutineDone(id, dateISO) { return !!S.routineLog[`${id}:${dateISO}`]; }
function routineTimeStatus(r, dateISO) {
  if (!r.start || !r.end) return { status: 'upcoming', progress: 0 };
  
  const today = todayISO();
  const nowM = minutesOf(nowHM());
  const startM = minutesOf(r.start);
  const endM = minutesOf(r.end);
  const done = isRoutineDone(r.id, dateISO);
  
  if (done) return { status: 'done', progress: 100 };
  
  if (dateISO < today) return { status: 'missed', progress: 0 };
  if (dateISO > today) return { status: 'upcoming', progress: 0 };
  
  if (nowM < startM) return { status: 'upcoming', progress: 0 };
  if (nowM >= endM) return { status: 'missed', progress: 0 };
  
  const duration = endM - startM;
  const elapsed = nowM - startM;
  const progress = Math.round((elapsed / duration) * 100);
  const remaining = endM - nowM;
  
  return { status: 'running', progress, remaining };
}

function markActivity(dateISO = todayISO()) {
  S.activity[dateISO] = true;
  checkAchievements();
}
function computeStreak() {
  let cur = 0;
  let d = todayISO();
  if (!S.activity[d]) d = addDays(d, -1);
  while (S.activity[d]) { cur++; d = addDays(d, -1); }
  let best = 0, run = 0;
  const keys = Object.keys(S.activity).sort();
  let prev = null;
  for (const k of keys) {
    if (prev && daysBetween(prev, k) === 1) run++; else run = 1;
    best = Math.max(best, run);
    prev = k;
  }
  return { current: cur, best: Math.max(best, cur) };
}

const ACHIEVEMENTS = [
  { id: 'first_day',   icon: '🌱', title: 'First Day',            desc: 'Complete your first day',        test: () => Object.keys(S.activity).length >= 1 },
  { id: 'streak_7',    icon: '🔥', title: '7 Day Streak',         desc: 'Stay consistent for 7 days',     test: () => computeStreak().best >= 7 },
  { id: 'streak_30',   icon: '🔥', title: '30 Day Streak',        desc: 'Stay consistent for 30 days',    test: () => computeStreak().best >= 30 },
  { id: 'tasks_10',    icon: '✅', title: '10 Tasks Completed',   desc: 'Finish 10 tasks',                test: () => S.tasks.filter(t => t.done).length >= 10 },
  { id: 'tasks_100',   icon: '💯', title: '100 Tasks Completed',  desc: 'Finish 100 tasks',               test: () => S.tasks.filter(t => t.done).length >= 100 },
  { id: 'study_10h',   icon: '📚', title: '10 Hours Studied',     desc: 'Log 600 minutes of focus',       test: () => S.sessions.reduce((a, s) => a + s.minutes, 0) >= 600 },
  { id: 'goal_done',   icon: '🎯', title: 'First Goal Completed', desc: 'Reach 100% on any goal',         test: () => S.goals.some(g => goalProgress(g) === 100) },
  { id: 'focus_1',     icon: '⏱️', title: 'First Focus Session',  desc: 'Complete a Pomodoro session',    test: () => S.sessions.length > 0 },
];
function checkAchievements() {
  let unlocked = false;
  ACHIEVEMENTS.forEach(a => {
    if (!S.achievements.includes(a.id) && a.test()) {
      S.achievements.push(a.id);
      unlocked = true;
      toast(`🏆 Achievement unlocked: ${a.title}`);
    }
  });
  if (unlocked) save();
}

/* ================================================================
   5. MODAL SYSTEM
   ================================================================ */
let modalSubmitHandler = null;

function openModal({ title, body, submit = 'Save', onSubmit, hideSubmit = false, wide = false }) {
  const root = $('#modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" data-close-backdrop>
      <div class="modal" style="${wide ? 'max-width:620px' : ''}">
        <div class="modal-head">
          <h3>${esc(title)}</h3>
          <button class="icon-btn" data-close-modal>✕</button>
        </div>
        <form id="modal-form" novalidate>
          <div class="modal-body">${body}</div>
          ${hideSubmit ? '' : `
          <div class="modal-foot">
            <button type="button" class="btn ghost" data-close-modal>Cancel</button>
            <button type="submit" class="btn primary">${esc(submit)}</button>
          </div>`}
        </form>
      </div>
    </div>`;
  root.classList.add('open');

  const form = $('#modal-form');
  modalSubmitHandler = fd => {
    const ok = onSubmit(fd, form);
    if (ok !== false) closeModal();
  };
  form.addEventListener('submit', e => {
    e.preventDefault();
    modalSubmitHandler?.(new FormData(form));
  });

  setTimeout(() => form.querySelector('input,textarea,select')?.focus(), 120);
}
function closeModal() {
  const root = $('#modal-root');
  root.classList.remove('open');
  setTimeout(() => { if (!root.classList.contains('open')) root.innerHTML = ''; }, 250);
}

function opts(list, selected, labels = {}) {
  return list.map(v =>
    `<option value="${esc(v)}" ${String(selected) === String(v) ? 'selected' : ''}>${esc(labels[v] || v)}</option>`
  ).join('');
}

/* ================================================================
   6. AUTH SCREEN
   ================================================================ */
function renderAuth() {
  $('#auth').innerHTML = `
    <div class="auth-card">
      <div class="auth-logo">🎓</div>
      <div class="auth-title">StudyMate</div>
      <div class="auth-sub">Your daily planner, goal tracker &amp; reminder app</div>
      <form id="auth-form">
        <label>Your name
          <input name="name" required placeholder="e.g. Sourabh" autocomplete="name">
        </label>
        <label>Email
          <input name="email" type="email" placeholder="you@example.com" autocomplete="email">
        </label>
        <div class="row">
          <label>Course
            <input name="course" placeholder="B.Tech">
          </label>
          <label>Year
            <select name="year">
              ${opts(['1st Year','2nd Year','3rd Year','4th Year','Postgraduate','Other'], '3rd Year')}
            </select>
          </label>
        </div>
        <label>Main goal
          <input name="mainGoal" placeholder="e.g. Internship Preparation">
        </label>
        <button class="btn primary block" type="submit" style="margin-top:6px">Get Started →</button>
        <p class="xs muted" style="text-align:center;margin-top:12px">
          Aapka data empty se shuru hoga. Jaise aap tasks add karenge waise progress badhega.
        </p>
      </form>
    </div>`;

  $('#auth-form').addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    S = defaultState();
    S.user = {
      name: fd.get('name') || 'Student',
      email: fd.get('email') || '',
      course: fd.get('course') || '',
      year: fd.get('year') || '',
      mainGoal: fd.get('mainGoal') || '',
      avatar: '🎓',
      onboarded: true,
    };
    save();
    bootApp();
  });
}

/* ================================================================
   7. ROUTER
   ================================================================ */
const ROUTES = {
  home:         renderHome,
  tasks:        renderTasks,
  routine:      renderRoutine,
  goals:        renderGoals,
  reminders:    renderReminders,
  subjects:     renderSubjects,
  focus:        renderFocus,
  calendar:     renderCalendar,
  notes:        renderNotes,
  progress:     renderProgress,
  achievements: renderAchievements,
  profile:      renderProfile,
  settings:     renderSettings,
};

function currentRoute() {
  const h = location.hash.replace('#/', '').trim();
  return ROUTES[h] ? h : 'home';
}
function navigate(route) {
  location.hash = '#/' + route;
}
function render() {
  const route = currentRoute();
  const view = $('#view');
  view.innerHTML = ROUTES[route]();
  view.scrollTop = 0;
  window.scrollTo(0, 0);

  $$('#bottomnav a').forEach(a =>
    a.classList.toggle('active', a.dataset.nav === route));

  afterRender(route);
}

function afterRender(route) {
  if (route === 'focus') mountTimer();
  updateDrawerHeader();
}

/* ================================================================
   8. VIEW — DASHBOARD
   ================================================================ */
function renderHome() {
  const t = todayISO();
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const name = S.user.name || 'Student';

  const dayTasks = tasksOn(t);
  const overdue  = S.tasks.filter(x => !x.done && x.date < t);
  const allToday = [...dayTasks, ...overdue];

  const routines = routineForDay(t);
  const rDone = routines.filter(r => isRoutineDone(r.id, t)).length;
  const tDone = dayTasks.filter(x => x.done).length;

  const totalUnits = dayTasks.length + routines.length;
  const doneUnits  = tDone + rDone;
  const pct = totalUnits ? Math.round((doneUnits / totalUnits) * 100) : 0;

  const studyMins = studyMinutesOn(t);
  const streak = computeStreak();

  const nowM = minutesOf(nowHM());
  const upcoming = [];
  routines.forEach(r => {
    if (minutesOf(r.start) >= nowM) upcoming.push({ time: r.start, label: r.title, icon: r.icon || '📌' });
  });
  S.reminders.filter(rm => rm.enabled && rm.date === t).forEach(rm => {
    if (minutesOf(rm.time) >= nowM) upcoming.push({ time: rm.time, label: rm.title, icon: '🔔' });
  });
  dayTasks.filter(x => !x.done && x.time).forEach(x => {
    if (minutesOf(x.time) >= nowM) upcoming.push({ time: x.time, label: x.title, icon: '✅' });
  });
  upcoming.sort((a, b) => a.time.localeCompare(b.time));

  const activeGoal = S.goals.find(g => g.dailyTarget) || S.goals[0];
  const goalMinsToday = studyMins;
  const isNewUser = S.tasks.length === 0 && S.goals.length === 0 && S.routines.length === 0;

  return `
    <div class="hero">
      <div class="hero-top">
        <div class="ring" style="--p:${pct}">
          <div class="inner">${pct}%</div>
        </div>
        <div style="min-width:0">
          <div class="greet">${greet}, ${esc(name)} 👋</div>
          <div class="date-line">📅 ${fmtLong(t)}</div>
        </div>
      </div>
      <div style="margin-top:14px">
        <div class="bar"><i style="width:${pct}%"></i></div>
        <div class="xs muted" style="margin-top:7px">
          ${doneUnits} of ${totalUnits} items completed today
        </div>
      </div>
    </div>

    ${isNewUser ? `
    <div class="card" style="text-align:center;padding:24px;border-color:rgba(108,140,255,.4);background:rgba(108,140,255,.08)">
      <div style="font-size:42px">🎉</div>
      <div style="font-size:17px;font-weight:800;margin-top:8px">Welcome to StudyMate!</div>
      <div class="xs muted" style="margin-top:6px">Aapka app bilkul fresh hai. Chaliye pehla task add karte hain.</div>
      <button class="btn primary" data-action="add-task" style="margin-top:14px">＋ Add First Task</button>
    </div>` : ''}

    <div class="stat-grid">
      <div class="stat">
        <div class="v">${humanMinutes(studyMins)}</div>
        <div class="l">📚 Studied today</div>
      </div>
      <div class="stat">
        <div class="v">🔥 ${streak.current} day${streak.current === 1 ? '' : 's'}</div>
        <div class="l">Current streak</div>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div class="card-title">📚 Today's Tasks</div>
        <button class="btn sm" data-action="add-task">+ Add</button>
      </div>
      ${allToday.length ? `<div class="tlist">
        ${allToday.slice(0, 8).map(taskRowHTML).join('')}
      </div>` : `<div class="empty"><span class="big">📭</span>No tasks for today.<br>Tap "+ Add" to create one.</div>`}
    </div>

    <div class="card">
      <div class="card-head">
        <div class="card-title">⏰ Upcoming</div>
        <button class="btn sm" data-nav="routine">Routine</button>
      </div>
      ${upcoming.length ? upcoming.slice(0, 5).map(u => `
        <div class="up-item">
          <div class="up-time">${fmtTime(u.time)}</div>
          <div class="up-line"></div>
          <div class="up-body">${u.icon} ${esc(u.label)}</div>
        </div>
      `).join('') : `<div class="empty">Nothing scheduled today</div>`}
    </div>

    ${activeGoal ? `
    <div class="card">
      <div class="card-head">
        <div class="card-title">🎯 ${esc(activeGoal.title)}</div>
        <span class="xs muted">${goalProgress(activeGoal)}%</span>
      </div>
      <div class="bar"><i style="width:${goalProgress(activeGoal)}%"></i></div>
      <div class="xs muted" style="margin-top:9px">
        Daily target: <b style="color:var(--text)">${humanMinutes(activeGoal.dailyTarget || 0)}</b>
        · Logged today: <b style="color:var(--text)">${humanMinutes(goalMinsToday)}</b>
      </div>
    </div>` : ''}

    <div class="card">
      <div class="card-head">
        <div class="card-title">🔔 Reminders</div>
        <button class="btn sm" data-nav="reminders">View all</button>
      </div>
      ${S.reminders.filter(r => r.enabled).length
        ? S.reminders.filter(r => r.enabled).slice(0, 4).map(r => `
          <div class="up-item">
            <div class="up-time">${fmtTime(r.time)}</div>
            <div class="up-line"></div>
            <div class="up-body">${esc(r.title)}
              <span class="xs muted"> · ${r.repeat}</span>
            </div>
          </div>`).join('')
        : `<div class="empty">No reminders yet</div>`}
    </div>
  `;
}

function taskRowHTML(task) {
  const cat = CATEGORIES[task.category] || CATEGORIES.study;
  const isSelected = ui.selectedTasks.includes(task.id);
  const inBulk = ui.bulkMode;

  return `
    <div class="trow ${task.done ? 'done' : ''}" ${inBulk ? `data-action="bulk-toggle" data-id="${task.id}"` : ''}>
      ${inBulk ? `
        <button class="check ${isSelected ? 'on' : ''}" style="border-radius:50%">
          ${isSelected ? '✓' : ''}
        </button>
      ` : `
        <button class="check ${task.done ? 'on' : ''}" data-action="toggle-task" data-id="${task.id}">
          ${task.done ? '✓' : ''}
        </button>
      `}
      <div class="t-main" ${!inBulk ? `data-action="edit-task" data-id="${task.id}"` : ''}>
        <div class="t-title">
          ${task.pinned ? '📌 ' : ''}${esc(task.title)}
        </div>
        <div class="t-sub">
          <span class="dot p-${task.priority}"></span>
          <span>${cat.icon} ${cat.label}</span>
          ${task.time ? `<span>· ${fmtTime(task.time)}</span>` : ''}
          ${task.date !== todayISO() ? `<span>· ${fmtShort(task.date)}</span>` : ''}
        </div>
      </div>
      ${!inBulk ? `
        <button
          data-action="pin-task"
          data-id="${task.id}"
          style="width:30px;height:30px;border-radius:50%;background:${task.pinned ? 'var(--accent)' : 'transparent'};border:1px solid ${task.pinned ? 'var(--accent)' : 'transparent'};font-size:13px;display:grid;place-items:center"
        >${task.pinned ? '📍' : '📌'}</button>
      ` : ''}
    </div>`;
}

/* ================================================================
   9. VIEW — TASKS
   ================================================================ */
function renderTasks() {
  const t = todayISO();
  const f = ui.taskFilter;

  let list;
  if (f === 'today')         list = S.tasks.filter(x => x.date === t);
  else if (f === 'upcoming') list = S.tasks.filter(x => x.date > t);
  else if (f === 'overdue')  list = S.tasks.filter(x => !x.done && x.date < t);
  else if (f === 'done')     list = S.tasks.filter(x => x.done);
  else                       list = [...S.tasks];

  if (ui.taskQuickFilter === 'pinned') {
    list = list.filter(x => x.pinned);
  } else if (ui.taskQuickFilter === 'high') {
    list = list.filter(x => x.priority === 'high' && !x.done);
  }

  const q = (ui.taskSearch || '').toLowerCase().trim();
  if (q) {
    list = list.filter(x =>
      x.title.toLowerCase().includes(q) ||
      (x.desc || '').toLowerCase().includes(q)
    );
  }

  if (ui.taskSort === 'priority') {
    const pOrder = { high: 0, medium: 1, low: 2 };
    list.sort((a, b) => (pOrder[a.priority] ?? 9) - (pOrder[b.priority] ?? 9));
  } else if (ui.taskSort === 'title') {
    list.sort((a, b) => a.title.localeCompare(b.title));
  } else if (ui.taskSort === 'created') {
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } else {
    list.sort((a, b) => (a.date + (a.time || '99:99')).localeCompare(b.date + (b.time || '99:99')));
  }

  list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const groups = {};
  list.forEach(x => { (groups[x.date] ||= []).push(x); });

  const bulkHeader = ui.bulkMode ? `
    <div class="card" style="background:linear-gradient(135deg,var(--accent),var(--accent2));border-color:transparent;margin-bottom:12px;position:sticky;top:0;z-index:10">
      <div style="display:flex;align-items:center;gap:8px;color:#fff;flex-wrap:wrap">
        <div style="flex:1;font-weight:800;min-width:80px">
          ${ui.selectedTasks.length} selected
        </div>
        <button class="btn sm" data-action="bulk-complete" style="background:#fff;color:var(--accent);border-color:transparent">✓ Complete</button>
        <button class="btn sm" data-action="bulk-delete" style="background:#fff;color:#ef4444;border-color:transparent">🗑️ Delete</button>
        <button class="btn sm" data-action="bulk-cancel" style="background:rgba(255,255,255,.2);color:#fff;border-color:transparent">✕</button>
      </div>
    </div>
  ` : '';

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div class="section-title" style="margin:0">📋 Tasks</div>
      ${!ui.bulkMode && list.length > 0 ? `
        <button class="btn sm" data-action="bulk-enter">☑️ Select</button>
      ` : ''}
    </div>

    ${bulkHeader}

    <div style="position:relative;margin-bottom:14px">
      <input
        id="taskSearch"
        placeholder="🔍 Search tasks..."
        value="${esc(ui.taskSearch)}"
        data-action="task-search"
      />
      ${ui.taskSearch ? `
        <button
          data-action="task-clear-search"
          style="position:absolute;right:8px;top:50%;transform:translateY(-50%);width:28px;height:28px;border-radius:50%;background:var(--card2);border:1px solid var(--line);font-size:12px;display:grid;place-items:center"
        >✕</button>
      ` : ''}
    </div>

    <div class="chips">
      ${[['today','Today'],['upcoming','Upcoming'],['overdue','Overdue'],['done','Done'],['all','All']]
        .map(([k, l]) => `<button class="chip ${f === k ? 'active' : ''}" data-action="task-filter" data-filter="${k}">${l}</button>`)
        .join('')}
    </div>

    <div style="display:flex;gap:8px;margin-bottom:14px;overflow-x:auto;scrollbar-width:none">
      <select
        data-action="task-sort"
        style="flex:0 0 auto;width:auto;margin:0;padding:9px 12px;font-size:12.5px;font-weight:700;border-radius:10px;background:var(--card);border:1px solid var(--line);color:var(--text)"
      >
        <option value="date"     ${ui.taskSort === 'date'     ? 'selected' : ''}>📅 Date</option>
        <option value="priority" ${ui.taskSort === 'priority' ? 'selected' : ''}>🔴 Priority</option>
        <option value="title"    ${ui.taskSort === 'title'    ? 'selected' : ''}>🔤 Title</option>
        <option value="created"  ${ui.taskSort === 'created'  ? 'selected' : ''}>🆕 Newest</option>
      </select>

      <button class="chip ${ui.taskQuickFilter === 'high' ? 'active' : ''}" data-action="task-quick-filter" data-qf="high" style="flex:0 0 auto">🔴 High Priority</button>
      <button class="chip ${ui.taskQuickFilter === 'pinned' ? 'active' : ''}" data-action="task-quick-filter" data-qf="pinned" style="flex:0 0 auto">📌 Pinned</button>
      ${ui.taskQuickFilter ? `<button class="chip" data-action="task-clear-quick" style="flex:0 0 auto">✕ Clear</button>` : ''}
    </div>

    <button class="btn primary block" data-action="add-task" style="margin-bottom:16px">＋ New Task</button>

    ${list.length ? Object.keys(groups).sort().map(date => `
      <div class="xs muted" style="font-weight:800;letter-spacing:.6px;margin:16px 0 8px;text-transform:uppercase">
        ${fmtShort(date)}
      </div>
      <div class="tlist">${groups[date].map(taskRowHTML).join('')}</div>
    `).join('') : `
      <div class="empty">
        <span class="big">${q ? '🔍' : '📭'}</span>
        ${q ? `No tasks match "${esc(ui.taskSearch)}"` : 'No tasks here yet.'}
      </div>
    `}
  `;
}

/* ================================================================
   10. VIEW — ROUTINE
   ================================================================ */
function renderRoutine() {
  const t = todayISO();
  const list = routineForDay(t);
  const doneCount = list.filter(r => isRoutineDone(r.id, t)).length;
  const pct = list.length ? Math.round((doneCount / list.length) * 100) : 0;

  // Weekly mini chart
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(t, -i);
    const dayRoutines = routineForDay(d);
    const dayDone = dayRoutines.filter(r => isRoutineDone(r.id, d)).length;
    const dayPct = dayRoutines.length ? Math.round((dayDone / dayRoutines.length) * 100) : 0;
    week.push({ date: d, pct: dayPct });
  }

  return `
    <div class="section-title">📅 Daily Routine</div>

    <!-- Weekly mini chart -->
    <div class="card">
      <div class="card-head">
        <div class="card-title">This Week</div>
        <span class="xs muted">Last 7 days</span>
      </div>
      <div style="display:flex;gap:6px;align-items:flex-end;height:60px;padding-top:8px">
        ${week.map(w => `
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end">
            <div style="width:100%;border-radius:6px 6px 3px 3px;background:${w.pct > 70 ? 'var(--green)' : w.pct > 30 ? 'var(--amber)' : 'var(--card2)'};height:${Math.max(4, w.pct)}%;transition:.3s"></div>
            <div class="xs muted" style="font-weight:700">${DOW[parseISO(w.date).getDay()][0]}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Today's progress -->
    <div class="card">
      <div class="card-head">
        <div class="card-title">Today · ${fmtShort(t)}</div>
        <span class="xs muted">${doneCount}/${list.length} done</span>
      </div>
      <div class="bar"><i style="width:${pct}%"></i></div>
    </div>

    <button class="btn primary block" data-action="add-routine" style="margin-bottom:16px">＋ Add Routine Item</button>

    ${list.length ? list.map(r => {
      const cat = CATEGORIES[r.category] || CATEGORIES.personal;
      const { status, progress, remaining } = routineTimeStatus(r, t);
      
      // Style based on status
      const isRunning = status === 'running';
      const isDone = status === 'done';
      const isMissed = status === 'missed';
      
      const borderColor = isRunning ? 'var(--green)' : isDone ? 'var(--line)' : 'var(--line)';
      const bgStyle = isRunning 
        ? 'background:linear-gradient(90deg, rgba(34,197,94,.08), transparent);border-color:var(--green)'
        : isDone
          ? 'opacity:.55'
          : '';
      
      return `
        <div class="rt-item" style="${bgStyle};border:1px solid ${borderColor};position:relative;overflow:hidden">
          <!-- Category color bar -->
          <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:${cat.color || 'var(--accent)'}"></div>
          
          <button class="check ${isDone ? 'on' : ''}" data-action="toggle-routine" data-id="${r.id}" style="margin-left:6px">
            ${isDone ? '✓' : ''}
          </button>
          
          <div class="rt-time">
            ${fmtTime(r.start)}<br>
            <span class="xs">${fmtTime(r.end)}</span>
          </div>
          
          <div class="rt-ic">${r.icon || cat.icon}</div>
          
          <div style="flex:1;min-width:0" data-action="edit-routine" data-id="${r.id}">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <div style="font-size:14px;font-weight:700;${isDone ? 'text-decoration:line-through' : ''}">${esc(r.title)}</div>
              ${isRunning ? `
                <span style="font-size:9px;font-weight:800;background:var(--green);color:#fff;padding:2px 6px;border-radius:6px;letter-spacing:.4px">● NOW</span>
              ` : ''}
            </div>
            <div class="xs muted" style="margin-top:3px">
              ${cat.label} · ${isRunning && remaining ? `<b style="color:var(--green)">Ends in ${humanMinutes(remaining)}</b>` : isMissed && r.end && minutesOf(nowHM()) > minutesOf(r.end) ? `<span style="color:#ef4444">Missed</span>` : `${fmtTime(r.start)} – ${fmtTime(r.end)}`}
            </div>
            ${isRunning ? `
              <div class="bar" style="margin-top:6px;height:4px">
                <i style="width:${progress}%;background:var(--green)"></i>
              </div>
            ` : ''}
          </div>
        </div>`;
    }).join('') : `<div class="empty"><span class="big">🕐</span>No routine items for today.</div>`}
  `;
}
/* ================================================================
   11. VIEW — GOALS
   ================================================================ */
function renderGoals() {
  return `
    <div class="section-title">🎯 Goals</div>
    <button class="btn primary block" data-action="add-goal" style="margin-bottom:16px">＋ New Goal</button>

    ${S.goals.length ? S.goals.map(g => {
      const pct = goalProgress(g);
      const daysLeft = g.deadline ? daysBetween(todayISO(), g.deadline) : null;
      return `
        <div class="goal-card">
          <div class="goal-head">
            <div style="min-width:0">
              <div class="goal-title">🎯 ${esc(g.title)}</div>
              ${g.desc ? `<div class="xs muted" style="margin-top:4px">${esc(g.desc)}</div>` : ''}
              <div class="xs muted" style="margin-top:6px">
                ${g.deadline ? `📅 ${fmtShort(g.deadline)} ${daysLeft !== null ? `· ${daysLeft >= 0 ? daysLeft + ' days left' : Math.abs(daysLeft) + ' days overdue'}` : ''}` : ''}
                ${g.dailyTarget ? ` · ⏱️ ${humanMinutes(g.dailyTarget)}/day` : ''}
              </div>
            </div>
            <button class="icon-btn" data-action="edit-goal" data-id="${g.id}">✏️</button>
          </div>

          <div style="margin-top:13px">
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:800;margin-bottom:6px">
              <span class="muted">Progress</span><span>${pct}%</span>
            </div>
            <div class="bar"><i style="width:${pct}%"></i></div>
          </div>

          <div class="sep"></div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <div class="xs muted" style="font-weight:800;letter-spacing:.5px">MILESTONES</div>
            <button class="btn sm" data-action="add-milestone" data-id="${g.id}">+ Add</button>
          </div>

          ${(g.milestones || []).map(m => `
            <div class="ms-item ${m.done ? 'done' : ''}">
              <button class="check ${m.done ? 'on' : ''}" data-action="toggle-milestone" data-goal="${g.id}" data-ms="${m.id}">
                ${m.done ? '✓' : ''}
              </button>
              <span style="flex:1">${esc(m.title)}</span>
              <button class="xs muted" data-action="del-milestone" data-goal="${g.id}" data-ms="${m.id}">✕</button>
            </div>
          `).join('') || `<div class="xs muted" style="padding:6px 0">No milestones yet.</div>`}

          <div style="display:flex;gap:8px;margin-top:12px">
            <button class="btn sm" data-action="goal-focus" data-id="${g.id}">⏱️ Focus</button>
            <button class="btn sm danger" data-action="del-goal" data-id="${g.id}">Delete</button>
          </div>
        </div>`;
    }).join('') : `<div class="empty"><span class="big">🎯</span>No goals yet. Create your first one!</div>`}
  `;
}

/* ================================================================
   12. VIEW — REMINDERS
   ================================================================ */
function renderReminders() {
  const list = [...S.reminders].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return `
    <div class="section-title">🔔 Reminders</div>

    ${!S.settings.notify ? `
      <div class="card" style="border-color:rgba(245,158,11,.4);background:rgba(245,158,11,.08)">
        <div style="font-size:13.5px;font-weight:700">⚠️ Notifications are off</div>
        <div class="xs muted" style="margin:5px 0 11px">Enable them so StudyMate can alert you on time.</div>
        <button class="btn sm primary" data-action="enable-notify">Enable Notifications</button>
      </div>` : ''}

    <button class="btn primary block" data-action="add-reminder" style="margin-bottom:16px">＋ New Reminder</button>

    ${list.length ? list.map(r => `
      <div class="card" style="${r.enabled ? '' : 'opacity:.5'}">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="font-size:22px">🔔</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:14.5px;font-weight:750">${esc(r.title)}</div>
            <div class="xs muted" style="margin-top:4px">
              ${fmtTime(r.time)} · ${fmtShort(r.date)}
              · ${r.repeat === 'none' ? 'Once' : r.repeat === 'daily' ? 'Daily'
                  : r.repeat === 'weekdays' ? 'Weekdays'
                  : r.repeat === 'weekly' ? 'Weekly'
                  : 'Selected days'}
            </div>
          </div>
          <button class="icon-btn" data-action="toggle-reminder" data-id="${r.id}">
            ${r.enabled ? '🔔' : '🔕'}
          </button>
          <button class="icon-btn" data-action="edit-reminder" data-id="${r.id}">✏️</button>
        </div>
      </div>
    `).join('') : `<div class="empty"><span class="big">🔕</span>No reminders yet.</div>`}
  `;
}

/* ================================================================
   13. VIEW — SUBJECTS
   ================================================================ */
function renderSubjects() {
  return `
    <div class="section-title">📚 Subjects</div>
    <button class="btn primary block" data-action="add-subject" style="margin-bottom:16px">＋ Add Subject</button>

    ${S.subjects.length ? S.subjects.map(s => {
      const { total, done, pct } = subjectProgress(s);
      const open = !!ui.expandedSubjects[s.id];
      const mins = S.sessions.filter(x => x.subjectId === s.id).reduce((a, x) => a + x.minutes, 0);
      return `
        <div class="subj-card">
          <div class="subj-top">
            <div style="display:flex;align-items:center;gap:11px;min-width:0">
              <div style="width:38px;height:38px;border-radius:12px;background:${s.color || '#6c8cff'}22;display:grid;place-items:center;font-size:18px">📘</div>
              <div style="min-width:0">
                <div style="font-size:15px;font-weight:800">${esc(s.name)}</div>
                <div class="xs muted" style="margin-top:3px">${done}/${total} topics · ${humanMinutes(mins)} studied</div>
              </div>
            </div>
            <button class="icon-btn" data-action="toggle-subject" data-id="${s.id}">${open ? '▾' : '▸'}</button>
          </div>

          <div style="margin-top:12px">
            <div class="bar"><i style="width:${pct}%;background:${s.color || 'var(--accent)'}"></i></div>
          </div>

          ${open ? `
            <div class="sep"></div>
            ${s.units.map(u => `
              <div style="margin-bottom:12px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                  <div class="xs" style="font-weight:800;letter-spacing:.4px;color:var(--muted);text-transform:uppercase">${esc(u.name)}</div>
                  <button class="xs muted" data-action="del-unit" data-subject="${s.id}" data-unit="${u.id}">✕</button>
                </div>
                ${u.topics.map(tp => `
                  <div class="topic ${tp.done ? 'done' : ''}">
                    <button class="check ${tp.done ? 'on' : ''}"
                      data-action="toggle-topic" data-subject="${s.id}" data-unit="${u.id}" data-topic="${tp.id}">
                      ${tp.done ? '✓' : ''}
                    </button>
                    <span style="flex:1;${tp.done ? 'text-decoration:line-through;color:var(--muted)' : ''}">${esc(tp.name)}</span>
                    <button class="xs muted" data-action="del-topic" data-subject="${s.id}" data-unit="${u.id}" data-topic="${tp.id}">✕</button>
                  </div>
                `).join('')}
                <button class="btn sm" style="margin-top:7px" data-action="add-topic" data-subject="${s.id}" data-unit="${u.id}">+ Topic</button>
              </div>
            `).join('')}
            <div style="display:flex;gap:8px;margin-top:10px">
              <button class="btn sm" data-action="add-unit" data-id="${s.id}">+ Unit</button>
              <button class="btn sm" data-action="subject-focus" data-id="${s.id}">⏱️ Focus</button>
              <button class="btn sm danger" data-action="del-subject" data-id="${s.id}">Delete</button>
            </div>
          ` : ''}
        </div>`;
    }).join('') : `<div class="empty"><span class="big">📚</span>No subjects added yet.</div>`}
  `;
}

/* ================================================================
   14. VIEW — FOCUS TIMER
   ================================================================ */
const timer = {
  running: false,
  total: 25 * 60,
  remaining: 25 * 60,
  mode: 'focus',
  subjectId: '',
  topic: '',
  interval: null,
};

function fmtClock(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${pad(m)}:${pad(s)}`;
}

function renderFocus() {
  const subjects = S.subjects;
  return `
    <div class="section-title">⏱️ Focus Session</div>

    <div class="card" style="padding:22px 16px">
      <div class="timer-wrap">
        <div class="timer-ring" id="timerRing" style="--p:${timer.total ? ((timer.total - timer.remaining) / timer.total) * 100 : 0}">
          <div class="timer-inner">
            <div class="timer-time" id="timerTime">${fmtClock(timer.remaining)}</div>
            <div class="timer-mode" id="timerMode">${timer.mode === 'focus' ? 'Focus' : 'Break'}</div>
          </div>
        </div>
      </div>

      <div class="timer-ctrls">
        <button class="btn primary" data-action="timer-toggle" style="min-width:130px">
          ${timer.running ? '⏸ Pause' : '▶ Start'}
        </button>
        <button class="btn" data-action="timer-reset">↺ Reset</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title" style="margin-bottom:12px">⚙️ Session Settings</div>

      <label>Subject
        <select id="focusSubject" data-action="focus-subject">
          <option value="">— General Study —</option>
          ${subjects.map(s => `<option value="${s.id}" ${timer.subjectId === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}
        </select>
      </label>

      <label>Topic / What are you studying?
        <input id="focusTopic" value="${esc(timer.topic)}" placeholder="e.g. Dijkstra Algorithm">
      </label>

      <div style="font-size:12px;font-weight:750;color:var(--muted);margin-bottom:8px">PRESET</div>
      <div class="row-3">
        <button class="btn sm" data-action="timer-preset" data-min="25" data-break="5">25 / 5</button>
        <button class="btn sm" data-action="timer-preset" data-min="50" data-break="10">50 / 10</button>
        <button class="btn sm" data-action="timer-preset" data-min="15" data-break="3">15 / 3</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title" style="margin-bottom:10px">📈 Today's Sessions</div>
      ${(() => {
        const todays = S.sessions.filter(s => s.date === todayISO());
        if (!todays.length) return `<div class="xs muted">No sessions logged today yet.</div>`;
        return todays.map(s => `
          <div class="kv">
            <span class="k">${esc(s.topic || 'Study')}${s.subjectId ? ' · ' + esc(getSubject(s.subjectId)?.name || '') : ''}</span>
            <span class="v">${humanMinutes(s.minutes)}</span>
          </div>`).join('');
      })()}
    </div>
  `;
}

function mountTimer() { updateTimerUI(); }

function updateTimerUI() {
  const ring = $('#timerRing');
  const time = $('#timerTime');
  const mode = $('#timerMode');
  if (!ring) return;
  const p = timer.total ? ((timer.total - timer.remaining) / timer.total) * 100 : 0;
  ring.style.setProperty('--p', p);
  time.textContent = fmtClock(timer.remaining);
  mode.textContent = timer.mode === 'focus' ? 'Focus' : 'Break';
  const btn = $('[data-action="timer-toggle"]');
  if (btn) btn.innerHTML = timer.running ? '⏸ Pause' : '▶ Start';
}

function startTimer() {
  if (timer.running) return;
  timer.running = true;
  timer.interval = setInterval(() => {
    timer.remaining--;
    if (timer.remaining <= 0) {
      clearInterval(timer.interval);
      timer.running = false;
      timer.remaining = 0;
      updateTimerUI();
      completeTimer();
      return;
    }
    updateTimerUI();
  }, 1000);
  updateTimerUI();
}
function pauseTimer() {
  timer.running = false;
  clearInterval(timer.interval);
  updateTimerUI();
}
function resetTimer() {
  pauseTimer();
  timer.remaining = timer.total;
  updateTimerUI();
}
function completeTimer() {
  if (timer.mode === 'focus') {
    const mins = Math.round(timer.total / 60);
    S.sessions.push({
      id: uid(), subjectId: timer.subjectId, topic: timer.topic || 'Focus Session',
      minutes: mins, date: todayISO(),
    });
    markActivity();
    save();
    notify('✅ Focus session complete!', `${mins} minutes logged.`);
    toast(`✅ ${mins} min session logged`);
    timer.mode = 'break';
    timer.total = 5 * 60;
    timer.remaining = 5 * 60;
  } else {
    notify('☕ Break over', 'Time to get back to studying!');
    timer.mode = 'focus';
    timer.total = 25 * 60;
    timer.remaining = 25 * 60;
  }
  updateTimerUI();
  if (currentRoute() === 'focus') render();
}

/* ================================================================
   15. VIEW — CALENDAR
   ================================================================ */
function renderCalendar() {
  const y = ui.calYear, m = ui.calMonth;
  const first = new Date(y, m, 1);
  const startDow = first.getDay();
  const weekStart = S.settings.weekStart;
  const lead = (startDow - weekStart + 7) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const daysInPrev = new Date(y, m, 0).getDate();

  const cells = [];
  for (let i = lead - 1; i >= 0; i--) cells.push({ d: daysInPrev - i, out: true, date: isoOf(new Date(y, m - 1, daysInPrev - i)) });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ d, out: false, date: isoOf(new Date(y, m, d)) });
  while (cells.length % 7 !== 0) {
    const n = cells.length - (lead + daysInMonth) + 1;
    cells.push({ d: n, out: true, date: isoOf(new Date(y, m + 1, n)) });
  }

  const dowLabels = weekStart === 1 ? ['MON','TUE','WED','THU','FRI','SAT','SUN'] : ['SUN','MON','TUE','WED','THU','FRI','SAT'];

  const sel = ui.calSelected;
  const selTasks = tasksOn(sel);
  const selRem = S.reminders.filter(r => r.date === sel);
  const selRoutine = routineForDay(sel);

  return `
    <div class="section-title">🗓️ Calendar</div>

    <div class="card">
      <div class="cal-head">
        <button class="icon-btn" data-action="cal-prev">‹</button>
        <div style="font-weight:800;font-size:16px">${MONTHS[m]} ${y}</div>
        <button class="icon-btn" data-action="cal-next">›</button>
      </div>

      <div class="cal-grid">
        ${dowLabels.map(d => `<div class="cal-dow">${d}</div>`).join('')}
        ${cells.map(c => {
          const hasTask = S.tasks.some(t => t.date === c.date);
          const hasRem  = S.reminders.some(r => r.date === c.date && r.enabled);
          const hasGoal = S.goals.some(g => g.deadline === c.date);
          return `
            <button class="cal-day ${c.out ? 'out' : ''} ${c.date === todayISO() ? 'today' : ''} ${c.date === sel ? 'sel' : ''}"
              data-action="cal-select" data-date="${c.date}">
              <span>${c.d}</span>
              <span class="cal-dots">
                ${hasTask ? `<i style="background:${c.date === sel ? '#fff' : 'var(--accent)'}"></i>` : ''}
                ${hasRem  ? `<i style="background:${c.date === sel ? '#fff' : 'var(--amber)'}"></i>` : ''}
                ${hasGoal ? `<i style="background:${c.date === sel ? '#fff' : 'var(--green)'}"></i>` : ''}
              </span>
            </button>`;
        }).join('')}
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div class="card-title">${fmtShort(sel)} · ${parseISO(sel).getDate()} ${MONTHS[parseISO(sel).getMonth()]}</div>
      </div>

      <div class="xs muted" style="font-weight:800;letter-spacing:.5px;margin-bottom:8px">📚 TASKS (${selTasks.length})</div>
      ${selTasks.length ? `<div class="tlist">${selTasks.map(taskRowHTML).join('')}</div>`
        : `<div class="xs muted" style="margin-bottom:12px">No tasks</div>`}

      <div class="sep"></div>

      <div class="xs muted" style="font-weight:800;letter-spacing:.5px;margin-bottom:8px">⏰ REMINDERS (${selRem.length})</div>
      ${selRem.length ? selRem.map(r => `
        <div class="up-item">
          <div class="up-time">${fmtTime(r.time)}</div>
          <div class="up-line"></div>
          <div class="up-body">${esc(r.title)}</div>
        </div>`).join('') : `<div class="xs muted" style="margin-bottom:12px">No reminders</div>`}

      <div class="sep"></div>

      <div class="xs muted" style="font-weight:800;letter-spacing:.5px;margin-bottom:8px">📅 ROUTINE (${selRoutine.length})</div>
      ${selRoutine.slice(0, 6).map(r => `
        <div class="up-item">
          <div class="up-time">${fmtTime(r.start)}</div>
          <div class="up-line"></div>
          <div class="up-body">${r.icon || '📌'} ${esc(r.title)}</div>
        </div>`).join('') || `<div class="xs muted">No routine items</div>`}
    </div>
  `;
}

/* ================================================================
   16. VIEW — NOTES
   ================================================================ */
function renderNotes() {
  const q = ui.noteQuery.toLowerCase();
  let list = [...S.notes];
  if (q) list = list.filter(n =>
    n.title.toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q));
  list.sort((a, b) => (b.pinned - a.pinned) || (b.createdAt - a.createdAt));

  return `
    <div class="section-title">📝 Notes</div>

    <input id="noteSearch" placeholder="🔍 Search notes..." value="${esc(ui.noteQuery)}"
      data-action="note-search" style="margin-bottom:14px">

    <button class="btn primary block" data-action="add-note" style="margin-bottom:16px">＋ New Note</button>

    ${list.length ? list.map(n => `
      <div class="note-card">
        <button class="pin ${n.pinned ? 'on' : ''}" data-action="pin-note" data-id="${n.id}">📌</button>
        <div class="note-title" data-action="edit-note" data-id="${n.id}">${esc(n.title)}</div>
        <div class="note-body">${esc((n.content || '').slice(0, 180))}${(n.content || '').length > 180 ? '…' : ''}</div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn sm" data-action="edit-note" data-id="${n.id}">Edit</button>
          <button class="btn sm danger" data-action="del-note" data-id="${n.id}">Delete</button>
        </div>
      </div>
    `).join('') : `<div class="empty"><span class="big">📝</span>No notes yet.</div>`}
  `;
}

/* ================================================================
   17. VIEW — PROGRESS
   ================================================================ */
function renderProgress() {
  const t = todayISO();

  const dayTasks = tasksOn(t);
  const taskPct = dayTasks.length ? Math.round((dayTasks.filter(x => x.done).length / dayTasks.length) * 100) : 0;

  const routines = routineForDay(t);
  const routinePct = routines.length ? Math.round((routines.filter(r => isRoutineDone(r.id, t)).length / routines.length) * 100) : 0;

  const studyTarget = S.goals.reduce((a, g) => a + (g.dailyTarget || 0), 0) || 240;
  const studyPct = clamp(Math.round((studyMinutesOn(t) / studyTarget) * 100), 0, 100);

  const goalPct = S.goals.length
    ? Math.round(S.goals.reduce((a, g) => a + goalProgress(g), 0) / S.goals.length) : 0;

  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(t, -i);
    const dt = tasksOn(d);
    const donePct = dt.length ? (dt.filter(x => x.done).length / dt.length) * 100 : 0;
    const studyScore = clamp(studyMinutesOn(d) / 4, 0, 100);
    const score = Math.round(dt.length ? (donePct * 0.6 + studyScore * 0.4) : studyScore);
    week.push({ date: d, score });
  }

  const doneTasks = S.tasks.filter(x => x.done).length;
  const missed = S.tasks.filter(x => !x.done && x.date < t).length;
  const totalStudy = S.sessions.reduce((a, s) => a + s.minutes, 0);
  const streak = computeStreak();
  const bestDay = week.reduce((a, b) => (b.score > a.score ? b : a), week[0]);

  const subjTime = {};
  S.sessions.forEach(s => {
    const key = s.subjectId ? (getSubject(s.subjectId)?.name || 'Other') : 'General';
    subjTime[key] = (subjTime[key] || 0) + s.minutes;
  });
  const subjRows = Object.entries(subjTime).sort((a, b) => b[1] - a[1]);

  return `
    <div class="section-title">📊 Progress</div>

    <div class="card">
      <div class="card-title" style="margin-bottom:14px">Today</div>
      ${progressRow('Tasks', taskPct)}
      ${progressRow('Study', studyPct)}
      ${progressRow('Goals', goalPct)}
      ${progressRow('Routine', routinePct)}
    </div>

    <div class="card">
      <div class="card-head">
        <div class="card-title">Weekly Report</div>
        <span class="xs muted">Last 7 days</span>
      </div>
      <div class="chart">
        ${week.map(w => `
          <div class="chart-col">
            <div class="chart-bar" style="height:${Math.max(4, w.score)}%"></div>
            <div class="chart-lab">${DOW[parseISO(w.date).getDay()][0]}</div>
          </div>
        `).join('')}
      </div>
      <div class="xs muted" style="margin-top:12px;text-align:center">
        Most productive day: <b style="color:var(--text)">${fmtShort(bestDay.date)}</b> (${bestDay.score}%)
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat"><div class="v">${doneTasks}</div><div class="l">✅ Tasks completed</div></div>
      <div class="stat"><div class="v">${missed}</div><div class="l">⚠️ Tasks overdue</div></div>
      <div class="stat"><div class="v">${humanMinutes(totalStudy)}</div><div class="l">📚 Total study time</div></div>
      <div class="stat"><div class="v">${S.goals.filter(g => goalProgress(g) === 100).length}</div><div class="l">🎯 Goals completed</div></div>
      <div class="stat"><div class="v">🔥 ${streak.current}</div><div class="l">Current streak</div></div>
      <div class="stat"><div class="v">🏅 ${streak.best}</div><div class="l">Best streak</div></div>
    </div>

    <div class="card">
      <div class="card-title" style="margin-bottom:12px">📚 Subject-wise Study Time</div>
      ${subjRows.length ? subjRows.map(([name, mins]) => `
        <div class="pbar-row">
          <div class="pbar-label" style="width:110px">${esc(name)}</div>
          <div class="bar" style="flex:1"><i style="width:${Math.round((mins / subjRows[0][1]) * 100)}%"></i></div>
          <div class="pbar-val" style="width:58px">${humanMinutes(mins)}</div>
        </div>
      `).join('') : `<div class="xs muted">No sessions logged yet.</div>`}
    </div>
  `;
}
function progressRow(label, pct) {
  return `
    <div class="pbar-row">
      <div class="pbar-label">${label}</div>
      <div class="bar" style="flex:1"><i style="width:${pct}%"></i></div>
      <div class="pbar-val">${pct}%</div>
    </div>`;
}

/* ================================================================
   18. VIEW — ACHIEVEMENTS
   ================================================================ */
function renderAchievements() {
  const streak = computeStreak();
  return `
    <div class="section-title">🏆 Achievements</div>

    <div class="card" style="text-align:center;padding:24px">
      <div style="font-size:42px">🔥</div>
      <div style="font-size:30px;font-weight:800;letter-spacing:-1px;margin-top:6px">${streak.current} Day Streak</div>
      <div class="xs muted" style="margin-top:5px">Best: ${streak.best} days</div>
      <div style="display:flex;gap:5px;justify-content:center;margin-top:16px;flex-wrap:wrap">
        ${Array.from({ length: 7 }, (_, i) => {
          const d = addDays(todayISO(), -(6 - i));
          const on = !!S.activity[d];
          return `<div style="text-align:center">
            <div style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center;
              background:${on ? 'var(--green)' : 'var(--card2)'};font-size:14px;color:#fff">
              ${on ? '✓' : ''}
            </div>
            <div class="xs muted" style="margin-top:4px">${DOW[parseISO(d).getDay()]}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="card">
      <div class="card-title" style="margin-bottom:14px">All Achievements</div>
      ${ACHIEVEMENTS.map(a => {
        const unlocked = S.achievements.includes(a.id);
        return `
          <div class="ach ${unlocked ? '' : 'locked'}">
            <div class="ach-ic">${a.icon}</div>
            <div>
              <div style="font-size:14px;font-weight:750">${a.title}</div>
              <div class="xs muted" style="margin-top:2px">${a.desc}</div>
            </div>
            <div style="margin-left:auto;font-size:16px">${unlocked ? '✅' : '🔒'}</div>
          </div>`;
      }).join('')}
    </div>
  `;
}

/* ================================================================
   19. VIEW — PROFILE
   ================================================================ */
function renderProfile() {
  const u = S.user;
  const streak = computeStreak();
  const totalStudy = S.sessions.reduce((a, s) => a + s.minutes, 0);

  return `
    <div class="section-title">👤 Profile</div>

    <div class="card" style="text-align:center;padding:26px">
      <div style="width:80px;height:80px;border-radius:26px;margin:0 auto;
        background:linear-gradient(135deg,var(--accent),var(--accent2));
        display:grid;place-items:center;font-size:38px">${u.avatar || '🎓'}</div>
      <div style="font-size:20px;font-weight:800;margin-top:14px">${esc(u.name || 'Student')}</div>
      <div class="xs muted" style="margin-top:4px">
        ${esc(u.course || 'Course not set')}${u.year ? ' · ' + esc(u.year) : ''}
      </div>
      ${u.email ? `<div class="xs muted" style="margin-top:3px">${esc(u.email)}</div>` : ''}
      <button class="btn sm" data-action="edit-profile" style="margin-top:16px">Edit Profile</button>
    </div>

    <div class="stat-grid">
      <div class="stat"><div class="v">${S.subjects.length}</div><div class="l">📚 Subjects</div></div>
      <div class="stat"><div class="v">🔥 ${streak.current}</div><div class="l">Day streak</div></div>
      <div class="stat"><div class="v">${S.goals.length}</div><div class="l">🎯 Goals</div></div>
      <div class="stat"><div class="v">${humanMinutes(totalStudy)}</div><div class="l">⏱️ Total study</div></div>
    </div>

    <div class="card">
      <div class="card-title" style="margin-bottom:10px">🎯 Main Goal</div>
      <div style="font-size:14.5px;font-weight:700">${esc(u.mainGoal || 'Not set')}</div>
    </div>

    <button class="btn block" data-nav="settings">⚙️ Settings</button>
  `;
}

/* ================================================================
   20. VIEW — SETTINGS
   ================================================================ */
function renderSettings() {
  const st = S.settings;
  return `
    <div class="section-title">⚙️ Settings</div>

    <div class="card">
      <div class="card-title" style="margin-bottom:10px">Appearance</div>
      <div class="kv">
        <span class="k">Theme</span>
        <button class="btn sm" data-action="toggle-theme">${st.theme === 'dark' ? '🌙 Dark' : '☀️ Light'}</button>
      </div>
      <div class="kv">
        <span class="k">Week starts on</span>
        <button class="btn sm" data-action="toggle-weekstart">${st.weekStart === 1 ? 'Monday' : 'Sunday'}</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title" style="margin-bottom:10px">Notifications</div>
      <div class="kv">
        <span class="k">Push notifications</span>
        <button class="btn sm ${st.notify ? '' : 'primary'}" data-action="enable-notify">
          ${st.notify ? 'Enabled ✓' : 'Enable'}
        </button>
      </div>
      <div class="kv">
        <span class="k">Test notification</span>
        <button class="btn sm" data-action="test-notify">Send test</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title" style="margin-bottom:10px">Day Boundaries</div>
      <div class="row">
        <label>Day starts
          <input type="time" value="${st.dayStart}" data-action="set-daystart">
        </label>
        <label>Day ends
          <input type="time" value="${st.dayEnd}" data-action="set-dayend">
        </label>
      </div>
    </div>

    <div class="card">
      <div class="card-title" style="margin-bottom:10px">Data</div>
      <button class="btn block primary" data-action="sync-backend" style="margin-bottom:9px">☁️ Sync with Cloud</button>
      <button class="btn block" data-action="export-data" style="margin-bottom:9px">⬇️ Export Data (JSON)</button>
      <button class="btn block" data-action="import-data" style="margin-bottom:9px">⬆️ Import Data</button>
      <button class="btn block" data-action="load-sample" style="margin-bottom:9px">🎲 Load Sample Data</button>
      <button class="btn block danger" data-action="reset-data">🗑️ Reset All Data</button>
      <input type="file" id="importFile" accept="application/json" class="hidden">
    </div>

    <div class="card" style="text-align:center">
      <div style="font-size:26px">🎓</div>
      <div style="font-weight:800;margin-top:6px">StudyMate</div>
      <div class="xs muted" style="margin-top:4px">Version 1.1 · Full Cloud Sync</div>
    </div>
  `;
}

/* ================================================================
   21. DRAWER HEADER
   ================================================================ */
function updateDrawerHeader() {
  $('#drawerAvatar').textContent = S.user.avatar || '🎓';
  $('#drawerName').textContent = S.user.name || 'Student';
  $('#drawerSub').textContent =
    [S.user.course, S.user.year].filter(Boolean).join(' · ') || 'Set up your profile';
  $('#topBrand').textContent = 'StudyMate';
}

/* ================================================================
   22. MODALS
   ================================================================ */
function taskModal(task) {
  const t = task || {
    title: '', desc: '', date: todayISO(), time: '', priority: 'medium',
    category: 'study', repeat: 'none', remind: '15', goalId: '', subjectId: '',
  };
  openModal({
    title: task ? 'Edit Task' : 'New Task',
    body: `
      <label>Title
        <input name="title" required value="${esc(t.title)}" placeholder="e.g. DAA — Dijkstra">
      </label>
      <label>Description
        <textarea name="desc" rows="2" placeholder="Optional details...">${esc(t.desc || '')}</textarea>
      </label>
      <div class="row">
        <label>Date<input type="date" name="date" value="${t.date}"></label>
        <label>Time<input type="time" name="time" value="${t.time || ''}"></label>
      </div>
      <div class="row">
        <label>Priority
          <select name="priority">${opts(['high','medium','low'], t.priority, PRIORITIES)}</select>
        </label>
        <label>Category
          <select name="category">
            ${Object.entries(CATEGORIES).map(([k, v]) =>
              `<option value="${k}" ${t.category === k ? 'selected' : ''}>${v.icon} ${v.label}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="row">
        <label>Repeat
          <select name="repeat">
            ${opts(['none','daily','weekdays','weekly'], t.repeat, {
              none:'Once', daily:'Daily', weekdays:'Weekdays', weekly:'Weekly'
            })}
          </select>
        </label>
        <label>Remind me
          <select name="remind">
            ${opts(['none','0','5','15','30','60'], t.remind, {
              none:'No reminder', '0':'At time', '5':'5 min before',
              '15':'15 min before', '30':'30 min before', '60':'1 hour before'
            })}
          </select>
        </label>
      </div>
      <label>Link to goal
        <select name="goalId">
          <option value="">— none —</option>
          ${S.goals.map(g => `<option value="${g.id}" ${t.goalId === g.id ? 'selected' : ''}>${esc(g.title)}</option>`).join('')}
        </select>
      </label>
    `,
    submit: task ? 'Save Changes' : 'Add Task',
    onSubmit(fd) {
      const data = {
        title: fd.get('title').trim(),
        desc: fd.get('desc').trim(),
        date: fd.get('date') || todayISO(),
        time: fd.get('time'),
        priority: fd.get('priority'),
        category: fd.get('category'),
        repeat: fd.get('repeat'),
        remind: fd.get('remind'),
        goalId: fd.get('goalId'),
      };
      if (!data.title) return false;

      if (task) {
        Object.assign(task, data);
      } else {
        S.tasks.push({
          id: uid(),
          done: false,
          pinned: false,
          subjectId: '',
          createdAt: Date.now(),
          ...data
        });
      }

      markActivity();
      save();
      render();
      toast(task ? 'Task updated' : 'Task added ✅');
    },
  });
}

function routineModal(item) {
  const r = item || {
    title: '', start: '08:00', end: '09:00', icon: '📌',
    category: 'personal', days: [0,1,2,3,4,5,6],
  };
  const dayLabels = ['S','M','T','W','T','F','S'];
  let selectedDays = [...(r.days || [0,1,2,3,4,5,6])];

  openModal({
    title: item ? 'Edit Routine' : 'New Routine Item',
    body: `
      <label>Title
        <input name="title" required value="${esc(r.title)}" placeholder="e.g. DAA Study">
      </label>
      <div class="row">
        <label>Start<input type="time" name="start" value="${r.start}"></label>
        <label>End<input type="time" name="end" value="${r.end}"></label>
      </div>
      <div class="row">
        <label>Icon
          <input name="icon" value="${esc(r.icon)}" maxlength="2" placeholder="📚">
        </label>
        <label>Category
          <select name="category">
            ${Object.entries(CATEGORIES).map(([k, v]) =>
              `<option value="${k}" ${r.category === k ? 'selected' : ''}>${v.icon} ${v.label}</option>`).join('')}
          </select>
        </label>
      </div>
      <div style="font-size:12px;font-weight:750;color:var(--muted);margin-bottom:2px">REPEAT ON</div>
      <div class="daypicker" id="daypicker">
        ${dayLabels.map((d, i) =>
          `<button type="button" data-day="${i}" class="${selectedDays.includes(i) ? 'on' : ''}">${d}</button>`).join('')}
      </div>
    `,
    submit: item ? 'Save Changes' : 'Add Routine',
    onSubmit(fd) {
      const data = {
        title: fd.get('title').trim(),
        start: fd.get('start'),
        end: fd.get('end'),
        icon: fd.get('icon') || '📌',
        category: fd.get('category'),
        days: selectedDays.length ? selectedDays : [0,1,2,3,4,5,6],
      };
      if (!data.title) return false;
      if (item) Object.assign(item, data);
      else S.routines.push({ id: uid(), ...data });
      save();
      render();
      toast(item ? 'Routine updated' : 'Routine added 📅');
    },
  });

  setTimeout(() => {
    const dp = $('#daypicker');
    if (!dp) return;
    dp.addEventListener('click', e => {
      const btn = e.target.closest('[data-day]');
      if (!btn) return;
      const d = Number(btn.dataset.day);
      if (selectedDays.includes(d)) selectedDays = selectedDays.filter(x => x !== d);
      else selectedDays.push(d);
      btn.classList.toggle('on');
    });
  }, 60);
}

function goalModal(goal) {
  const g = goal || { title: '', desc: '', deadline: '', dailyTarget: 30, color: '#6c8cff' };
  openModal({
    title: goal ? 'Edit Goal' : 'New Goal',
    body: `
      <label>Goal title
        <input name="title" required value="${esc(g.title)}" placeholder="e.g. Learn Java">
      </label>
      <label>Description
        <textarea name="desc" rows="2" placeholder="What does success look like?">${esc(g.desc || '')}</textarea>
      </label>
      <div class="row">
        <label>Deadline
          <input type="date" name="deadline" value="${g.deadline || ''}">
        </label>
        <label>Daily target (min)
          <input type="number" name="dailyTarget" min="0" step="5" value="${g.dailyTarget || 30}">
        </label>
      </div>
      <label>Color
        <select name="color">
          ${opts(['#6c8cff','#8b5cf6','#06b6d4','#22c55e','#f59e0b','#ec4899'], g.color, {
            '#6c8cff':'Blue','#8b5cf6':'Purple','#06b6d4':'Cyan',
            '#22c55e':'Green','#f59e0b':'Amber','#ec4899':'Pink'
          })}
        </select>
      </label>
    `,
    submit: goal ? 'Save Changes' : 'Create Goal',
    onSubmit(fd) {
      const data = {
        title: fd.get('title').trim(),
        desc: fd.get('desc').trim(),
        deadline: fd.get('deadline'),
        dailyTarget: Number(fd.get('dailyTarget')) || 0,
        color: fd.get('color'),
      };
      if (!data.title) return false;
      if (goal) Object.assign(goal, data);
      else S.goals.push({ id: uid(), milestones: [], progress: 0, ...data });
      save();
      render();
      toast(goal ? 'Goal updated' : 'Goal created 🎯');
    },
  });
}

function reminderModal(rem) {
  const r = rem || { title: '', time: '09:00', date: todayISO(), repeat: 'none', days: [], enabled: true };
  let selDays = [...(r.days || [])];
  const dayLabels = ['S','M','T','W','T','F','S'];

  openModal({
    title: rem ? 'Edit Reminder' : 'New Reminder',
    body: `
      <label>What should I remind you about?
        <input name="title" required value="${esc(r.title)}" placeholder="e.g. DAA Class">
      </label>
      <div class="row">
        <label>Time<input type="time" name="time" value="${r.time}"></label>
        <label>Date<input type="date" name="date" value="${r.date}"></label>
      </div>
      <label>Repeat
        <select name="repeat">
          ${opts(['none','daily','weekdays','weekly','custom'], r.repeat, {
            none:'Once', daily:'Every day', weekdays:'Weekdays (Mon–Fri)',
            weekly:'Weekly', custom:'Custom days'
          })}
        </select>
      </label>
      <div id="customDays" class="${r.repeat === 'custom' ? '' : 'hidden'}">
        <div style="font-size:12px;font-weight:750;color:var(--muted)">SELECT DAYS</div>
        <div class="daypicker" id="daypicker">
          ${dayLabels.map((d, i) =>
            `<button type="button" data-day="${i}" class="${selDays.includes(i) ? 'on' : ''}">${d}</button>`).join('')}
        </div>
      </div>
    `,
    submit: rem ? 'Save Changes' : 'Add Reminder',
    onSubmit(fd) {
      const repeat = fd.get('repeat');
      const data = {
        title: fd.get('title').trim(),
        time: fd.get('time'),
        date: fd.get('date') || todayISO(),
        repeat,
        days: repeat === 'custom' ? selDays
             : repeat === 'weekdays' ? [1,2,3,4,5]
             : repeat === 'weekly' ? [parseISO(fd.get('date')).getDay()]
             : [],
        enabled: rem ? rem.enabled : true,
      };
      if (!data.title || !data.time) {
        toast('Please enter a title and time.');
        return false;
      }
      if (rem) Object.assign(rem, data);
      else S.reminders.push({ id: uid(), ...data });
      save();
      render();
      toast(rem ? 'Reminder updated' : 'Reminder set 🔔');
    },
  });

  setTimeout(() => {
    const sel = $('#modal-form select[name="repeat"]');
    const box = $('#customDays');
    sel?.addEventListener('change', () => {
      box.classList.toggle('hidden', sel.value !== 'custom');
    });
    const dp = $('#daypicker');
    dp?.addEventListener('click', e => {
      const btn = e.target.closest('[data-day]');
      if (!btn) return;
      const d = Number(btn.dataset.day);
      if (selDays.includes(d)) selDays = selDays.filter(x => x !== d);
      else selDays.push(d);
      btn.classList.toggle('on');
    });
  }, 60);
}

function subjectModal() {
  const colors = ['#6c8cff','#8b5cf6','#06b6d4','#22c55e','#f59e0b','#ec4899','#14b8a6'];
  openModal({
    title: 'New Subject',
    body: `
      <label>Subject name
        <input name="name" required placeholder="e.g. Operating Systems">
      </label>
      <label>Color
        <select name="color">
          ${colors.map((c, i) => `<option value="${c}" ${i === 0 ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
      </label>
    `,
    submit: 'Add Subject',
    onSubmit(fd) {
      const name = fd.get('name').trim();
      if (!name) return false;
      S.subjects.push({ id: uid(), name, color: fd.get('color'), units: [] });
      save();
      render();
      toast('Subject added 📚');
    },
  });
}

function noteModal(note) {
  const n = note || { title: '', content: '', pinned: false, tags: [] };
  openModal({
    title: note ? 'Edit Note' : 'New Note',
    body: `
      <label>Title
        <input name="title" required value="${esc(n.title)}" placeholder="e.g. DAA Important Questions">
      </label>
      <label>Content
        <textarea name="content" rows="7" placeholder="Write anything...">${esc(n.content || '')}</textarea>
      </label>
    `,
    submit: note ? 'Save Changes' : 'Add Note',
    onSubmit(fd) {
      const title = fd.get('title').trim();
      const content = fd.get('content');
      if (!title) return false;
      if (note) Object.assign(note, { title, content });
      else S.notes.push({ id: uid(), title, content, pinned: false, tags: [], createdAt: Date.now() });
      save();
      render();
      toast(note ? 'Note updated' : 'Note saved 📝');
    },
  });
}

function profileModal() {
  const u = S.user;
  const avatars = ['🎓','👨‍🎓','👩‍🎓','🚀','🧠','📚','⚡','🌟','🎯','🔥'];
  openModal({
    title: 'Edit Profile',
    body: `
      <label>Name
        <input name="name" value="${esc(u.name)}" required>
      </label>
      <label>Email
        <input name="email" type="email" value="${esc(u.email || '')}">
      </label>
      <div class="row">
        <label>Course
          <input name="course" value="${esc(u.course || '')}" placeholder="B.Tech">
        </label>
        <label>Year
          <select name="year">
            ${opts(['1st Year','2nd Year','3rd Year','4th Year','Postgraduate','Other'], u.year || '3rd Year')}
          </select>
        </label>
      </div>
      <label>Main goal
        <input name="mainGoal" value="${esc(u.mainGoal || '')}" placeholder="e.g. Internship Preparation">
      </label>
      <label>Avatar
        <select name="avatar">
          ${avatars.map(a => `<option value="${a}" ${u.avatar === a ? 'selected' : ''}>${a}</option>`).join('')}
        </select>
      </label>
    `,
    submit: 'Save',
    onSubmit(fd) {
      Object.assign(S.user, {
        name: fd.get('name').trim() || 'Student',
        email: fd.get('email').trim(),
        course: fd.get('course').trim(),
        year: fd.get('year'),
        mainGoal: fd.get('mainGoal').trim(),
        avatar: fd.get('avatar'),
      });
      save();
      render();
      updateDrawerHeader();
      toast('Profile updated ✅');
    },
  });
}

function quickAddSheet() {
  openModal({
    title: 'Quick Add',
    hideSubmit: true,
    body: `
      <button class="sheet-item" data-action="add-task"><span class="ic">✅</span> Task</button>
      <button class="sheet-item" data-action="add-routine"><span class="ic">📅</span> Routine Item</button>
      <button class="sheet-item" data-action="add-goal"><span class="ic">🎯</span> Goal</button>
      <button class="sheet-item" data-action="add-reminder"><span class="ic">🔔</span> Reminder</button>
      <button class="sheet-item" data-action="add-note"><span class="ic">📝</span> Note</button>
      <button class="sheet-item" data-action="add-subject"><span class="ic">📚</span> Subject</button>
    `,
  });
}

/* ================================================================
   23. NOTIFICATIONS — FINAL ANDROID FIX
   ================================================================ */

let notificationTimer = null;
let studyMateSW = null;

async function registerStudyMateServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker is not supported.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('StudyMate Service Worker registered:', registration.scope);
    studyMateSW = registration;
    if (registration.active) return registration;
    await navigator.serviceWorker.ready;
    studyMateSW = await navigator.serviceWorker.getRegistration('/');
    return studyMateSW;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    studyMateSW = null;
    return null;
  }
}

function notificationSupported() {
  return ('Notification' in window && window.isSecureContext);
}

async function enableNotifications() {
  if (!('Notification' in window)) {
    toast('This browser does not support notifications.');
    return false;
  }
  if (!window.isSecureContext) {
    toast('Open StudyMate using the HTTPS Render URL.');
    return false;
  }
  try {
    await registerStudyMateServiceWorker();
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    console.log('Notification permission:', permission);
    if (permission !== 'granted') {
      S.settings.notify = false;
      save();
      if (permission === 'denied') {
        toast('❌ Notifications are blocked. Allow them in Chrome settings.');
      } else {
        toast('Notification permission was not granted.');
      }
      render();
      return false;
    }
    S.settings.notify = true;
    save();
    startNotificationLoop();
    const success = await notify('🎓 StudyMate', 'Notifications are working successfully!');
    render();
    if (success) {
      toast('🔔 Notifications enabled successfully!');
    } else {
      toast('Permission is enabled, but notification could not be sent.');
    }
    return success;
  } catch (error) {
    console.error('Enable notification error:', error);
    toast('Could not enable notifications.');
    return false;
  }
}

async function notify(title, body) {
  if (!('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;
  try {
    let registration = studyMateSW;
    if (!registration && 'serviceWorker' in navigator) {
      registration = await navigator.serviceWorker.getRegistration('/');
    }
    if (!registration) {
      registration = await registerStudyMateServiceWorker();
    }
    if (registration && typeof registration.showNotification === 'function') {
      await registration.showNotification(title, {
        body: body,
        tag: 'studymate-' + Date.now(),
        renotify: true,
        vibrate: [200, 100, 200]
      });
      return true;
    }
    if (typeof Notification === 'function') {
      new Notification(title, { body: body });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Notification failed:', error);
    return false;
  }
}

function reminderAppliesToday(reminder, dateISO) {
  const repeat = reminder.repeat || 'none';
  const currentDay = parseISO(dateISO).getDay();
  if (repeat === 'none') return reminder.date === dateISO;
  if (repeat === 'daily') return true;
  if (repeat === 'weekdays') return [1, 2, 3, 4, 5].includes(currentDay);
  if (repeat === 'weekly') {
    if (!reminder.date) return false;
    return parseISO(dateISO).getDay() === parseISO(reminder.date).getDay();
  }
  if (repeat === 'custom') return (reminder.days || []).includes(currentDay);
  return false;
}

function checkDueNotifications() {
  if (!('Notification' in window)) return;
  if (!S.settings.notify) return;
  if (Notification.permission !== 'granted') {
    S.settings.notify = false;
    save();
    return;
  }
  const today = todayISO();
  const currentMinutes = minutesOf(nowHM());

  S.reminders
    .filter(reminder => reminder.enabled && reminder.time)
    .forEach(reminder => {
      if (!reminderAppliesToday(reminder, today)) return;
      const dueMinutes = minutesOf(reminder.time);
      const key = `rem:${reminder.id}:${today}:${reminder.time}`;
      if (currentMinutes >= dueMinutes && currentMinutes - dueMinutes <= 30 && !S.fired[key]) {
        S.fired[key] = true;
        save();
        notify('🔔 ' + reminder.title, 'Scheduled for ' + fmtTime(reminder.time));
      }
    });

  S.tasks
    .filter(task => !task.done && task.date === today && task.time && task.remind && task.remind !== 'none')
    .forEach(task => {
      const minutesBefore = Number(task.remind);
      if (!Number.isFinite(minutesBefore)) return;
      const dueMinutes = minutesOf(task.time) - minutesBefore;
      const key = `task:${task.id}:${today}:${task.remind}`;
      if (currentMinutes >= dueMinutes && currentMinutes - dueMinutes <= 30 && !S.fired[key]) {
        S.fired[key] = true;
        save();
        notify('⏰ ' + task.title, 'Starts at ' + fmtTime(task.time));
      }
    });

  Object.keys(S.fired).forEach(key => {
    const match = key.match(/\d{4}-\d{2}-\d{2}/);
    if (match && match[0] !== today) {
      delete S.fired[key];
    }
  });

  save();
}

function startNotificationLoop() {
  if (notificationTimer !== null) return;
  checkDueNotifications();
  notificationTimer = setInterval(() => {
    checkDueNotifications();
  }, 15000);
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) checkDueNotifications();
});

window.addEventListener('focus', () => {
  checkDueNotifications();
});

/* ================================================================
   24. GLOBAL EVENT DELEGATION
   ================================================================ */
document.addEventListener('click', e => {
  if (e.target.closest('[data-close-modal]')) { closeModal(); return; }
  if (e.target.matches('[data-close-backdrop]')) { closeModal(); return; }

  const el = e.target.closest('[data-action]');
  const navEl = e.target.closest('[data-nav]');
  const drawerNav = e.target.closest('[data-nav-drawer]');

  if (drawerNav) {
    closeDrawer();
    navigate(drawerNav.dataset.navDrawer);
    return;
  }
  if (navEl && !el) { navigate(navEl.dataset.nav); return; }
  if (!el) return;

  const a = el.dataset.action;
  const id = el.dataset.id;

  switch (a) {
    case 'open-drawer': $('#drawer').classList.add('open'); break;
    case 'close-drawer': closeDrawer(); break;
    case 'toggle-theme': toggleTheme(); break;
    case 'nav': navigate(el.dataset.view); break;

    case 'quick-add': quickAddSheet(); break;
    case 'add-task': closeModal(); setTimeout(() => taskModal(), 260); break;
    case 'add-routine': closeModal(); setTimeout(() => routineModal(), 260); break;
    case 'add-goal': closeModal(); setTimeout(() => goalModal(), 260); break;
    case 'add-reminder': closeModal(); setTimeout(() => reminderModal(), 260); break;
    case 'add-note': closeModal(); setTimeout(() => noteModal(), 260); break;
    case 'add-subject': closeModal(); setTimeout(() => subjectModal(), 260); break;

    case 'toggle-task': {
      const task = getTask(id);
      if (!task) break;
      task.done = !task.done;
      if (task.done) {
        markActivity();
        if (task.repeat && task.repeat !== 'none') {
          const next = { ...task, id: uid(), done: false, synced: false };
          next.date = task.repeat === 'daily' ? addDays(task.date, 1)
                    : task.repeat === 'weekdays' ? nextWeekday(task.date)
                    : addDays(task.date, 7);
          S.tasks.push(next);
        }
      }
      save(); render();
      break;
    }
    case 'edit-task': taskModal(getTask(id)); break;
    case 'task-filter': ui.taskFilter = el.dataset.filter; render(); break;

    case 'task-sort': ui.taskSort = el.value; render(); break;

    case 'task-clear-search':
      ui.taskSearch = '';
      render();
      break;

    case 'task-quick-filter': {
      const qf = el.dataset.qf;
      ui.taskQuickFilter = (ui.taskQuickFilter === qf) ? '' : qf;
      render();
      break;
    }

    case 'task-clear-quick':
      ui.taskQuickFilter = '';
      render();
      break;

    case 'pin-task': {
      const task = getTask(id);
      if (!task) break;
      task.pinned = !task.pinned;
      save();
      render();
      toast(task.pinned ? 'Task pinned 📌' : 'Task unpinned');
      break;
    }

    case 'bulk-enter':
      ui.bulkMode = true;
      ui.selectedTasks = [];
      render();
      break;

    case 'bulk-cancel':
      ui.bulkMode = false;
      ui.selectedTasks = [];
      render();
      break;

    case 'bulk-toggle': {
      const idx = ui.selectedTasks.indexOf(id);
      if (idx >= 0) ui.selectedTasks.splice(idx, 1);
      else ui.selectedTasks.push(id);
      render();
      break;
    }

    case 'bulk-complete': {
      if (!ui.selectedTasks.length) { toast('No tasks selected'); break; }
      let count = 0;
      ui.selectedTasks.forEach(tid => {
        const task = getTask(tid);
        if (task && !task.done) {
          task.done = true;
          count++;
        }
      });
      if (count > 0) markActivity();
      save();
      toast(`${count} task${count === 1 ? '' : 's'} completed ✅`);
      ui.bulkMode = false;
      ui.selectedTasks = [];
      render();
      break;
    }

    case 'bulk-delete': {
      if (!ui.selectedTasks.length) { toast('No tasks selected'); break; }
      if (!confirm(`Delete ${ui.selectedTasks.length} task${ui.selectedTasks.length === 1 ? '' : 's'}?`)) break;
      const count = ui.selectedTasks.length;
      S.tasks = S.tasks.filter(t => !ui.selectedTasks.includes(t.id));
      save();
      toast(`${count} task${count === 1 ? '' : 's'} deleted 🗑️`);
      ui.bulkMode = false;
      ui.selectedTasks = [];
      render();
      break;
    }

    case 'toggle-routine': {
      const key = `${id}:${todayISO()}`;
      S.routineLog[key] = !S.routineLog[key];
      if (S.routineLog[key]) markActivity();
      save(); render();
      break;
    }
    case 'edit-routine': routineModal(getRoutine(id)); break;

    case 'edit-goal': goalModal(getGoal(id)); break;
    case 'toggle-milestone': {
      const g = getGoal(el.dataset.goal);
      const m = g?.milestones.find(x => x.id === el.dataset.ms);
      if (m) { m.done = !m.done; if (m.done) markActivity(); save(); render(); }
      break;
    }
    case 'add-milestone': {
      const g = getGoal(id);
      openModal({
        title: 'Add Milestone',
        body: `<label>Milestone
                 <input name="title" required placeholder="e.g. Exception Handling">
               </label>`,
        submit: 'Add',
        onSubmit(fd) {
          const title = fd.get('title').trim();
          if (!title) return false;
          g.milestones.push({ id: uid(), title, done: false });
          save(); render(); toast('Milestone added');
        },
      });
      break;
    }
    case 'del-milestone': {
      const g = getGoal(el.dataset.goal);
      g.milestones = g.milestones.filter(x => x.id !== el.dataset.ms);
      save(); render();
      break;
    }
    case 'del-goal':
      if (confirm('Delete this goal? This cannot be undone.')) {
        S.goals = S.goals.filter(g => g.id !== id);
        save(); render(); toast('Goal deleted');
      }
      break;
    case 'goal-focus': {
      timer.subjectId = '';
      timer.topic = getGoal(id)?.title || '';
      navigate('focus');
      break;
    }

    case 'toggle-reminder': {
      const r = getReminder(id);
      r.enabled = !r.enabled;
      save(); render();
      break;
    }
    case 'edit-reminder': reminderModal(getReminder(id)); break;

    case 'enable-notify':
      enableNotifications();
      break;

    case 'test-notify':
      if (!('Notification' in window) || Notification.permission !== 'granted' || !S.settings.notify) {
        enableNotifications();
      } else {
        notify('🎓 StudyMate', 'This is a test notification.').then(sent => {
          toast(sent ? 'Test notification sent!' : 'Test notification failed. Check browser settings.');
        });
      }
      break;

    case 'toggle-subject':
      ui.expandedSubjects[id] = !ui.expandedSubjects[id];
      render();
      break;
    case 'add-unit': {
      const s = getSubject(id);
      openModal({
        title: 'Add Unit',
        body: `<label>Unit name
                 <input name="name" required placeholder="e.g. Unit 3 — Trees">
               </label>`,
        submit: 'Add Unit',
        onSubmit(fd) {
          const name = fd.get('name').trim();
          if (!name) return false;
          s.units.push({ id: uid(), name, topics: [] });
          ui.expandedSubjects[s.id] = true;
          save(); render();
        },
      });
      break;
    }
    case 'del-unit': {
      const s = getSubject(el.dataset.subject);
      s.units = s.units.filter(u => u.id !== el.dataset.unit);
      save(); render();
      break;
    }
    case 'add-topic': {
      const s = getSubject(el.dataset.subject);
      const u = s.units.find(x => x.id === el.dataset.unit);
      openModal({
        title: 'Add Topic',
        body: `<label>Topic name
                 <input name="name" required placeholder="e.g. AVL Trees">
               </label>`,
        submit: 'Add Topic',
        onSubmit(fd) {
          const name = fd.get('name').trim();
          if (!name) return false;
          u.topics.push({ id: uid(), name, done: false });
          save(); render();
        },
      });
      break;
    }
    case 'toggle-topic': {
      const s = getSubject(el.dataset.subject);
      const u = s.units.find(x => x.id === el.dataset.unit);
      const tp = u?.topics.find(x => x.id === el.dataset.topic);
      if (tp) {
        tp.done = !tp.done;
        if (tp.done) markActivity();
        save(); render();
      }
      break;
    }
    case 'del-topic': {
      const s = getSubject(el.dataset.subject);
      const u = s.units.find(x => x.id === el.dataset.unit);
      u.topics = u.topics.filter(x => x.id !== el.dataset.topic);
      save(); render();
      break;
    }
    case 'del-subject':
      if (confirm('Delete this subject and all its topics?')) {
        S.subjects = S.subjects.filter(s => s.id !== id);
        save(); render(); toast('Subject deleted');
      }
      break;
    case 'subject-focus':
      timer.subjectId = id;
      navigate('focus');
      break;

    case 'timer-toggle':
      timer.running ? pauseTimer() : startTimer();
      break;
    case 'timer-reset':
      resetTimer();
      break;
    case 'timer-preset': {
      pauseTimer();
      const m = Number(el.dataset.min);
      timer.mode = 'focus';
      timer.total = m * 60;
      timer.remaining = m * 60;
      updateTimerUI();
      toast(`Set to ${m} minutes`);
      break;
    }

    case 'cal-prev':
      ui.calMonth--;
      if (ui.calMonth < 0) { ui.calMonth = 11; ui.calYear--; }
      render();
      break;
    case 'cal-next':
      ui.calMonth++;
      if (ui.calMonth > 11) { ui.calMonth = 0; ui.calYear++; }
      render();
      break;
    case 'cal-select':
      ui.calSelected = el.dataset.date;
      render();
      break;

    case 'edit-note': noteModal(getNote(id)); break;
    case 'del-note':
      if (confirm('Delete this note?')) {
        S.notes = S.notes.filter(n => n.id !== id);
        save(); render();
      }
      break;
    case 'pin-note': {
      const n = getNote(id);
      n.pinned = !n.pinned;
      save(); render();
      break;
    }

    case 'edit-profile': profileModal(); break;
    case 'toggle-weekstart':
      S.settings.weekStart = S.settings.weekStart === 1 ? 0 : 1;
      save(); render();
      break;
    case 'sync-backend': syncWithBackend(); break;
    case 'export-data': {
      const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a2 = document.createElement('a');
      a2.href = url;
      a2.download = `studymate-backup-${todayISO()}.json`;
      a2.click();
      URL.revokeObjectURL(url);
      toast('Backup downloaded ⬇️');
      break;
    }
    case 'import-data':
      $('#importFile').click();
      break;
    case 'load-sample':
      if (confirm('Load sample data? This will replace your current data.')) {
        S = defaultState();
        seedSampleData();
        save(); render(); updateDrawerHeader();
        toast('Sample data loaded 🎲');
      }
      break;
    case 'reset-data':
      if (confirm('Delete ALL data? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        S = defaultState();
        save();
        location.hash = '';
        $('#shell').classList.add('hidden');
        renderAuth();
        $('#auth').classList.remove('hidden');
        toast('All data cleared. Reloading...');
        setTimeout(() => location.reload(), 800);
      }
      break;
  }
});

document.addEventListener('input', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;

  if (el.dataset.action === 'note-search') {
    ui.noteQuery = el.value;
    const pos = el.selectionStart;
    render();
    const next = $('#noteSearch');
    if (next) { next.focus(); next.setSelectionRange(pos, pos); }
  }

  if (el.dataset.action === 'task-search') {
    ui.taskSearch = el.value;
    const pos = el.selectionStart;
    render();
    const next = $('#taskSearch');
    if (next) { next.focus(); next.setSelectionRange(pos, pos); }
  }
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  switch (el.dataset.action) {
    case 'focus-subject':
      timer.subjectId = el.value; break;
    case 'set-daystart':
      S.settings.dayStart = el.value; save(); break;
    case 'set-dayend':
      S.settings.dayEnd = el.value; save(); break;
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'focusTopic') timer.topic = e.target.value;
});

document.addEventListener('change', e => {
  if (e.target.id !== 'importFile') return;
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      S = Object.assign(defaultState(), data);
      save(); render(); updateDrawerHeader();
      toast('Data imported ✅');
    } catch { toast('Invalid backup file'); }
  };
  reader.readAsText(file);
});

/* ================================================================
   25. HELPERS
   ================================================================ */
function toggleTheme() {
  S.settings.theme = S.settings.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', S.settings.theme);
  save();
  if (currentRoute() === 'settings') render();
  toast(S.settings.theme === 'dark' ? '🌙 Dark mode' : '☀️ Light mode');
}
function closeDrawer() { $('#drawer').classList.remove('open'); }

function nextWeekday(isoStr) {
  let d = addDays(isoStr, 1);
  while ([0, 6].includes(parseISO(d).getDay())) d = addDays(d, 1);
  return d;
}

/* ================================================================
   26. FULL BACKEND SYNC
   ================================================================ */
const API_URL = 'https://studymate-backend-5vyt.onrender.com';

async function syncWithBackend() {
  try {
    toast('Syncing... ⏳');
    const userId = S.user.email || 'defaultUser';
    let pushedCount = 0;
    let pulledCount = 0;

    for (const task of S.tasks) {
      if (task.synced) continue;
      try {
        const res = await fetch(`${API_URL}/api/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId, title: task.title, description: task.desc,
            date: task.date, time: task.time, priority: task.priority,
            category: task.category, completed: task.done
          })
        });
        if (res.ok) { task.synced = true; pushedCount++; }
      } catch (e) { console.error('Task push error:', e); }
    }

    for (const goal of S.goals) {
      if (goal.synced) continue;
      try {
        const res = await fetch(`${API_URL}/api/goals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId, title: goal.title, desc: goal.desc,
            deadline: goal.deadline, dailyTarget: goal.dailyTarget,
            color: goal.color, milestones: goal.milestones || []
          })
        });
        if (res.ok) { goal.synced = true; pushedCount++; }
      } catch (e) { console.error('Goal push error:', e); }
    }

    for (const routine of S.routines) {
      if (routine.synced) continue;
      try {
        const res = await fetch(`${API_URL}/api/routines`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId, title: routine.title, start: routine.start, end: routine.end,
            icon: routine.icon, category: routine.category, days: routine.days || []
          })
        });
        if (res.ok) { routine.synced = true; pushedCount++; }
      } catch (e) { console.error('Routine push error:', e); }
    }

    for (const note of S.notes) {
      if (note.synced) continue;
      try {
        const res = await fetch(`${API_URL}/api/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId, title: note.title, content: note.content,
            pinned: note.pinned, tags: note.tags || []
          })
        });
        if (res.ok) { note.synced = true; pushedCount++; }
      } catch (e) { console.error('Note push error:', e); }
    }

    const tRes = await fetch(`${API_URL}/api/tasks?userId=${userId}`);
    const remoteTasks = await tRes.json();
    if (Array.isArray(remoteTasks)) {
      remoteTasks.forEach(rt => {
        const exists = S.tasks.find(t => t.title === rt.title && t.date === rt.date);
        if (!exists) {
          S.tasks.push({
            id: rt._id, title: rt.title, desc: rt.description || '',
            date: rt.date, time: rt.time || '', priority: rt.priority || 'medium',
            category: rt.category || 'study', done: rt.completed,
            repeat: 'none', remind: '15', goalId: '', subjectId: '', synced: true
          });
          pulledCount++;
        }
      });
    }

    const gRes = await fetch(`${API_URL}/api/goals?userId=${userId}`);
    const remoteGoals = await gRes.json();
    if (Array.isArray(remoteGoals)) {
      remoteGoals.forEach(rg => {
        const exists = S.goals.find(g => g.title === rg.title);
        if (!exists) {
          S.goals.push({
            id: rg._id, title: rg.title, desc: rg.desc || '',
            deadline: rg.deadline || '', dailyTarget: rg.dailyTarget || 0,
            color: rg.color || '#6c8cff',
            milestones: rg.milestones || [], synced: true
          });
          pulledCount++;
        }
      });
    }

    const rRes = await fetch(`${API_URL}/api/routines?userId=${userId}`);
    const remoteRoutines = await rRes.json();
    if (Array.isArray(remoteRoutines)) {
      remoteRoutines.forEach(rr => {
        const exists = S.routines.find(r => r.title === rr.title && r.start === rr.start);
        if (!exists) {
          S.routines.push({
            id: rr._id, title: rr.title, start: rr.start, end: rr.end,
            icon: rr.icon || '📌', category: rr.category || 'personal',
            days: rr.days || [0,1,2,3,4,5,6], synced: true
          });
          pulledCount++;
        }
      });
    }

    const nRes = await fetch(`${API_URL}/api/notes?userId=${userId}`);
    const remoteNotes = await nRes.json();
    if (Array.isArray(remoteNotes)) {
      remoteNotes.forEach(rn => {
        const exists = S.notes.find(n => n.title === rn.title);
        if (!exists) {
          S.notes.push({
            id: rn._id, title: rn.title, content: rn.content || '',
            pinned: rn.pinned || false, tags: rn.tags || [],
            createdAt: Date.now(), synced: true
          });
          pulledCount++;
        }
      });
    }

    save();
    render();
    toast(`Synced! Pushed ${pushedCount}, Pulled ${pulledCount} ✅`);
  } catch (err) {
    console.error(err);
    toast('Sync failed. Check internet.');
  }
}

/* ================================================================
   27. BOOT
   ================================================================ */
function bootApp() {
  $('#auth').classList.add('hidden');
  $('#shell').classList.remove('hidden');
  document.documentElement.setAttribute('data-theme', S.settings.theme);
  if (!location.hash) location.hash = '#/home';
  updateDrawerHeader();
  render();
  checkAchievements();
  startNotificationLoop();
}

function init() {
  document.documentElement.setAttribute('data-theme', S.settings.theme);
  if (!S.user.onboarded) {
    renderAuth();
    return;
  }
  bootApp();
}

window.addEventListener('hashchange', () => {
  if ($('#shell').classList.contains('hidden')) return;
  render();
});

init();
