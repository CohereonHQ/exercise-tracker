import { useState, useEffect, useMemo } from 'react';
import { parseCSV, getDailySummary, getMuscleGroupData, getWeeklyData, getChartData } from './utils/dataParser';
import './App.css';

const MUSCLE_GROUPS = ['all', 'chest', 'back', 'legs', 'shoulders', 'biceps', 'triceps', 'core', 'cardio'];

function StatCard({ label, value, unit, color }) {
  return (
    <div className="stat-card" style={{ '--accent': color }}>
      <div className="stat-value">{value}<span className="stat-unit">{unit}</span></div>
      <div className="stat-label">{label}</div>
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

function WeeklyCalendar({ data, filter }) {
  const weeks = useMemo(() => getWeeklyData(data), [data]);
  const [weekIndex, setWeekIndex] = useState(Math.floor((data.length > 0 ? Math.min(31, data.length) - 1 : 0) / 7));

  const muscleGroups = useMemo(() => getMuscleGroupData(data), [data]);

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

  const week = weeks[weekIndex] || [];

  return (
    <div className="calendar-section">
      <div className="week-nav">
        <button onClick={goPrev} disabled={weekIndex === 0}>← Prev</button>
        <span className="week-title">Week {weekIndex + 1} (Days {week[0]?.day}–{week[week.length - 1]?.day})</span>
        <button onClick={goNext} disabled={weekIndex === weeks.length - 1}>Next →</button>
      </div>
      <div className="week-grid">
        {week.map((day, i) => {
          const visible = getDayData(day);
          return (
            <div key={day.day} className={`day-card ${day.isRest ? 'rest' : ''} ${!visible ? 'filtered-out' : ''}`}>
              <div className="day-header">Day {day.day}</div>
              {day.isRest ? (
                <div className="day-rest">Rest Day</div>
              ) : (
                <div className="day-content">
                  {day.muscleGroups.length > 0 && (
                    <div className="day-muscles">
                      {day.muscleGroups.map(m => (
                        <span key={m} className="muscle-tag">{m}</span>
                      ))}
                    </div>
                  )}
                  {day.totalSets > 0 && <div className="day-stat"><span className="day-stat-val">{day.totalSets}</span> sets</div>}
                  {day.totalReps > 0 && <div className="day-stat"><span className="day-stat-val">{day.totalReps}</span> reps</div>}
                  {day.calories > 0 && <div className="day-stat"><span className="day-stat-val">{day.calories}</span> cal</div>}
                  {(day.walkMin > 0 || day.cardioMin > 0 || day.hiitMin > 0) && (
                    <div className="day-cardio">
                      {day.walkMin > 0 && <span>🚶{day.walkMin}m</span>}
                      {day.cardioMin > 0 && <span>🏃{day.cardioMin}m</span>}
                      {day.hiitMin > 0 && <span>⚡{day.hiitMin}m</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function App() {
  const [rawData, setRawData] = useState([]);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/data.csv')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load data');
        return r.text();
      })
      .then(text => {
        const data = parseCSV(text);
        setRawData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Loading exercise data...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="app">
      <header className="app-header">
        <h1>💪 Exercise Tracker</h1>
        <nav className="tab-nav">
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
          <button className={activeTab === 'calendar' ? 'active' : ''} onClick={() => setActiveTab('calendar')}>Calendar</button>
        </nav>
      </header>

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
          <WeeklyCalendar data={rawData} filter={filter} />
        )}
      </main>
    </div>
  );
}

export default App;
