import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  loadDataV3, saveDataV3, generateId,
  getMonthKey, getMonthName, getDaysInMonth, getFirstDayOfMonth, formatDate,
  calculateStreak, getCategoryMonthlyTotals, getMonthlySets, getMonthlyTonnage, getMonthlyCalories,
  getDailyTotalsForMonth, getHeatmapData, getHeatmapQuartiles, getHeatmapLevel,
  getStatsData, toCSV, downloadCSV,
  MUSCLE_GROUP_ORDER, CATEGORY_COLORS, CARDIO_MUSCLE_GROUPS,
  EXERCISE_LIBRARY, SPLIT_MUSCLE_GROUPS,
} from './utils/dataParser';
import './App.css';

/* ============================================================
   ICONS
   ============================================================ */
const Icon = {
  home: '🏠',
  calendar: '📅',
  stats: '📊',
  settings: '⚙️',
  plus: '＋',
  chevronLeft: '‹',
  chevronRight: '›',
  chevronDown: '⌄',
  back: '🏋️',
  legs: '🦵',
  chest: '💪',
  cardio: '❤️',
  fire: '🔥',
};

/* ============================================================
   CATEGORY CONFIG
   ============================================================ */
const CATEGORY_CONFIG = {
  back:    { icon: Icon.back,   label: 'Back',    color: '#6366f1' },
  legs:    { icon: Icon.legs, label: 'Legs',    color: '#10b981' },
  chest:   { icon: Icon.chest, label: 'Chest',   color: '#ec4899' },
  cardio:  { icon: Icon.cardio, label: 'Cardio', color: '#f59e0b' },
};

const MUSCLE_CONFIG = {
  back:          { color: '#6366f1' },
  biceps:        { color: '#818cf8' },
  lower_back:    { color: '#a78bfa' },
  traps:         { color: '#7c3aed' },
  legs:          { color: '#10b981' },
  glutes:        { color: '#34d399' },
  quads:         { color: '#059669' },
  hamstring:     { color: '#047857' },
  calf:          { color: '#065f46' },
  chest:         { color: '#ec4899' },
  shoulders:     { color: '#f472b6' },
  triceps:       { color: '#db2777' },
  abs:           { color: '#be185d' },
};

/* ============================================================
   REGIMEN & SPLIT CONFIG
   ============================================================ */
const REGIMEN_STORAGE_KEY = 'exerciseRegimen';

export const REGIMEN_OPTIONS = [
  { id: 'full_body',   label: 'Full-body',          icon: '🏋️', desc: 'All muscle groups available every day' },
  { id: 'ppl',         label: 'Push / Pull / Legs', icon: '🔄', desc: '3-day rotation: Push → Pull → Legs' },
  { id: 'upper_lower', label: 'Upper / Lower',       icon: '🏔️', desc: '2-day rotation: Upper → Lower' },
];

export const SPLIT_COLORS = {
  push:       '#f97316',
  pull:       '#6366f1',
  legs:       '#10b981',
  upper:      '#a855f7',
  lower:      '#14b8a6',
  full_body:  null,
};

export const SPLIT_LABELS = {
  push: 'Push Day',
  pull: 'Pull Day',
  legs: 'Legs Day',
  upper: 'Upper Day',
  lower: 'Lower Day',
};

export function getRegimen() {
  return localStorage.getItem(REGIMEN_STORAGE_KEY) || null;
}

export function setRegimen(id) {
  localStorage.setItem(REGIMEN_STORAGE_KEY, id);
}

/* ============================================================
   UTILITY HOOKS
   ============================================================ */
function useAppData() {
  const [sessions, setSessions] = useState(() => loadDataV3());

  useEffect(() => {
    saveDataV3(sessions);
  }, [sessions]);

  const replaceSession = useCallback((date, session) => {
    setSessions(prev => ({ ...prev, [date]: session }));
  }, []);

  return { sessions, replaceSession };
}

/* ============================================================
   STEPPER COMPONENT (fixed for mobile)
   ============================================================ */
function Stepper({ value, onChange, min = 0, max = 999, step = 1 }) {
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const inputRef = useRef(null);

  const decrement = () => {
    if (!inputRef.current) return;
    const newVal = Math.min(max, Math.max(min, value - step));
    inputRef.current.value = newVal;
    // Dispatch a React-compatible input event
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(inputRef.current, newVal);
    inputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const increment = () => {
    if (!inputRef.current) return;
    const newVal = Math.min(max, Math.max(min, value + step));
    inputRef.current.value = newVal;
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(inputRef.current, newVal);
    inputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
  };

  return (
    <div className="stepper-controls">
      <button type="button" className="stepper-btn" onClick={decrement}>−</button>
      <input
        ref={inputRef}
        type="number"
        className="stepper-input"
        defaultValue={value}
        min={min}
        max={max}
      />
      <button type="button" className="stepper-btn" onClick={increment}>+</button>
    </div>
  );
}

/* ============================================================
   DATE PICKER MODAL
   ============================================================ */
function DatePickerModal({ year, month, day, onSelect, onClose }) {
  const [viewYear, setViewYear] = useState(year);
  const [viewMonth, setViewMonth] = useState(month);

  const daysInView = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const today = new Date();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInView; d++) cells.push(d);

  const isSelected = (d) => d === day && viewYear === year && viewMonth === month;
  const isToday = (d) =>
    d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  return (
    <div className="date-picker-overlay" onClick={onClose}>
      <div className="date-picker-sheet" onClick={e => e.stopPropagation()}>
        <div className="date-picker-title">{getMonthName(viewYear, viewMonth)}</div>
        <div className="date-picker-month-nav">
          <button className="month-picker-btn" onClick={prevMonth}>{Icon.chevronLeft}</button>
          <span className="month-label" style={{ fontSize: '0.9rem' }}>{getMonthName(viewYear, viewMonth)}</span>
          <button className="month-picker-btn" onClick={nextMonth}>{Icon.chevronRight}</button>
        </div>
        <div className="date-picker-grid">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} className="date-picker-day-header">{d}</div>
          ))}
          {cells.map((d, i) => (
            <div
              key={i}
              className={`date-picker-cell ${d === null ? 'disabled' : ''} ${isSelected(d) ? 'selected' : ''} ${isToday(d) && !isSelected(d) ? 'today' : ''}`}
              onClick={d !== null ? () => onSelect(viewYear, viewMonth, d) : undefined}
            >
              {d}
            </div>
          ))}
        </div>
        <button className="date-picker-done" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

/* ============================================================
   SPLIT PICKER MODAL
   ============================================================ */
function SplitPickerModal({ regimen, onSelect, onCancel }) {
  const options = regimen === 'ppl'
    ? [
        { id: 'push', label: 'Push', icon: '💪', color: SPLIT_COLORS.push },
        { id: 'pull', label: 'Pull', icon: '🔙', color: SPLIT_COLORS.pull },
        { id: 'legs', label: 'Legs', icon: '🦵', color: SPLIT_COLORS.legs },
      ]
    : [
        { id: 'upper', label: 'Upper', icon: '🏋️', color: SPLIT_COLORS.upper },
        { id: 'lower', label: 'Lower', icon: '🦵', color: SPLIT_COLORS.lower },
      ];

  return (
    <div className="split-picker-overlay" onClick={onCancel}>
      <div className="split-picker-sheet" onClick={e => e.stopPropagation()}>
        <div className="split-picker-title">What type of day?</div>
        <div className="split-picker-options">
          {options.map(opt => (
            <button
              key={opt.id}
              className="split-picker-btn"
              style={{ '--split-color': opt.color }}
              onClick={() => onSelect(opt.id)}
            >
              <span className="split-picker-btn-icon">{opt.icon}</span>
              <span className="split-picker-btn-label">{opt.label}</span>
            </button>
          ))}
        </div>
        <button className="split-picker-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

/* ============================================================
   SCREEN: SETTINGS
   ============================================================ */
function SettingsScreen({ regimen, onSelectRegimen }) {
  return (
    <div className="settings">
      <div className="settings-section">
        <div className="settings-section-title">Choose Your Regimen</div>
        <div className="settings-section-desc">
          Select how you want to structure your workouts. You can change this anytime.
        </div>
        <div className="regimen-cards">
          {REGIMEN_OPTIONS.map(opt => (
            <button
              key={opt.id}
              className={`regimen-card ${regimen === opt.id ? 'selected' : ''}`}
              onClick={() => onSelectRegimen(opt.id)}
            >
              <div className="regimen-card-icon">{opt.icon}</div>
              <div className="regimen-card-body">
                <div className="regimen-card-label">{opt.label}</div>
                <div className="regimen-card-desc">{opt.desc}</div>
              </div>
              {regimen === opt.id && (
                <div className="regimen-card-check">✅</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SCREEN: DASHBOARD
   ============================================================ */
function DashboardScreen({ sessions, year, month, onNavigateCalendar, onChangeMonth, onOpenSettings }) {
  const catTotals = useMemo(() => getCategoryMonthlyTotals(sessions, year, month), [sessions, year, month]);
  const totalSets = useMemo(() => getMonthlySets(sessions, year, month), [sessions, year, month]);
  const totalTonnage = useMemo(() => getMonthlyTonnage(sessions, year, month), [sessions, year, month]);
  const totalCals = useMemo(() => getMonthlyCalories(sessions, year, month), [sessions, year, month]);
  const streak = useMemo(() => calculateStreak(sessions), [sessions]);
  const heatmap = useMemo(() => getHeatmapData(sessions, 28), [sessions]);
  const quartiles = useMemo(() => getHeatmapQuartiles(heatmap), [heatmap]);

  return (
    <div className="dashboard">
      {/* Big stats */}
      <div className="big-stats">
        <div className="big-stat">
          <div className="big-stat-value">{totalSets.toLocaleString()}</div>
          <div className="big-stat-label">Total Sets</div>
        </div>
        <div className="big-stat-sep" />
        <div className="big-stat">
          <div className="big-stat-value">{(totalTonnage / 1000).toFixed(1)}k</div>
          <div className="big-stat-label">Tonnage (kg)</div>
        </div>
        <div className="big-stat-sep" />
        <div className="big-stat">
          <div className="big-stat-value">{totalCals.toLocaleString()}</div>
          <div className="big-stat-label">Calories</div>
        </div>
      </div>

      {/* Category cards */}
      <div className="category-grid">
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
          const catSets = catTotals[key] || 0;
          return (
            <div
              key={key}
              className={`category-card ${key}`}
              onClick={() => onNavigateCalendar(key)}
            >
              <div className="category-icon">{cfg.icon}</div>
              <div className="category-name" style={{ color: cfg.color }}>{cfg.label}</div>
              <div className="category-value">
                {catSets.toLocaleString()}
                <span className="category-unit">sets</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Streak */}
      <div className="streak-row">
        <span className="streak-emoji">🔥</span>
        <span className="streak-text">{streak} day streak</span>
        <span className="streak-sub">consecutive workout days</span>
      </div>

      {/* Heatmap */}
      <div className="heatmap-section">
        <div className="heatmap-title">Last 28 Days (tonnage)</div>
        <div className="heatmap-grid">
          {heatmap.map(({ date, volume }) => (
            <div
              key={date}
              className={`heatmap-cell l${getHeatmapLevel(volume, quartiles)}`}
            >
              <div className="heatmap-tooltip">{date}: {volume.toLocaleString()} kg</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SCREEN: CALENDAR
   ============================================================ */
function CalendarScreen({ sessions, year, month, regimen, onSelectDay, onAddEntry }) {
  const today = new Date();
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const dailyTotals = useMemo(() => getDailyTotalsForMonth(sessions, year, month), [sessions, year, month]);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const dotColor = (splitType) => {
    if (splitType && SPLIT_COLORS[splitType]) return SPLIT_COLORS[splitType];
    return '#888';
  };

  const maxVol = useMemo(() => {
    const vols = Object.values(dailyTotals).map(d => d.tonnage);
    return Math.max(...vols, 1);
  }, [dailyTotals]);

  const getBgTint = (sets, tonnage) => {
    if (sets === 0) return 'transparent';
    const ratio = Math.min(tonnage / maxVol, 1);
    const alpha = 0.08 + ratio * 0.22;
    return `rgba(16, 185, 129, ${alpha})`;
  };

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDayClick = (dateStr) => {
    onSelectDay(dateStr, regimen);
  };

  return (
    <div className="calendar">
      <div className="calendar-grid">
        {dayHeaders.map(d => (
          <div key={d} className="day-header-cell">{d}</div>
        ))}
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="calendar-day-cell outside-month" />;
          }
          const dateStr = formatDate(year, month, day);
          const dt = dailyTotals[dateStr] || { sets: 0, tonnage: 0, calories: 0, muscleGroups: new Set(), isRest: false, splitType: null };
          const isToday = dateStr === todayStr;

          return (
            <div
              key={dateStr}
              className={`calendar-day-cell ${isToday ? 'today' : ''}`}
              style={{ background: getBgTint(dt.sets, dt.tonnage) }}
              onClick={() => handleDayClick(dateStr)}
            >
              <div className="calendar-day-number">{day}</div>
              {dt.sets > 0 && (
                <div className="calendar-sets">{dt.sets}s · {(dt.tonnage / 1000).toFixed(1)}k</div>
              )}
              {dt.calories > 0 && (
                <div className="calendar-calories">{dt.calories}cal</div>
              )}
              {dt.splitType && (
                <div className="calendar-dot" style={{ background: dotColor(dt.splitType), width: 8, height: 8, borderRadius: '50%' }} />
              )}
              {dt.isRest && (
                <div className="calendar-dot" style={{ background: '#888', width: 8, height: 8, borderRadius: '50%' }} />
              )}
            </div>
          );
        })}
      </div>

      <button className="calendar-add-btn" onClick={onAddEntry}>
        {Icon.plus} Log Workout
      </button>
    </div>
  );
}

/* ============================================================
   EXERCISE CARD (per-exercise block in log screen)
   ============================================================ */
function ExerciseCard({ exercise, onUpdate, onRemove }) {
  const sets = exercise.sets || [];

  const updateSet = (setId, field, value) => {
    const newSets = sets.map(s =>
      s.id === setId ? { ...s, [field]: value } : s
    );
    onUpdate({ ...exercise, sets: newSets });
  };

  const removeSet = (setId) => {
    onUpdate({ ...exercise, sets: sets.filter(s => s.id !== setId) });
  };

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    const newSet = {
      id: generateId(),
      weight_kg: lastSet ? lastSet.weight_kg : 0,
      reps: lastSet ? lastSet.reps : 0,
    };
    onUpdate({ ...exercise, sets: [...sets, newSet] });
  };

  const exerciseTonnage = sets.reduce((sum, s) => sum + (s.weight_kg || 0) * (s.reps || 0), 0);
  const exerciseReps = sets.reduce((sum, s) => sum + (s.reps || 0), 0);

  const color = MUSCLE_CONFIG[exercise.muscle_group]?.color || '#6366f1';

  return (
    <div className="exercise-card">
      <div className="exercise-card-header">
        <div className="exercise-color-bar" style={{ background: color }} />
        <span className="exercise-name">{exercise.name}</span>
        <button className="exercise-remove-btn" onClick={onRemove}>×</button>
      </div>
      <div className="exercise-sets-list">
        {sets.map((set, idx) => (
          <div key={set.id} className="set-row">
            <span className="set-num">Set {idx + 1}:</span>
            <div className="set-inputs">
              <Stepper
                value={set.weight_kg || 0}
                onChange={v => updateSet(set.id, 'weight_kg', v)}
                min={0} max={500} step={2.5}
              />
              <span className="set-unit">kg ×</span>
              <Stepper
                value={set.reps || 0}
                onChange={v => updateSet(set.id, 'reps', v)}
                min={0} max={100} step={1}
              />
              <span className="set-unit">reps</span>
            </div>
            <button className="set-remove-btn" onClick={() => removeSet(set.id)}>×</button>
          </div>
        ))}
        <button className="add-set-btn" onClick={addSet}>+ Add Set</button>
      </div>
      {sets.length > 0 && (
        <div className="exercise-subtotal">
          Subtotal: {exerciseReps} reps · {exerciseTonnage.toLocaleString()} kg
        </div>
      )}
    </div>
  );
}

/* ============================================================
   EXERCISE PICKER MODAL
   ============================================================ */
function ExercisePickerModal({ splitType, onSelect, onCancel }) {
  // Build options: primary groups first, then others, always include cardio
  const primaryMgs = splitType ? (SPLIT_MUSCLE_GROUPS[splitType] || []) : Object.keys(EXERCISE_LIBRARY);

  const allMgs = Object.keys(EXERCISE_LIBRARY);
  const secondaryMgs = allMgs.filter(mg => !primaryMgs.includes(mg));

  const buildOptions = (mgs) => {
    const opts = [];
    mgs.forEach(mg => {
      const exercises = EXERCISE_LIBRARY[mg] || [];
      exercises.forEach(ex => {
        opts.push({ ...ex, group: mg });
      });
    });
    return opts;
  };

  const primaryOptions = buildOptions(primaryMgs);
  const secondaryOptions = buildOptions(secondaryMgs);

  return (
    <div className="exercise-picker-overlay" onClick={onCancel}>
      <div className="exercise-picker-sheet" onClick={e => e.stopPropagation()}>
        <div className="exercise-picker-title">Add Exercise</div>
        <div className="exercise-picker-search-wrap">
          <select
            className="exercise-picker-select"
            defaultValue=""
            onChange={e => {
              if (e.target.value) {
                const [name, mg] = e.target.value.split('||');
                onSelect({ name, muscle_group: mg });
                e.target.value = '';
              }
            }}
          >
            <option value="" disabled>Select an exercise…</option>
            {primaryOptions.length > 0 && (
              <optgroup label={splitType ? 'Primary muscles' : 'All exercises'}>
                {primaryOptions.map(ex => (
                  <option key={`${ex.name}||${ex.muscle_group}`} value={`${ex.name}||${ex.muscle_group}`}>
                    {ex.name} ({ex.muscle_group})
                  </option>
                ))}
              </optgroup>
            )}
            {secondaryOptions.length > 0 && (
              <optgroup label="Other muscle groups">
                {secondaryOptions.map(ex => (
                  <option key={`${ex.name}||${ex.muscle_group}`} value={`${ex.name}||${ex.muscle_group}`}>
                    {ex.name} ({ex.muscle_group})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
        <button className="exercise-picker-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

/* ============================================================
   SCREEN: LOG WORKOUT (V3)
   ============================================================ */
function LogScreen({ sessions, initialDate, splitType, onSave, onBack }) {
  const today = new Date();
  const [year, setYear] = useState(initialDate ? parseInt(initialDate.split('-')[0]) : today.getFullYear());
  const [month, setMonth] = useState(initialDate ? parseInt(initialDate.split('-')[1]) - 1 : today.getMonth());
  const [day, setDay] = useState(initialDate ? parseInt(initialDate.split('-')[2]) : today.getDate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [session, setSession] = useState(() => {
    const dateStr = initialDate || formatDate(today.getFullYear(), today.getMonth(), today.getDate());
    const existing = sessions[dateStr];
    if (existing) {
      return {
        date: dateStr,
        splitType: splitType || existing.splitType || null,
        exercises: existing.exercises || [],
        cardio: existing.cardio || { walk_min: 0, cardio_min: 0, hiit_min: 0, calories: 0 },
        isRest: existing.isRest || false,
      };
    }
    return {
      date: dateStr,
      splitType: splitType || null,
      exercises: [],
      cardio: { walk_min: 0, cardio_min: 0, hiit_min: 0, calories: 0 },
      isRest: false,
    };
  });

  const dateStr = formatDate(year, month, day);

  // Sync when date changes
  const syncFromSessions = useCallback(() => {
    const existing = sessions[dateStr];
    if (existing) {
      setSession({
        date: dateStr,
        splitType: splitType || existing.splitType || null,
        exercises: existing.exercises || [],
        cardio: existing.cardio || { walk_min: 0, cardio_min: 0, hiit_min: 0, calories: 0 },
        isRest: existing.isRest || false,
      });
    } else {
      setSession({
        date: dateStr,
        splitType: splitType || null,
        exercises: [],
        cardio: { walk_min: 0, cardio_min: 0, hiit_min: 0, calories: 0 },
        isRest: false,
      });
    }
  }, [dateStr, sessions, splitType]);

  const updateExercise = (updated) => {
    setSession(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => ex.id === updated.id ? updated : ex),
    }));
  };

  const removeExercise = (id) => {
    setSession(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.id !== id),
    }));
  };

  const addExercise = ({ name, muscle_group }) => {
    const newEx = {
      id: generateId(),
      name,
      muscle_group,
      sets: [{ id: generateId(), weight_kg: 0, reps: 0 }],
    };
    setSession(prev => ({
      ...prev,
      exercises: [...prev.exercises, newEx],
      isRest: false,
    }));
    setShowExercisePicker(false);
  };

  const updateCardio = (field, value) => {
    setSession(prev => ({
      ...prev,
      cardio: { ...prev.cardio, [field]: value },
      isRest: false,
    }));
  };

  const copyFromYesterday = () => {
    const d = new Date(year, month, day);
    d.setDate(d.getDate() - 1);
    const yesterdayStr = formatDate(d.getFullYear(), d.getMonth(), d.getDate());
    const yesterdaySession = sessions[yesterdayStr];
    if (!yesterdaySession) return;
    setSession({
      ...yesterdaySession,
      date: dateStr,
      splitType: splitType || yesterdaySession.splitType,
    });
  };

  const markAsRest = () => {
    setSession({
      date: dateStr,
      splitType: splitType || null,
      exercises: [],
      cardio: { walk_min: 0, cardio_min: 0, hiit_min: 0, calories: 0 },
      isRest: true,
    });
  };

  const totals = useMemo(() => {
    let sets = 0, reps = 0, tonnage = 0, cardioMin = 0, calories = 0;
    (session.exercises || []).forEach(ex => {
      (ex.sets || []).forEach(set => {
        sets++;
        reps += set.reps || 0;
        tonnage += (set.weight_kg || 0) * (set.reps || 0);
      });
    });
    cardioMin += (session.cardio?.walk_min || 0) + (session.cardio?.cardio_min || 0) + (session.cardio?.hiit_min || 0);
    calories += session.cardio?.calories || 0;
    return { sets, reps, tonnage, cardioMin, calories };
  }, [session]);

  const handleSave = () => {
    onSave(dateStr, session);
  };

  const handleDateSelect = (y, m, d) => {
    setYear(y); setMonth(m); setDay(d);
    setShowDatePicker(false);
    const ds = formatDate(y, m, d);
    const existing = sessions[ds];
    if (existing) {
      setSession({
        date: ds,
        splitType: splitType || existing.splitType || null,
        exercises: existing.exercises || [],
        cardio: existing.cardio || { walk_min: 0, cardio_min: 0, hiit_min: 0, calories: 0 },
        isRest: existing.isRest || false,
      });
    } else {
      setSession({
        date: ds,
        splitType: splitType || null,
        exercises: [],
        cardio: { walk_min: 0, cardio_min: 0, hiit_min: 0, calories: 0 },
        isRest: false,
      });
    }
  };

  const prevDay = () => {
    const d = new Date(year, month, day);
    d.setDate(d.getDate() - 1);
    handleDateSelect(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const nextDay = () => {
    const d = new Date(year, month, day);
    d.setDate(d.getDate() + 1);
    handleDateSelect(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const dayLabel = new Date(year, month, day).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

  const splitColor = session.splitType ? SPLIT_COLORS[session.splitType] : '#6366f1';

  return (
    <div className="log">
      {/* Back button */}
      <button className="log-back-btn" onClick={onBack}>← Back</button>

      {/* Split type banner */}
      {session.splitType && (
        <div className="log-split-banner" style={{ '--split-color': splitColor }}>
          {SPLIT_LABELS[session.splitType] || session.splitType} — {dateStr}
        </div>
      )}
      {!session.splitType && (
        <div className="log-split-banner full-body-banner">
          Full-body — {dateStr}
        </div>
      )}

      {/* Date picker row */}
      <div className="log-date-picker">
        <button className="log-date-btn" onClick={prevDay}>{Icon.chevronLeft}</button>
        <span className="log-date-label" onClick={() => setShowDatePicker(true)}>{dayLabel}</span>
        <button className="log-date-btn" onClick={nextDay}>{Icon.chevronRight}</button>
      </div>

      {/* Quick actions */}
      <div className="log-quick-actions">
        <button className="log-quick-btn" onClick={copyFromYesterday}>
          📋 Copy from yesterday
        </button>
        <button className="log-quick-btn" onClick={markAsRest}>
          😴 Mark as rest day
        </button>
      </div>

      {/* Add exercise button */}
      {!session.isRest && (
        <button className="add-exercise-btn" onClick={() => setShowExercisePicker(true)}>
          {Icon.plus} Add Exercise
        </button>
      )}

      {/* Exercise list */}
      {!session.isRest && (
        <div className="exercise-list">
          {(session.exercises || []).map(ex => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              onUpdate={updateExercise}
              onRemove={() => removeExercise(ex.id)}
            />
          ))}
        </div>
      )}

      {/* Rest day message */}
      {session.isRest && (
        <div className="rest-day-msg">😴 Rest day — no exercises logged.</div>
      )}

      {/* Cardio section */}
      {!session.isRest && (
        <div className="cardio-section">
          <div className="cardio-title">Cardio</div>
          <div className="stepper-row">
            <span className="stepper-label">Walk (min)</span>
            <Stepper
              value={session.cardio?.walk_min || 0}
              onChange={v => updateCardio('walk_min', v)}
              min={0} max={300}
            />
          </div>
          <div className="stepper-row">
            <span className="stepper-label">Cardio (min)</span>
            <Stepper
              value={session.cardio?.cardio_min || 0}
              onChange={v => updateCardio('cardio_min', v)}
              min={0} max={300}
            />
          </div>
          <div className="stepper-row">
            <span className="stepper-label">HIIT (min)</span>
            <Stepper
              value={session.cardio?.hiit_min || 0}
              onChange={v => updateCardio('hiit_min', v)}
              min={0} max={300}
            />
          </div>
          <div className="stepper-row">
            <span className="stepper-label">Calories</span>
            <Stepper
              value={session.cardio?.calories || 0}
              onChange={v => updateCardio('calories', v)}
              min={0} max={5000} step={10}
            />
          </div>
        </div>
      )}

      {/* Sticky footer */}
      <div className="log-footer">
        <div className="log-totals">
          Today: <strong>{totals.sets} sets</strong> · <strong>{totals.reps} reps</strong> · <strong>{(totals.tonnage / 1000).toFixed(1)}k kg</strong> · <strong>{totals.cardioMin} min</strong> cardio · <strong>{totals.calories} cal</strong>
        </div>
        <button className="log-save-btn" onClick={handleSave}>Save</button>
      </div>

      {showDatePicker && (
        <DatePickerModal
          year={year} month={month} day={day}
          onSelect={handleDateSelect}
          onClose={() => setShowDatePicker(false)}
        />
      )}

      {showExercisePicker && (
        <ExercisePickerModal
          splitType={session.splitType}
          onSelect={addExercise}
          onCancel={() => setShowExercisePicker(false)}
        />
      )}
    </div>
  );
}

/* ============================================================
   SCREEN: STATS
   ============================================================ */
function StatsScreen({ sessions, year, month }) {
  const stats = useMemo(() => getStatsData(sessions, year, month), [sessions, year, month]);
  const { categoryTotals, categoryTonnage, exerciseStats } = stats;

  const totalSetsAll = Object.values(categoryTotals).reduce((a, b) => a + b, 0) || 1;
  const totalTonnageAll = Object.values(categoryTonnage).reduce((a, b) => a + b, 0) || 1;

  const handleExport = () => {
    const csv = toCSV(sessions);
    downloadCSV(csv, `exercise-tracker-${getMonthKey(year, month)}.csv`);
  };

  const catBars = Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => ({
    label: cfg.label,
    sets: categoryTotals[key] || 0,
    tonnage: categoryTonnage[key] || 0,
    color: cfg.color,
  }));

  const maxTonnage = Math.max(...catBars.map(b => b.tonnage), 1);

  const daysInMonth = getDaysInMonth(year, month);
  const dailyData = [];
  let maxDailyVol = 1;
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = formatDate(year, month, d);
    const v = stats.dailyVolume?.[ds] || 0;
    dailyData.push({ day: d, volume: v });
    if (v > maxDailyVol) maxDailyVol = v;
  }

  const monthName = getMonthName(year, month);

  const exerciseRows = Object.entries(exerciseStats)
    .sort((a, b) => b[1].tonnage - a[1].tonnage);

  return (
    <div className="stats">
      <div className="stats-grid-2">
        <div className="stats-mini-card">
          <div className="stats-mini-value" style={{ color: '#6366f1' }}>
            {totalSetsAll.toLocaleString()}
          </div>
          <div className="stats-mini-label">Total Sets</div>
        </div>
        <div className="stats-mini-card">
          <div className="stats-mini-value" style={{ color: '#f59e0b' }}>
            {(totalTonnageAll / 1000).toFixed(1)}k
          </div>
          <div className="stats-mini-label">Tonnage (kg)</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">Tonnage by Category — {monthName}</div>
        <div className="bar-chart-container">
          {catBars.map(b => (
            <div key={b.label} className="bar-chart-bar-wrap" style={{ height: '100%' }}>
              <div className="bar-chart-value">{(b.tonnage / 1000).toFixed(1)}k</div>
              <div
                className="bar-chart-bar"
                style={{
                  height: `${Math.max((b.tonnage / maxTonnage) * 80, b.tonnage > 0 ? 4 : 0)}%`,
                  background: b.color,
                }}
              />
              <div className="bar-chart-label">{b.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">Daily Tonnage — {monthName}</div>
        <svg className="svg-bar-chart" viewBox={`0 0 ${daysInMonth * 8 + 20} 120`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {dailyData.map(({ day, volume }, i) => {
            const barH = maxDailyVol > 0 ? (volume / maxDailyVol) * 90 : 0;
            const x = 10 + i * 8;
            const y = 105 - barH;
            return (
              <g key={day}>
                {barH > 0 && (
                  <rect
                    className="svg-bar-rect"
                    x={x} y={y}
                    width={5} height={barH}
                    rx={1}
                    fill="url(#volGrad)"
                  />
                )}
                {day % 5 === 1 && (
                  <text className="svg-axis-label" x={x + 2} y={115}>{day}</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {exerciseRows.length > 0 && (
        <div className="chart-card">
          <div className="chart-title">Exercise Breakdown — {monthName}</div>
          <table className="muscle-table">
            <thead>
              <tr>
                <th>Exercise</th>
                <th>Sets</th>
                <th>Reps</th>
                <th>Tonnage</th>
              </tr>
            </thead>
            <tbody>
              {exerciseRows.map(([name, t]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{t.sets}</td>
                  <td>{t.reps.toLocaleString()}</td>
                  <td>{(t.tonnage / 1000).toFixed(1)}k kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button className="export-btn" onClick={handleExport}>
        📥 Export to CSV
      </button>
    </div>
  );
}

/* ============================================================
   MONTH PICKER
   ============================================================ */
function MonthPicker({ year, month, onChange }) {
  const prevMonth = () => {
    if (month === 0) onChange(year - 1, 11);
    else onChange(year, month - 1);
  };
  const nextMonth = () => {
    if (month === 11) onChange(year + 1, 0);
    else onChange(year, month + 1);
  };

  return (
    <div className="month-picker">
      <button className="month-picker-btn" onClick={prevMonth}>{Icon.chevronLeft}</button>
      <span className="month-label">{getMonthName(year, month)}</span>
      <button className="month-picker-btn" onClick={nextMonth}>{Icon.chevronRight}</button>
    </div>
  );
}

/* ============================================================
   EMPTY STATE
   ============================================================ */
function EmptyState({ onStart }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">💪</div>
      <h2>No workouts logged yet</h2>
      <p>Start tracking your fitness journey today. Log your first workout to see your progress.</p>
      <button className="empty-cta" onClick={onStart}>
        {Icon.plus} Log First Workout
      </button>
    </div>
  );
}

/* ============================================================
   APP ROOT
   ============================================================ */
export default function App() {
  const { sessions, replaceSession } = useAppData();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [screen, setScreen] = useState('main'); // 'main' | 'log'
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [logDate, setLogDate] = useState(null);
  const [logSplitType, setLogSplitType] = useState(null);
  const [regimen, setRegimen] = useState(() => getRegimen());
  const [pendingDate, setPendingDate] = useState(null); // for split picker flow
  const [showSettings, setShowSettings] = useState(false);

  const hasData = Object.keys(sessions).length > 0;

  // On first load: if no regimen, force settings screen
  useEffect(() => {
    const stored = getRegimen();
    if (!stored) {
      setShowSettings(true);
    }
  }, []);

  const changeMonth = (y, m) => { setYear(y); setMonth(m); };

  const handleSelectRegimen = (id) => {
    setRegimen(id);
    localStorage.setItem(REGIMEN_STORAGE_KEY, id);
    setShowSettings(false);
  };

  const handleNavigateCalendar = (category) => {
    setActiveTab('calendar');
    setScreen('main');
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
    setActiveTab('dashboard');
    setScreen('main');
  };

  const handleSelectDay = (dateStr, currentRegimen) => {
    const reg = currentRegimen || regimen;
    if (reg === 'full_body' || !reg) {
      setLogDate(dateStr);
      setLogSplitType(null);
      setScreen('log');
    } else {
      // Show split picker
      setPendingDate(dateStr);
    }
  };

  const handleSplitSelect = (splitType) => {
    setLogDate(pendingDate);
    setLogSplitType(splitType);
    setPendingDate(null);
    setScreen('log');
  };

  const handleSplitCancel = () => {
    setPendingDate(null);
  };

  const handleAddEntry = () => {
    const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());
    const reg = regimen;
    if (reg === 'full_body' || !reg) {
      setLogDate(todayStr);
      setLogSplitType(null);
      setScreen('log');
    } else {
      setPendingDate(todayStr);
    }
  };

  const handleSaveLog = (dateStr, sessionData) => {
    replaceSession(dateStr, sessionData);
    setScreen('main');
    setActiveTab('calendar');
    setLogDate(null);
    setLogSplitType(null);
  };

  const handleBackFromLog = () => {
    setScreen('main');
    setLogDate(null);
    setLogSplitType(null);
  };

  // Settings screen overlay
  if (showSettings) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-title">⚙️ Settings</div>
        </header>
        <main className="main-content">
          <SettingsScreen regimen={regimen} onSelectRegimen={handleSelectRegimen} />
        </main>
      </div>
    );
  }

  // Show empty state inside main content when no data
  const showEmptyState = !hasData && screen === 'main' && activeTab === 'dashboard';

  return (
    <div className="app">
      {/* Header */}
      {screen === 'main' && (
        <header className="header">
          <div className="header-title-row">
            <div className="header-title">💪 Exercise Tracker</div>
            <button className="header-settings-btn" onClick={handleOpenSettings}>
              {Icon.settings}
            </button>
          </div>
          <MonthPicker year={year} month={month} onChange={changeMonth} />
        </header>
      )}

      {/* Main content */}
      {screen === 'main' ? (
        <main className="main-content">
          {showEmptyState ? (
            <EmptyState onStart={handleAddEntry} />
          ) : activeTab === 'dashboard' ? (
            <DashboardScreen
              sessions={sessions}
              year={year} month={month}
              onNavigateCalendar={handleNavigateCalendar}
              onChangeMonth={changeMonth}
              onOpenSettings={handleOpenSettings}
            />
          ) : activeTab === 'calendar' ? (
            <CalendarScreen
              sessions={sessions}
              year={year} month={month}
              regimen={regimen}
              onSelectDay={handleSelectDay}
              onAddEntry={handleAddEntry}
            />
          ) : activeTab === 'stats' ? (
            <StatsScreen sessions={sessions} year={year} month={month} />
          ) : null}
        </main>
      ) : (
        <main className="main-content">
          <LogScreen
            sessions={sessions}
            initialDate={logDate}
            splitType={logSplitType}
            onSave={handleSaveLog}
            onBack={handleBackFromLog}
          />
        </main>
      )}

      {/* Bottom tab bar */}
      {screen === 'main' && (
        <nav className="tab-bar">
          <button
            className={`tab-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="tab-icon">{Icon.home}</span>
            Dashboard
          </button>
          <button
            className={`tab-item ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <span className="tab-icon">{Icon.calendar}</span>
            Calendar
          </button>
          <button
            className={`tab-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="tab-icon">{Icon.settings}</span>
            Settings
          </button>
          <button
            className={`tab-item ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <span className="tab-icon">{Icon.stats}</span>
            Stats
          </button>
        </nav>
      )}

      {/* Split picker modal */}
      {pendingDate !== null && (
        <SplitPickerModal
          regimen={regimen}
          onSelect={handleSplitSelect}
          onCancel={handleSplitCancel}
        />
      )}
    </div>
  );
}
