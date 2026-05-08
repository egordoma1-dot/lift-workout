const APP_VERSION = 'v0.2 p.1';
// Same key as p.4/p.5 so the Home Screen app keeps existing workout data after a GitHub Pages update.
const STORAGE_KEY = 'lift.v0.1.p4.program';

const ui = {
  screen: 'workout',
  settingsExerciseId: null,
  backupOpen: false,
  backupText: '',
  toast: ''
};

const seedProgram = {
  schemaVersion: 2,
  currentMonthIndex: 1,
  currentSessionIndex: 0,
  rebuildMode: false,
  history: [],
  sessions: [
    {
      id: 'w22-upper-a', title: 'UPPER A', source: 'Week 22 / 4.05 style', intensity: 'PRE 9',
      notes: 'Current workout only. Build-ups are separate. Shoulder: do not hero-lift through weirdness.',
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
      notes: 'Back-friendly lower/core. Keep it clean, not heroic.',
      exercises: [
        prep('Bike', '5 min', 'easy'), body('Bird Dog', 'core', 2, 8, 'each'), timeHold('Side Plank', 'core', 2, 30, 's'),
        lift('pallof-press', 'Pallof Press', 'abs', 2, 10, 15, 2, 'pl', 1, [12, 12], 13, [buildup(1, 'pl', 12)]),
        lift('hip-add', 'Hip Add', 'adductors', 2, 10, 15, 4, 'pin', 1, [12, 12], 13),
        lift('hip-abd', 'Hip Abd', 'glutes', 3, 10, 15, 5, 'pin', 1, [12, 12, 12], 13),
        lift('glute-bridge', 'Glute Bridge', 'glutes', 3, 8, 12, 18.5, 'kg', 2.5, [10, 10, 10], 11, [buildup(16, 'kg', 12)]),
        prep('Bike', '8 min', 'easy')
      ]
    },
    {
      id: 'w22-upper-b', title: 'UPPER B', source: 'Week 22 / 7.05 style', intensity: 'solid, not stupid',
      notes: 'Dips + pull-up day. Ropes/face pull cluster lives here.',
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
      notes: 'Repeat lower/core pattern, small rep targets only.',
      exercises: [
        prep('Bike', '5 min', 'easy'), body('Dead Bug', 'core', 2, 11, 'each'), timeHold('Side Plank', 'core', 2, 30, 's each'),
        lift('pallof-press', 'Pallof Press', 'abs', 2, 10, 15, 2, 'pl', 1, [12, 12], 13),
        lift('hip-add', 'Hip Add', 'adductors', 2, 10, 15, 4, 'pin', 1, [12, 12], 13),
        lift('hip-abd', 'Hip Abd', 'glutes', 4, 10, 15, 5, 'pin', 1, [12, 12, 12, 12], 13),
        lift('glute-bridge', 'Glute Bridge', 'glutes', 4, 8, 12, 18.5, 'kg', 2.5, [10, 10, 10, 10], 11, [buildup(16, 'kg', 12)]),
        prep('Bike', '8 min', 'easy')
      ]
    },
    {
      id: 'w22-arm-sh', title: 'ARM + SH', source: 'Week 22 / 9.05 style', intensity: 'RPE 7',
      notes: 'Shoulders/arms with strict build-ups and no ego jumps.',
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

let state = loadState();

function lift(id, name, family, sets, repMin, repMax, weight, unit, increment, reps, targetRep, buildups = []) {
  const workRows = Array.from({ length: sets }, (_, i) => makeWorkRow(id, i + 1, weight, unit, reps[i] ?? targetRep ?? repMin));
  return {
    id, type: 'lift', name, family, sets, repMin, repMax, weight, unit, increment, targetRep,
    tracked: true, note: '', bestRepAtWeight: Math.max(0, ...reps.map(n => Number(n) || 0)),
    done: false, historyLog: [], lastCompletion: null, rows: [...buildups, ...workRows]
  };
}
function makeWorkRow(exerciseId, index, weight, unit, reps = '') {
  return { id: uid(`${exerciseId}-work-${index}`), kind: 'work', label: `SET ${index}`, weight, unit, reps, complete: false };
}
function buildup(weight, unit, reps) { return { id: uid('buildup'), kind: 'buildup', label: 'BUILDUP', weight, unit, reps, complete: false }; }
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
  next.schemaVersion = 2;
  next.currentMonthIndex = Number.isFinite(Number(next.currentMonthIndex)) ? Number(next.currentMonthIndex) : 1;
  next.currentSessionIndex = clampInt(next.currentSessionIndex, 0, Math.max(0, (next.sessions || base.sessions).length - 1), 0);
  next.rebuildMode = Boolean(next.rebuildMode);
  next.history = Array.isArray(next.history) ? next.history : [];
  next.sessions = Array.isArray(next.sessions) && next.sessions.length ? next.sessions : base.sessions;
  next.sessions = next.sessions.map((session, sessionIndex) => migrateSession(session, base.sessions[sessionIndex] || base.sessions[0]));
  return next;
}
function migrateSession(session, seedSession) {
  const next = { ...seedSession, ...session };
  next.exercises = Array.isArray(session.exercises) && session.exercises.length ? session.exercises : seedSession.exercises;
  next.exercises = next.exercises.map((item, itemIndex) => migrateExercise(item, seedSession.exercises[itemIndex] || {}));
  return next;
}
function migrateExercise(item, seed = {}) {
  const next = { ...seed, ...item };
  next.id = next.id || seed.id || uid(slug(next.name || 'exercise'));
  next.name = next.name || seed.name || 'Exercise';
  next.family = next.family || seed.family || 'general';
  next.done = Boolean(next.done);
  next.note = next.note || '';
  if (next.type !== 'lift') return next;
  next.tracked = next.tracked !== false;
  next.repMin = numberOr(next.repMin, seed.repMin, 8);
  next.repMax = numberOr(next.repMax, seed.repMax, 12);
  next.weight = numberOr(next.weight, seed.weight, 0);
  next.unit = next.unit || seed.unit || 'kg';
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
    unit: row.unit || next.unit,
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
function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function commit(next, toast = '') {
  state = migrateState(next);
  ui.toast = toast;
  saveState();
  render();
}

function currentSession() { return state.sessions[state.currentSessionIndex] || state.sessions[0]; }
function completion(session) {
  const total = session?.exercises?.length || 0;
  const done = session?.exercises?.filter(ex => ex.done).length || 0;
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}
function updateCurrentSession(updater, toast = '') {
  const sessions = state.sessions.map((s, i) => i === state.currentSessionIndex ? updater(s) : s);
  commit({ ...state, sessions }, toast);
}
function updateExercise(exerciseId, updater, toast = '') {
  updateCurrentSession(session => ({ ...session, exercises: session.exercises.map(ex => ex.id === exerciseId ? updater(ex) : ex) }), toast);
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
    const numericFields = new Set(['sets', 'repMin', 'repMax', 'targetRep', 'weight', 'increment']);
    const boolFields = new Set(['tracked']);
    let nextValue = value;
    if (numericFields.has(field)) nextValue = cleanNumber(value);
    if (boolFields.has(field)) nextValue = Boolean(value);
    let next = { ...ex, [field]: nextValue, done: false };
    if (field === 'weight') {
      next.rows = next.rows.map(row => row.kind === 'work' ? { ...row, weight: nextValue } : row);
    }
    if (field === 'unit') {
      next.rows = next.rows.map(row => ({ ...row, unit: nextValue }));
    }
    if (field === 'repMin' || field === 'repMax') {
      next.repMin = Math.max(0, Number(next.repMin));
      next.repMax = Math.max(Number(next.repMin), Number(next.repMax));
      next.targetRep = Math.min(Number(next.repMax), Math.max(Number(next.repMin), Number(next.targetRep)));
    }
    if (field === 'sets') next = setPlannedSets(next, Number(nextValue));
    return normalizeWorkRows(next);
  });
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
  const session = currentSession();
  const source = findExercise(exerciseId);
  if (!source || source.type !== 'lift') return;
  if (source.done) return reopenLift(exerciseId);

  const result = computeNextExercise(source);
  if (result.event === 'no-data') return toastOnly(result.message);

  const eventId = uid('event');
  const completedAt = new Date().toISOString();
  const event = {
    id: eventId,
    scope: 'exercise',
    monthIndex: state.currentMonthIndex,
    sessionId: session.id,
    sessionTitle: session.title,
    exerciseId: source.id,
    exerciseName: source.name,
    type: result.event,
    label: result.message,
    why: result.why,
    at: completedAt,
    weightBefore: source.weight,
    weightAfter: result.exercise.weight,
    targetBefore: source.targetRep,
    targetAfter: result.exercise.targetRep,
    reps: result.reps || workRows(source).map(row => Number(row.reps)).filter(Number.isFinite),
    buildupCount: buildupRows(source).length
  };
  const before = clone(source);
  const after = {
    ...result.exercise,
    done: true,
    lastCompletion: { eventId, before },
    historyLog: [compactExerciseEvent(event), ...(source.historyLog || [])].slice(0, 24)
  };
  const sessions = state.sessions.map((s, i) => i === state.currentSessionIndex
    ? { ...s, exercises: s.exercises.map(ex => ex.id === exerciseId ? after : ex) }
    : s
  );
  commit({ ...state, sessions, history: [event, ...state.history].slice(0, 200) }, result.message);
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
  const eventId = source.lastCompletion?.eventId || uid('simple');
  const event = {
    id: eventId,
    scope: 'simple',
    monthIndex: state.currentMonthIndex,
    sessionId: currentSession().id,
    sessionTitle: currentSession().title,
    exerciseId: source.id,
    exerciseName: source.name,
    type: 'done',
    label: `${source.name}: ${done ? 'done' : 'reopened'}.`,
    at: new Date().toISOString()
  };
  const sessions = state.sessions.map((s, i) => i === state.currentSessionIndex
    ? { ...s, exercises: s.exercises.map(ex => ex.id === exerciseId ? { ...ex, done, lastCompletion: done ? { eventId } : null } : ex) }
    : s
  );
  const history = done ? [event, ...state.history].slice(0, 200) : state.history.filter(h => h.id !== eventId);
  commit({ ...state, sessions, history }, event.label);
}
function findExercise(exerciseId) {
  return currentSession()?.exercises?.find(ex => ex.id === exerciseId);
}
function toastOnly(message) { ui.toast = message; render(); }

function nextWorkout() {
  const session = currentSession();
  const last = state.currentSessionIndex >= state.sessions.length - 1;
  const event = {
    id: uid('session'), scope: 'session', monthIndex: state.currentMonthIndex,
    type: 'session-done', label: `${session.title}: moved to next workout.`, at: new Date().toISOString()
  };
  commit({
    ...state,
    currentSessionIndex: last ? 0 : state.currentSessionIndex + 1,
    history: [event, ...state.history].slice(0, 200)
  }, last ? 'cycle restarted' : 'next workout');
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
  const nextMonth = Number(state.currentMonthIndex || 1) + 1;
  const isDeloadMonth = nextMonth % 2 === 0;
  const sessions = state.sessions.map(session => ({
    ...session,
    id: `${session.id.replace(/-m\d+$/, '')}-m${nextMonth}`,
    source: isDeloadMonth ? `Month ${nextMonth} / deload block` : `Month ${nextMonth} / progression block`,
    intensity: isDeloadMonth ? 'DELOAD' : (session.intensity === 'DELOAD' ? 'progression' : session.intensity),
    exercises: session.exercises.map(item => prepareForNextBlock(item, isDeloadMonth))
  }));
  const event = { id: uid('month'), scope: 'month', monthIndex: nextMonth, type: 'month-built', label: isDeloadMonth ? `Month ${nextMonth}: deload generated.` : `Month ${nextMonth}: progression block generated.`, at: new Date().toISOString() };
  commit({ ...state, currentMonthIndex: nextMonth, currentSessionIndex: 0, sessions, history: [event, ...state.history].slice(0, 200) }, event.label);
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
  const sessionEvents = (state.history || []).filter(h => h.monthIndex === monthIndex && h.scope === 'session');
  const progressed = events.filter(h => h.type === 'progressed-load' || h.type === 'progressed-reps');
  const misses = events.filter(h => h.type === 'missed-held');
  const held = events.filter(h => !['progressed-load', 'progressed-reps', 'missed-held'].includes(h.type));
  const buildups = events.reduce((sum, h) => sum + Number(h.buildupCount || 0), 0);
  return { events, sessionEvents, progressed, misses, held, buildups };
}

function escapeHtml(s) { return String(s ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }
function fmtDate(iso) {
  try { return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}
function sign(value) { return Number(value) > 0 ? '+' : ''; }

function render() {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="app">
    <div class="topbar">
      <button class="logo" data-action="workout">LIFT</button>
      <div class="version">${APP_VERSION}</div>
      <button class="top-action" data-action="toggle-screen">${ui.screen === 'month' ? 'WORKOUT' : 'MONTH'}</button>
    </div>
    <main class="main">${ui.screen === 'month' ? monthScreen() : workoutScreen()}</main>
    ${backupDialog()}
    ${ui.toast ? `<div class="toast">${escapeHtml(ui.toast)}</div>` : ''}
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
  <div class="bottom-grid">
    <button class="big-button" data-action="next-workout">NEXT WORKOUT</button>
    <button class="big-button ghost" data-action="clear-session">CLEAR SESSION</button>
  </div>`;
}
function liftCard(item) {
  const open = ui.settingsExerciseId === item.id;
  const preview = nextPreview(item);
  return `<article class="card lift-card ${item.done ? 'done' : ''}" data-exercise-id="${item.id}">
    <header class="card-head">
      <div class="card-title-row">
        <div><p class="family">${escapeHtml(item.family)}</p><h2 class="exercise-title">${escapeHtml(item.name)}</h2></div>
        <span class="badge">${escapeHtml(item.weight)}${escapeHtml(item.unit)}</span>
      </div>
      <div class="target">Target ${item.targetRep} · Range ${item.repMin}–${item.repMax} · ${sign(item.increment)}${item.increment}${item.unit}</div>
      ${item.note ? `<div class="tiny-note">${escapeHtml(item.note)}</div>` : ''}
    </header>
    <div class="rows">${item.rows.map(row => rowTemplate(item, row)).join('')}</div>
    <div class="card-actions">
      <button class="action quiet" data-action="add-buildup" data-exercise-id="${item.id}">+ BUILDUP</button>
      <button class="action quiet" data-action="add-work-set" data-exercise-id="${item.id}">+ SET</button>
      <button class="action" data-action="toggle-settings" data-exercise-id="${item.id}">${open ? 'CLOSE' : 'SETTINGS'}</button>
      <button class="action primary" data-action="complete-lift" data-exercise-id="${item.id}">${item.done ? 'REOPEN' : 'COMPLETE'}</button>
    </div>
    ${open ? settingsPanel(item) : ''}
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
  return `<div class="row ${row.kind === 'buildup' ? 'buildup' : 'work'}">
    <div class="row-top">
      <div class="row-label">${escapeHtml(row.label || row.kind)}</div>
      ${canDelete ? `<button class="row-delete" data-action="delete-row" data-exercise-id="${item.id}" data-row-id="${row.id}" aria-label="Delete row">×</button>` : ''}
    </div>
    <div class="row-fields">
      <label class="input-shell"><span class="field-caption">weight</span><input aria-label="Weight" inputmode="decimal" value="${escapeHtml(row.weight)}" data-action="update-row" data-exercise-id="${item.id}" data-row-id="${row.id}" data-field="weight" /><span class="unit">${escapeHtml(row.unit || item.unit)}</span></label>
      <label class="input-shell"><span class="field-caption">reps</span><input aria-label="Reps" inputmode="numeric" pattern="[0-9]*" value="${escapeHtml(row.reps)}" data-action="update-row" data-exercise-id="${item.id}" data-row-id="${row.id}" data-field="reps" /></label>
    </div>
  </div>`;
}
function settingsPanel(item) {
  return `<div class="settings-panel">
    <div class="settings-grid">
      ${settingText(item, 'name', 'Name')}
      ${settingText(item, 'family', 'Family')}
      ${settingNumber(item, 'sets', 'Planned sets')}
      ${settingNumber(item, 'repMin', 'Rep min')}
      ${settingNumber(item, 'repMax', 'Rep max')}
      ${settingNumber(item, 'targetRep', 'Target')}
      ${settingNumber(item, 'weight', 'Weight')}
      ${settingText(item, 'unit', 'Unit')}
      ${settingNumber(item, 'increment', 'Jump')}
      <label class="setting check"><span>Progression</span><input type="checkbox" data-action="update-setting" data-exercise-id="${item.id}" data-field="tracked" ${item.tracked !== false ? 'checked' : ''}></label>
    </div>
    <label class="setting full"><span>Note</span><textarea data-action="update-setting" data-exercise-id="${item.id}" data-field="note">${escapeHtml(item.note || '')}</textarea></label>
  </div>`;
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
function simpleCard(item) {
  const prescription = item.type === 'prep' ? item.prescription : item.type === 'time' ? `${item.sets} × ${item.seconds}${item.unit}` : `${item.sets} × ${item.reps}${item.unit ? ' ' + item.unit : ''}`;
  return `<article class="card simple-card ${item.done ? 'done' : ''}">
    <header class="card-head"><p class="family">${escapeHtml(item.family)}</p><h2 class="exercise-title">${escapeHtml(item.name)}</h2></header>
    <div class="simple-body"><div class="simple-main"><div class="simple-prescription">${escapeHtml(prescription)}</div><div>${escapeHtml(item.intensity || '')}</div></div><button class="action primary" data-action="complete-simple" data-exercise-id="${item.id}">${item.done ? 'REOPEN' : 'DONE'}</button></div>
  </article>`;
}
function monthScreen() {
  const r = deriveMonthResults();
  const nextIsDeload = (Number(state.currentMonthIndex || 1) + 1) % 2 === 0;
  return `<section class="hero">
    <p class="kicker">Month ${state.currentMonthIndex}</p>
    <h1 class="title">RESULTS</h1>
    <p class="note">Month view is the rebuild table: what moved, what held, and why. Next generated block: ${nextIsDeload ? 'DELOAD' : 'PROGRESSION'}.</p>
  </section>
  <section class="month-grid">
    ${stat(r.sessionEvents.length, 'sessions')}${stat(r.events.length, 'exercises')}${stat(r.progressed.length, 'progressed')}${stat(r.misses.length, 'misses held')}${stat(r.held.length, 'held')}${stat(r.buildups, 'build-ups')}
  </section>
  <div class="month-actions">
    <button class="action primary" data-action="build-next-month">BUILD NEXT MONTH</button>
    <button class="action" data-action="open-backup">BACKUP</button>
    <button class="action quiet" data-action="import-backup-open">IMPORT</button>
    <button class="action quiet danger" data-action="reset">RESET</button>
  </div>
  ${monthList('Progressed', r.progressed)}
  ${monthList('Missed but held', r.misses)}
  <section class="history"><div class="history-title">Recent moves</div>${state.history.length ? state.history.slice(0, 30).map(historyItem).join('') : '<div class="history-item">No history yet.</div>'}</section>`;
}
function stat(value, label) { return `<div class="stat"><div class="stat-value">${escapeHtml(value)}</div><div class="stat-label">${escapeHtml(label)}</div></div>`; }
function monthList(title, events) {
  return `<section class="month-list"><div class="history-title">${escapeHtml(title)}</div>${events.length ? events.map(historyItem).join('') : '<div class="history-item muted-line">Nothing here yet.</div>'}</section>`;
}
function historyItem(h) {
  return `<div class="history-item ${h.type || ''}"><div>${escapeHtml(h.label)}</div>${h.why ? `<div class="history-why">${escapeHtml(h.why)}</div>` : ''}<div class="history-time">${fmtDate(h.at)}</div></div>`;
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
      el.addEventListener(eventName, ev => updateLiftSetting(el.dataset.exerciseId, el.dataset.field, el.type === 'checkbox' ? ev.target.checked : ev.target.value));
      return;
    }
    el.addEventListener('click', ev => { ev.preventDefault(); handleAction(el); });
  });
}
function handleAction(el) {
  const action = el.dataset.action;
  if (action === 'workout') { ui.screen = 'workout'; render(); }
  if (action === 'toggle-screen') { ui.screen = ui.screen === 'month' ? 'workout' : 'month'; render(); }
  if (action === 'toggle-rebuild') { commit({ ...state, rebuildMode: !state.rebuildMode }); }
  if (action === 'goto-session') { ui.settingsExerciseId = null; commit({ ...state, currentSessionIndex: Number(el.dataset.index) }); }
  if (action === 'add-buildup') addBuildupRow(el.dataset.exerciseId);
  if (action === 'add-work-set') addWorkSetRow(el.dataset.exerciseId);
  if (action === 'delete-row') deleteRow(el.dataset.exerciseId, el.dataset.rowId);
  if (action === 'toggle-settings') { ui.settingsExerciseId = ui.settingsExerciseId === el.dataset.exerciseId ? null : el.dataset.exerciseId; render(); }
  if (action === 'complete-lift') completeLift(el.dataset.exerciseId);
  if (action === 'complete-simple') completeSimple(el.dataset.exerciseId);
  if (action === 'next-workout') nextWorkout();
  if (action === 'clear-session') clearCurrentSession();
  if (action === 'build-next-month') buildNextMonth();
  if (action === 'open-backup') openBackup('export');
  if (action === 'import-backup-open') openBackup('import');
  if (action === 'copy-backup') copyBackup();
  if (action === 'close-backup') { ui.backupOpen = false; render(); }
  if (action === 'import-backup') importBackup();
  if (action === 'reset') resetProgram();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
render();
