const APP_VERSION = 'v0.1 p.4';
const STORAGE_KEY = 'lift.v0.1.p4.program';

const seedProgram = {
  currentMonthIndex: 1,
  currentSessionIndex: 0,
  rebuildMode: false,
  history: [],
  monthResults: { sessionsDone: 0, exercisesDone: 0, progressed: 0, held: 0, misses: 0, buildups: 0 },
  sessions: [
    {
      id: 'w22-upper-a', title: 'UPPER A', source: 'Week 22 / 4.05 style', intensity: 'PRE 9',
      notes: 'Current workout only. Build-ups are separate. Shoulder: do not hero-lift through weirdness.',
      exercises: [
        prep('Bike', '5 min', 'mid'),
        ex('db-y-raise', 'Db Y-Raise', 'shoulders', 2, 12, 15, 5, 'kg', 1, [12, 12], 13),
        ex('flat-bench', 'Flat Bench', 'chest', 3, 6, 8, 60, 'kg', 2.5, [8, 7, 6], 8, [buildup(20, 'kg', 20), buildup(40, 'kg', 10), buildup(50, 'kg', 5)]),
        ex('wide-pull-up', 'Wide Pull-Up', 'back', 2, 6, 10, 10, 'kg', 2.5, [4, 8], 9, [buildup(0, 'kg', 8), buildup(5, 'kg', 8)]),
        ex('db-preach-curl', 'Db Preach Curl', 'biceps', 1, 6, 10, 13.5, 'kg', 2.5, [6], 7, [buildup(11, 'kg', 10)]),
        ex('pec-deck', 'Pec Deck', 'chest', 2, 12, 15, 30, 'kg', 2.5, [15, 15], 15),
        ex('sup-db-row', 'Sup Db Row', 'back', 2, 8, 12, 18.5, 'kg', 2.5, [10, 10], 11, [buildup(16, 'kg', 12)]),
        ex('cab-kickback', 'Cab Kickback', 'triceps', 2, 10, 15, 15, 'kg', 2.5, [12, 12], 13),
        ex('neck-curl-ext', 'Neck Curl & Extension', 'neck', 1, 12, 20, 5, 'kg', 1, [12], 13, [buildup(0, 'kg', 20)])
      ]
    },
    {
      id: 'w22-lower-a', title: 'LOWER + CORE A', source: 'Week 22 / 5.05 style', intensity: 'RPE 6–7',
      notes: 'Back-friendly lower/core. Keep it clean, not heroic.',
      exercises: [
        prep('Bike', '5 min', 'easy'), body('Bird Dog', 'core', 2, 8, 'each'), timeHold('Side Plank', 'core', 2, 30, 's'),
        ex('pallof-press', 'Pallof Press', 'abs', 2, 10, 15, 2, 'pl', 1, [12, 12], 13, [buildup(1, 'pl', 12)]),
        ex('hip-add', 'Hip Add', 'adductors', 2, 10, 15, 4, 'pin', 1, [12, 12], 13),
        ex('hip-abd', 'Hip Abd', 'glutes', 3, 10, 15, 5, 'pin', 1, [12, 12, 12], 13),
        ex('glute-bridge', 'Glute Bridge', 'glutes', 3, 8, 12, 18.5, 'kg', 2.5, [10, 10, 10], 11, [buildup(16, 'kg', 12)]),
        prep('Bike', '8 min', 'easy')
      ]
    },
    {
      id: 'w22-upper-b', title: 'UPPER B', source: 'Week 22 / 7.05 style', intensity: 'solid, not stupid',
      notes: 'Dips + pull-up day. Ropes/face pull cluster lives here.',
      exercises: [
        prep('Bike', '5 min', 'mid'),
        ex('dips', 'Dips', 'chest/triceps', 2, 8, 12, 10, 'kg', 2.5, [10, 10], 11, [buildup(0, 'kg', 10), buildup(5, 'kg', 10)]),
        ex('wide-pull-up', 'Wide Pull-Up', 'back', 2, 6, 10, 10, 'kg', 2.5, [8, 8], 9, [buildup(0, 'kg', 8), buildup(5, 'kg', 8)]),
        ex('db-ham-curl', 'Db Ham Curl', 'biceps/forearm', 1, 6, 10, 13.5, 'kg', 2.5, [8], 9, [buildup(10, 'kg', 12)]),
        ex('sup-db-row', 'Sup Db Rows', 'back', 2, 8, 12, 18.5, 'kg', 2.5, [10, 10], 11, [buildup(16, 'kg', 10)]),
        ex('pec-deck', 'Pec Deck', 'chest', 2, 12, 15, 30, 'kg', 2.5, [15, 15], 15),
        ex('rope-upright-row', 'Rope Upright Row', 'shoulders/traps', 2, 10, 15, 25, 'kg', 2.5, [13, 13], 14),
        ex('face-pull', 'Face Pull', 'rear delts', 2, 10, 15, 35, 'kg', 2.5, [13, 13], 14),
        ex('pushdowns', 'Pushdowns', 'triceps', 2, 8, 12, 45, 'kg', 2.5, [12, 8], 12),
        ex('neck-curl-ext', 'Neck Curl & Extension', 'neck', 1, 12, 20, 5, 'kg', 1, [12], 13, [buildup(0, 'kg', 20)])
      ]
    },
    {
      id: 'w22-lower-b', title: 'LOWER + CORE B', source: 'Week 22 / 8.05 style', intensity: 'RPE 6–7',
      notes: 'Repeat lower/core pattern, small rep targets only.',
      exercises: [
        prep('Bike', '5 min', 'easy'), body('Dead Bug', 'core', 2, 11, 'each'), timeHold('Side Plank', 'core', 2, 30, 's each'),
        ex('pallof-press', 'Pallof Press', 'abs', 2, 10, 15, 2, 'pl', 1, [12, 12], 13),
        ex('hip-add', 'Hip Add', 'adductors', 2, 10, 15, 4, 'pin', 1, [12, 12], 13),
        ex('hip-abd', 'Hip Abd', 'glutes', 4, 10, 15, 5, 'pin', 1, [12, 12, 12, 12], 13),
        ex('glute-bridge', 'Glute Bridge', 'glutes', 4, 8, 12, 18.5, 'kg', 2.5, [10, 10, 10, 10], 11, [buildup(16, 'kg', 12)]),
        prep('Bike', '8 min', 'easy')
      ]
    },
    {
      id: 'w22-arm-sh', title: 'ARM + SH', source: 'Week 22 / 9.05 style', intensity: 'RPE 7',
      notes: 'Shoulders/arms with strict build-ups and no ego jumps.',
      exercises: [
        prep('Bike', '5 min', 'easy'),
        ex('lean-in-lat-raise', 'Lean-In Db Lat Raise', 'shoulders', 2, 10, 15, 5, 'kg', 1, [12, 12], 13),
        ex('sh-press', 'Sh. Press', 'shoulders', 3, 8, 12, 16, 'kg', 2.5, [8, 10, 10], 11, [buildup(13.5, 'kg', 12)]),
        ex('sup-zott-curl', 'Sup Zott Curl', 'biceps/forearm', 1, 6, 10, 13.5, 'kg', 2.5, [6], 7, [buildup(10, 'kg', 12)]),
        ex('rear-db-fly', 'Rear Db Fly', 'rear delts', 2, 10, 15, 5, 'kg', 1, [10, 10], 11),
        ex('cab-kickback', 'Cab Kickback', 'triceps', 2, 8, 12, 15, 'kg', 2.5, [10, 9], 11),
        ex('bayesian-curl', 'Bayesian Curl', 'biceps', 2, 10, 15, 15, 'kg', 2.5, [12, 12], 13),
        ex('wrist-curl', 'Wrist Curl', 'forearms', 1, 12, 20, 8, 'kg', 1, [18], 19, [buildup(6, 'kg', 18), buildup(6, 'kg', 13)]),
        ex('wrist-extension', 'Wrist Extension', 'forearms', 2, 12, 20, 0, 'kg', 1, [13, 13], 14),
        ex('neck-curl-ext', 'Neck Curl & Extension', 'neck', 1, 12, 20, 5, 'kg', 1, [12], 13, [buildup(0, 'kg', 20)])
      ]
    }
  ]
};

let state = loadState();
let screen = 'workout';
let ioText = '';
let showIo = false;

function ex(id, name, family, sets, repMin, repMax, weight, unit, increment, reps, targetRep, buildups = []) {
  return {
    id, type: 'lift', name, family, sets, repMin, repMax, weight, unit, increment, targetRep,
    bestRepAtWeight: Math.max(...reps), done: false,
    rows: [
      ...buildups,
      ...Array.from({ length: sets }, (_, i) => ({ id: `${id}-work-${i + 1}`, kind: 'work', label: `SET ${i + 1}`, weight, unit, reps: reps[i] ?? '', complete: false }))
    ]
  };
}
function buildup(weight, unit, reps) { return { id: id('buildup'), kind: 'buildup', label: 'BUILDUP', weight, unit, reps, complete: false }; }
function prep(name, prescription, intensity = '') { return { id: id(`prep-${slug(name)}`), type: 'prep', name, family: 'prep', prescription, intensity, done: false }; }
function body(name, family, sets, reps, unit = '') { return { id: id(`body-${slug(name)}`), type: 'body', name, family, sets, reps, unit, done: false }; }
function timeHold(name, family, sets, seconds, unit = 's') { return { id: id(`time-${slug(name)}`), type: 'time', name, family, sets, seconds, unit, done: false }; }
function id(prefix) { return `${prefix}-${Math.random().toString(36).slice(2, 8)}`; }
function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : structuredClone(seedProgram);
  } catch {
    return structuredClone(seedProgram);
  }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function commit(next) { state = next; saveState(); render(); }

function computeNextExercise(exercise) {
  if (!exercise || exercise.type !== 'lift') return { exercise, event: 'none' };
  const workRows = exercise.rows.filter(row => row.kind === 'work');
  const reps = workRows.map(row => Number(row.reps)).filter(n => Number.isFinite(n) && n >= 0);
  if (reps.length === 0) return { exercise, event: 'no-data', message: 'No work reps entered.' };

  const maxRep = Math.max(...reps);
  const oldTarget = Number(exercise.targetRep || exercise.repMin);
  const oldBest = Number(exercise.bestRepAtWeight || 0);
  const bestRepAtWeight = Math.max(oldBest, maxRep);
  const allTopRange = reps.length === workRows.length && reps.every(rep => rep >= Number(exercise.repMax));
  let next = { ...exercise, bestRepAtWeight, done: true };
  let event = 'held';
  let message = `Target stays ${oldTarget}.`;

  if (allTopRange) {
    const nextWeight = roundLoad(Number(exercise.weight) + Number(exercise.increment || 0));
    next = {
      ...next, weight: nextWeight, targetRep: Number(exercise.repMin), bestRepAtWeight: 0,
      rows: exercise.rows.map(row => row.kind === 'work' ? { ...row, weight: nextWeight, reps: Number(exercise.repMin), complete: false } : row)
    };
    event = 'progressed-load';
    message = `Top range hit. Next: ${nextWeight}${exercise.unit}, target ${exercise.repMin}.`;
  } else if (maxRep >= oldTarget) {
    const nextTarget = Math.min(Number(exercise.repMax), Math.max(oldTarget + 1, maxRep + 1));
    next = { ...next, targetRep: nextTarget, rows: exercise.rows.map(row => row.kind === 'work' ? { ...row, reps: nextTarget, complete: false } : row) };
    event = nextTarget > oldTarget ? 'progressed-reps' : 'held-top';
    message = nextTarget > oldTarget ? `Rep target moves ${oldTarget} → ${nextTarget}.` : `Top target held. Need all sets at ${exercise.repMax} before load jump.`;
  } else {
    next = { ...next, targetRep: oldTarget, rows: exercise.rows.map(row => row.kind === 'work' ? { ...row, reps: oldTarget, complete: false } : row) };
    event = 'missed-held';
    message = `Miss recorded. Target does not drop: ${oldTarget}.`;
  }
  return { exercise: next, event, message, maxRep, oldTarget };
}

function roundLoad(n) { return Math.round(n * 10) / 10; }
function cleanNumber(value) {
  if (value === '') return '';
  const n = Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : value;
}

function completion(session) {
  const total = session?.exercises?.length || 0;
  const done = session?.exercises?.filter(ex => ex.done).length || 0;
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}
function currentSession() { return state.sessions[state.currentSessionIndex] || state.sessions[0]; }
function updateCurrentSession(updater) {
  const sessions = state.sessions.map((s, i) => i === state.currentSessionIndex ? updater(s) : s);
  commit({ ...state, sessions });
}
function updateExercise(exerciseId, updater) {
  updateCurrentSession(session => ({ ...session, exercises: session.exercises.map(ex => ex.id === exerciseId ? updater(ex) : ex) }));
}
function updateRow(exerciseId, rowId, field, value) {
  updateExercise(exerciseId, ex => ({ ...ex, rows: ex.rows.map(row => row.id === rowId ? { ...row, [field]: cleanNumber(value) } : row) }));
}
function addBuildupRow(exerciseId) {
  updateExercise(exerciseId, ex => {
    if (ex.type !== 'lift') return ex;
    const firstWork = ex.rows.find(row => row.kind === 'work');
    const workIndex = ex.rows.findIndex(row => row.kind === 'work');
    const newRow = { id: id('buildup'), kind: 'buildup', label: 'BUILDUP', weight: firstWork ? Math.max(0, roundLoad(Number(firstWork.weight) - Number(ex.increment || 1))) : 0, unit: ex.unit, reps: ex.repMin, complete: false };
    const rows = [...ex.rows];
    rows.splice(workIndex < 0 ? 0 : workIndex, 0, newRow);
    return { ...ex, rows };
  });
}
function completeLift(exerciseId) {
  const session = currentSession();
  let resultEvent = 'held', resultMessage = '', buildupCount = 0;
  const exercises = session.exercises.map(exer => {
    if (exer.id !== exerciseId) return exer;
    buildupCount = (exer.rows || []).filter(row => row.kind === 'buildup').length;
    const result = computeNextExercise(exer);
    resultEvent = result.event;
    resultMessage = result.message || 'Exercise completed.';
    return result.exercise;
  });
  const progressed = resultEvent === 'progressed-load' || resultEvent === 'progressed-reps' ? 1 : 0;
  const misses = resultEvent === 'missed-held' ? 1 : 0;
  const held = progressed || misses ? 0 : 1;
  const sessions = state.sessions.map((s, i) => i === state.currentSessionIndex ? { ...s, exercises } : s);
  commit({
    ...state,
    sessions,
    monthResults: {
      ...state.monthResults,
      exercisesDone: state.monthResults.exercisesDone + 1,
      progressed: state.monthResults.progressed + progressed,
      held: state.monthResults.held + held,
      misses: state.monthResults.misses + misses,
      buildups: state.monthResults.buildups + buildupCount
    },
    history: [{ id: id('event'), type: resultEvent, label: resultMessage, at: new Date().toISOString() }, ...state.history].slice(0, 40)
  });
}
function completeSimple(exerciseId) {
  const session = currentSession();
  const sessions = state.sessions.map((s, i) => i === state.currentSessionIndex ? { ...s, exercises: s.exercises.map(ex => ex.id === exerciseId ? { ...ex, done: true } : ex) } : s);
  commit({
    ...state,
    sessions,
    monthResults: { ...state.monthResults, exercisesDone: state.monthResults.exercisesDone + 1 },
    history: [{ id: id('simple'), type: 'done', label: 'Non-progression item completed.', at: new Date().toISOString() }, ...state.history].slice(0, 40)
  });
}
function nextWorkout() {
  const session = currentSession();
  const last = state.currentSessionIndex >= state.sessions.length - 1;
  commit({
    ...state,
    currentSessionIndex: last ? 0 : state.currentSessionIndex + 1,
    monthResults: { ...state.monthResults, sessionsDone: state.monthResults.sessionsDone + 1 },
    history: [{ id: id('session'), type: 'session-done', label: `${session.title} completed.`, at: new Date().toISOString() }, ...state.history].slice(0, 40)
  });
}
function buildNextMonth() {
  const nextMonth = Number(state.currentMonthIndex || 1) + 1;
  const isDeloadMonth = nextMonth % 2 === 0;
  const sessions = state.sessions.map(session => ({
    ...session,
    id: `${session.id}-m${nextMonth}`,
    source: isDeloadMonth ? `Month ${nextMonth} / deload block` : `Month ${nextMonth} / progression block`,
    intensity: isDeloadMonth ? 'DELOAD' : session.intensity,
    exercises: session.exercises.map(item => deloadIfNeeded(item, isDeloadMonth))
  }));
  commit({
    ...state,
    currentMonthIndex: nextMonth,
    currentSessionIndex: 0,
    sessions,
    history: [{ id: id('month'), type: 'month-built', label: isDeloadMonth ? `Month ${nextMonth}: deload generated` : `Month ${nextMonth}: progression generated`, at: new Date().toISOString() }, ...state.history].slice(0, 40),
    monthResults: { sessionsDone: 0, exercisesDone: 0, progressed: 0, held: 0, misses: 0, buildups: 0 }
  });
}
function deloadIfNeeded(item, isDeloadMonth) {
  if (!isDeloadMonth || item.type !== 'lift') return { ...item, done: false };
  const deloadWeight = roundLoad(Number(item.weight) * 0.85);
  const deloadSets = Math.max(1, Math.ceil(Number(item.sets) * 0.6));
  const workRows = item.rows.filter(row => row.kind === 'work').slice(0, deloadSets).map((row, i) => ({ ...row, id: `${row.id}-deload-${i}`, weight: deloadWeight, reps: item.repMin, complete: false }));
  const buildupRows = item.rows.filter(row => row.kind === 'buildup').map(row => ({ ...row, complete: false }));
  return { ...item, sets: deloadSets, weight: deloadWeight, targetRep: item.repMin, done: false, rows: [...buildupRows, ...workRows] };
}
function resetProgram() {
  if (!confirm('Reset LIFT local data?')) return;
  commit(structuredClone(seedProgram));
}
function exportData() { ioText = JSON.stringify(state, null, 2); showIo = true; render(); }
function importData() {
  try {
    const parsed = JSON.parse(document.getElementById('ioText').value);
    showIo = false; ioText = '';
    commit(parsed);
  } catch {
    alert('Bad JSON. Nothing imported.');
  }
}

function escapeHtml(s) { return String(s ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }
function fmtDate(iso) { try { return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } }

function render() {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="app">
    <div class="topbar">
      <button class="logo" data-action="workout">LIFT</button>
      <div class="version">${APP_VERSION}</div>
      <button class="top-action" data-action="toggle-screen">${screen === 'month' ? 'WORKOUT' : 'MONTH'}</button>
    </div>
    <main class="main">${screen === 'month' ? monthScreen() : workoutScreen()}</main>
    ${ioDialog()}
  </div>`;
  bindEvents();
}

function workoutScreen() {
  const session = currentSession();
  const comp = completion(session);
  return `<section class="hero">
    <p class="kicker">Current workout</p>
    <h1 class="title">${escapeHtml(session.title)}</h1>
    <p class="meta">${escapeHtml(session.intensity)} · ${escapeHtml(session.source)}</p>
    <p class="note">${escapeHtml(session.notes)}</p>
    <div class="progress-track"><div class="progress-fill" style="width:${comp.percent}%"></div></div>
    <div class="hero-bottom">
      <span>${comp.done}/${comp.total} done</span>
      <label class="toggle-wrap"><span>Rebuild</span><input class="toggle" type="checkbox" data-action="toggle-rebuild" ${state.rebuildMode ? 'checked' : ''}></label>
    </div>
  </section>
  <nav class="session-strip">${state.sessions.map((s, i) => `<button class="chip ${i === state.currentSessionIndex ? 'active' : ''}" data-action="goto-session" data-index="${i}">${escapeHtml(s.title)}</button>`).join('')}</nav>
  <section class="stack">${session.exercises.map(item => item.type === 'lift' ? liftCard(item) : simpleCard(item)).join('')}</section>
  <button class="big-button" data-action="next-workout">NEXT WORKOUT</button>`;
}

function liftCard(item) {
  return `<article class="card ${item.done ? 'done' : ''}" data-exercise-id="${item.id}">
    <header class="card-head">
      <div class="card-title-row">
        <div><p class="family">${escapeHtml(item.family)}</p><h2 class="exercise-title">${escapeHtml(item.name)}</h2></div>
        <span class="badge">${escapeHtml(item.weight)}${escapeHtml(item.unit)}</span>
      </div>
      <div class="target">Target ${item.targetRep} · Range ${item.repMin}–${item.repMax} · +${item.increment}${item.unit}</div>
    </header>
    <div class="rows">${item.rows.map(row => rowTemplate(item, row)).join('')}</div>
    <div class="card-actions">
      <button class="action quiet" data-action="add-buildup" data-exercise-id="${item.id}">+ BUILDUP</button>
      <button class="action primary" data-action="complete-lift" data-exercise-id="${item.id}">${item.done ? 'DONE' : 'COMPLETE'}</button>
    </div>
    ${state.rebuildMode ? `<div class="rebuild-panel">
      <div>Best at this weight: ${item.bestRepAtWeight || 0}</div>
      <div>Progress rule: target holds after misses; load only jumps when every work set hits ${item.repMax}.</div>
      <div>Build-ups: ${item.rows.filter(r => r.kind === 'buildup').length}; not counted for progression.</div>
    </div>` : ''}
  </article>`;
}
function rowTemplate(item, row) {
  return `<div class="row ${row.kind === 'buildup' ? 'buildup' : 'work'}">
    <div class="row-label">${escapeHtml(row.label || row.kind)}</div>
    <label class="input-shell"><input inputmode="decimal" value="${escapeHtml(row.weight)}" data-action="update-row" data-exercise-id="${item.id}" data-row-id="${row.id}" data-field="weight" /><span class="unit">${escapeHtml(row.unit || item.unit)}</span></label>
    <label class="input-shell"><input inputmode="numeric" value="${escapeHtml(row.reps)}" data-action="update-row" data-exercise-id="${item.id}" data-row-id="${row.id}" data-field="reps" /><span class="unit">reps</span></label>
  </div>`;
}
function simpleCard(item) {
  const prescription = item.type === 'prep' ? item.prescription : item.type === 'time' ? `${item.sets} × ${item.seconds}${item.unit}` : `${item.sets} × ${item.reps}${item.unit ? ' ' + item.unit : ''}`;
  return `<article class="card ${item.done ? 'done' : ''}">
    <header class="card-head"><p class="family">${escapeHtml(item.family)}</p><h2 class="exercise-title">${escapeHtml(item.name)}</h2></header>
    <div class="simple-body"><div class="simple-main"><div class="simple-prescription">${escapeHtml(prescription)}</div><div>${escapeHtml(item.intensity || '')}</div></div><button class="action primary" data-action="complete-simple" data-exercise-id="${item.id}">${item.done ? 'DONE' : 'DONE'}</button></div>
  </article>`;
}

function monthScreen() {
  const r = state.monthResults;
  return `<section class="hero">
    <p class="kicker">Month ${state.currentMonthIndex}</p>
    <h1 class="title">RESULTS</h1>
    <p class="note">End-of-month view. Build next month here; every second generated month is deload.</p>
  </section>
  <section class="month-grid">
    ${stat(r.sessionsDone, 'sessions')}${stat(r.exercisesDone, 'exercises')}${stat(r.progressed, 'progressed')}${stat(r.misses, 'misses held')}${stat(r.held, 'held')}${stat(r.buildups, 'build-ups')}
  </section>
  <div class="month-actions">
    <button class="action primary" data-action="build-next-month">BUILD NEXT MONTH</button>
    <button class="action" data-action="export-data">EXPORT DATA</button>
    <button class="action quiet" data-action="reset">RESET</button>
  </div>
  <section class="history">${state.history.length ? state.history.slice(0, 18).map(h => `<div class="history-item">${escapeHtml(h.label)}<div class="history-time">${fmtDate(h.at)}</div></div>`).join('') : '<div class="history-item">No history yet.</div>'}</section>`;
}
function stat(value, label) { return `<div class="stat"><div class="stat-value">${escapeHtml(value)}</div><div class="stat-label">${escapeHtml(label)}</div></div>`; }
function ioDialog() {
  return `<div class="dialog ${showIo ? 'show' : ''}"><div class="sheet"><h2>EXPORT / IMPORT</h2><p>Copy this JSON somewhere safe. Paste saved JSON here and hit Import to restore.</p><textarea id="ioText">${escapeHtml(ioText)}</textarea><div class="card-actions" style="padding:12px 0 0"><button class="action" data-action="close-io">CLOSE</button><button class="action primary" data-action="import-data">IMPORT</button></div></div></div>`;
}

function bindEvents() {
  document.querySelectorAll('[data-action]').forEach(el => {
    const action = el.dataset.action;
    if (action === 'update-row') {
      el.addEventListener('change', ev => updateRow(el.dataset.exerciseId, el.dataset.rowId, el.dataset.field, ev.target.value));
      el.addEventListener('blur', ev => updateRow(el.dataset.exerciseId, el.dataset.rowId, el.dataset.field, ev.target.value));
      return;
    }
    el.addEventListener('click', () => handleAction(el));
  });
}
function handleAction(el) {
  const action = el.dataset.action;
  if (action === 'workout') { screen = 'workout'; render(); }
  if (action === 'toggle-screen') { screen = screen === 'month' ? 'workout' : 'month'; render(); }
  if (action === 'toggle-rebuild') { commit({ ...state, rebuildMode: !state.rebuildMode }); }
  if (action === 'goto-session') { commit({ ...state, currentSessionIndex: Number(el.dataset.index) }); }
  if (action === 'add-buildup') addBuildupRow(el.dataset.exerciseId);
  if (action === 'complete-lift') completeLift(el.dataset.exerciseId);
  if (action === 'complete-simple') completeSimple(el.dataset.exerciseId);
  if (action === 'next-workout') nextWorkout();
  if (action === 'build-next-month') buildNextMonth();
  if (action === 'reset') resetProgram();
  if (action === 'export-data') exportData();
  if (action === 'close-io') { showIo = false; render(); }
  if (action === 'import-data') importData();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
render();
