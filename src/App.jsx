import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  loadData, saveData, generateId,
  getMonthKey, getMonthName, getDaysInMonth, getFirstDayOfMonth, formatDate,
  calculateStreak, getCategoryMonthlyTotals, getMonthlyVolume, getMonthlyCalories,
  getDailyTotalsForMonth, getHeatmapData, getHeatmapQuartiles, getHeatmapLevel,
  getStatsData, toCSV, downloadCSV,
  MUSCLE_GROUP_ORDER, CATEGORY_COLORS, CARDIO_MUSCLE_GROUPS,
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
  legs:    { icon: Icon.legs,   label: 'Legs',    color: '#10b981' },
  chest:   { icon: Icon.chest,  label: 'Chest',   color: '#ec4899' },
  cardio:  { icon: Icon.cardio, label: 'Cardio',  color: '#f59e0b' },
};

const MUSCLE_CONFIG = {
  back:          { color: '#6366f1', unit: 'sets' },
  biceps:        { color: '#818cf8', unit: 'sets' },
  lower_back:    { color: '#a78bfa', unit: 'sets' },
  traps:         { color: '#7c3aed', unit: 'sets' },
  legs:          { color: '#10b981', unit: 'sets' },
  glutes:        { color: '#34d399', unit: 'sets' },
  quads:         { color: '#059669', unit: 'sets' },
  hamstring:     { color: '#047857', unit: 'sets' },
  calf:          { color: '#065f46', unit: 'sets' },
  chest:         { color: '#ec4899', unit: 'sets' },
  shoulder:      { color: '#f472b6', unit: 'sets' },
  triceps:       { color: '#db2777', unit: 'sets' },
  abs:           { color: '#be185d', unit: 'sets' },
  cardio_walk:   { color: '#f59e0b', unit: 'min' },
  cardio_generic:{ color: '#d97706', unit: 'min' },
  hiit:          { color: '#b45309', unit: 'min' },
};

/* ============================================================
   REGIMEN & SPLIT CONFIG
   ============================================================ */
const REGIMEN_STORAGE_KEY = 'exerciseRegimen';

export const REGIMEN_OPTIONS = [
  { id: 'full_body',   label: 'Full-body',         icon: '🏋️', desc: 'All muscle groups available every day' },
  { id: 'ppl',         label: 'Push / Pull / Legs', icon: '🔄', desc: '3-day rotation: Push → Pull → Legs' },
  { id: 'upper_lower', label: 'Upper / Lower',       icon: '🏔️', desc: '2-day rotation: Upper → Lower' },
];

export const SPLIT_MUSCLE_GROUPS = {
  push:    ['chest', 'shoulder', 'triceps', 'abs'],
  pull:    ['back', 'biceps', 'traps', 'lower_back'],
  legs:    ['quads', 'hamstring', 'glutes', 'calf', 'abs'],
  upper:   ['chest', 'back', 'shoulder', 'biceps', 'triceps', 'abs'],
  lower:   ['quads', 'hamstring', 'glutes', 'calf'],
};

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
  const [data, setData] = useState(() => loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const addEntry = useCallback((entry) => {
    setData(prev => {
      const filtered = prev.filter(e => !(e.date === entry.date && e.muscle_group === entry.muscle_group));
      return [...filtered, { ...entry, id: generateId() }];
    });
  }, []);

  const removeEntry = useCallback((id) => {
    setData(prev => prev.filter(e => e.id !== id));
  }, []);

  const replaceDayEntries = useCallback((date, entries) => {
    setData(prev => {
      const rest = prev.filter(e => e.date !== date);
      return [...rest, ...entries.map(e => ({ ...e, id: generateId() }))];
    });
  }, []);

  return { data, addEntry, removeEntry, replaceDayEntries };
}

/* ============================================================
   STEPPER COMPONENT
   ============================================================ */
function Stepper({ value, onChange, min = 0, max = 999, step = 1 }) {
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const startHold = (delta) => {
    const tick = () => {
      onChange(prev => Math.min(max, Math.max(min, prev + delta)));
    };
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(tick, 80);
    }, 400);
  };

  const endHold = () => {
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
  };

  const handleBtnMouseDown = (delta) => (e) => {
    e.preventDefault();
    onChange(prev => Math.min(max, Math.max(min, prev + delta)));
    startHold(delta);
  };

  useEffect(() => () => {
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="stepper-controls">
      <button
        className="stepper-btn"
        onMouseDown={handleBtnMouseDown(-step)}
        onMouseUp={endHold}
        onMouseLeave={endHold}
        onTouchStart={handleBtnMouseDown(-step)}
        onTouchEnd={endHold}
      >−</button>
      <input
        type="number"
        className="stepper-input"
        value={value}
        min={min}
        max={max}
        onChange={e => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
      />
      <button
        className="stepper-btn"
        onMouseDown={handleBtnMouseDown(step)}
        onMouseUp={endHold}
        onMouseLeave={endHold}
        onTouchStart={handleBtnMouseDown(step)}
        onTouchEnd={endHold}
      >+</button>
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
function DashboardScreen({ data, year, month, onNavigateCalendar, onChangeMonth, onOpenSettings }) {
  const catTotals = useMemo(() => getCategoryMonthlyTotals(data, year, month), [data, year, month]);
  const totalVolume = useMemo(() => getMonthlyVolume(data, year, month), [data, year, month]);
  const totalCals = useMemo(() => getMonthlyCalories(data, year, month), [data, year, month]);
  const streak = useMemo(() => calculateStreak(data), [data]);
  const heatmap = useMemo(() => getHeatmapData(data, 28), [data]);
  const quartiles = useMemo(() => getHeatmapQuartiles(heatmap), [heatmap]);

  return (
    <div className="dashboard">
      {/* Big stats */}
      <div className="big-stats">
        <div className="big-stat">
          <div className="big-stat-value">{totalVolume.toLocaleString()}</div>
          <div className="big-stat-label">Total Volume (reps)</div>
        </div>
        <div className="big-stat-sep" />
        <div className="big-stat">
          <div className="big-stat-value">{totalCals.toLocaleString()}</div>
          <div className="big-stat-label">Total Calories</div>
        </div>
      </div>

      {/* Category cards */}
      <div className="category-grid">
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
          <div
            key={key}
            className={`category-card ${key}`}
            onClick={() => onNavigateCalendar(key)}
          >
            <div className="category-icon">{cfg.icon}</div>
            <div className="category-name" style={{ color: cfg.color }}>{cfg.label}</div>
            <div className="category-value">
              {catTotals[key].toLocaleString()}
              <span className="category-unit">{key === 'cardio' ? 'min' : 'sets'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Streak */}
      <div className="streak-row">
        <span className="streak-emoji">🔥</span>
        <span className="streak-text">{streak} day streak</span>
        <span className="streak-sub">consecutive workout days</span>
      </div>

      {/* Heatmap */}
      <div className="heatmap-section">
        <div className="heatmap-title">Last 28 Days</div>
        <div className="heatmap-grid">
          {heatmap.map(({ date, volume }) => (
            <div
              key={date}
              className={`heatmap-cell l${getHeatmapLevel(volume, quartiles)}`}
            >
              <div className="heatmap-tooltip">{date}: {volume} vol</div>
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
function CalendarScreen({ data, year, month, regimen, onSelectDay, onAddEntry }) {
  const today = new Date();
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const dailyTotals = useMemo(() => getDailyTotalsForMonth(data, year, month), [data, year, month]);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const dotColor = (mg) => {
    if (['back','biceps','lower_back','traps'].includes(mg)) return '#6366f1';
    if (['legs','glutes','quads','hamstring','calf'].includes(mg)) return '#10b981';
    if (['chest','shoulder','triceps','abs'].includes(mg)) return '#ec4899';
    if (['cardio_walk','cardio_generic','hiit'].includes(mg)) return '#f59e0b';
    return '#888';
  };

  const maxVol = useMemo(() => {
    const vols = Object.values(dailyTotals).map(d => d.volume);
    return Math.max(...vols, 1);
  }, [dailyTotals]);

  const getBgTint = (sets, volume) => {
    if (sets === 0) return 'transparent';
    const ratio = Math.min(volume / maxVol, 1);
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
          const dt = dailyTotals[dateStr] || { sets: 0, volume: 0, calories: 0, muscleGroups: new Set(), isRest: false };
          const isToday = dateStr === todayStr;

          return (
            <div
              key={dateStr}
              className={`calendar-day-cell ${isToday ? 'today' : ''}`}
              style={{ background: getBgTint(dt.sets, dt.volume) }}
              onClick={() => handleDayClick(dateStr)}
            >
              <div className="calendar-day-number">{day}</div>
              {dt.sets > 0 && (
                <div className="calendar-sets">{dt.sets}s</div>
              )}
              {dt.calories > 0 && (
                <div className="calendar-calories">{dt.calories}cal</div>
              )}
              {dt.muscleGroups.size > 0 && (
                <div className="calendar-dots">
                  {[...dt.muscleGroups].slice(0, 4).map(mg => (
                    <div key={mg} className="calendar-dot" style={{ background: dotColor(mg) }} />
                  ))}
                </div>
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
   SCREEN: LOG WORKOUT
   ============================================================ */
function LogScreen({ data, initialDate, splitType, onSave, onBack }) {
  const today = new Date();
  const [year, setYear] = useState(initialDate ? parseInt(initialDate.split('-')[0]) : today.getFullYear());
  const [month, setMonth] = useState(initialDate ? parseInt(initialDate.split('-')[1]) - 1 : today.getMonth());
  const [day, setDay] = useState(initialDate ? parseInt(initialDate.split('-')[2]) : today.getDate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [openSections, setOpenSections] = useState(new Set());
  const [entries, setEntries] = useState(() => {
    const dateStr = initialDate || formatDate(today.getFullYear(), today.getMonth(), today.getDate());
    const existing = data.filter(e => e.date === dateStr);
    if (existing.length === 0) return {};
    const map = {};
    existing.forEach(e => { map[e.muscle_group] = { ...e }; });
    return map;
  });

  const dateStr = formatDate(year, month, day);

  // Determine which muscle groups to show based on splitType
  const visibleGroups = useMemo(() => {
    if (!splitType || splitType === 'full_body') return null; // null = all
    return SPLIT_MUSCLE_GROUPS[splitType] || null;
  }, [splitType]);

  const isGroupVisible = (mg) => {
    if (visibleGroups === null) return true;
    return visibleGroups.includes(mg);
  };

  const updateEntry = (mg, field, value) => {
    setEntries(prev => {
      const existing = prev[mg] || {
        date: dateStr, muscle_group: mg, sets: 0, reps: 0,
        walk_min: 0, cardio_min: 0, hiit_min: 0, calories: 0,
      };
      return { ...prev, [mg]: { ...existing, [field]: value } };
    });
  };

  const toggleSection = (mg) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(mg)) next.delete(mg);
      else next.add(mg);
      return next;
    });
  };

  const isCardio = (mg) => CARDIO_MUSCLE_GROUPS.includes(mg);

  const copyFromYesterday = () => {
    const d = new Date(year, month, day);
    d.setDate(d.getDate() - 1);
    const yesterdayStr = formatDate(d.getFullYear(), d.getMonth(), d.getDate());
    const yesterdayEntries = data.filter(e => e.date === yesterdayStr);
    if (yesterdayEntries.length === 0) return;
    const newEntries = {};
    yesterdayEntries.forEach(e => {
      if (isGroupVisible(e.muscle_group) || isCardio(e.muscle_group)) {
        newEntries[e.muscle_group] = { ...e, date: dateStr };
      }
    });
    setEntries(prev => ({ ...prev, ...newEntries }));
  };

  const markAsRest = () => {
    setEntries({ rest: { date: dateStr, muscle_group: 'rest', sets: 0, reps: 0, walk_min: 0, cardio_min: 0, hiit_min: 0, calories: 0 } });
  };

  const totals = useMemo(() => {
    let sets = 0, reps = 0, cardioMin = 0, calories = 0;
    Object.values(entries).forEach(e => {
      if (e.muscle_group === 'rest') return;
      if (isCardio(e.muscle_group)) {
        cardioMin += (e.walk_min || 0) + (e.cardio_min || 0) + (e.hiit_min || 0);
      } else {
        sets += e.sets || 0;
        reps += (e.sets || 0) * (e.reps || 0);
      }
      calories += e.calories || 0;
    });
    return { sets, reps, cardioMin, calories };
  }, [entries]);

  const handleSave = () => {
    const toSave = Object.values(entries).filter(e => {
      if (e.muscle_group === 'rest') return true;
      if (isCardio(e.muscle_group)) return (e.walk_min || 0) + (e.cardio_min || 0) + (e.hiit_min || 0) > 0;
      return (e.sets || 0) > 0;
    });
    onSave(dateStr, toSave);
  };

  const handleDateSelect = (y, m, d) => {
    setYear(y); setMonth(m); setDay(d);
    setShowDatePicker(false);
    const ds = formatDate(y, m, d);
    const existing = data.filter(e => e.date === ds);
    if (existing.length === 0) setEntries({});
    else {
      const map = {};
      existing.forEach(e => { map[e.muscle_group] = { ...e }; });
      setEntries(map);
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

  const entryCount = (mg) => {
    const e = entries[mg];
    if (!e) return '';
    if (isCardio(mg)) {
      const m = (e.walk_min || 0) + (e.cardio_min || 0) + (e.hiit_min || 0);
      return m > 0 ? `${m} min` : '';
    }
    return (e.sets || 0) > 0 ? `${e.sets} sets` : '';
  };

  const sectionColor = (mg) => {
    if (visibleGroups !== null && splitType && SPLIT_COLORS[splitType]) {
      return SPLIT_COLORS[splitType];
    }
    return MUSCLE_CONFIG[mg]?.color || '#888';
  };

  return (
    <div className="log">
      {/* Split type banner */}
      {splitType && (
        <div className="log-split-banner" style={{ '--split-color': SPLIT_COLORS[splitType] || '#6366f1' }}>
          {SPLIT_LABELS[splitType] || splitType} — {dateStr}
        </div>
      )}
      {!splitType && (
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

      {/* Muscle group sections */}
      <div className="muscle-sections">
        {MUSCLE_GROUP_ORDER.map(mg => {
          if (!isGroupVisible(mg)) return null;
          const cfg = MUSCLE_CONFIG[mg];
          const isOpen = openSections.has(mg);
          const count = entryCount(mg);
          const color = sectionColor(mg);

          return (
            <div key={mg} className={`muscle-section ${isOpen ? 'open' : ''}`}>
              <div className="muscle-section-header" onClick={() => toggleSection(mg)}>
                <div className="muscle-section-color-bar" style={{ background: color }} />
                <span className="muscle-section-name">
                  {mg.replace('_', ' ')}
                </span>
                {count && <span className="muscle-section-count">{count}</span>}
                <span className="muscle-section-arrow">{Icon.chevronDown}</span>
              </div>
              <div className="muscle-section-body">
                {isCardio(mg) ? (
                  <>
                    <div className="stepper-row">
                      <span className="stepper-label">Walk (min)</span>
                      <Stepper
                        value={entries[mg]?.walk_min || 0}
                        onChange={v => updateEntry(mg, 'walk_min', v)}
                      />
                    </div>
                    <div className="stepper-row">
                      <span className="stepper-label">Cardio (min)</span>
                      <Stepper
                        value={entries[mg]?.cardio_min || 0}
                        onChange={v => updateEntry(mg, 'cardio_min', v)}
                      />
                    </div>
                    <div className="stepper-row">
                      <span className="stepper-label">HIIT (min)</span>
                      <Stepper
                        value={entries[mg]?.hiit_min || 0}
                        onChange={v => updateEntry(mg, 'hiit_min', v)}
                      />
                    </div>
                    <div className="stepper-row">
                      <span className="stepper-label">Calories</span>
                      <Stepper
                        value={entries[mg]?.calories || 0}
                        onChange={v => updateEntry(mg, 'calories', v)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="stepper-row">
                      <span className="stepper-label">Sets</span>
                      <Stepper
                        value={entries[mg]?.sets || 0}
                        onChange={v => updateEntry(mg, 'sets', v)}
                      />
                    </div>
                    <div className="stepper-row">
                      <span className="stepper-label">Reps/set</span>
                      <Stepper
                        value={entries[mg]?.reps || 0}
                        onChange={v => updateEntry(mg, 'reps', v)}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky footer */}
      <div className="log-footer">
        <div className="log-totals">
          Today: <strong>{totals.sets} sets</strong> · <strong>{totals.reps} reps</strong> · <strong>{totals.cardioMin} min</strong> cardio · <strong>{totals.calories} cal</strong>
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
    </div>
  );
}

/* ============================================================
   SCREEN: STATS
   ============================================================ */
function StatsScreen({ data, year, month }) {
  const stats = useMemo(() => getStatsData(data, year, month), [data, year, month]);
  const { categoryTotals, muscleTotals, dailyVolume } = stats;

  const totalVol = Object.values(categoryTotals).reduce((a, b) => a + b, 0) || 1;

  const handleExport = () => {
    const csv = toCSV(data);
    downloadCSV(csv, `exercise-tracker-${getMonthKey(year, month)}.csv`);
  };

  const catBars = Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => ({
    label: cfg.label,
    value: categoryTotals[key] || 0,
    color: cfg.color,
  }));

  const maxCat = Math.max(...catBars.map(b => b.value), 1);

  const daysInMonth = getDaysInMonth(year, month);
  const dailyData = [];
  let maxDailyVol = 1;
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = formatDate(year, month, d);
    const v = dailyVolume[ds] || 0;
    dailyData.push({ day: d, volume: v });
    if (v > maxDailyVol) maxDailyVol = v;
  }

  const musclePie = Object.entries(muscleTotals)
    .filter(([mg]) => mg !== 'rest')
    .map(([mg, totals]) => {
      const cfg = MUSCLE_CONFIG[mg];
      const vol = totals.volume || 0;
      const pct = totalVol > 0 ? Math.round((vol / totalVol) * 100) : 0;
      return { mg, vol, pct, color: cfg?.color || '#888' };
    })
    .sort((a, b) => b.vol - a.vol);

  const buildConic = (slices) => {
    let currentDeg = 0;
    const parts = [];
    for (const s of slices) {
      const deg = (s.pct / 100) * 360;
      if (deg > 0) {
        parts.push(`${s.color} ${currentDeg}deg ${currentDeg + deg}deg`);
        currentDeg += deg;
      }
    }
    return parts.length > 0 ? `conic-gradient(${parts.join(', ')})` : 'conic-gradient(#333 0deg 360deg)';
  };

  const monthName = getMonthName(year, month);
  const totalSetsAll = catBars.reduce((s, b) => s + b.value, 0);

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
            {categoryTotals.cardio?.toLocaleString() || 0}
          </div>
          <div className="stats-mini-label">Cardio Min</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">Category Totals — {monthName}</div>
        <div className="bar-chart-container">
          {catBars.map(b => (
            <div key={b.label} className="bar-chart-bar-wrap" style={{ height: '100%' }}>
              <div className="bar-chart-value">{b.value.toLocaleString()}</div>
              <div
                className="bar-chart-bar"
                style={{
                  height: `${Math.max((b.value / maxCat) * 80, b.value > 0 ? 4 : 0)}%`,
                  background: b.color,
                }}
              />
              <div className="bar-chart-label">{b.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">Daily Volume — {monthName}</div>
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

      {musclePie.length > 0 && (
        <div className="chart-card">
          <div className="chart-title">Training Balance — {monthName}</div>
          <div className="pie-chart-container">
            <div className="pie-chart" style={{ background: buildConic(musclePie) }} />
            <div className="pie-legend">
              {musclePie.slice(0, 6).map(s => (
                <div key={s.mg} className="pie-legend-item">
                  <div className="pie-legend-dot" style={{ background: s.color }} />
                  <span style={{ textTransform: 'capitalize' }}>{s.mg.replace('_', ' ')}</span>
                  <span className="pie-legend-pct">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {Object.keys(muscleTotals).length > 0 && (
        <div className="chart-card">
          <div className="chart-title">Muscle Totals — {monthName}</div>
          <table className="muscle-table">
            <thead>
              <tr>
                <th>Muscle</th>
                <th>Sets</th>
                <th>Reps</th>
                <th>Volume</th>
                <th>Cal</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(muscleTotals).map(([mg, t]) => (
                <tr key={mg}>
                  <td>{mg.replace('_', ' ')}</td>
                  <td>{t.sets}</td>
                  <td>{t.reps}</td>
                  <td>{t.volume.toLocaleString()}</td>
                  <td>{t.calories || '—'}</td>
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
  const { data, replaceDayEntries } = useAppData();
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

  const hasData = data.length > 0;

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

  const handleSaveLog = (dateStr, entries) => {
    replaceDayEntries(dateStr, entries);
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

  // Empty state
  if (!hasData && screen === 'main' && activeTab === 'dashboard') {
    return (
      <div className="app">
        <header className="header">
          <div className="header-title">💪 Exercise Tracker</div>
          <div className="header-settings-btn" onClick={handleOpenSettings}>
            {Icon.settings}
          </div>
          <MonthPicker year={year} month={month} onChange={changeMonth} />
        </header>
        <main className="main-content">
          <EmptyState onStart={handleAddEntry} />
        </main>
      </div>
    );
  }

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
          {activeTab === 'dashboard' && (
            <DashboardScreen
              data={data}
              year={year} month={month}
              onNavigateCalendar={handleNavigateCalendar}
              onChangeMonth={changeMonth}
              onOpenSettings={handleOpenSettings}
            />
          )}
          {activeTab === 'calendar' && (
            <CalendarScreen
              data={data}
              year={year} month={month}
              regimen={regimen}
              onSelectDay={handleSelectDay}
              onAddEntry={handleAddEntry}
            />
          )}
          {activeTab === 'stats' && (
            <StatsScreen data={data} year={year} month={month} />
          )}
        </main>
      ) : (
        <main className="main-content">
          <LogScreen
            data={data}
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
