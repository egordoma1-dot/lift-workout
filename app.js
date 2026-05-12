// p.32.2 recovery: old iPhone service-worker cache can keep serving a broken app.js.
(async function clearOldLiftCaches() {
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => String(k).startsWith('lift-')).map(k => caches.delete(k)));
    }
    if (navigator.serviceWorker?.getRegistrations) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(reg => reg.unregister().catch(() => null)));
    }
  } catch {}
})();
const APP_VERSION = 'v0.2 p.41';
// Same key as p.4/p.5 so the Home Screen app keeps existing workout data after a GitHub Pages update.
const STORAGE_KEY = 'lift.v0.1.p4.program';
const PROGRAM_START_WEEK = '2025-12-08';

const ui = {
  screen: 'workout',
  settingsExerciseId: null,
  backupOpen: false,
  backupText: '',
  toast: '',
  forceWorkout: false,
  monthWeek: null,
  replaySessionId: null,
  blockSettingsOpen: false,
  selectedDate: localIsoDate(new Date()),
  activeDate: null,
  calendarMonth: localIsoDate(new Date()).slice(0, 7),
  weekStripScrollLeft: 0,
  weekStripTargetDate: localIsoDate(new Date()),
  calendarMenuDate: null,
  calendarChangeDate: null,
  editingSessionNote: false,
  noteDraft: '',
  editingExerciseNoteId: null,
  exerciseNoteDraft: '',
  globalSettingsOpen: false,
  globalSettingsInfo: null,
  updateMessage: '',
  updateBusy: false,
  updateDrag: false
};

let toastTimer = null;
function setToast(message = '', duration = 2000) {
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
  ui.toast = message || '';
  if (ui.toast && duration > 0) {
    toastTimer = setTimeout(() => {
      ui.toast = '';
      toastTimer = null;
      render();
    }, duration);
  }
}

const seedProgram = {
  schemaVersion: 5,
  currentMonthIndex: 1,
  currentBlockIndex: 1,
  currentWeekIndex: 23,
  blockStartedOn: PROGRAM_START_WEEK,
  deloadWeek: 8,
  deloadAppliedForBlock: false,
  preDeloadSessions: null,
  currentSessionIndex: 0,
  sessionDrafts: {},
  rebuildMode: false,
  history: [],
  sessions: [
    {
      id: 'w22-upper-a', title: 'UPPER A', source: 'Week 22 / 4.05 style', intensity: 'PRE 9',
      notes: '',
      exercises: [
        prep('Bike', '5 min', 'mid'),
        lift('db-y-raise', 'Db Y-Raise', 'shoulders', 2, 12, 15, 5, 'kg', 1, [12, 12], 13),
        lift('flat-bench', 'Flat Bench', 'chest', 3, 6, 8, 60, 'kg', 2.5, [8, 7, 6], 8, [buildup(20, 'kg', 20), buildup(40, 'kg', 10), buildup(50, 'kg', 5)]),
        lift('wide-pull-up', 'Wide Pull-Up', 'back', 2, 6, 10, 10, 'kg', 2.5, [4, 8], 9, [buildup(0, 'kg', 8), buildup(5, 'kg', 8)]),
        lift('db-preach-curl', 'Db Preach Curl', 'biceps', 1, 6, 10, 13.5, 'kg', 2.5, [6], 7, [buildup(11, 'kg', 10)]),
        lift('pec-deck', 'Pec Deck', 'chest', 2, 12, 15, 30, 'kg', 2.5, [15, 15], 15),
        lift('sup-db-row', 'Sup Db Row', 'back', 2, 8, 12, 18.5, 'kg', 2.5, [10, 10], 11, [buildup(16, 'kg', 12)]),
        lift('cab-kickback', 'Cab Kickback', 'triceps', 2, 10, 15, 15, 'kg', 2.5, [12, 12], 13),
        lift('neck-curl-ext', 'Neck Curl & Extension', 'neck', 1, 12, 20, 5, 'kg', 1, [12], 13, [buildup(0, 'kg', 20)])
      ]
    },
    {
      id: 'w22-lower-a', title: 'LOWER + CORE A', source: 'Week 22 / 5.05 style', intensity: 'RPE 6–7',
      notes: '',
      exercises: [
        prep('Bike', '5 min', 'easy'), body('Bird Dog', 'core', 2, 8, 'each'), timeHold('Side Plank', 'core', 2, 30, 's'),
        lift('pallof-press', 'Pallof Press', 'abs', 2, 10, 15, 2, 'pl', 1, [12, 12], 13, [buildup(1, 'pl', 12)]),
        lift('hip-add', 'Hip Add', 'adductors', 2, 10, 15, 4, 'pl', 1, [12, 12], 13),
        lift('hip-abd', 'Hip Abd', 'glutes', 3, 10, 15, 5, 'pl', 1, [12, 12, 12], 13),
        lift('glute-bridge', 'Glute Bridge', 'glutes', 3, 8, 12, 18.5, 'kg', 2.5, [10, 10, 10], 11, [buildup(16, 'kg', 12)]),
        prep('Bike', '8 min', 'easy')
      ]
    },
    {
      id: 'w22-upper-b', title: 'UPPER B', source: 'Week 22 / 7.05 style', intensity: 'solid, not stupid',
      notes: '',
      exercises: [
        prep('Bike', '5 min', 'mid'),
        lift('dips', 'Dips', 'chest/triceps', 2, 8, 12, 10, 'kg', 2.5, [10, 10], 11, [buildup(0, 'kg', 10), buildup(5, 'kg', 10)]),
        lift('wide-pull-up', 'Wide Pull-Up', 'back', 2, 6, 10, 10, 'kg', 2.5, [8, 8], 9, [buildup(0, 'kg', 8), buildup(5, 'kg', 8)]),
        lift('db-ham-curl', 'Db Ham Curl', 'biceps/forearm', 1, 6, 10, 13.5, 'kg', 2.5, [8], 9, [buildup(10, 'kg', 12)]),
        lift('sup-db-row', 'Sup Db Rows', 'back', 2, 8, 12, 18.5, 'kg', 2.5, [10, 10], 11, [buildup(16, 'kg', 10)]),
        lift('pec-deck', 'Pec Deck', 'chest', 2, 12, 15, 30, 'kg', 2.5, [15, 15], 15),
        lift('rope-upright-row', 'Rope Upright Row', 'shoulders/traps', 2, 10, 15, 25, 'kg', 2.5, [13, 13], 14),
        lift('face-pull', 'Face Pull', 'rear delts', 2, 10, 15, 35, 'kg', 2.5, [13, 13], 14),
        lift('pushdowns', 'Pushdowns', 'triceps', 2, 8, 12, 45, 'kg', 2.5, [12, 8], 12),
        lift('neck-curl-ext', 'Neck Curl & Extension', 'neck', 1, 12, 20, 5, 'kg', 1, [12], 13, [buildup(0, 'kg', 20)])
      ]
    },
    {
      id: 'w22-lower-b', title: 'LOWER + CORE B', source: 'Week 22 / 8.05 style', intensity: 'RPE 6–7',
      notes: '',
      exercises: [
        prep('Bike', '5 min', 'easy'), body('Dead Bug', 'core', 2, 11, 'each'), timeHold('Side Plank', 'core', 2, 30, 's each'),
        lift('pallof-press', 'Pallof Press', 'abs', 2, 10, 15, 2, 'pl', 1, [12, 12], 13),
        lift('hip-add', 'Hip Add', 'adductors', 2, 10, 15, 4, 'pl', 1, [12, 12], 13),
        lift('hip-abd', 'Hip Abd', 'glutes', 4, 10, 15, 5, 'pl', 1, [12, 12, 12, 12], 13),
        lift('glute-bridge', 'Glute Bridge', 'glutes', 4, 8, 12, 18.5, 'kg', 2.5, [10, 10, 10, 10], 11, [buildup(16, 'kg', 12)]),
        prep('Bike', '8 min', 'easy')
      ]
    },
    {
      id: 'w22-arm-sh', title: 'ARM + SH', source: 'Week 22 / 9.05 style', intensity: 'RPE 7',
      notes: '',
      exercises: [
        prep('Bike', '5 min', 'easy'),
        lift('lean-in-lat-raise', 'Lean-In Db Lat Raise', 'shoulders', 2, 10, 15, 5, 'kg', 1, [12, 12], 13),
        lift('sh-press', 'Sh. Press', 'shoulders', 3, 8, 12, 16, 'kg', 2.5, [8, 10, 10], 11, [buildup(13.5, 'kg', 12)]),
        lift('sup-zott-curl', 'Sup Zott Curl', 'biceps/forearm', 1, 6, 10, 13.5, 'kg', 2.5, [6], 7, [buildup(10, 'kg', 12)]),
        lift('rear-db-fly', 'Rear Db Fly', 'rear delts', 2, 10, 15, 5, 'kg', 1, [10, 10], 11),
        lift('cab-kickback', 'Cab Kickback', 'triceps', 2, 8, 12, 15, 'kg', 2.5, [10, 9], 11),
        lift('bayesian-curl', 'Bayesian Curl', 'biceps', 2, 10, 15, 15, 'kg', 2.5, [12, 12], 13),
        lift('wrist-curl', 'Wrist Curl', 'forearms', 1, 12, 20, 8, 'kg', 1, [18], 19, [buildup(6, 'kg', 18)]),
        lift('wrist-extension', 'Wrist Extension', 'forearms', 2, 12, 20, 0, 'kg', 1, [13, 13], 14),
        lift('neck-curl-ext', 'Neck Curl & Extension', 'neck', 1, 12, 20, 5, 'kg', 1, [12], 13, [buildup(0, 'kg', 20)])
      ]
    }
  ]
};

const WEEK_PLAN = [
  { day: 'MON', kind: 'workout', sessionIndex: 0, title: 'UPPER A' },
  { day: 'TUE', kind: 'workout', sessionIndex: 1, title: 'LOWER + CORE A' },
  { day: 'WED', kind: 'rest', title: 'REST' },
  { day: 'THU', kind: 'workout', sessionIndex: 2, title: 'UPPER B' },
  { day: 'FRI', kind: 'workout', sessionIndex: 3, title: 'LOWER + CORE B' },
  { day: 'SAT', kind: 'workout', sessionIndex: 4, title: 'ARM + SH' },
  { day: 'SUN', kind: 'rest', title: 'REST' }
];

let state = syncCalendarState(loadState());
if (!ui.monthWeek) ui.monthWeek = state.currentWeekIndex || 1;
saveState();

function lift(id, name, family, sets, repMin, repMax, weight, unit, increment, reps, targetRep, buildups = []) {
  unit = cleanUnit(unit);
  const workRows = Array.from({ length: sets }, (_, i) => makeWorkRow(id, i + 1, weight, unit, reps[i] ?? targetRep ?? repMin));
  return {
    id, exerciseKey: id, type: 'lift', name, family, sets, repMin, repMax, weight, unit, increment, targetRep,
    tracked: true, note: '', bestRepAtWeight: Math.max(0, ...reps.map(n => Number(n) || 0)),
    done: false, historyLog: [], lastCompletion: null, rows: [...buildups, ...workRows]
  };
}
function makeWorkRow(exerciseId, index, weight, unit, reps = '') {
  return { id: uid(`${exerciseId}-work-${index}`), kind: 'work', label: `SET ${index}`, weight, unit: cleanUnit(unit), reps, complete: false };
}
function buildup(weight, unit, reps) { return { id: uid('buildup'), kind: 'buildup', label: 'BUILDUP', weight, unit: cleanUnit(unit), reps, complete: false }; }
function prep(name, prescription, intensity = '') { return { id: uid(`prep-${slug(name)}`), type: 'prep', name, family: 'prep', prescription, intensity, done: false, note: '' }; }
function body(name, family, sets, reps, unit = '') { return { id: uid(`body-${slug(name)}`), type: 'body', name, family, sets, reps, unit, done: false, note: '' }; }
function timeHold(name, family, sets, seconds, unit = 's') { return { id: uid(`time-${slug(name)}`), type: 'time', name, family, sets, seconds, unit, done: false, note: '' }; }
function uid(prefix = 'id') { return `${prefix}-${Math.random().toString(36).slice(2, 8)}`; }
function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return migrateState(raw ? JSON.parse(raw) : clone(seedProgram));
  } catch {
    return clone(seedProgram);
  }
}
function migrateState(input) {
  const base = clone(seedProgram);
  const next = input && typeof input === 'object' ? input : base;
  const previousSchema = Number(next.schemaVersion || 0);
  next.schemaVersion = 6;
  next.currentMonthIndex = Number.isFinite(Number(next.currentMonthIndex)) ? Number(next.currentMonthIndex) : 1;
  next.currentBlockIndex = Number.isFinite(Number(next.currentBlockIndex)) ? Number(next.currentBlockIndex) : Number(next.currentMonthIndex || 1);
  next.currentWeekIndex = Number.isFinite(Number(next.currentWeekIndex)) ? Number(next.currentWeekIndex) : 23;
  if (previousSchema < 6) next.blockStartedOn = PROGRAM_START_WEEK;
  next.blockStartedOn = next.blockStartedOn || PROGRAM_START_WEEK;
  next.deloadWeek = clampInt(next.deloadWeek, 1, 8, 8);
  next.deloadAppliedForBlock = Boolean(next.deloadAppliedForBlock);
  next.preDeloadSessions = next.preDeloadSessions || null;
  next.manualWorkout = null;
  next.sessionDrafts = next.sessionDrafts && typeof next.sessionDrafts === 'object' ? next.sessionDrafts : {};
  Object.keys(next.sessionDrafts).forEach(key => {
    const draft = next.sessionDrafts[key];
    if (!draft || !draft.session) delete next.sessionDrafts[key];
    else draft.session = migrateSession(draft.session, next.sessions?.[draft.sessionIndex] || base.sessions?.[draft.sessionIndex] || base.sessions[0]);
  });
  next.calendar = next.calendar && typeof next.calendar === 'object' ? next.calendar : { days: {} };
  next.calendar.days = next.calendar.days && typeof next.calendar.days === 'object' ? next.calendar.days : {};
  next.currentSessionIndex = clampInt(next.currentSessionIndex, 0, Math.max(0, (next.sessions || base.sessions).length - 1), 0);
  next.rebuildMode = Boolean(next.rebuildMode);
  next.history = Array.isArray(next.history) ? next.history : [];
  next.sessions = Array.isArray(next.sessions) && next.sessions.length ? next.sessions : base.sessions;
  next.sessions = next.sessions.map((session, sessionIndex) => migrateSession(session, base.sessions[sessionIndex] || base.sessions[0]));
  return next;
}
function migrateSession(session, seedSession) {
  const next = { ...seedSession, ...session };
  const oldDefaultNotes = new Set([
    'Current workout only. Build-ups are separate. Shoulder: do not hero-lift through weirdness.',
    'Back-friendly lower/core. Keep it clean, not heroic.',
    'Dips + pull-up day. Ropes/face pull cluster lives here.',
    'Repeat lower/core pattern, small rep targets only.',
    'Shoulders/arms with strict build-ups and no ego jumps.'
  ]);
  if (oldDefaultNotes.has(next.notes)) next.notes = '';
  next.exercises = Array.isArray(session.exercises) && session.exercises.length ? session.exercises : seedSession.exercises;
  next.exercises = next.exercises.map((item, itemIndex) => migrateExercise(item, seedSession.exercises[itemIndex] || {}));
  return next;
}
function migrateExercise(item, seed = {}) {
  const next = { ...seed, ...item };
  next.id = next.id || seed.id || uid(slug(next.name || 'exercise'));
  next.exerciseKey = next.exerciseKey || seed.exerciseKey || next.id || slug(next.name || 'exercise');
  next.name = next.name || seed.name || 'Exercise';
  next.family = next.family || seed.family || 'general';
  next.done = Boolean(next.done);
  next.note = next.note || '';
  if (next.type !== 'lift') return next;
  next.tracked = next.tracked !== false;
  next.repMin = numberOr(next.repMin, seed.repMin, 8);
  next.repMax = numberOr(next.repMax, seed.repMax, 12);
  next.weight = numberOr(next.weight, seed.weight, 0);
  next.unit = cleanUnit(next.unit || seed.unit || 'kg');
  next.increment = numberOr(next.increment, seed.increment, 1);
  next.targetRep = numberOr(next.targetRep, seed.targetRep, next.repMin);
  next.bestRepAtWeight = numberOr(next.bestRepAtWeight, seed.bestRepAtWeight, 0);
  next.historyLog = Array.isArray(next.historyLog) ? next.historyLog : [];
  next.lastCompletion = next.lastCompletion || null;
  next.rows = Array.isArray(next.rows) && next.rows.length ? next.rows : (seed.rows || []);
  next.rows = next.rows.map((row, index) => ({
    id: row.id || uid(`${next.id}-row-${index}`),
    kind: row.kind === 'buildup' ? 'buildup' : 'work',
    label: row.label || (row.kind === 'buildup' ? 'BUILDUP' : `SET ${index + 1}`),
    weight: cleanNumber(row.weight ?? next.weight),
    unit: cleanUnit(row.unit || next.unit),
    reps: cleanNumber(row.reps ?? ''),
    complete: Boolean(row.complete)
  }));
  return normalizeWorkRows(next);
}
function numberOr(...values) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}
function cleanUnit(value) {
  const unit = String(value || '').toLowerCase().trim();
  if (unit === 'lbs' || unit === 'lb') return 'lbs';
  if (unit === 'pl' || unit === 'pin') return 'pl';
  return 'kg';
}
function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function commit(next, toast = '') {
  state = syncCalendarState(migrateState(next));
  setToast(toast);
  saveState();
  render();
}

function mondayWeekIndex(date = new Date()) { return (date.getDay() + 6) % 7; }
function todayPlan(date = new Date()) { return WEEK_PLAN[mondayWeekIndex(date)] || WEEK_PLAN[0]; }
function defaultPlanForIso(iso) { return todayPlan(parseIsoDate(iso)); }
function planForDateIso(iso, sourceState = state) {
  if (isNoDataDate(iso, sourceState)) return { day: weekdayLabel(iso), kind: 'nodata', title: 'NO DATA!' };
  const override = sourceState?.calendar?.days?.[iso];
  if (override) {
    if (override.kind === 'rest') return { day: weekdayLabel(iso), kind: 'rest', title: 'REST' };
    const index = clampInt(override.sessionIndex, 0, Math.max(0, (sourceState.sessions || []).length - 1), 0);
    const session = sourceState.sessions?.[index];
    return { day: weekdayLabel(iso), kind: 'workout', sessionIndex: index, title: session?.title || override.title || 'WORKOUT' };
  }
  return defaultPlanForIso(iso);
}
function weekdayLabel(iso) { return ['SUN','MON','TUE','WED','THU','FRI','SAT'][parseIsoDate(iso).getDay()] || ''; }
function activeDateIso() { return ui.activeDate || localIsoDate(new Date()); }
function selectedDateIso() { return ui.selectedDate || localIsoDate(new Date()); }
function localIsoDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function parseIsoDate(iso) {
  const [y, m, d] = String(iso || '').split('-').map(Number);
  return new Date(y || new Date().getFullYear(), (m || 1) - 1, d || 1);
}
function addDays(dateOrIso, days) {
  const d = typeof dateOrIso === 'string' ? parseIsoDate(dateOrIso) : new Date(dateOrIso);
  d.setDate(d.getDate() + Number(days || 0));
  return d;
}
function startOfWeekIso(date = new Date()) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - mondayWeekIndex(d));
  return localIsoDate(d);
}
function daysBetween(startIso, endIso) {
  const a = parseIsoDate(startIso); a.setHours(12,0,0,0);
  const b = parseIsoDate(endIso); b.setHours(12,0,0,0);
  return Math.round((b - a) / 86400000);
}
function programWeekForDate(nextState = state, date = new Date()) {
  const start = startOfWeekIso(parseIsoDate(nextState.blockStartedOn || PROGRAM_START_WEEK));
  const currentMonday = startOfWeekIso(date);
  return Math.floor(daysBetween(start, currentMonday) / 7) + 1;
}
function isNoDataDate(iso, sourceState = state) {
  return programWeekForDate(sourceState, parseIsoDate(iso)) < 1;
}
function deloadEvery(nextState = state) {
  return Math.max(1, Number(nextState.deloadWeek || nextState.deloadInterval || 8));
}
function isDeloadWeekNumber(week, nextState = state) {
  return Number(week) >= 1 && Number(week) % deloadEvery(nextState) === 0;
}
function isDeloadDate(iso, nextState = state) {
  return isDeloadWeekNumber(programWeekForDate(nextState, parseIsoDate(iso)), nextState);
}
function weekLabelForDate(iso = activeDateIso()) {
  const week = programWeekForDate(state, parseIsoDate(iso));
  if (week < 1) return 'NO DATA!';
  return `WEEK ${week}${isDeloadWeekNumber(week) ? ', DELOAD' : ''}`;
}
function sessionDateFor(weekIndex = state.currentWeekIndex, planOrIndex = todayPlan()) {
  const dayIndex = typeof planOrIndex === 'number' ? planOrIndex : WEEK_PLAN.indexOf(planOrIndex);
  return localIsoDate(addDays(state.blockStartedOn, (Number(weekIndex || 1) - 1) * 7 + Math.max(0, dayIndex)));
}
function displayDate(iso) {
  try { return parseIsoDate(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }); }
  catch { return String(iso || ''); }
}
function currentWeekIsDeload(nextState = state) { return isDeloadWeekNumber(Number(nextState.currentWeekIndex || 1), nextState); }
function syncCalendarState(nextState, date = new Date()) {
  let next = migrateStateShallow(nextState);
  next.calendar = next.calendar && typeof next.calendar === 'object' ? next.calendar : { days: {} };
  next.calendar.days = next.calendar.days && typeof next.calendar.days === 'object' ? next.calendar.days : {};
  const week = programWeekForDate(next, date);
  const todayIso = localIsoDate(date);
  const plan = planForDateIso(todayIso, next);
  next = { ...next, currentWeekIndex: week, lastAutoDay: todayIso, manualWorkout: null };
  if (plan.kind === 'workout' && !ui.forceWorkout && !ui.activeDate) {
    next.currentSessionIndex = clampInt(plan.sessionIndex, 0, Math.max(0, (next.sessions || []).length - 1), 0);
  }
  return next;
}
function migrateStateShallow(next) { return next && typeof next === 'object' ? next : clone(seedProgram); }
function planForSessionIndex(sessionIndex) { return WEEK_PLAN.find(p => p.kind === 'workout' && p.sessionIndex === sessionIndex); }
function nextScheduledWorkout(fromIndex = mondayWeekIndex()) {
  for (let step = 1; step <= WEEK_PLAN.length; step += 1) {
    const plan = WEEK_PLAN[(fromIndex + step) % WEEK_PLAN.length];
    if (plan.kind === 'workout') return plan;
  }
  return WEEK_PLAN.find(p => p.kind === 'workout');
}
function activeManualWorkout() {
  return state.manualWorkout && state.manualWorkout.date === localIsoDate(new Date()) ? state.manualWorkout : null;
}
function workoutDateForCurrent(plan = planForSessionIndex(state.currentSessionIndex)) {
  return activeDateIso();
}
function workoutMoveLabel() { return ''; }
function weekStatusFor(index, weekIndex = state.currentWeekIndex) {
  const currentWeek = Number(state.currentWeekIndex || 1);
  if (Number(weekIndex) < currentWeek) return 'past';
  if (Number(weekIndex) > currentWeek) return 'future';
  const today = mondayWeekIndex();
  if (index < today) return 'past';
  if (index === today) return 'today';
  return 'future';
}
function sessionEventForDate(date, plan) {
  if (!plan || plan.kind !== 'workout') return null;
  return (state.history || []).find(h => h.scope === 'session' && h.sessionDate === date && h.sessionIndex === plan.sessionIndex && h.type === 'session-done') || null;
}
function sessionSkipEventForDate(date, plan) {
  if (!plan || plan.kind !== 'workout') return null;
  return (state.history || []).find(h => h.scope === 'session' && h.sessionDate === date && h.sessionIndex === plan.sessionIndex && h.type === 'session-skipped') || null;
}
function sessionDoneForDate(date, plan) { return Boolean(sessionEventForDate(date, plan)); }
function sessionSkippedForDate(date, plan) { return Boolean(sessionSkipEventForDate(date, plan)); }
function sessionMissedForDate(date, plan) {
  if (!plan || plan.kind !== 'workout') return false;
  return date < localIsoDate(new Date()) && !sessionDoneForDate(date, plan) && !sessionSkippedForDate(date, plan);
}
function dateStatus(date, plan) {
  const today = localIsoDate(new Date());
  if (date === today) return 'today';
  if (date < today) return 'past';
  return 'future';
}
function sessionEventFor(plan, weekIndex = state.currentWeekIndex) {
  if (!plan || plan.kind !== 'workout') return null;
  const date = sessionDateFor(weekIndex, plan);
  return (state.history || []).find(h => h.scope === 'session' && h.sessionDate === date && h.sessionIndex === plan.sessionIndex && h.type === 'session-done') || null;
}
function sessionSkipEventFor(plan, weekIndex = state.currentWeekIndex) {
  if (!plan || plan.kind !== 'workout') return null;
  const date = sessionDateFor(weekIndex, plan);
  return (state.history || []).find(h => h.scope === 'session' && h.sessionDate === date && h.sessionIndex === plan.sessionIndex && h.type === 'session-skipped') || null;
}
function sessionDoneFor(plan, weekIndex = state.currentWeekIndex) {
  return Boolean(sessionEventFor(plan, weekIndex));
}
function sessionSkippedFor(plan, weekIndex = state.currentWeekIndex) {
  return Boolean(sessionSkipEventFor(plan, weekIndex));
}
function sessionMissedFor(plan, status, weekIndex = state.currentWeekIndex) {
  return plan && plan.kind === 'workout' && status === 'past' && !sessionDoneFor(plan, weekIndex) && !sessionSkippedFor(plan, weekIndex);
}
function statusLabel(plan, status, weekIndex = state.currentWeekIndex) {
  if (status === 'today') return plan.kind === 'rest' ? 'REST!' : 'TODAY';
  if (plan.kind === 'rest') return 'REST';
  if (sessionDoneFor(plan, weekIndex)) return 'DONE';
  if (sessionSkippedFor(plan, weekIndex)) return 'SKIPPED';
  if (status === 'past') return 'MISSED';
  return status === 'future' ? 'FUTURE' : '';
}
function lastSessionEvent() {
  return (state.history || []).find(h => h.scope === 'session' && h.type === 'session-done') || null;
}
function isActiveDateNoDataPage() {
  const plan = planForDateIso(activeDateIso());
  return plan.kind === 'nodata';
}
function isActiveDateRestPage() {
  const plan = planForDateIso(activeDateIso());
  return plan.kind === 'rest' && !ui.forceWorkout;
}

function activeSessionIndex(date = activeDateIso(), sourceState = state) {
  const plan = planForDateIso(date, sourceState);
  if (plan?.kind === 'workout') {
    return clampInt(plan.sessionIndex, 0, Math.max(0, (sourceState.sessions || []).length - 1), 0);
  }
  return clampInt(sourceState.currentSessionIndex, 0, Math.max(0, (sourceState.sessions || []).length - 1), 0);
}

function sessionDraftKey(date = activeDateIso(), sessionIndex = activeSessionIndex(date)) { return `${date}::${sessionIndex}`; }
function draftFor(date = activeDateIso(), sessionIndex = activeSessionIndex(date, state), sourceState = state) {
  return sourceState.sessionDrafts?.[sessionDraftKey(date, sessionIndex)] || null;
}
function sessionFor(date = activeDateIso(), sessionIndex = activeSessionIndex(date, sourceState), sourceState = state) {
  return draftFor(date, sessionIndex, sourceState)?.session || sourceState.sessions?.[sessionIndex] || sourceState.sessions?.[0];
}
function currentSession() { return sessionFor(activeDateIso(), activeSessionIndex(activeDateIso()), state); }
function selectedDateHasDraft(iso, plan = planForDateIso(iso)) { return Boolean(plan?.kind === 'workout' && draftFor(iso, plan.sessionIndex)); }
function completion(session) {
  const total = session?.exercises?.length || 0;
  const done = session?.exercises?.filter(ex => ex.done).length || 0;
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}
function updateCurrentSession(updater, toast = '') {
  const date = activeDateIso();
  const sessionIndex = activeSessionIndex(date);
  const base = sessionFor(date, sessionIndex, state);
  const updated = updater(clone(base));
  const sessionDrafts = { ...(state.sessionDrafts || {}), [sessionDraftKey(date, sessionIndex)]: { date, sessionIndex, session: updated, updatedAt: new Date().toISOString() } };
  commit({ ...state, sessionDrafts }, toast);
}
function startSessionNoteEdit() {
  ui.editingSessionNote = true;
  ui.noteDraft = currentSession()?.notes || '';
  render();
}
function saveSessionNote(raw) {
  const date = activeDateIso();
  const sessionIndex = activeSessionIndex(date);
  const note = String(raw ?? '').trim();
  const sessions = (state.sessions || []).map((session, i) => i === sessionIndex ? { ...session, notes: note } : session);
  const updated = { ...clone(sessionFor(date, sessionIndex, state)), notes: note };
  const sessionDrafts = { ...(state.sessionDrafts || {}), [sessionDraftKey(date, sessionIndex)]: { date, sessionIndex, session: updated, updatedAt: new Date().toISOString() } };
  ui.editingSessionNote = false;
  ui.noteDraft = '';
  commit({ ...state, sessions, sessionDrafts }, 'note saved');
}
function startExerciseNoteEdit(exerciseId) {
  const ex = (currentSession()?.exercises || []).find(item => item.id === exerciseId);
  ui.editingExerciseNoteId = exerciseId;
  ui.exerciseNoteDraft = ex?.note || '';
  render();
}
function saveExerciseNote(exerciseId, raw) {
  const note = String(raw ?? '').trim();
  ui.editingExerciseNoteId = null;
  ui.exerciseNoteDraft = '';
  updateExercise(exerciseId, ex => ({ ...ex, note, done: false }), 'saved');
}
function updateExercise(exerciseId, updater, toast = '') {
  updateCurrentSession(session => ({ ...session, exercises: session.exercises.map(ex => ex.id === exerciseId ? updater(ex) : ex) }), toast);
}
function completeExerciseGesture(exerciseId) {
  const ex = findExercise(exerciseId);
  if (!ex) return;
  if (ex.type === 'lift') completeLift(exerciseId);
  else completeSimple(exerciseId);
}
function toggleExerciseSettingsGesture(exerciseId) {
  ui.settingsExerciseId = ui.settingsExerciseId === exerciseId ? null : exerciseId;
  render();
}
function reorderExerciseGesture(exerciseId, toIndex) {
  const session = currentSession();
  const exercises = session?.exercises || [];
  const fromIndex = exercises.findIndex(ex => ex.id === exerciseId);
  if (fromIndex < 0) return;
  const maxIndex = Math.max(0, exercises.length - 1);
  const targetIndex = Math.max(0, Math.min(maxIndex, Number(toIndex)));
  if (targetIndex === fromIndex) return render();
  updateCurrentSession(s => {
    const nextExercises = [...s.exercises];
    const [moved] = nextExercises.splice(fromIndex, 1);
    nextExercises.splice(targetIndex, 0, moved);
    return { ...s, exercises: nextExercises };
  }, '');
}
function updateRow(exerciseId, rowId, field, value) {
  updateExercise(exerciseId, ex => ({ ...ex, done: false, rows: ex.rows.map(row => row.id === rowId ? { ...row, [field]: cleanNumber(value) } : row) }));
}
function cleanNumber(value) {
  if (value === '' || value === null || value === undefined) return '';
  const n = Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : value;
}
function roundLoad(n) { return Math.round(Number(n) * 10) / 10; }

function workRows(ex) { return (ex.rows || []).filter(row => row.kind === 'work'); }
function buildupRows(ex) { return (ex.rows || []).filter(row => row.kind === 'buildup'); }
function exerciseIdentity(ex) { return String(ex?.exerciseKey || ex?.id || slug(ex?.name || 'exercise')).toLowerCase(); }
function exerciseIdentityForCurrent(exerciseId) { const ex = findExercise(exerciseId) || findAnyExercise(exerciseId); return ex ? exerciseIdentity(ex) : String(exerciseId || '').toLowerCase(); }
function findAnyExercise(exerciseId) {
  for (const session of state.sessions || []) {
    const hit = (session.exercises || []).find(ex => ex.id === exerciseId || ex.exerciseKey === exerciseId);
    if (hit) return hit;
  }
  return null;
}
function sameExercise(ex, exerciseIdOrKey) { return exerciseIdentity(ex) === exerciseIdentityForCurrent(exerciseIdOrKey); }
function normalizeWorkRows(ex) {
  let workNumber = 0;
  const rows = (ex.rows || []).map(row => {
    if (row.kind !== 'work') return { ...row, label: 'BUILDUP', unit: row.unit || ex.unit };
    workNumber += 1;
    return { ...row, label: `SET ${workNumber}`, unit: row.unit || ex.unit };
  });
  return { ...ex, sets: workNumber, rows };
}
function addWorkSetRow(exerciseId) {
  updateExercise(exerciseId, ex => {
    if (ex.type !== 'lift') return ex;
    const rows = ex.rows || [];
    const work = workRows(ex);
    const lastWork = work[work.length - 1];
    return normalizeWorkRows({
      ...ex,
      done: false,
      rows: [...rows, makeWorkRow(ex.id, work.length + 1, lastWork ? lastWork.weight : ex.weight, ex.unit, ex.targetRep || ex.repMin)]
    });
  }, '+ set added');
}
function addBuildupRow(exerciseId) {
  updateExercise(exerciseId, ex => {
    if (ex.type !== 'lift') return ex;
    const firstWorkIndex = ex.rows.findIndex(row => row.kind === 'work');
    const firstWork = ex.rows[firstWorkIndex] || { weight: ex.weight };
    const suggested = Math.max(0, roundLoad(Number(firstWork.weight || ex.weight) - Number(ex.increment || 1)));
    const rows = [...ex.rows];
    rows.splice(firstWorkIndex < 0 ? 0 : firstWorkIndex, 0, buildup(suggested, ex.unit, ex.repMin));
    return { ...ex, done: false, rows };
  }, '+ buildup added');
}
function deleteRow(exerciseId, rowId) {
  updateExercise(exerciseId, ex => {
    if (ex.type !== 'lift') return ex;
    const row = (ex.rows || []).find(r => r.id === rowId);
    if (!row) return ex;
    if (row.kind === 'work' && workRows(ex).length <= 1) return ex;
    return normalizeWorkRows({ ...ex, done: false, rows: ex.rows.filter(r => r.id !== rowId) });
  }, 'row deleted');
}
function updateLiftSetting(exerciseId, field, value) {
  updateExercise(exerciseId, ex => {
    if (ex.type !== 'lift') return ex;
    const numericFields = new Set(['increment']);
    const boolFields = new Set(['tracked']);
    let nextValue = value;
    if (numericFields.has(field)) nextValue = cleanNumber(value);
    if (boolFields.has(field)) nextValue = Boolean(value);
    if (field === 'unit') nextValue = cleanUnit(value);
    let next = { ...ex, [field]: nextValue, done: false };
    if (field === 'unit') {
      next.rows = next.rows.map(row => ({ ...row, unit: nextValue }));
    }
    return normalizeWorkRows(next);
  });
}
function updateSimpleSetting(exerciseId, field, value) {
  updateExercise(exerciseId, ex => {
    if (ex.type === 'lift') return ex;
    const numericFields = new Set(['sets', 'reps', 'seconds']);
    const nextValue = numericFields.has(field) ? cleanNumber(value) : value;
    return { ...ex, [field]: nextValue, done: false };
  });
}
function updateRepRange(exerciseId, value) {
  const raw = String(value || '').trim();
  const parts = raw.split(/[-–—\\s]+/).map(cleanNumber).filter(n => Number.isFinite(Number(n)));
  if (parts.length < 2) return;
  const min = Math.max(0, Number(parts[0]));
  const max = Math.max(min, Number(parts[1]));
  updateExercise(exerciseId, ex => {
    if (ex.type !== 'lift') return ex;
    const targetRep = Math.min(max, Math.max(min, Number(ex.targetRep || min)));
    return normalizeWorkRows({ ...ex, repMin: min, repMax: max, targetRep, done: false });
  });
}
function updateGlobalDeload(value) {
  const weeks = clampInt(value, 2, 24, 8);
  commit({ ...state, deloadWeek: weeks, deloadInterval: weeks }, 'saved');
}
function setPlannedSets(ex, count) {
  const targetCount = clampInt(count, 1, 10, ex.sets || 1);
  const buildups = buildupRows(ex);
  const work = workRows(ex);
  const nextWork = [...work];
  while (nextWork.length < targetCount) nextWork.push(makeWorkRow(ex.id, nextWork.length + 1, ex.weight, ex.unit, ex.targetRep));
  while (nextWork.length > targetCount) nextWork.pop();
  return { ...ex, sets: targetCount, rows: [...buildups, ...nextWork] };
}

function computeNextExercise(exercise) {
  if (!exercise || exercise.type !== 'lift') return { exercise, event: 'none', message: '' };
  if (exercise.tracked === false) return { exercise: { ...exercise, done: true }, event: 'untracked', message: `${exercise.name}: completed, not progression-tracked.` };

  const work = workRows(exercise);
  const reps = work.map(row => Number(row.reps)).filter(n => Number.isFinite(n) && n >= 0);
  if (reps.length === 0) return { exercise, event: 'no-data', message: `${exercise.name}: no work reps entered.` };

  const oldTarget = Number(exercise.targetRep || exercise.repMin);
  const oldBest = Number(exercise.bestRepAtWeight || 0);
  const maxRep = Math.max(...reps);
  const bestRepAtWeight = Math.max(oldBest, maxRep);
  const allTopRange = reps.length === work.length && reps.every(rep => rep >= Number(exercise.repMax));

  let next = { ...exercise, bestRepAtWeight, done: true };
  let event = 'held';
  let message = `${exercise.name}: target stays ${oldTarget}.`;
  let why = 'Held: no clean progression condition was met.';

  if (allTopRange) {
    const nextWeight = roundLoad(Number(exercise.weight) + Number(exercise.increment || 0));
    next = {
      ...next,
      weight: nextWeight,
      targetRep: Number(exercise.repMin),
      bestRepAtWeight: 0,
      rows: exercise.rows.map(row => row.kind === 'work'
        ? { ...row, weight: nextWeight, reps: Number(exercise.repMin), complete: false }
        : { ...row, complete: false })
    };
    event = 'progressed-load';
    message = `${exercise.name}: load ${exercise.weight}${exercise.unit} → ${nextWeight}${exercise.unit}.`;
    why = `All work sets hit the top of range (${exercise.repMax}). Weight increased by the smallest allowed jump.`;
  } else if (maxRep >= oldTarget) {
    const nextTarget = Math.min(Number(exercise.repMax), Math.max(oldTarget + 1, maxRep + 1));
    next = {
      ...next,
      targetRep: nextTarget,
      rows: exercise.rows.map(row => row.kind === 'work'
        ? { ...row, reps: nextTarget, complete: false }
        : { ...row, complete: false })
    };
    event = nextTarget > oldTarget ? 'progressed-reps' : 'held-top';
    message = nextTarget > oldTarget ? `${exercise.name}: target ${oldTarget} → ${nextTarget}.` : `${exercise.name}: top target held until all sets hit ${exercise.repMax}.`;
    why = nextTarget > oldTarget
      ? `At least one work set matched/beat the target. Next target follows the best real set, not an imaginary plan.`
      : `You are at the top of the rep range, but not every set hit it, so weight does not jump yet.`;
  } else {
    next = {
      ...next,
      targetRep: oldTarget,
      rows: exercise.rows.map(row => row.kind === 'work'
        ? { ...row, reps: oldTarget, complete: false }
        : { ...row, complete: false })
    };
    event = 'missed-held';
    message = `${exercise.name}: miss logged. Target still ${oldTarget}.`;
    why = `Bad day recorded, target not lowered. Previous best/goal stays alive.`;
  }

  return { exercise: next, event, message, why, maxRep, reps, oldTarget };
}
function completeLift(exerciseId) {
  const source = findExercise(exerciseId);
  if (!source || source.type !== 'lift') return;
  if (source.done) {
    updateExercise(exerciseId, ex => ({ ...ex, done: false, draftCompletion: null }), 'exercise reopened');
    return;
  }
  const result = computeNextExercise(source);
  if (result.event === 'no-data') return toastOnly(result.message);
  updateExercise(exerciseId, ex => ({
    ...ex,
    done: true,
    draftCompletion: {
      type: result.event,
      label: result.message,
      why: result.why,
      targetBefore: ex.targetRep,
      targetAfter: result.exercise.targetRep,
      weightBefore: ex.weight,
      weightAfter: result.exercise.weight,
      reps: result.reps || workRows(ex).map(row => Number(row.reps)).filter(Number.isFinite),
      at: new Date().toISOString()
    }
  }), 'ready — progression commits on Finish Day');
}

function countFutureMatchingExercises(exerciseId) {
  return state.sessions.slice(state.currentSessionIndex + 1).reduce((count, session) => {
    return count + (session.exercises || []).filter(ex => ex.type === 'lift' && sameExercise(ex, exerciseId) && !ex.done).length;
  }, 0);
}

function propagateCompletionToWeek(exerciseId, completedExercise, progressionExercise) {
  return state.sessions.map((session, sessionIndex) => {
    if (sessionIndex < state.currentSessionIndex) return session;
    const exercises = session.exercises.map(ex => {
      if (ex.type !== 'lift' || !sameExercise(ex, exerciseId)) return ex;
      if (sessionIndex === state.currentSessionIndex) return completedExercise;
      if (ex.done) return ex;
      return applyWeekInnerProgression(ex, progressionExercise);
    });
    return { ...session, exercises };
  });
}

function applyWeekInnerProgression(futureEx, progressionEx) {
  const nextWeight = numberOr(progressionEx.weight, futureEx.weight, 0);
  const nextTarget = clampInt(progressionEx.targetRep, futureEx.repMin, futureEx.repMax, futureEx.targetRep);
  const nextBest = numberOr(progressionEx.bestRepAtWeight, futureEx.bestRepAtWeight, 0);
  const buildups = buildupRows(futureEx).map(row => ({ ...row, complete: false }));
  const existingWork = workRows(futureEx);
  const workCount = Math.max(1, futureEx.sets || existingWork.length || 1);
  const work = Array.from({ length: workCount }, (_, i) => ({
    ...(existingWork[i] || makeWorkRow(futureEx.id, i + 1, nextWeight, futureEx.unit, nextTarget)),
    label: `SET ${i + 1}`,
    weight: nextWeight,
    reps: nextTarget,
    complete: false
  }));
  return {
    ...futureEx,
    weight: nextWeight,
    targetRep: nextTarget,
    bestRepAtWeight: nextBest,
    done: false,
    lastCompletion: null,
    rows: [...buildups, ...work]
  };
}
function compactExerciseEvent(event) {
  return {
    at: event.at,
    type: event.type,
    label: event.label,
    why: event.why,
    weightBefore: event.weightBefore,
    weightAfter: event.weightAfter,
    targetBefore: event.targetBefore,
    targetAfter: event.targetAfter,
    reps: event.reps
  };
}
function reopenLift(exerciseId) {
  const source = findExercise(exerciseId);
  if (!source) return;
  const restore = source.lastCompletion?.before ? { ...clone(source.lastCompletion.before), done: false, lastCompletion: null } : { ...source, done: false, lastCompletion: null };
  const eventId = source.lastCompletion?.eventId;
  const sessions = state.sessions.map((s, i) => i === state.currentSessionIndex
    ? { ...s, exercises: s.exercises.map(ex => ex.id === exerciseId ? restore : ex) }
    : s
  );
  const history = eventId ? state.history.filter(h => h.id !== eventId) : state.history;
  commit({ ...state, sessions, history }, 'completion undone');
}
function completeSimple(exerciseId) {
  const source = findExercise(exerciseId);
  if (!source) return;
  const done = !source.done;
  updateExercise(exerciseId, ex => ({ ...ex, done, lastCompletion: null }), done ? 'done' : 'reopened');
}

function findExercise(exerciseId) {
  return currentSession()?.exercises?.find(ex => ex.id === exerciseId);
}
function toastOnly(message) { setToast(message); render(); }

function nextWorkout() {
  const sessionDate = activeDateIso();
  const sessionIndex = activeSessionIndex(sessionDate);
  const session = sessionFor(sessionDate, sessionIndex, state);
  const plan = planForDateIso(sessionDate);
  const scheduledDate = sessionDate;
  const manual = null;
  const snapshot = createSessionSnapshot(session, sessionDate);
  let sessions = clone(state.sessions);
  let events = [];
  const sourceSession = clone(session);

  (sourceSession.exercises || []).forEach(source => {
    if (source.type !== 'lift') return;
    if (!source.done) return;
    const result = computeNextExercise(source);
    if (result.event === 'no-data') return;
    const event = buildExerciseEvent(source, result, session, sessionDate);
    events.push(event);
    const after = {
      ...result.exercise,
      done: false,
      draftCompletion: null,
      lastCompletion: null,
      historyLog: [compactExerciseEvent(event), ...(source.historyLog || [])].slice(0, 24)
    };
    sessions = applyFinalProgressionToSessions(sessions, source.id, after, result.exercise, sessionIndex);
  });

  sessions = sessions.map((s, i) => i === sessionIndex
    ? { ...s, exercises: s.exercises.map(ex => ex.type === 'lift' ? { ...ex, done: false, draftCompletion: null, lastCompletion: null } : { ...ex, done: false, lastCompletion: null }) }
    : s
  );

  const doneCount = snapshot.exercises.filter(ex => ex.done).length;
  const totalCount = snapshot.exercises.length;
  const sessionEvent = {
    id: uid('session'),
    scope: 'session',
    monthIndex: state.currentMonthIndex,
    blockIndex: state.currentBlockIndex,
    blockWeek: state.currentWeekIndex,
    sessionIndex: sessionIndex,
    sessionId: session.id,
    sessionTitle: session.title,
    sessionDate,
    scheduledDate,
    movedFromDate: null,
    type: 'session-done',
    label: `${session.title}: ${doneCount}/${totalCount} finished · ${displayDate(sessionDate)}.`,
    at: new Date().toISOString(),
    snapshot,
    progressedCount: events.filter(e => e.type === 'progressed-load' || e.type === 'progressed-reps').length,
    missedCount: events.filter(e => e.type === 'missed-held').length
  };
  const last = false;
  const historyWithoutSameSession = (state.history || []).filter(h => !(h.sessionDate === sessionDate && h.sessionIndex === sessionIndex && (h.scope === 'session' || h.scope === 'exercise')));
  const sessionDrafts = { ...(state.sessionDrafts || {}) };
  delete sessionDrafts[sessionDraftKey(sessionDate, sessionIndex)];
  ui.replaySessionId = null;
  commit({
    ...state,
    sessions,
    sessionDrafts,
    manualWorkout: null,
    currentSessionIndex: sessionIndex,
    history: [sessionEvent, ...events, ...historyWithoutSameSession].slice(0, 300)
  }, 'day finished · progression committed');
}

function buildExerciseEvent(source, result, session, sessionDate) {
  return {
    id: uid('event'),
    scope: 'exercise',
    monthIndex: state.currentMonthIndex,
    blockIndex: state.currentBlockIndex,
    blockWeek: state.currentWeekIndex,
    sessionId: session.id,
    sessionTitle: session.title,
    sessionDate,
    exerciseId: source.id,
    exerciseKey: exerciseIdentity(source),
    exerciseName: source.name,
    type: result.event,
    label: result.message,
    why: result.why,
    at: new Date().toISOString(),
    weightBefore: source.weight,
    weightAfter: result.exercise.weight,
    targetBefore: source.targetRep,
    targetAfter: result.exercise.targetRep,
    reps: result.reps || workRows(source).map(row => Number(row.reps)).filter(Number.isFinite),
    buildupCount: buildupRows(source).length
  };
}

function applyFinalProgressionToSessions(sessions, exerciseId, completedExercise, progressionExercise, baseSessionIndex = activeSessionIndex()) {
  return sessions.map((session, sessionIndex) => {
    if (sessionIndex < baseSessionIndex) return session;
    const exercises = session.exercises.map(ex => {
      if (ex.type !== 'lift' || !sameExercise(ex, exerciseId)) return ex;
      if (sessionIndex === baseSessionIndex) return completedExercise;
      if (ex.done) return ex;
      return applyWeekInnerProgression(ex, progressionExercise);
    });
    return { ...session, exercises };
  });
}

function createSessionSnapshot(session, sessionDate) {
  return {
    id: uid('snapshot'),
    sessionId: session.id,
    title: session.title,
    source: session.source,
    intensity: session.intensity,
    notes: session.notes,
    date: sessionDate,
    week: state.currentWeekIndex,
    block: state.currentBlockIndex || state.currentMonthIndex,
    capturedAt: new Date().toISOString(),
    exercises: (session.exercises || []).map(ex => {
      if (ex.type === 'lift') {
        return {
          type: 'lift', id: ex.id, name: ex.name, family: ex.family, done: Boolean(ex.done), note: ex.note || '',
          targetRep: ex.targetRep, repMin: ex.repMin, repMax: ex.repMax, weight: ex.weight, unit: ex.unit,
          rows: (ex.rows || []).map(row => ({ kind: row.kind, label: row.label, weight: row.weight, unit: row.unit, reps: row.reps }))
        };
      }
      return { type: ex.type, id: ex.id, name: ex.name, family: ex.family, done: Boolean(ex.done), note: ex.note || '', prescription: simplePrescription(ex) };
    })
  };
}

function simplePrescription(item) {
  if (item.type === 'prep') return `${item.prescription}${item.intensity ? ' · ' + item.intensity : ''}`;
  if (item.type === 'time') return `${item.sets} × ${item.seconds}${item.unit}`;
  return `${item.sets} × ${item.reps}${item.unit ? ' ' + item.unit : ''}`;
}

function planByDayIndex(dayIndex) { return WEEK_PLAN[clampInt(dayIndex, 0, WEEK_PLAN.length - 1, 0)] || WEEK_PLAN[0]; }
function replaceSameSessionHistory(history, date, sessionIndex, event) {
  const rest = (history || []).filter(h => !(h.scope === 'session' && h.sessionDate === date && h.sessionIndex === sessionIndex));
  return [event, ...rest].slice(0, 300);
}
function skipSessionDay(dayIndex, weekIndex = state.currentWeekIndex) {
  const plan = planByDayIndex(dayIndex);
  if (!plan || plan.kind !== 'workout') return;
  const date = sessionDateFor(weekIndex, plan);
  const event = {
    id: uid('skip'), scope: 'session', monthIndex: state.currentMonthIndex, blockIndex: state.currentBlockIndex,
    blockWeek: weekIndex, sessionIndex: plan.sessionIndex, sessionId: state.sessions[plan.sessionIndex]?.id,
    sessionTitle: plan.title, sessionDate: date, type: 'session-skipped',
    label: `${plan.title}: skipped · ${displayDate(date)}.`, at: new Date().toISOString()
  };
  commit({ ...state, history: replaceSameSessionHistory(state.history, date, plan.sessionIndex, event) }, 'session skipped');
}
function markSessionDone(dayIndex, weekIndex = state.currentWeekIndex) {
  const plan = planByDayIndex(dayIndex);
  if (!plan || plan.kind !== 'workout') return;
  const session = state.sessions[plan.sessionIndex];
  const date = sessionDateFor(weekIndex, plan);
  const snapshot = createSessionSnapshot(session, date);
  const event = {
    id: uid('session'), scope: 'session', monthIndex: state.currentMonthIndex, blockIndex: state.currentBlockIndex,
    blockWeek: weekIndex, sessionIndex: plan.sessionIndex, sessionId: session?.id, sessionTitle: plan.title,
    sessionDate: date, type: 'session-done', label: `${plan.title}: marked done · ${displayDate(date)}.`,
    at: new Date().toISOString(), snapshot, progressedCount: 0, missedCount: 0, manualMark: true
  };
  commit({ ...state, history: replaceSameSessionHistory(state.history, date, plan.sessionIndex, event) }, 'marked done');
}
function moveSessionDayToToday(dayIndex, weekIndex = state.currentWeekIndex) {
  const plan = planByDayIndex(dayIndex);
  if (!plan || plan.kind !== 'workout') return;
  const fromDate = sessionDateFor(weekIndex, plan);
  ui.forceWorkout = true;
  ui.screen = 'workout';
  ui.replaySessionId = null;
  commit({
    ...state,
    currentSessionIndex: plan.sessionIndex,
    manualWorkout: { sessionIndex: plan.sessionIndex, date: localIsoDate(new Date()), movedFromDate: fromDate, title: plan.title }
  }, `moved ${plan.title} to today`);
}
function updateBlockSetting(field, value) {
  let next = { ...state };
  if (field === 'blockStartedOn') {
    const parsed = parseIsoDate(value);
    next.blockStartedOn = startOfWeekIso(parsed);
    next.currentWeekIndex = programWeekForDate(next, new Date());
    next.deloadAppliedForBlock = false;
    next.preDeloadSessions = null;
    ui.monthWeek = next.currentWeekIndex;
  }
  if (field === 'currentWeekIndex') {
    const week = clampInt(value, 1, 8, state.currentWeekIndex || 1);
    next.blockStartedOn = localIsoDate(addDays(startOfWeekIso(new Date()), -7 * (week - 1)));
    next.currentWeekIndex = week;
    next.deloadAppliedForBlock = false;
    next.preDeloadSessions = null;
    ui.monthWeek = week;
  }
  if (field === 'deloadWeek') {
    next.deloadWeek = clampInt(value, 1, 8, 8);
    next.deloadAppliedForBlock = false;
    next.preDeloadSessions = null;
  }
  commit(next, 'block settings updated');
}


function assignCalendarDate(iso, value) {
  const oldPlan = planForDateIso(iso);
  const oldKey = oldPlan?.kind === 'workout' ? sessionDraftKey(iso, oldPlan.sessionIndex) : null;
  const oldDraft = oldKey ? state.sessionDrafts?.[oldKey] : null;
  const days = { ...(state.calendar?.days || {}) };
  const defaultPlan = defaultPlanForIso(iso);
  let targetPlan;
  if (value === 'rest') {
    targetPlan = { kind: 'rest', title: 'REST', day: weekdayLabel(iso) };
    if (oldDraft && !confirm('This date has logged/editing data. Change it to REST and keep the old draft hidden?')) return;
    if (defaultPlan.kind === 'rest') delete days[iso]; else days[iso] = { kind: 'rest' };
  } else {
    const sessionIndex = clampInt(value, 0, state.sessions.length - 1, 0);
    targetPlan = { kind: 'workout', sessionIndex, title: state.sessions[sessionIndex]?.title || 'WORKOUT', day: weekdayLabel(iso) };
    if (oldDraft && oldPlan?.sessionIndex !== sessionIndex) {
      const ok = confirm('This date has logged/editing data. Move the draft to the new workout type?');
      if (!ok) return;
    }
    if (defaultPlan.kind === 'workout' && defaultPlan.sessionIndex === sessionIndex) delete days[iso];
    else days[iso] = { kind: 'workout', sessionIndex, title: state.sessions[sessionIndex]?.title || 'WORKOUT' };
  }
  let sessionDrafts = { ...(state.sessionDrafts || {}) };
  if (oldDraft && targetPlan.kind === 'workout' && oldPlan?.sessionIndex !== targetPlan.sessionIndex) {
    delete sessionDrafts[oldKey];
    sessionDrafts[sessionDraftKey(iso, targetPlan.sessionIndex)] = { ...oldDraft, date: iso, sessionIndex: targetPlan.sessionIndex, movedFromSessionIndex: oldPlan.sessionIndex, updatedAt: new Date().toISOString() };
  }
  const nextState = { ...state, calendar: { ...(state.calendar || {}), days }, sessionDrafts };
  const newPlan = planForDateIso(iso, nextState);
  if (iso === activeDateIso() || iso === localIsoDate(new Date())) {
    if (newPlan.kind === 'workout') {
      nextState.currentSessionIndex = newPlan.sessionIndex;
      ui.activeDate = iso;
      ui.forceWorkout = true;
    } else {
      ui.forceWorkout = false;
      if (iso === activeDateIso()) ui.activeDate = iso;
    }
  }
  ui.selectedDate = iso;
  ui.weekStripTargetDate = iso;
  commit(nextState, 'calendar updated');
}
function openDate(iso) {
  ui.weekStripTargetDate = iso;
  ui.activeDate = iso;
  ui.selectedDate = iso;
  ui.replaySessionId = null;
  const plan = planForDateIso(iso);
  if (plan.kind === 'workout') {
    ui.forceWorkout = true;
    ui.screen = 'workout';
    commit({ ...state, currentSessionIndex: plan.sessionIndex }, `opened ${displayDate(iso)}`);
  } else {
    ui.forceWorkout = false;
    ui.screen = 'workout';
    render();
  }
}
function shiftWeek(days) {
  const base = parseIsoDate(activeDateIso());
  const nextIso = localIsoDate(addDays(base, Number(days || 0)));
  openDate(nextIso);
}
function gotoCurrentWeek() {
  ui.activeDate = null;
  ui.selectedDate = localIsoDate(new Date());
  ui.weekStripTargetDate = localIsoDate(new Date());
  ui.forceWorkout = false;
  openDate(localIsoDate(new Date()));
}

function markDateDone(iso) {
  ui.weekStripTargetDate = iso;
  const plan = planForDateIso(iso);
  if (!plan || plan.kind !== 'workout') return;
  const existing = sessionEventForDate(iso, plan);
  if (existing) {
    undoDateDone(iso, plan);
    return;
  }
  ui.activeDate = iso;
  ui.selectedDate = iso;
  ui.forceWorkout = true;
  ui.calendarMenuDate = null;
  ui.calendarChangeDate = null;
  commit({ ...state, currentSessionIndex: plan.sessionIndex }, 'opened for finish');
  nextWorkout();
}
function undoDateDone(iso, plan = planForDateIso(iso)) {
  if (!plan || plan.kind !== 'workout') return;
  const history = (state.history || []).filter(h => !(h.sessionDate === iso && h.sessionIndex === plan.sessionIndex && (h.scope === 'session' || h.scope === 'exercise')));
  ui.calendarMenuDate = null;
  ui.calendarChangeDate = null;
  commit({ ...state, history }, 'done toggled off');
}
function toggleDateSkip(iso) {
  const plan = planForDateIso(iso);
  if (!plan || plan.kind !== 'workout') return;
  const exists = sessionSkipEventForDate(iso, plan);
  let history;
  if (exists) {
    history = (state.history || []).filter(h => h.id !== exists.id);
  } else {
    const event = {
      id: uid('skip'), scope: 'session', monthIndex: state.currentMonthIndex, blockIndex: state.currentBlockIndex,
      blockWeek: programWeekForDate(state, parseIsoDate(iso)), sessionIndex: plan.sessionIndex, sessionId: state.sessions[plan.sessionIndex]?.id,
      sessionTitle: plan.title, sessionDate: iso, type: 'session-skipped',
      label: `${plan.title}: skipped · ${displayDate(iso)}.`, at: new Date().toISOString()
    };
    history = replaceSameSessionHistory(state.history, iso, plan.sessionIndex, event);
  }
  ui.calendarMenuDate = null;
  ui.calendarChangeDate = null;
  commit({ ...state, history }, exists ? 'skip toggled off' : 'session skipped');
}
function changeCalendarDateTo(iso, value) {
  ui.calendarMenuDate = null;
  ui.calendarChangeDate = null;
  if (value === 'REST') assignCalendarDate(iso, 'rest');
  else assignCalendarDate(iso, preferredSessionIndexForCalendarLabel(iso, value));
}
function shiftCalendarMonth(delta) {
  const [y, m] = (ui.calendarMonth || localIsoDate(new Date()).slice(0,7)).split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  ui.calendarMonth = localIsoDate(d).slice(0,7);
  render();
}
function clearCurrentSession() {
  if (!confirm('Clear current workout completion + rows? This keeps exercise settings.')) return;
  updateCurrentSession(session => ({
    ...session,
    exercises: session.exercises.map(ex => {
      if (ex.type !== 'lift') return { ...ex, done: false, lastCompletion: null };
      return {
        ...ex,
        done: false,
        lastCompletion: null,
        rows: ex.rows.map(row => row.kind === 'work' ? { ...row, reps: ex.targetRep, weight: ex.weight, complete: false } : { ...row, complete: false })
      };
    })
  }), 'session cleared');
}
function buildNextMonth() {
  const nextBlock = Number(state.currentBlockIndex || state.currentMonthIndex || 1) + 1;
  const sourceSessions = state.preDeloadSessions && state.preDeloadSessions.length ? state.preDeloadSessions : state.sessions;
  const nextStart = localIsoDate(addDays(state.blockStartedOn || startOfWeekIso(new Date()), 56));
  const sessions = sourceSessions.map(session => ({
    ...session,
    id: `${session.id.replace(/-m\d+$/, '').replace(/-b\d+$/, '')}-b${nextBlock}`,
    source: `Block ${nextBlock} · week 1/8`,
    intensity: session.intensity === 'DELOAD' ? 'progression' : session.intensity,
    exercises: session.exercises.map(item => prepareForNextBlock(item, false))
  }));
  const event = { id: uid('block'), scope: 'month', monthIndex: nextBlock, blockIndex: nextBlock, type: 'block-built', label: `Block ${nextBlock}: new 8-week block started. Week 8 will be deload.`, at: new Date().toISOString() };
  ui.monthWeek = 1;
  commit({
    ...state,
    currentMonthIndex: nextBlock,
    currentBlockIndex: nextBlock,
    currentWeekIndex: 1,
    blockStartedOn: nextStart,
    currentSessionIndex: 0,
    deloadAppliedForBlock: false,
    preDeloadSessions: null,
    sessions,
    history: [event, ...state.history].slice(0, 200)
  }, event.label);
}

function prepareForDeloadWeek(item) {
  if (item.type !== 'lift') return { ...item, done: false, lastCompletion: null };
  const deloadWeight = roundLoad(Number(item.weight || 0) * 0.85);
  const deloadSets = Math.max(1, Math.ceil(Number(item.sets || 1) * 0.6));
  const buildups = buildupRows(item).map(row => ({ ...row, complete: false }));
  const work = workRows(item).slice(0, deloadSets).map((row, i) => ({
    ...row,
    id: uid(`${item.id}-deload-${i + 1}`),
    weight: deloadWeight,
    reps: Number(item.repMin || row.reps || 0),
    complete: false
  }));
  return normalizeWorkRows({
    ...item,
    sets: deloadSets,
    weight: deloadWeight,
    targetRep: Number(item.repMin || item.targetRep || 0),
    done: false,
    lastCompletion: null,
    rows: [...buildups, ...work]
  });
}

function prepareForNextBlock(item, isDeloadMonth) {
  if (item.type !== 'lift') return { ...item, done: false, lastCompletion: null };
  if (!isDeloadMonth) return { ...item, done: false, lastCompletion: null, rows: item.rows.map(row => ({ ...row, complete: false })) };
  const deloadWeight = roundLoad(Number(item.weight) * 0.85);
  const deloadSets = Math.max(1, Math.ceil(Number(item.sets) * 0.6));
  const buildups = buildupRows(item).map(row => ({ ...row, complete: false }));
  const work = workRows(item).slice(0, deloadSets).map((row, i) => ({ ...row, id: uid(`${item.id}-deload-${i + 1}`), weight: deloadWeight, reps: item.repMin, complete: false }));
  return normalizeWorkRows({ ...item, sets: deloadSets, weight: deloadWeight, targetRep: item.repMin, done: false, lastCompletion: null, rows: [...buildups, ...work] });
}
function resetProgram() {
  if (!confirm('Reset LIFT local data? This deletes the phone copy.')) return;
  commit(clone(seedProgram), 'reset complete');
}
function openBackup(mode = 'export') {
  ui.backupOpen = true;
  ui.backupText = mode === 'export' ? JSON.stringify(state, null, 2) : '';
  render();
}
function importBackup() {
  try {
    const parsed = JSON.parse(document.getElementById('backupText').value);
    ui.backupOpen = false;
    ui.backupText = '';
    commit(parsed, 'backup imported');
  } catch {
    alert('Bad JSON. Nothing imported.');
  }
}
async function copyBackup() {
  try {
    const text = document.getElementById('backupText').value;
    await navigator.clipboard.writeText(text);
    toastOnly('backup copied');
  } catch {
    toastOnly('copy failed — select and copy manually');
  }
}

function deriveMonthResults(monthIndex = state.currentMonthIndex) {
  const events = (state.history || []).filter(h => h.monthIndex === monthIndex && h.scope === 'exercise');
  const sessionEvents = (state.history || []).filter(h => h.monthIndex === monthIndex && h.scope === 'session' && h.type === 'session-done');
  const skippedSessions = (state.history || []).filter(h => h.monthIndex === monthIndex && h.scope === 'session' && h.type === 'session-skipped');
  const progressed = events.filter(h => h.type === 'progressed-load' || h.type === 'progressed-reps');
  const misses = events.filter(h => h.type === 'missed-held');
  const held = events.filter(h => !['progressed-load', 'progressed-reps', 'missed-held'].includes(h.type));
  const buildups = events.reduce((sum, h) => sum + Number(h.buildupCount || 0), 0);
  return { events, sessionEvents, skippedSessions, progressed, misses, held, buildups };
}

function escapeHtml(s) { return String(s ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }
function fmtDate(iso) {
  try { return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}
function sign(value) { return Number(value) > 0 ? '+' : ''; }


function captureWeekStripScroll() {
  const strip = document.querySelector('.week-strip');
  if (strip) ui.weekStripScrollLeft = strip.scrollLeft || 0;
}
function centerWeekStripOnDate(iso) {
  const strip = document.querySelector('.week-strip');
  if (!strip) return;
  const target = strip.querySelector(`.day-chip[data-date="${iso}"]`) || strip.querySelector('.day-chip.active');
  if (!target) {
    strip.scrollLeft = ui.weekStripScrollLeft || 0;
    return;
  }
  const targetLeft = target.offsetLeft;
  const desired = targetLeft - ((strip.clientWidth - target.offsetWidth) / 2);
  const max = Math.max(0, strip.scrollWidth - strip.clientWidth);
  strip.scrollLeft = Math.max(0, Math.min(max, desired));
  ui.weekStripScrollLeft = strip.scrollLeft;
}
function restoreWeekStripScroll() {
  const strip = document.querySelector('.week-strip');
  if (!strip) return;
  if (ui.weekStripTargetDate) {
    centerWeekStripOnDate(ui.weekStripTargetDate);
    ui.weekStripTargetDate = null;
  } else {
    strip.scrollLeft = ui.weekStripScrollLeft || 0;
  }
  strip.addEventListener('scroll', () => {
    ui.weekStripScrollLeft = strip.scrollLeft || 0;
  }, { passive: true });
}

function render() {
  captureWeekStripScroll();
  const app = document.getElementById('app');
  const main = ui.screen === 'month' ? monthScreen() : (isActiveDateNoDataPage() ? noDataScreen() : (isActiveDateRestPage() ? restScreen() : workoutScreen()));
  app.innerHTML = `<div class="app">
    <div class="topbar">
      <button class="logo" data-action="open-global-settings">LIFT</button>
      <div class="version">${APP_VERSION}</div>
      <button class="top-action" data-action="toggle-screen">${ui.screen === 'month' ? 'WORKOUT' : 'MONTH'}</button>
    </div>
    <main class="main">${main}</main>
    ${backupDialog()}
    ${globalSettingsDialog()}
    ${ui.toast ? `<div class="toast">${escapeHtml(ui.toast)}</div>` : ''}
  </div>`;
  bindEvents();
  restoreWeekStripScroll();
}

function noDataScreen() {
  return `<section class="hero no-data-hero">
    <h1 class="title">NO DATA!</h1>
    <p class="meta">${escapeHtml(displayDate(activeDateIso()))}</p>
    <p class="note">Nothing tracked before Week 1.</p>
  </section>
  ${weekStrip()}
  <div class="bottom-grid">
    <button class="big-button" data-action="goto-current-week">CURRENT WEEK</button>
    <button class="big-button ghost" data-action="toggle-screen">MONTH</button>
  </div>`;
}
function workoutScreen() {
  const sessionDate = activeDateIso();
  const plan = planForDateIso(sessionDate);
  const doneEvent = sessionEventForDate(sessionDate, plan);
  const readOnly = Boolean(doneEvent?.snapshot);
  const session = readOnly ? doneEvent.snapshot : currentSession();
  const comp = completion(session);
  const noteValue = ui.editingSessionNote ? ui.noteDraft : (session.notes || '');
  return `<section class="hero ${readOnly ? 'read-only-hero' : ''}">
    ${readOnly ? '' : `<button class="icon-plain note-pen" data-action="edit-session-note" aria-label="Edit workout note" title="Edit workout note">✎</button>`}
    <h1 class="title">${escapeHtml(session.title)}</h1>
    ${(!readOnly && ui.editingSessionNote)
      ? `<textarea class="note-editor" data-action="update-session-note" data-role="session-note-editor" placeholder="Add notes...">${escapeHtml(noteValue)}</textarea>`
      : `<p class="note">${escapeHtml(noteValue)}</p>`}
    <div class="progress-track"><div class="progress-fill" style="width:${comp.percent}%"></div></div>
    <div class="hero-bottom">
      <span>${comp.done}/${comp.total} done</span>
      ${readOnly
        ? `<span class="readonly-pill">DONE · READ ONLY</span>`
        : `<label class="toggle-wrap"><span>Rebuild</span><input class="toggle" type="checkbox" data-action="toggle-rebuild" ${state.rebuildMode ? 'checked' : ''}></label>`}
    </div>
  </section>
  ${weekStrip()}
  <section class="stack ${readOnly ? 'replay-stack read-only-stack' : ''}">${(session.exercises || []).map(item => readOnly ? replayExerciseCard(item) : (item.type === 'lift' ? liftCard(item) : simpleCard(item))).join('')}</section>
  ${readOnly ? '' : `<div class="bottom-grid">
    <button class="big-button" data-action="next-workout">FINISH DAY</button>
    <button class="big-button ghost" data-action="clear-session">CLEAR SESSION</button>
  </div>`}`;
}
function restScreen() {
  const next = nextScheduledWorkout();
  const restDate = activeDateIso();
  const nextLabel = calendarWorkoutLabel(next?.title || 'WORKOUT');
  return `<section class="hero rest-hero">
    <h1 class="title">REST!</h1>
    <p class="meta">${escapeHtml(displayDate(restDate))}</p>
    <p class="note">No main workout scheduled today.</p>
    <p class="tiny-note">Next: ${escapeHtml(next?.day || '')} · ${escapeHtml(nextLabel)}</p>
  </section>
  ${weekStrip()}
  <div class="bottom-grid">
    <button class="big-button" data-action="open-next-scheduled">OPEN NEXT WORKOUT</button>
    <button class="big-button ghost" data-action="toggle-screen">MONTH</button>
  </div>`;
}
function weekStrip() {
  const currentIso = activeDateIso();
  const stripStart = startOfWeekIso(parseIsoDate(currentIso));
  const currentWeekClass = startOfWeekIso(parseIsoDate(currentIso)) === startOfWeekIso(new Date()) ? 'current-week' : '';
  return `<div class="week-wrap ${currentWeekClass}">
    <div class="week-nav">
      <button class="week-arrow" data-action="shift-week" data-days="-7" aria-label="Previous week">←</button>
      <button class="week-label ${currentWeekClass}" data-action="goto-current-week" aria-label="Go to current week">${escapeHtml(weekLabelForDate(currentIso))}</button>
      <button class="week-arrow" data-action="shift-week" data-days="7" aria-label="Next week">→</button>
    </div>
    <nav class="week-strip" aria-label="Workout week">${WEEK_PLAN.map((basePlan, i) => {
      const date = localIsoDate(addDays(stripStart, i));
      const plan = planForDateIso(date);
      const status = dateStatus(date, plan);
      const done = sessionDoneForDate(date, plan);
      const missed = sessionMissedForDate(date, plan);
      const active = date === currentIso;
      const deload = isDeloadDate(date);
      const action = `data-action="open-date" data-date="${date}"`;
      const isRest = plan.kind === 'rest';
      const isNoData = plan.kind === 'nodata';
      const label = (isRest || isNoData) ? '' : (done ? 'DONE' : missed ? 'MISSED' : status === 'today' ? 'TODAY' : status.toUpperCase());
      const title = isNoData ? `<span class="day-title">NO DATA</span>` : (isRest ? `<span class="day-title">REST</span>` : `<span class="day-title">${escapeHtml(plan.title)}</span>`);
      const stateSlot = label ? `<span class="day-state">${escapeHtml(label)}</span>` : `<span class="day-state placeholder">&nbsp;</span>`;
      return `<div class="day-card"><button class="day-chip ${status} ${plan.kind} ${deload ? 'deload' : ''} ${missed ? 'missed' : ''} ${done ? 'done' : ''} ${active ? 'active' : ''}" ${action}>
          <span class="day-name">${escapeHtml(plan.day || basePlan.day)} · ${escapeHtml(shortDayDate(date))}</span>
          ${title}
          ${stateSlot}
        </button></div>`;
    }).join('')}</nav></div>`;
}
function shortDayDate(iso) {
  try { return parseIsoDate(iso).toLocaleDateString([], { month: 'short', day: 'numeric' }); } catch { return iso; }
}

function calendarWorkoutLabel(title = '') {
  const raw = String(title || 'WORKOUT').replace(/\s+[AB]$/i, '').trim().toUpperCase();
  if (!raw || raw === 'REST') return 'REST';
  if (raw.includes('LOWER')) return 'LOWER';
  if (raw.includes('ARM')) return 'ARM';
  if (raw.includes('UPPER')) return 'UPPER';
  return raw.replace(/\s*\+\s*/g, '+') || 'WORKOUT';
}
function calendarStatusLabel(iso, plan) {
  if (plan.kind === 'nodata') return '';
  if (plan.kind === 'rest') return isDeloadDate(iso) ? 'DELOAD' : '';
  if (sessionDoneForDate(iso, plan)) return 'DONE';
  if (sessionSkippedForDate(iso, plan)) return 'SKIP';
  if (selectedDateHasDraft(iso, plan)) return 'LIVE';
  if (sessionMissedForDate(iso, plan)) return 'MISS';
  if (isDeloadDate(iso)) return 'DELOAD';
  if (iso === localIsoDate(new Date())) return 'TODAY';
  return '';
}
function preferredSessionIndexForCalendarLabel(iso, label) {
  const wanted = String(label || '').toUpperCase();
  const matches = state.sessions
    .map((s, i) => ({ s, i, label: calendarWorkoutLabel(s.title).toUpperCase() }))
    .filter(x => x.label === wanted);
  if (!matches.length) return 0;
  if (matches.length === 1) return matches[0].i;
  const defaultPlan = defaultPlanForIso(iso);
  if (defaultPlan.kind === 'workout') {
    const defaultMatch = matches.find(x => x.i === defaultPlan.sessionIndex);
    if (defaultMatch) return defaultMatch.i;
  }
  const dow = parseIsoDate(iso).getDay();
  if (dow >= 4) return matches[matches.length - 1].i;
  return matches[0].i;
}
function calendarChangeOptions(iso) {
  const labels = [];
  state.sessions.forEach(s => {
    const label = calendarWorkoutLabel(s.title);
    if (!labels.includes(label)) labels.push(label);
  });
  return ['REST', ...labels].map(label => `<button class="menu-item" data-action="calendar-change-to" data-date="${iso}" data-value="${escapeHtml(label)}">${escapeHtml(label)}</button>`).join('');
}
function calendarQuickMenu() {
  const iso = ui.calendarMenuDate;
  if (!iso) return '';
  const plan = planForDateIso(iso);
  const done = sessionDoneForDate(iso, plan);
  const skipped = sessionSkippedForDate(iso, plan);
  const canWorkout = plan.kind === 'workout';
  return `<div class="calendar-menu" role="dialog" aria-label="Calendar actions">
    <div class="menu-actions">
      <button class="menu-item" data-action="calendar-change-menu" data-date="${iso}">CHANGE</button>
      <button class="menu-item" data-action="calendar-skip" data-date="${iso}" ${!canWorkout ? 'disabled' : ''}>${skipped ? 'UNSKIP' : 'SKIP'}</button>
      <button class="menu-item primary" data-action="calendar-done" data-date="${iso}" ${!canWorkout ? 'disabled' : ''}>${done ? 'UNDONE' : 'DONE'}</button>
    </div>
    ${ui.calendarChangeDate === iso ? `<div class="change-menu">${calendarChangeOptions(iso)}</div>` : ''}
  </div>`;
}
function liftCard(item) {
  const open = ui.settingsExerciseId === item.id;
  const preview = nextPreview(item);
  const editingNote = ui.editingExerciseNoteId === item.id;
  const noteValue = editingNote ? ui.exerciseNoteDraft : (item.note || '');
  return `<article class="card lift-card ${item.done ? 'done' : ''}" data-exercise-id="${item.id}">
    <header class="card-head">
      <button class="icon-plain exercise-note-pen" data-action="edit-exercise-note" data-exercise-id="${item.id}" aria-label="Edit exercise note" title="Edit exercise note">✎</button>
      <div class="card-title-row">
        <div><p class="family">${escapeHtml(item.family)}</p><h2 class="exercise-title">${escapeHtml(item.name)}</h2></div>
      </div>
      ${editingNote
        ? `<textarea class="exercise-note-editor" data-action="update-exercise-note" data-exercise-id="${item.id}" data-role="exercise-note-editor" placeholder="Note">${escapeHtml(noteValue)}</textarea>`
        : (noteValue ? `<div class="tiny-note">${escapeHtml(noteValue)}</div>` : '')}
    </header>
    <div class="rows">${item.rows.map(row => rowTemplate(item, row)).join('')}</div>
    ${open ? settingsPanel(item) : ''}
    ${item.done && item.draftCompletion ? `<div class="draft-panel"><strong>Pending:</strong> ${escapeHtml(item.draftCompletion.label)} <span>Commits on Finish Day.</span></div>` : ''}
    ${state.rebuildMode ? rebuildPanel(item, preview) : ''}
  </article>`;
}
function nextPreview(item) {
  const result = computeNextExercise(item);
  if (!result || result.event === 'no-data') return 'Enter work reps to preview target.';
  return result.message || '';
}
function rowTemplate(item, row) {
  const canDelete = row.kind === 'buildup' || workRows(item).length > 1;
  const deleteButton = canDelete
    ? `<button class="swipe-delete" data-action="delete-row" data-exercise-id="${item.id}" data-row-id="${row.id}" aria-label="Delete row">DELETE</button>`
    : '';
  return `<div class="swipe-row ${canDelete ? 'can-delete' : 'locked'}" data-row-id="${row.id}" data-exercise-id="${item.id}">
    ${deleteButton}
    <div class="row live-row ${row.kind === 'buildup' ? 'buildup' : 'work'} swipe-track">
      <div class="inline-load" aria-label="${escapeHtml(row.label || row.kind)} load">
        <span class="load-box weight-box">
          <input class="inline-weight" aria-label="Weight" inputmode="decimal" value="${escapeHtml(row.weight)}" data-action="update-row" data-exercise-id="${item.id}" data-row-id="${row.id}" data-field="weight" />
          <span class="inline-unit">${escapeHtml(cleanUnit(row.unit || item.unit))}</span>
        </span>
        <span class="inline-times">×</span>
        <span class="load-box reps-box">
          <input class="inline-reps" aria-label="Reps" inputmode="numeric" pattern="[0-9]*" value="${escapeHtml(row.reps)}" data-action="update-row" data-exercise-id="${item.id}" data-row-id="${row.id}" data-field="reps" />
        </span>
      </div>
      <div class="row-label row-label-right">${escapeHtml(row.kind === 'buildup' ? 'BUILDUP' : (row.label || 'SET'))}</div>
    </div>
  </div>`;
}
function settingsPanel(item) {
  return `<div class="settings-panel">
    <div class="settings-top-actions">
      <button class="action quiet" data-action="add-buildup" data-exercise-id="${item.id}">+ BUILDUP</button>
      <button class="action quiet" data-action="add-work-set" data-exercise-id="${item.id}">+ SET</button>
    </div>
    <div class="settings-grid">
      ${settingText(item, 'name', 'Name')}
      ${settingText(item, 'family', 'Family')}
      ${settingRange(item)}
      ${settingUnit(item)}
      ${settingNumber(item, 'increment', 'Jump')}
      <label class="setting check"><span>Progression</span><input type="checkbox" data-action="update-setting" data-exercise-id="${item.id}" data-field="tracked" ${item.tracked !== false ? 'checked' : ''}></label>
    </div>
  </div>`;
}
function settingRange(item) {
  return `<label class="setting"><span>Rep range</span><input value="${escapeHtml(`${item.repMin || 0}-${item.repMax || 0}`)}" data-action="update-rep-range" data-exercise-id="${item.id}"></label>`;
}
function settingUnit(item) {
  const unit = cleanUnit(item.unit);
  return `<label class="setting"><span>Unit</span><select data-action="update-setting" data-exercise-id="${item.id}" data-field="unit">
    <option value="kg" ${unit === 'kg' ? 'selected' : ''}>kg</option>
    <option value="lbs" ${unit === 'lbs' ? 'selected' : ''}>lbs</option>
    <option value="pl" ${unit === 'pl' ? 'selected' : ''}>pl</option>
  </select></label>`;
}
function settingText(item, field, label) {
  return `<label class="setting"><span>${escapeHtml(label)}</span><input value="${escapeHtml(item[field])}" data-action="update-setting" data-exercise-id="${item.id}" data-field="${field}"></label>`;
}
function settingNumber(item, field, label) {
  return `<label class="setting"><span>${escapeHtml(label)}</span><input inputmode="decimal" value="${escapeHtml(item[field])}" data-action="update-setting" data-exercise-id="${item.id}" data-field="${field}"></label>`;
}
function rebuildPanel(item, preview) {
  const last = (item.historyLog || []).slice(0, 4);
  return `<div class="rebuild-panel">
    <div class="rebuild-title">WHY THIS TARGET</div>
    <div>${escapeHtml(preview)}</div>
    <div>Best at current weight: ${escapeHtml(item.bestRepAtWeight || 0)} · Build-ups: ${buildupRows(item).length} · Tracking: ${item.tracked === false ? 'off' : 'on'}</div>
    <div>Rule: miss = logged truth, not a lower target. Weight moves only after every work set hits ${item.repMax}.</div>
    ${last.length ? `<div class="mini-history">${last.map(h => `<div>${fmtDate(h.at)} · ${escapeHtml(h.label)}</div>`).join('')}</div>` : '<div class="mini-history">No completed history for this exercise yet.</div>'}
  </div>`;
}
function simplePrescription(item) {
  if (item.type === 'prep') return item.prescription || '';
  if (item.type === 'time') return `${item.sets} × ${item.seconds}${item.unit || ''}`;
  return `${item.sets} × ${item.reps}${item.unit ? ' ' + item.unit : ''}`;
}
function simpleCard(item) {
  const open = ui.settingsExerciseId === item.id;
  const editingNote = ui.editingExerciseNoteId === item.id;
  const noteValue = editingNote ? ui.exerciseNoteDraft : (item.note || '');
  return `<article class="card simple-card ${item.done ? 'done' : ''}" data-exercise-id="${item.id}">
    <header class="card-head">
      <button class="icon-plain exercise-note-pen" data-action="edit-exercise-note" data-exercise-id="${item.id}" aria-label="Edit exercise note" title="Edit exercise note">✎</button>
      <p class="family">${escapeHtml(item.family)}</p>
      <h2 class="exercise-title">${escapeHtml(item.name)}</h2>
      ${editingNote
        ? `<textarea class="exercise-note-editor" data-action="update-exercise-note" data-exercise-id="${item.id}" data-role="exercise-note-editor" placeholder="Note">${escapeHtml(noteValue)}</textarea>`
        : (noteValue ? `<div class="tiny-note">${escapeHtml(noteValue)}</div>` : '')}
    </header>
    <div class="simple-body">
      <div class="simple-main">
        <div class="simple-prescription">${escapeHtml(simplePrescription(item))}</div>
        <div>${escapeHtml(item.intensity || '')}</div>
      </div>
    </div>
    ${open ? simpleSettingsPanel(item) : ''}
  </article>`;
}
function simpleSettingsPanel(item) {
  const fields = [
    settingText(item, 'name', 'Name'),
    settingText(item, 'family', 'Family')
  ];
  if (item.type === 'prep') {
    fields.push(settingText(item, 'prescription', 'Prescription'));
    fields.push(settingText(item, 'intensity', 'Intensity'));
  } else if (item.type === 'time') {
    fields.push(settingNumber(item, 'sets', 'Sets'));
    fields.push(settingNumber(item, 'seconds', 'Seconds'));
    fields.push(settingText(item, 'unit', 'Unit'));
  } else {
    fields.push(settingNumber(item, 'sets', 'Sets'));
    fields.push(settingNumber(item, 'reps', 'Reps'));
    fields.push(settingText(item, 'unit', 'Unit'));
  }
  return `<div class="settings-panel"><div class="settings-grid">${fields.join('')}</div></div>`;
}


function replayScreen() {
  const event = (state.history || []).find(h => h.id === ui.replaySessionId && h.scope === 'session');
  const snap = event?.snapshot;
  if (!snap) {
    return `<section class="hero"><p class="kicker">Replay</p><h1 class="title">NO DATA</h1><p class="note">This session was finished before p.6 saved full snapshots, or the backup has no replay data.</p><div class="bottom-grid"><button class="big-button" data-action="toggle-screen">MONTH</button><button class="big-button ghost" data-action="workout">WORKOUT</button></div></section>`;
  }
  return `<section class="hero replay-hero">
    <p class="kicker">Replay · Block ${escapeHtml(snap.block)} · Week ${escapeHtml(snap.week)}/8</p>
    <h1 class="title">${escapeHtml(snap.title)}</h1>
    <p class="session-date">${escapeHtml(snap.date)}</p>
    <p class="meta">${escapeHtml(snap.intensity || '')} · ${escapeHtml(snap.source || '')}</p>
    <p class="note">Read-only truth of that day. Progression was committed after this snapshot.</p>
  </section>
  <section class="stack replay-stack">${snap.exercises.map(replayExerciseCard).join('')}</section>
  <div class="bottom-grid"><button class="big-button" data-action="toggle-screen">BACK TO WEEKS</button><button class="big-button ghost" data-action="workout">CURRENT</button></div>`;
}
function replayExerciseCard(ex) {
  if (ex.type !== 'lift') {
    return `<article class="card replay-card ${ex.done ? 'done' : ''}"><header class="card-head"><p class="family">${escapeHtml(ex.family || ex.type)}</p><h2 class="exercise-title">${escapeHtml(ex.name)}</h2>${ex.prescription ? `<div class="target">${escapeHtml(ex.prescription)}</div>` : ''}</header></article>`;
  }
  return `<article class="card replay-card ${ex.done ? 'done' : ''}">
    <header class="card-head"><div class="card-title-row"><div><p class="family">${escapeHtml(ex.family)}</p><h2 class="exercise-title">${escapeHtml(ex.name)}</h2></div><span class="badge">${escapeHtml(ex.weight)}${escapeHtml(ex.unit)}</span></div><div class="target">Target ${escapeHtml(ex.targetRep)} · Range ${escapeHtml(ex.repMin)}–${escapeHtml(ex.repMax)}</div></header>
    <div class="replay-rows">${(ex.rows || []).map(row => `<div class="replay-row ${row.kind}"><span>${escapeHtml(row.label || row.kind)}</span><strong>${escapeHtml(row.weight)}${escapeHtml(row.unit)} × ${escapeHtml(row.reps)}</strong></div>`).join('')}</div>
  </article>`;
}

function monthScreen() {
  return `${calendarGrid()}${calendarQuickMenu()}`;
}
function calendarGrid() {
  const month = ui.calendarMonth || localIsoDate(new Date()).slice(0,7);
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const startOffset = mondayWeekIndex(first);
  const daysInMonth = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push('<div class="calendar-cell empty"></div>');
  for (let d = 1; d <= daysInMonth; d += 1) {
    const iso = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const plan = planForDateIso(iso);
    const event = sessionEventForDate(iso, plan);
    const status = dateStatus(iso, plan);
    const menuOpen = iso === ui.calendarMenuDate;
    const done = Boolean(event);
    const skipped = sessionSkippedForDate(iso, plan);
    const missed = sessionMissedForDate(iso, plan);
    const inProgress = selectedDateHasDraft(iso, plan);
    const isDeload = isDeloadDate(iso);
    const typeLabel = plan.kind === 'nodata' ? 'NO DATA' : (plan.kind === 'rest' ? 'REST' : calendarWorkoutLabel(plan.title));
    const statusLabel = calendarStatusLabel(iso, plan);
    cells.push(`<button class="calendar-cell ${status} ${plan.kind} ${isDeload ? 'deload' : ''} ${menuOpen ? 'menu-open' : ''} ${done ? 'done' : ''} ${skipped ? 'skipped' : ''} ${inProgress ? 'in-progress' : ''} ${missed ? 'missed' : ''}" data-action="calendar-date" data-date="${iso}">
      <span class="cal-top"><span class="cal-day">${d}</span></span>
      <span class="cal-type">${escapeHtml(typeLabel)}</span>
      ${statusLabel ? `<span class="cal-label">${escapeHtml(statusLabel)}</span>` : '<span class="cal-label muted"></span>'}
    </button>`);
  }
  return `<section class="calendar-panel"><div class="calendar-head"><button class="mini-toggle" data-action="calendar-prev">←</button><strong>${first.toLocaleDateString([], { month: 'long', year: 'numeric' })}</strong><button class="mini-toggle" data-action="calendar-next">→</button></div><div class="calendar-dows"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div><div class="calendar-grid">${cells.join('')}</div></section>`;
}
function selectedDateStatus(iso, plan) {
  const event = sessionEventForDate(iso, plan);
  if (plan.kind === 'nodata') return { label: 'NO DATA', event, key: 'nodata' };
  if (plan.kind === 'rest') return { label: iso === localIsoDate(new Date()) ? 'REST TODAY' : 'REST', event, key: 'rest' };
  if (event) return { label: 'DONE', event, key: 'done' };
  if (selectedDateHasDraft(iso, plan)) return { label: 'IN PROGRESS', event, key: 'in-progress' };
  if (sessionMissedForDate(iso, plan)) return { label: 'MISSED', event, key: 'missed' };
  if (iso === localIsoDate(new Date())) return { label: 'PLANNED TODAY', event, key: 'planned' };
  return { label: iso < localIsoDate(new Date()) ? 'MISSED' : 'PLANNED', event, key: 'planned' };
}
function selectedDatePanel() {
  const iso = selectedDateIso();
  const plan = planForDateIso(iso);
  const status = selectedDateStatus(iso, plan);
  const done = Boolean(status.event);
  const options = [`<option value="rest" ${plan.kind === 'rest' ? 'selected' : ''}>REST</option>`, ...state.sessions.map((s, i) => `<option value="${i}" ${plan.kind === 'workout' && plan.sessionIndex === i ? 'selected' : ''}>${escapeHtml(s.title)}</option>`)].join('');
  const openButton = done
    ? `<button class="big-button ghost" data-action="open-replay" data-event-id="${status.event.id}">VIEW DAY</button>`
    : `<button class="big-button ghost" data-action="open-date" data-date="${iso}" ${plan.kind !== 'workout' ? 'disabled' : ''}>OPEN SESSION</button>`;
  return `<section class="selected-date-panel v9">
    <div class="selected-summary">
      <div><p class="kicker">Selected date</p><h2>${escapeHtml(displayDate(iso))}</h2><p>${escapeHtml(iso)} · Week ${programWeekForDate(state, parseIsoDate(iso))}/8</p></div>
      <span class="status-pill ${escapeHtml(status.key || status.label.toLowerCase().replace(/\s+/g, '-'))}">${escapeHtml(status.label)}</span>
    </div>
    <div class="session-facts">
      <div><span>Date</span><strong>${escapeHtml(iso)}</strong></div>
      <div><span>Workout</span><strong>${escapeHtml(plan.title)}</strong></div>
      <div><span>Status</span><strong>${escapeHtml(status.label)}</strong></div>
      <div><span>Block</span><strong>W${programWeekForDate(state, parseIsoDate(iso))}/8</strong></div>
    </div>
    <label class="setting"><span>Planned session</span><select data-action="assign-calendar-date" data-date="${iso}">${options}</select></label>
    <div class="selected-actions split">
      ${openButton}
      <button class="big-button" data-action="calendar-done" data-date="${iso}" ${plan.kind !== 'workout' || done ? 'disabled' : ''}>DONE</button>
    </div>
  </section>`;
}

function blockSettingsPanel() {
  return `<section class="block-settings">
    <div class="block-settings-head">
      <div><span>Block settings</span><strong>Week ${state.currentWeekIndex}/8 · deload W${state.deloadWeek || 8}</strong></div>
      <button class="mini-toggle" data-action="toggle-block-settings">${ui.blockSettingsOpen ? 'Close' : 'Edit'}</button>
    </div>
    ${ui.blockSettingsOpen ? `<div class="settings-grid block-grid">
      <label class="setting"><span>Block starts</span><input type="date" value="${escapeHtml(state.blockStartedOn || startOfWeekIso(new Date()))}" data-action="update-block-setting" data-field="blockStartedOn"></label>
      <label class="setting"><span>Current week</span><input inputmode="numeric" value="${escapeHtml(state.currentWeekIndex || 1)}" data-action="update-block-setting" data-field="currentWeekIndex"></label>
      <label class="setting"><span>Deload week</span><input inputmode="numeric" value="${escapeHtml(state.deloadWeek || 8)}" data-action="update-block-setting" data-field="deloadWeek"></label>
    </div>` : ''}
  </section>`;
}

function stat(value, label) { return `<div class="stat"><div class="stat-value">${escapeHtml(value)}</div><div class="stat-label">${escapeHtml(label)}</div></div>`; }
function monthList(title, events) {
  return `<section class="month-list"><div class="history-title">${escapeHtml(title)}</div>${events.length ? events.map(historyItem).join('') : '<div class="history-item muted-line">Nothing here yet.</div>'}</section>`;
}
function historyItem(h) {
  return `<div class="history-item ${h.type || ''}"><div>${escapeHtml(h.label)}</div>${h.why ? `<div class="history-why">${escapeHtml(h.why)}</div>` : ''}<div class="history-time">${fmtDate(h.at)}</div></div>`;
}
function globalSettingsDialog() {
  if (!ui.globalSettingsOpen) return '';
  const info = ui.globalSettingsInfo;
  const versions = info?.versions || {};
  const releases = versions.releases || [];
  const releaseRows = releases.length
    ? releases.map(item => {
        const label = item.version || item.name;
        const current = !!item.current;
        return `<div class="version-row ${current ? 'current' : ''}">
          <div class="version-main">
            <strong>${escapeHtml(label)}</strong>
            ${current ? `<span class="current-pill">Current</span>` : ''}
          </div>
          ${current ? '' : `<div class="version-actions">
            <button class="mini-action" data-action="switch-version" data-name="${escapeHtml(item.name)}">Switch</button>
            <button class="mini-action" data-action="delete-version" data-name="${escapeHtml(item.name)}">Delete</button>
          </div>`}
        </div>`;
      }).join('')
    : `<div class="muted-line">No versions yet.</div>`;
  return `<div class="dialog show global-settings-dialog">
    <div class="sheet settings-sheet">
      <div class="settings-sheet-head">
        <h2>Settings</h2>
        <button class="icon-plain sheet-x" data-action="close-global-settings" aria-label="Close">×</button>
      </div>

      <section class="settings-block">
        <h3>Training</h3>
        <label class="setting deload-setting"><span>Deload every</span><input inputmode="numeric" value="${escapeHtml(state.deloadWeek || 8)}" data-action="update-global-deload"><em>weeks</em></label>
      </section>

      <section class="settings-block">
        <h3>Update</h3>
        <label class="update-drop ${ui.updateDrag ? 'dragging' : ''}">
          <input type="file" accept=".zip,application/zip" data-action="install-update-zip" ${ui.updateBusy ? 'disabled' : ''}>
          <span>${ui.updateBusy ? 'Installing…' : 'Upload update'}</span>
        </label>
      </section>

      ${ui.updateMessage ? `<div class="notice ${ui.updateMessage.toLowerCase().includes('fail') || ui.updateMessage.toLowerCase().includes('error') ? 'warn' : 'safe'}">${escapeHtml(ui.updateMessage)}</div>` : ''}

      <section class="settings-block versions-block">
        <h3>Versions</h3>
        <div class="version-list">${releaseRows}</div>
      </section>
    </div>
  </div>`;
}

async function openGlobalSettings() {
  ui.globalSettingsOpen = true;
  ui.updateMessage = '';
  render();
  await refreshGlobalSettingsInfo();
}

async function refreshGlobalSettingsInfo() {
  try {
    const res = await fetch(`./api/app-info?t=${Date.now()}`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Could not read app info.');
    ui.globalSettingsInfo = data;
  } catch (err) {
    ui.globalSettingsInfo = { app_version: APP_VERSION, app_root: 'local static mode', versions: { root: 'versions', releases: [] } };
    ui.updateMessage = `Settings loaded without server API: ${err.message || err}`;
  }
  render();
}

async function clearBrowserAppCache() {
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    }
    if (navigator.serviceWorker?.getRegistrations) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(reg => reg.update().catch(() => null)));
    }
  } catch {}
}

async function waitForServerVersion(targetVersion, timeoutMs = 9000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`./api/app-info?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.ok && (!targetVersion || data.app_version === targetVersion)) {
        return data;
      }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 350));
  }
  return null;
}

async function finishUpdateAndReload(targetVersion) {
  ui.updateMessage = 'Restarting…';
  render();
  const data = await waitForServerVersion(targetVersion);
  if (data) {
    ui.updateMessage = 'Updated. Reloading…';
    ui.globalSettingsInfo = data;
    render();
    await clearBrowserAppCache();
    window.location.replace(`${window.location.pathname}?t=${Date.now()}`);
  } else {
    ui.updateMessage = 'Update installed. Server is still restarting — refresh once in a moment.';
    render();
  }
}

async function installUpdateZip(file) {
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.zip')) {
    ui.updateMessage = 'Choose a .zip update package.';
    render();
    return;
  }
  ui.updateBusy = true;
  ui.updateMessage = `Installing ${file.name}…`;
  render();
  try {
    const res = await fetch('./api/install-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/zip', 'X-Filename': encodeURIComponent(file.name) },
      body: file,
      cache: 'no-store'
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Update failed.');
    const targetVersion = data.target_version || data.app_version || '';
    ui.updateBusy = false;
    ui.updateMessage = data.message || 'Update installed. Restarting…';
    render();
    await finishUpdateAndReload(targetVersion);
  } catch (err) {
    ui.updateBusy = false;
    ui.updateMessage = `Update failed: ${err.message || err}`;
    render();
  }
}

async function versionCommand(action, name) {
  if (!name) return;
  ui.updateBusy = true;
  ui.updateMessage = action === 'delete' ? `Deleting ${name}…` : `Switching to ${name}…`;
  render();
  try {
    const res = await fetch(action === 'delete' ? './api/delete-version' : './api/switch-version', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
      cache: 'no-store'
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || `${action} failed.`);
    if (action === 'delete') {
      ui.updateBusy = false;
      ui.updateMessage = data.message || 'Deleted.';
      ui.globalSettingsInfo = data;
      render();
      return;
    }
    const targetVersion = data.target_version || data.app_version || '';
    ui.updateBusy = false;
    ui.updateMessage = data.message || 'Switched. Restarting…';
    render();
    await finishUpdateAndReload(targetVersion);
  } catch (err) {
    ui.updateBusy = false;
    ui.updateMessage = `${action === 'delete' ? 'Delete' : 'Switch'} failed: ${err.message || err}`;
    render();
  }
}

function backupDialog() {
  return `<div class="dialog ${ui.backupOpen ? 'show' : ''}"><div class="sheet"><h2>BACKUP</h2><p>Copy this JSON somewhere safe. Paste saved JSON and hit Import to restore.</p><textarea id="backupText">${escapeHtml(ui.backupText)}</textarea><div class="card-actions sheet-actions"><button class="action" data-action="close-backup">CLOSE</button><button class="action" data-action="copy-backup">COPY</button><button class="action primary" data-action="import-backup">IMPORT</button></div></div></div>`;
}

function bindEvents() {
  document.querySelectorAll('[data-action]').forEach(el => {
    const action = el.dataset.action;
    if (action === 'update-row') {
      el.addEventListener('change', ev => updateRow(el.dataset.exerciseId, el.dataset.rowId, el.dataset.field, ev.target.value));
      el.addEventListener('blur', ev => updateRow(el.dataset.exerciseId, el.dataset.rowId, el.dataset.field, ev.target.value));
      return;
    }
    if (action === 'update-setting') {
      const eventName = el.type === 'checkbox' ? 'change' : 'change';
      el.addEventListener(eventName, ev => {
        const ex = findExercise(el.dataset.exerciseId) || findAnyExercise(el.dataset.exerciseId);
        if (ex?.type === 'lift') updateLiftSetting(el.dataset.exerciseId, el.dataset.field, el.type === 'checkbox' ? ev.target.checked : ev.target.value);
        else updateSimpleSetting(el.dataset.exerciseId, el.dataset.field, ev.target.value);
      });
      return;
    }
    if (action === 'update-rep-range') {
      el.addEventListener('change', ev => updateRepRange(el.dataset.exerciseId, ev.target.value));
      el.addEventListener('blur', ev => updateRepRange(el.dataset.exerciseId, ev.target.value));
      return;
    }
    if (action === 'update-global-deload') {
      el.addEventListener('change', ev => updateGlobalDeload(ev.target.value));
      el.addEventListener('blur', ev => updateGlobalDeload(ev.target.value));
      return;
    }
    if (action === 'update-block-setting') {
      el.addEventListener('change', ev => updateBlockSetting(el.dataset.field, ev.target.value));
      return;
    }
    if (action === 'assign-calendar-date') {
      el.addEventListener('change', ev => assignCalendarDate(el.dataset.date, ev.target.value));
      return;
    }
    if (action === 'update-session-note') {
      el.addEventListener('input', ev => { ui.noteDraft = ev.target.value; });
      el.addEventListener('blur', ev => saveSessionNote(ev.target.value));
      el.addEventListener('keydown', ev => {
        if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') { ev.preventDefault(); saveSessionNote(ev.target.value); }
      });
      return;
    }
    if (action === 'update-exercise-note') {
      el.addEventListener('input', ev => { ui.exerciseNoteDraft = ev.target.value; });
      el.addEventListener('blur', ev => saveExerciseNote(el.dataset.exerciseId, ev.target.value));
      el.addEventListener('keydown', ev => {
        if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') { ev.preventDefault(); saveExerciseNote(el.dataset.exerciseId, ev.target.value); }
      });
      return;
    }
    if (action === 'install-update-zip') {
      const drop = el.closest('.update-drop');
      el.addEventListener('change', ev => installUpdateZip(ev.target.files && ev.target.files[0]));
      if (drop) {
        drop.addEventListener('dragenter', ev => { ev.preventDefault(); ui.updateDrag = true; drop.classList.add('dragging'); });
        drop.addEventListener('dragover', ev => { ev.preventDefault(); });
        drop.addEventListener('dragleave', ev => { ev.preventDefault(); ui.updateDrag = false; drop.classList.remove('dragging'); });
        drop.addEventListener('drop', ev => {
          ev.preventDefault();
          ui.updateDrag = false;
          drop.classList.remove('dragging');
          const file = ev.dataTransfer?.files && ev.dataTransfer.files[0];
          installUpdateZip(file);
        });
      }
      return;
    }
    if (action === 'calendar-date') {
      let longTimer = null;
      let startX = 0;
      let startY = 0;
      const cancelLong = () => { if (longTimer) clearTimeout(longTimer); longTimer = null; };
      el.addEventListener('pointerdown', ev => {
        startX = ev.clientX; startY = ev.clientY; el.dataset.longPress = '';
        longTimer = setTimeout(() => { el.dataset.longPress = '1'; showCalendarMenu(el.dataset.date); }, 470);
      });
      el.addEventListener('pointermove', ev => { if (Math.abs(ev.clientX - startX) > 10 || Math.abs(ev.clientY - startY) > 10) cancelLong(); });
      el.addEventListener('pointerup', cancelLong);
      el.addEventListener('pointercancel', cancelLong);
      el.addEventListener('click', ev => { ev.preventDefault(); if (el.dataset.longPress === '1') { el.dataset.longPress = ''; return; } handleAction(el); });
      return;
    }
    el.addEventListener('click', ev => { ev.preventDefault(); handleAction(el); });
  });
  bindSwipeRows();
  bindExerciseGestures();
  const noteEditor = document.querySelector('[data-role="session-note-editor"], [data-role="exercise-note-editor"]');
  if (noteEditor) {
    setTimeout(() => {
      noteEditor.focus();
      try { noteEditor.setSelectionRange(noteEditor.value.length, noteEditor.value.length); } catch {}
    }, 0);
  }
}

function bindSwipeRows() {
  const rows = Array.from(document.querySelectorAll('.swipe-row.can-delete'));
  rows.forEach(row => {
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let dragging = false;
    let mode = null;
    const track = row.querySelector('.swipe-track');
    if (!track) return;

    const close = () => {
      row.classList.remove('open', 'dragging');
      track.style.transform = '';
    };
    const open = () => {
      closeSwipeRows(row);
      row.classList.add('open');
      track.style.transform = 'translateX(-94px)';
    };

    row.addEventListener('pointerdown', ev => {
      if (ev.target.closest('input, textarea, button, label, .input-shell')) return;
      startX = ev.clientX;
      startY = ev.clientY;
      lastX = startX;
      dragging = true;
      mode = null;
    }, { passive: true });

    row.addEventListener('pointermove', ev => {
      if (!dragging) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      lastX = ev.clientX;

      if (!mode) {
        if (ay > 10 && ay > ax * 0.9) {
          mode = 'scroll';
          dragging = false;
          row.classList.remove('dragging');
          if (row.classList.contains('open')) close();
          return;
        }
        const wantsOpen = dx < -16 && ax > ay * 1.9;
        const wantsClose = row.classList.contains('open') && dx > 14 && ax > ay * 1.45;
        if (wantsOpen || wantsClose) {
          mode = 'swipe';
          row.classList.add('dragging');
          try { row.setPointerCapture(ev.pointerId); } catch {}
        } else {
          return;
        }
      }
      if (mode !== 'swipe') return;
      ev.preventDefault();
      if (!row.classList.contains('open')) closeSwipeRows(row);
      const base = row.classList.contains('open') ? -94 : 0;
      const offset = Math.min(0, Math.max(-110, base + dx));
      track.style.transform = `translateX(${offset}px)`;
    }, { passive: false });

    const finish = () => {
      if (!dragging && mode !== 'swipe') return;
      const dx = lastX - startX;
      dragging = false;
      row.classList.remove('dragging');
      if (mode !== 'swipe') return;
      if (row.classList.contains('open')) {
        if (dx > 24) close();
        else open();
      } else {
        if (dx < -58) open();
        else close();
      }
      mode = null;
    };
    row.addEventListener('pointerup', finish);
    row.addEventListener('pointercancel', finish);
  });

  document.addEventListener('pointerdown', ev => {
    if (!ev.target.closest('.swipe-row.open')) closeSwipeRows();
  }, { passive: true });
  document.addEventListener('scroll', () => closeSwipeRows(), { passive: true, capture: true });
}

function bindExerciseGestures() {
  const cards = Array.from(document.querySelectorAll('.stack > .card[data-exercise-id]'));
  cards.forEach(card => {
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let mode = null;
    let down = false;
    let longTimer = null;
    let targetIndex = null;
    const exerciseId = card.dataset.exerciseId;

    const clearLong = () => {
      if (longTimer) {
        clearTimeout(longTimer);
        longTimer = null;
      }
    };
    const resetCard = () => {
      card.classList.remove('card-swiping', 'drag-reorder');
      card.style.transform = '';
      card.style.opacity = '';
      document.querySelectorAll('.card.reorder-target').forEach(el => el.classList.remove('reorder-target'));
    };
    const indexForY = y => {
      const all = Array.from(document.querySelectorAll('.stack > .card[data-exercise-id]'));
      let index = 0;
      all.forEach(el => {
        if (el === card) return;
        const rect = el.getBoundingClientRect();
        if (y > rect.top + rect.height / 2) index += 1;
      });
      return Math.max(0, Math.min(all.length - 1, index));
    };

    card.addEventListener('pointerdown', ev => {
      if (ev.target.closest('input, textarea, button, select, label, .settings-panel, .swipe-row, .exercise-note-pen')) return;
      startX = lastX = ev.clientX;
      startY = lastY = ev.clientY;
      mode = null;
      down = true;
      targetIndex = null;
      clearLong();
      longTimer = setTimeout(() => {
        if (!down || mode) return;
        mode = 'reorder';
        card.classList.add('drag-reorder');
        try { card.setPointerCapture(ev.pointerId); } catch {}
        if (navigator.vibrate) navigator.vibrate(8);
      }, 430);
    }, { passive: true });

    card.addEventListener('pointermove', ev => {
      if (!down) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      lastX = ev.clientX;
      lastY = ev.clientY;

      if (mode === 'reorder') {
        ev.preventDefault();
        targetIndex = indexForY(ev.clientY);
        card.style.transform = `translateY(${dy}px) scale(.985)`;
        card.style.opacity = '.86';
        return;
      }

      if (ax > 8 || ay > 8) clearLong();

      if (!mode) {
        if (ay > 12 && ay > ax * 1.15) {
          mode = 'scroll';
          down = false;
          clearLong();
          return;
        }
        if (ax > 24 && ax > ay * 1.75) {
          mode = 'swipe';
          card.classList.add('card-swiping');
          try { card.setPointerCapture(ev.pointerId); } catch {}
        } else {
          return;
        }
      }

      if (mode === 'swipe') {
        ev.preventDefault();
        const offset = Math.max(-82, Math.min(82, dx));
        card.style.transform = `translateX(${offset}px)`;
      }
    }, { passive: false });

    const finish = () => {
      clearLong();
      if (!down && mode !== 'swipe' && mode !== 'reorder') return;
      const dx = lastX - startX;
      const finalMode = mode;
      down = false;
      mode = null;
      resetCard();

      if (finalMode === 'swipe') {
        if (dx < -72) completeExerciseGesture(exerciseId);
        else if (dx > 72) toggleExerciseSettingsGesture(exerciseId);
        return;
      }
      if (finalMode === 'reorder') {
        if (targetIndex === null) targetIndex = indexForY(lastY);
        reorderExerciseGesture(exerciseId, targetIndex);
      }
    };

    card.addEventListener('pointerup', finish);
    card.addEventListener('pointercancel', () => {
      clearLong();
      down = false;
      mode = null;
      resetCard();
    });
  });
}

function closeSwipeRows(except = null) {
  document.querySelectorAll('.swipe-row.open, .swipe-row.dragging').forEach(row => {
    if (row === except) return;
    row.classList.remove('open', 'dragging');
    const track = row.querySelector('.swipe-track');
    if (track) track.style.transform = '';
  });
}

function showCalendarMenu(iso) {
  ui.selectedDate = iso;
  ui.calendarMenuDate = iso;
  ui.calendarChangeDate = null;
  if (navigator.vibrate) navigator.vibrate(8);
  render();
}
function handleAction(el) {
  const action = el.dataset.action;
  if (action === 'workout') { ui.weekStripTargetDate = activeDateIso(); ui.screen = 'workout'; ui.forceWorkout = false; ui.replaySessionId = null; ui.activeDate = null; render(); }
  if (action === 'toggle-screen') { ui.replaySessionId = null; ui.screen = ui.screen === 'month' ? 'workout' : 'month'; if (ui.screen === 'workout') ui.weekStripTargetDate = activeDateIso(); if (ui.screen === 'month') { ui.monthWeek = state.currentWeekIndex || 1; ui.selectedDate = activeDateIso(); ui.calendarMonth = selectedDateIso().slice(0,7); } render(); }
  if (action === 'toggle-rebuild') { commit({ ...state, rebuildMode: !state.rebuildMode }); }
  if (action === 'edit-session-note') { startSessionNoteEdit(); }
  if (action === 'edit-exercise-note') { startExerciseNoteEdit(el.dataset.exerciseId); }
  if (action === 'goto-session') { ui.settingsExerciseId = null; ui.replaySessionId = null; ui.forceWorkout = true; ui.screen = 'workout'; ui.weekStripTargetDate = activeDateIso(); commit({ ...state, currentSessionIndex: Number(el.dataset.index), manualWorkout: null }); }
  if (action === 'open-replay') { const ev = (state.history || []).find(h => h.id === el.dataset.eventId && h.scope === 'session'); if (ev?.sessionDate) openDate(ev.sessionDate); else { ui.screen = 'workout'; render(); } }
  if (action === 'add-buildup') addBuildupRow(el.dataset.exerciseId);
  if (action === 'add-work-set') addWorkSetRow(el.dataset.exerciseId);
  if (action === 'delete-row') { closeSwipeRows(); deleteRow(el.dataset.exerciseId, el.dataset.rowId); }
  if (action === 'toggle-settings') { ui.settingsExerciseId = ui.settingsExerciseId === el.dataset.exerciseId ? null : el.dataset.exerciseId; render(); }
  if (action === 'complete-lift') completeLift(el.dataset.exerciseId);
  if (action === 'complete-simple') completeSimple(el.dataset.exerciseId);
  if (action === 'next-workout') nextWorkout();
  if (action === 'open-next-scheduled') { const next = nextScheduledWorkout(); ui.forceWorkout = true; ui.weekStripTargetDate = activeDateIso(); commit({ ...state, currentSessionIndex: next.sessionIndex }, `opened ${next.title}`); }
  if (action === 'goto-rest') { ui.replaySessionId = null; ui.forceWorkout = false; ui.screen = 'workout'; render(); }
  if (action === 'clear-session') clearCurrentSession();
  if (action === 'select-week') { ui.monthWeek = Number(el.dataset.week); render(); }
  if (action === 'toggle-block-settings') { ui.blockSettingsOpen = !ui.blockSettingsOpen; render(); }
  if (action === 'open-date') openDate(el.dataset.date);
  if (action === 'shift-week') shiftWeek(Number(el.dataset.days || 0));
  if (action === 'goto-current-week') gotoCurrentWeek();
  if (action === 'calendar-date') { ui.calendarMenuDate = null; ui.calendarChangeDate = null; openDate(el.dataset.date); }
  if (action === 'calendar-prev') shiftCalendarMonth(-1);
  if (action === 'calendar-next') shiftCalendarMonth(1);
  if (action === 'calendar-done') markDateDone(el.dataset.date);
  if (action === 'calendar-skip') toggleDateSkip(el.dataset.date);
  if (action === 'calendar-change-menu') { ui.calendarMenuDate = el.dataset.date; ui.calendarChangeDate = ui.calendarChangeDate === el.dataset.date ? null : el.dataset.date; render(); }
  if (action === 'calendar-change-to') changeCalendarDateTo(el.dataset.date, el.dataset.value);
  if (action === 'build-next-month') buildNextMonth();
  if (action === 'open-backup') openBackup('export');
  if (action === 'import-backup-open') openBackup('import');
  if (action === 'copy-backup') copyBackup();
  if (action === 'close-backup') { ui.backupOpen = false; render(); }
  if (action === 'import-backup') importBackup();
  if (action === 'open-global-settings') openGlobalSettings();
  if (action === 'close-global-settings') { ui.globalSettingsOpen = false; render(); }
  if (action === 'switch-version') versionCommand('switch', el.dataset.name);
  if (action === 'delete-version') versionCommand('delete', el.dataset.name);
  if (action === 'reset') resetProgram();
}

// Recovery build: no service-worker registration.
async function installUpdateFromErrorPage(file) {
  const status = document.querySelector('[data-role="error-update-status"]');
  const write = text => { if (status) status.textContent = text; };
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.zip')) {
    write('Choose a zip.');
    return;
  }
  write(`Installing ${file.name}…`);
  try {
    const res = await fetch('./api/install-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/zip', 'X-Filename': encodeURIComponent(file.name) },
      body: file,
      cache: 'no-store'
    });
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok || data.ok === false) throw new Error(data.error || `Update failed (${res.status}).`);
    write('Installed. Restarting…');
    setTimeout(() => window.location.replace(`${window.location.pathname}?t=${Date.now()}`), 2400);
  } catch (err) {
    write(`Update failed: ${err.message || err}`);
  }
}
function bindErrorPageUpdater() {
  const input = document.querySelector('[data-role="error-update-input"]');
  const drop = document.querySelector('[data-role="error-update-drop"]');
  if (!input || !drop || drop.dataset.bound) return;
  drop.dataset.bound = '1';
  input.addEventListener('change', ev => installUpdateFromErrorPage(ev.target.files && ev.target.files[0]));
  drop.addEventListener('dragover', ev => { ev.preventDefault(); drop.classList.add('dragging'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('dragging'));
  drop.addEventListener('drop', ev => {
    ev.preventDefault();
    drop.classList.remove('dragging');
    installUpdateFromErrorPage(ev.dataTransfer?.files && ev.dataTransfer.files[0]);
  });
}
function renderCrash(error) {
  const node = document.getElementById('app');
  const message = escapeHtml(error && (error.stack || error.message) ? (error.stack || error.message) : String(error || 'Unknown error'));
  if (node) node.innerHTML = `<div class="app"><main class="main"><section class="hero error-hero">
    <h1 class="title">APP ERROR</h1>
    <p class="note">${message}</p>
    <label class="error-update-drop" data-role="error-update-drop">
      <input type="file" accept=".zip,application/zip" data-role="error-update-input">
      <span>Upload update</span>
    </label>
    <p class="error-update-status" data-role="error-update-status"></p>
  </section></main></div>`;
  bindErrorPageUpdater();
  console.error(error);
}
try { render(); } catch (error) { renderCrash(error); }
window.addEventListener('error', event => renderCrash(event.error || event.message));
window.addEventListener('unhandledrejection', event => renderCrash(event.reason || event));
