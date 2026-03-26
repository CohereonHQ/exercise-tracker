import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { parseCSV, getDailySummary, getMuscleGroupData, getWeeklyData, getChartData } from './utils/dataParser';
import './App.css';

const STORAGE_KEY = 'exerciseTrackerData';
const MUSCLE_GROUPS = ['all', 'chest', 'back', 'legs', 'shoulders', 'biceps', 'triceps', 'core', 'cardio', 'rest'];
const FORM_MUSCLE_GROUPS = ['chest', 'back', 'legs', 'shoulders', 'biceps', 'triceps', 'core', 'cardio', 'rest'];

const CSV_HEADERS = 'day,muscle_group,reps,sets,walk_min,cardio_min,hiit_min,calories';

function toCSV(data) {
  const rows = data.map(e => `${e.day},${e.muscle_group},${e.reps},${e.sets},${e.walk_min},${e.cardio_min},${e.hiit_min},${e.calories}`);
  return [CSV_HEADERS, ...rows].join('\n');
}

function downloadCSV(csvText, filename = 'exercise_data.csv') {
  const blob = new Blob([csvText], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function validateEntry(entry) {
  if (!entry.day || entry.day < 1 || entry.day > 31) return 'Day must be between 1 and 31';
  if (!FORM_MUSCLE_GROUPS.includes(entry.muscle_group)) return 'Invalid muscle group';
  if (entry.reps < 0 || entry.sets < 0 || entry.walk_min < 0 || entry.cardio_min < 0 || entry.hiit_min < 0 || entry.calories < 0) {
    return 'All numeric fields must be 0 or greater';
  }
  return null;
}

function StatCard({ label, value, unit, color }) {
  return (
    <div className="stat-card" style={{ '--accent': color }}>
      <div className="stat-value">{value}<span className="stat-unit">{unit}</span></div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function EmptyState({ onImport }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">📋</div>
      <h2>No workout data yet</h2>
      <p>Import a CSV file or add entries manually to get started.</p>
      <label className="btn btn-primary import-btn">
        <input type="file" accept=".csv" style={{ display: 'none' }} onChange={onImport} />
        Import CSV
      </label>
    </div>
  );
}

function WorkoutModal({ entry, onSave, onDelete, onClose }) {
  const isNew = !entry._id;
  const [form, setForm] = useState({
    day: entry.day ?? '',
    muscle_group: entry.muscle_group ?? 'chest',
    reps: entry.reps ?? '',
    sets: entry.sets ?? '',
    walk_min: entry.walk_min ?? '',
    cardio_min: entry.cardio_min ?? '',
    hiit_min: entry.hiit_min ?? '',
    calories: entry.calories ?? '',
  });
  const [error, setError] = useState('');
  const overlayRef = useRef(null);

  const handleChange = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsed = {
      ...form,
      day: parseInt(form.day, 10),
      reps: parseInt(form.reps, 10) || 0,
      sets: parseInt(form.sets, 10) || 0,
      walk_min: parseInt(form.walk_min, 10) || 0,
      cardio_min: parseInt(form.cardio_min, 10) || 0,
      hiit_min: parseInt(form.hiit_min, 10) || 0,
      calories: parseInt(form.calories, 10) || 0,
    };
    const err = validateEntry(parsed);
    if (err) { setError(err); return; }
    setError('');
    onSave(parsed, entry._id);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this entry?')) {
      onDelete(entry._id);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-header">
          <h3>{isNew ? 'Add Workout' : 'Edit Workout'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Day (1–31)</label>
              <input type="number" min="1" max="31" value={form.day} onChange={e => handleChange('day', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Muscle Group</label>
              <select value={form.muscle_group} onChange={e => handleChange('muscle_group', e.target.value)}>
                {FORM_MUSCLE_GROUPS.map(mg => <option key={mg} value={mg}>{mg.charAt(0).toUpperCase() + mg.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Reps</label>
              <input type="number" min="0" value={form.reps} onChange={e => handleChange('reps', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Sets</label>
              <input type="number" min="0" value={form.sets} onChange={e => handleChange('sets', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Walk (min)</label>
              <input type="number" min="0" value={form.walk_min} onChange={e => handleChange('walk_min', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Cardio (min)</label>
              <input type="number" min="0" value={form.cardio_min} onChange={e => handleChange('cardio_min', e.target.value)} />
            </div>
            <div className="form-group">
              <label>HIIT (min)</label>
              <input type="number" min="0" value={form.hiit_min} onChange={e => handleChange('hiit_min', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Calories</label>
              <input type="number" min="0" value={form.calories} onChange={e => handleChange('calories', e.target.value)} />
            </div>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions">
            {!isNew && (
              <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
            )}
            <div className="modal-actions-right">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Dashboard({ data, filter }) {
  const chartData = useMemo(() => getChartData(data), [data]);
  const muscleGroups = useMemo(() => getMuscleGroupData(data), [data]);
  const daily = useMemo(() => getDailySummary(data), [data]);

  const filteredDaily = useMemo(() => {
    if (filter === 'all') return daily;
    return daily.map(d => {
      if (filter === 'cardio') {
        return { ...d, totalSets: d.walkMin > 0 || d.cardioMin > 0 || d.hiitMin > 0 ? d.totalSets : 0 };
      }
      return d;
    }).filter(d => d.muscleGroups.includes(filter));
  }, [daily, filter]);

  const totals = useMemo(() => {
    return filteredDaily.reduce((acc, d) => ({
      calories: acc.calories + (d.isRest ? 0 : d.calories),
      sets: acc.sets + d.totalSets,
      volume: acc.volume + d.totalReps,
      walk: acc.walk + d.walkMin,
      cardio: acc.cardio + d.cardioMin,
      hiit: acc.hiit + d.hiitMin,
    }), { calories: 0, sets: 0, volume: 0, walk: 0, cardio: 0, hiit: 0 });
  }, [filteredDaily]);

  const activeDays = filteredDaily.filter(d => !d.isRest).length;

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <StatCard label="Active Days" value={activeDays} unit="" color="#6366f1" />
        <StatCard label="Total Sets" value={totals.sets} unit="" color="#8b5cf6" />
        <StatCard label="Volume" value={totals.volume.toLocaleString()} unit="reps" color="#ec4899" />
        <StatCard label="Calories" value={totals.calories.toLocaleString()} unit="" color="#f59e0b" />
        <StatCard label="Walk" value={totals.walk} unit="min" color="#10b981" />
        <StatCard label="Cardio" value={totals.cardio} unit="min" color="#06b6d4" />
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h3>Daily Calories Burned</h3>
          <div className="bar-chart">
            {chartData.calories.map(d => (
              <div key={d.day} className="bar-wrap" title={`Day ${d.day}: ${d.calories} cal`}>
                <div className="bar" style={{ height: `${Math.min((d.calories / 500) * 100, 100)}%` }} />
                <span className="bar-label">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h3>Daily Sets</h3>
          <div className="bar-chart">
            {chartData.sets.map(d => (
              <div key={d.day} className="bar-wrap" title={`Day ${d.day}: ${d.sets} sets`}>
                <div className="bar sets" style={{ height: `${Math.min((d.sets / 20) * 100, 100)}%` }} />
                <span className="bar-label">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card full-width">
          <h3>Cardio Minutes</h3>
          <div className="stacked-bar-chart">
            {chartData.cardio.map(d => {
              const total = d.walk + d.cardio + d.hiit;
              return (
                <div key={d.day} className="stacked-bar-wrap" title={`Day ${d.day}: ${total}min (W:${d.walk} C:${d.cardio} H:${d.hiit})`}>
                  <div className="stacked-bar">
                    {d.walk > 0 && <div className="seg walk" style={{ height: `${(d.walk / 60) * 100}%` }} />}
                    {d.cardio > 0 && <div className="seg cardio" style={{ height: `${(d.cardio / 60) * 100}%` }} />}
                    {d.hiit > 0 && <div className="seg hiit" style={{ height: `${(d.hiit / 60) * 100}%` }} />}
                  </div>
                  <span className="bar-label">{d.day}</span>
                </div>
              );
            })}
          </div>
          <div className="chart-legend">
            <span className="legend-item"><span className="dot walk"></span>Walk</span>
            <span className="legend-item"><span className="dot cardio"></span>Cardio</span>
            <span className="legend-item"><span className="dot hiit"></span>HIIT</span>
          </div>
        </div>

        <div className="chart-card">
          <h3>Muscle Groups</h3>
          <div className="muscle-bars">
            {muscleGroups.map(mg => (
              <div key={mg.name} className="muscle-row">
                <span className="muscle-name">{mg.name}</span>
                <div className="muscle-bar-wrap">
                  <div className="muscle-bar" style={{ width: `${(mg.totalSets / 150) * 100}%` }} />
                </div>
                <span className="muscle-days">{mg.activeDays}d</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WeeklyCalendar({ data, filter, onEdit, onDelete }) {
  const weeks = useMemo(() => getWeeklyData(data), [data]);
  const [weekIndex, setWeekIndex] = useState(Math.floor((data.length > 0 ? Math.min(31, data.length) - 1 : 0) / 7));

  const getDayData = (day) => {
    if (!day) return null;
    if (filter === 'all') return day;
    if (filter === 'cardio') {
      return day.walkMin > 0 || day.cardioMin > 0 || day.hiitMin > 0 ? day : null;
    }
    return day.muscleGroups.includes(filter) ? day : null;
  };

  const goNext = () => {
    if (weekIndex < weeks.length - 1) setWeekIndex(i => i + 1);
  };
  const goPrev = () => {
    if (weekIndex > 0) setWeekIndex(i => i - 1);
  };

  // Flatten entries by day to allow per-entry editing
  const entriesByDay = useMemo(() => {
    const map = {};
    data.forEach(entry => {
      if (!map[entry.day]) map[entry.day] = [];
      map[entry.day].push(entry);
    });
    return map;
  }, [data]);

  const week = weeks[weekIndex] || [];
  const isEmpty = week.length === 0;

  return (
    <div className="calendar-section">
      <div className="week-nav">
        <button onClick={goPrev} disabled={weekIndex === 0}>← Prev</button>
        <span className="week-title">Week {weekIndex + 1} {week.length > 0 ? `(Days ${week[0]?.day}–${week[week.length - 1]?.day})` : ''}</span>
        <button onClick={goNext} disabled={isEmpty || weekIndex >= weeks.length - 1}>Next →</button>
      </div>
      {isEmpty ? (
        <div className="calendar-empty">No data for this week. Add entries to see them here.</div>
      ) : (
        <div className="week-grid">
          {week.map((day) => {
            const visible = getDayData(day);
            const dayEntries = entriesByDay[day.day] || [];
            return (
              <div key={day.day} className={`day-card ${day.isRest ? 'rest' : ''} ${!visible ? 'filtered-out' : ''}`}>
                <div className="day-header">
                  <span>Day {day.day}</span>
                  {!day.isRest && dayEntries.length > 0 && (
                    <button className="day-add-btn" onClick={() => onEdit({ day: day.day, muscle_group: 'chest', reps: 0, sets: 0, walk_min: 0, cardio_min: 0, hiit_min: 0, calories: 0 })} title="Add entry">+</button>
                  )}
                </div>
                {day.isRest ? (
                  <div className="day-rest">Rest Day</div>
                ) : (
                  <div className="day-content">
                    {dayEntries.map((entry, idx) => {
                      const isVisible = filter === 'all' || (filter === 'cardio' ? (entry.walk_min > 0 || entry.cardio_min > 0 || entry.hiit_min > 0) : entry.muscle_group === filter);
                      return (
                        <div key={entry._id || idx} className={`day-entry ${!isVisible ? 'entry-filtered' : ''}`} onClick={() => onEdit(entry)}>
                          <div className="entry-actions">
                            <span className="entry-muscle">{entry.muscle_group}</span>
                            <button className="entry-delete" onClick={e => { e.stopPropagation(); onDelete(entry._id); }} title="Delete">×</button>
                          </div>
                          {entry.sets > 0 && <div className="entry-stat">{entry.sets}s × {entry.reps}r</div>}
                          {(entry.walk_min > 0 || entry.cardio_min > 0 || entry.hiit_min > 0) && (
                            <div className="day-cardio">
                              {entry.walk_min > 0 && <span>🚶{entry.walk_min}m</span>}
                              {entry.cardio_min > 0 && <span>🏃{entry.cardio_min}m</span>}
                              {entry.hiit_min > 0 && <span>⚡{entry.hiit_min}m</span>}
                            </div>
                          )}
                          {entry.calories > 0 && <div className="entry-cal">{entry.calories} cal</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function App() {
  const [rawData, setRawData] = useState([]);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalEntry, setModalEntry] = useState(null); // null = closed, {} = add, {...,_id} = edit
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Assign stable IDs if missing
          const withIds = parsed.map((e, i) => ({ ...e, _id: e._id || `entry-${i}-${Date.now()}` }));
          setRawData(withIds);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('localStorage read error:', err);
    }
    setLoading(false);
  }, []);

  // Persist to localStorage whenever data changes
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rawData));
      } catch (err) {
        console.warn('localStorage write error:', err);
      }
    }
  }, [rawData, loading]);

  // Close header menu on outside click
  useEffect(() => {
    if (!headerMenuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setHeaderMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [headerMenuOpen]);

  const importCSV = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target.result;
        const parsed = parseCSV(text);
        if (!parsed || parsed.length === 0) {
          setError('CSV file contains no data.'); return;
        }
        const withIds = parsed.map((entry, i) => ({
          ...entry,
          _id: `entry-${Date.now()}-${i}`,
        }));
        setRawData(withIds);
        setError(null);
      } catch (err) {
        setError('Failed to parse CSV: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const exportCSV = useCallback(() => {
    if (rawData.length === 0) return;
    const exportData = rawData.map(({ _id, ...rest }) => rest);
    downloadCSV(toCSV(exportData));
  }, [rawData]);

  const handleSaveEntry = useCallback((formData, id) => {
    setRawData(prev => {
      if (id) {
        // Update existing
        return prev.map(e => e._id === id ? { ...formData, _id: id } : e);
      } else {
        // Add new
        return [...prev, { ...formData, _id: `entry-${Date.now()}` }];
      }
    });
    setModalEntry(null);
  }, []);

  const handleDeleteEntry = useCallback((id) => {
    if (window.confirm('Delete this entry?')) {
      setRawData(prev => prev.filter(e => e._id !== id));
    }
  }, []);

  const handleClearAll = useCallback(() => {
    if (window.confirm('Clear all workout data? This cannot be undone.')) {
      setRawData([]);
      localStorage.removeItem(STORAGE_KEY);
      setHeaderMenuOpen(false);
    }
  }, []);

  const openAddModal = useCallback(() => setModalEntry({ day: 1, muscle_group: 'chest', reps: 0, sets: 0, walk_min: 0, cardio_min: 0, hiit_min: 0, calories: 0 }), []);
  const openEditModal = useCallback((entry) => setModalEntry(entry), []);
  const closeModal = useCallback(() => setModalEntry(null), []);

  if (loading) return <div className="loading">Loading exercise data...</div>;

  const hasData = rawData.length > 0;

  return (
    <div className="app">
      <header className="app-header">
        <h1>💪 Exercise Tracker</h1>
        <div className="header-right">
          <div className="header-actions">
            {hasData && (
              <>
                <label className="btn btn-sm import-btn">
                  <input type="file" accept=".csv" style={{ display: 'none' }} onChange={importCSV} />
                  Import CSV
                </label>
                <button className="btn btn-sm" onClick={exportCSV} title="Export CSV">Export CSV</button>
              </>
            )}
            <button className="btn btn-sm" onClick={() => setHeaderMenuOpen(o => !o)} title="More options">⋮</button>
          </div>
          {headerMenuOpen && (
            <div className="header-menu" ref={menuRef}>
              {hasData && <button className="header-menu-item danger" onClick={handleClearAll}>Clear All Data</button>}
            </div>
          )}
        </div>
      </header>

      {!hasData ? (
        <EmptyState onImport={importCSV} />
      ) : (
        <>
          <nav className="tab-nav">
            <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
            <button className={activeTab === 'calendar' ? 'active' : ''} onClick={() => setActiveTab('calendar')}>Calendar</button>
          </nav>

          <div className="filter-bar">
            {MUSCLE_GROUPS.map(mg => (
              <button
                key={mg}
                className={`filter-btn ${filter === mg ? 'active' : ''}`}
                onClick={() => setFilter(mg)}
              >
                {mg === 'all' ? 'All' : mg.charAt(0).toUpperCase() + mg.slice(1)}
              </button>
            ))}
          </div>

          <main>
            {activeTab === 'dashboard' ? (
              <Dashboard data={rawData} filter={filter} />
            ) : (
              <WeeklyCalendar data={rawData} filter={filter} onEdit={openEditModal} onDelete={handleDeleteEntry} />
            )}
          </main>

          {/* Floating Add Button */}
          <button className="fab" onClick={openAddModal} title="Add Workout">+</button>
        </>
      )}

      {error && <div className="error-banner">{error} <button onClick={() => setError(null)}>×</button></div>}

      {modalEntry !== null && (
        <WorkoutModal
          entry={modalEntry}
          onSave={handleSaveEntry}
          onDelete={handleDeleteEntry}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

export default App;
