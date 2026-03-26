// Data utility functions for exercise tracker V3
// Storage key: exerciseTrackerDataV3
// Each session entry: { date, splitType, exercises: [{id, name, muscle_group, sets:[{id, weight_kg, reps}]}], cardio: { walk_min, cardio_min, hiit_min, calories } }

export const STORAGE_KEY_V3 = 'exerciseTrackerDataV3';

export const MUSCLE_GROUP_ORDER = [
  'back', 'biceps', 'lower_back', 'traps', 'legs', 'glutes',
  'quads', 'hamstring', 'calf', 'chest', 'shoulder', 'triceps', 'abs',
];

export const CATEGORY_COLORS = {
  back: '#6366f1',
  legs: '#10b981',
  chest: '#ec4899',
  cardio: '#f59e0b',
};

export const CATEGORY_MUSCLE_GROUPS = {
  back: ['back', 'biceps', 'lower_back', 'traps'],
  legs: ['legs', 'glutes', 'quads', 'hamstring', 'calf'],
  chest: ['chest', 'shoulder', 'triceps', 'abs'],
  cardio: ['cardio_walk', 'cardio_generic', 'hiit'],
};

export const CARDIO_MUSCLE_GROUPS = ['cardio_walk', 'cardio_generic', 'hiit'];

/* ============================================================
   EXERCISE LIBRARY
   ============================================================ */
export const EXERCISE_LIBRARY = {
  chest: [
    { name: 'Bench Press', muscle_group: 'chest' },
    { name: 'Incline Bench Press', muscle_group: 'chest' },
    { name: 'Dumbbell Press', muscle_group: 'chest' },
    { name: 'Incline Dumbbell Press', muscle_group: 'chest' },
    { name: 'Cable Flyes', muscle_group: 'chest' },
    { name: 'Push-ups', muscle_group: 'chest' },
    { name: 'Chest Dips', muscle_group: 'chest' },
  ],
  shoulders: [
    { name: 'Overhead Press', muscle_group: 'shoulders' },
    { name: 'Lateral Raises', muscle_group: 'shoulders' },
    { name: 'Front Raises', muscle_group: 'shoulders' },
    { name: 'Face Pulls', muscle_group: 'shoulders' },
    { name: 'Arnold Press', muscle_group: 'shoulders' },
  ],
  triceps: [
    { name: 'Tricep Pushdowns', muscle_group: 'triceps' },
    { name: 'Skull Crushers', muscle_group: 'triceps' },
    { name: 'Close Grip Bench', muscle_group: 'triceps' },
    { name: 'Overhead Tricep Extension', muscle_group: 'triceps' },
  ],
  back: [
    { name: 'Deadlift', muscle_group: 'back' },
    { name: 'Barbell Rows', muscle_group: 'back' },
    { name: 'Lat Pulldown', muscle_group: 'back' },
    { name: 'Seated Cable Row', muscle_group: 'back' },
    { name: 'Pull-ups', muscle_group: 'back' },
    { name: 'T-Bar Row', muscle_group: 'back' },
  ],
  biceps: [
    { name: 'Barbell Curl', muscle_group: 'biceps' },
    { name: 'Dumbbell Curl', muscle_group: 'biceps' },
    { name: 'Hammer Curl', muscle_group: 'biceps' },
    { name: 'Preacher Curl', muscle_group: 'biceps' },
  ],
  traps: [
    { name: 'Shrugs', muscle_group: 'traps' },
    { name: 'Rack Pulls', muscle_group: 'traps' },
  ],
  lower_back: [
    { name: 'Good Mornings', muscle_group: 'lower_back' },
    { name: 'Back Extensions', muscle_group: 'lower_back' },
    { name: 'Superman', muscle_group: 'lower_back' },
  ],
  quads: [
    { name: 'Squat', muscle_group: 'quads' },
    { name: 'Leg Press', muscle_group: 'quads' },
    { name: 'Leg Extension', muscle_group: 'quads' },
    { name: 'Bulgarian Split Squat', muscle_group: 'quads' },
    { name: 'Lunges', muscle_group: 'quads' },
    { name: 'Hack Squat', muscle_group: 'quads' },
  ],
  hamstring: [
    { name: 'Romanian Deadlift', muscle_group: 'hamstring' },
    { name: 'Leg Curl', muscle_group: 'hamstring' },
    { name: 'Stiff-Leg Deadlift', muscle_group: 'hamstring' },
  ],
  glutes: [
    { name: 'Hip Thrust', muscle_group: 'glutes' },
    { name: 'Glute Bridge', muscle_group: 'glutes' },
    { name: 'Cable Kickback', muscle_group: 'glutes' },
  ],
  calf: [
    { name: 'Standing Calf Raise', muscle_group: 'calf' },
    { name: 'Seated Calf Raise', muscle_group: 'calf' },
  ],
  abs: [
    { name: 'Plank', muscle_group: 'abs' },
    { name: 'Hanging Leg Raise', muscle_group: 'abs' },
    { name: 'Cable Crunch', muscle_group: 'abs' },
    { name: 'Ab Wheel', muscle_group: 'abs' },
    { name: 'Russian Twist', muscle_group: 'abs' },
  ],
};

// Split to primary muscle groups mapping
export const SPLIT_MUSCLE_GROUPS = {
  push:    ['chest', 'shoulder', 'triceps', 'abs'],
  pull:    ['back', 'biceps', 'traps', 'lower_back'],
  legs:    ['quads', 'hamstring', 'glutes', 'calf', 'abs'],
  upper:   ['chest', 'back', 'shoulder', 'biceps', 'triceps', 'abs'],
  lower:   ['quads', 'hamstring', 'glutes', 'calf'],
};

// Generate unique ID
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Load V3 data from localStorage
export function loadDataV3() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_V3);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed;
  } catch {
    return {};
  }
}

// Save V3 data to localStorage
export function saveDataV3(sessions) {
  try {
    localStorage.setItem(STORAGE_KEY_V3, JSON.stringify(sessions));
  } catch (e) {
    console.warn('Failed to save data:', e);
  }
}

// Get month key string
export function getMonthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

// Parse YYYY-MM-DD
export function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

// Format date parts to YYYY-MM-DD
export function formatDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Get month name
export function getMonthName(year, month) {
  return new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

// Get number of days in month
export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Get day of week for first day of month (0=Sun ... 6=Sat)
export function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

// Get week boundaries (Mon–Sun) for a given date
export function getWeekBounds(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day; // Mon offset
  const mon = new Date(d);
  mon.setDate(d.getDate() + diffToMon);
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return { weekStart: mon, weekEnd: sun };
}

// Get week totals for sessions within a week range
export function getWeekTotals(sessions, weekStart, weekEnd) {
  let sets = 0, tonnage = 0, workoutDays = 0;
  const startStr = weekStart.toISOString().split('T')[0];
  const endStr = weekEnd.toISOString().split('T')[0];

  for (const [dateStr, session] of Object.entries(sessions)) {
    if (dateStr < startStr || dateStr > endStr) continue;
    if (session.isRest) continue;
    const daySets = (session.exercises || []).reduce((sum, ex) => sum + (ex.sets || []).length, 0);
    const dayTonnage = (session.exercises || []).reduce((sum, ex) => {
      return sum + (ex.sets || []).reduce((s, set) => s + (set.weight_kg || 0) * (set.reps || 0), 0);
    }, 0);
    if (daySets > 0) workoutDays++;
    sets += daySets;
    tonnage += dayTonnage;
  }
  return { sets, tonnage, workoutDays };
}

// This week vs last week comparison
export function getWeekComparison(sessions) {
  const today = new Date();
  const thisWeek = getWeekBounds(today);
  const lastWeekStart = new Date(thisWeek.weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(lastWeekStart);
  lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
  lastWeekEnd.setHours(23, 59, 59, 999);

  const thisWeekData = getWeekTotals(sessions, thisWeek.weekStart, thisWeek.weekEnd);
  const lastWeekData = getWeekTotals(sessions, lastWeekStart, lastWeekEnd);

  const pctChange = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  return {
    thisWeek: thisWeekData,
    lastWeek: lastWeekData,
    setsChange: pctChange(thisWeekData.sets, lastWeekData.sets),
    tonnageChange: pctChange(thisWeekData.tonnage, lastWeekData.tonnage),
    daysChange: pctChange(thisWeekData.workoutDays, lastWeekData.workoutDays),
  };
}

// Month comparison (this month vs last month)
export function getMonthComparison(sessions, year, month) {
  const thisMonthStart = new Date(year, month, 1);
  const thisMonthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const lastMonthStart = new Date(year, month - 1, 1);
  const lastMonthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  const thisData = getWeekTotals(sessions, thisMonthStart, thisMonthEnd);
  const lastData = getWeekTotals(sessions, lastMonthStart, lastMonthEnd);

  const pctChange = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  return {
    thisMonth: thisData,
    lastMonth: lastData,
    setsChange: pctChange(thisData.sets, lastData.sets),
    tonnageChange: pctChange(thisData.tonnage, lastData.tonnage),
    daysChange: pctChange(thisData.workoutDays, lastData.workoutDays),
  };
}

// Calculate streak (consecutive days with >=1 workout, ignoring rest days)
export function calculateStreak(sessions) {
  const sessionDates = Object.keys(sessions);
  if (sessionDates.length === 0) return 0;

  const workoutDates = sessionDates
    .filter(date => {
      const s = sessions[date];
      return !s.isRest && s.exercises?.length > 0;
    })
    .sort()
    .reverse();

  if (workoutDates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mostRecent = new Date(workoutDates[0]);
  const diffDays = Math.round((today - mostRecent) / (1000 * 60 * 60 * 24));

  if (diffDays > 1) return 0;

  let streak = 0;
  let currentDate = new Date(mostRecent);
  currentDate.setHours(0, 0, 0, 0);

  for (const dateStr of workoutDates) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((currentDate - d) / (1000 * 60 * 60 * 24));

    if (diff === 0) {
      streak++;
      currentDate = new Date(d);
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (diff === 1) {
      streak++;
      currentDate = new Date(d);
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// Get monthly totals for a category
export function getCategoryMonthlyTotals(sessions, year, month) {
  const monthStr = getMonthKey(year, month);
  const totals = { back: 0, legs: 0, chest: 0, cardio: 0 };

  Object.entries(sessions).forEach(([date, session]) => {
    if (!date.startsWith(monthStr) || session.isRest) return;

    // Cardio
    if (session.cardio) {
      totals.cardio += (session.cardio.walk_min || 0) + (session.cardio.cardio_min || 0) + (session.cardio.hiit_min || 0);
    }

    // Exercises
    (session.exercises || []).forEach(ex => {
      const sets = ex.sets?.length || 0;
      if (['back', 'biceps', 'lower_back', 'traps'].includes(ex.muscle_group)) {
        totals.back += sets;
      } else if (['legs', 'glutes', 'quads', 'hamstring', 'calf'].includes(ex.muscle_group)) {
        totals.legs += sets;
      } else if (['chest', 'shoulder', 'triceps', 'abs'].includes(ex.muscle_group)) {
        totals.chest += sets;
      }
    });
  });

  return totals;
}

// Get monthly total sets (for dashboard)
export function getMonthlySets(sessions, year, month) {
  const monthStr = getMonthKey(year, month);
  let totalSets = 0;

  Object.entries(sessions).forEach(([date, session]) => {
    if (!date.startsWith(monthStr) || session.isRest) return;
    (session.exercises || []).forEach(ex => {
      totalSets += ex.sets?.length || 0;
    });
  });

  return totalSets;
}

// Get monthly total tonnage (for dashboard)
export function getMonthlyTonnage(sessions, year, month) {
  const monthStr = getMonthKey(year, month);
  let totalTonnage = 0;

  Object.entries(sessions).forEach(([date, session]) => {
    if (!date.startsWith(monthStr) || session.isRest) return;
    (session.exercises || []).forEach(ex => {
      (ex.sets || []).forEach(set => {
        totalTonnage += (set.weight_kg || 0) * (set.reps || 0);
      });
    });
  });

  return totalTonnage;
}

// Get total calories for month
export function getMonthlyCalories(sessions, year, month) {
  const monthStr = getMonthKey(year, month);
  let totalCals = 0;

  Object.entries(sessions).forEach(([date, session]) => {
    if (!date.startsWith(monthStr)) return;
    if (session.cardio?.calories) totalCals += session.cardio.calories;
  });

  return totalCals;
}

// Get daily totals for a month (for calendar/heatmap)
export function getDailyTotalsForMonth(sessions, year, month) {
  const monthStr = getMonthKey(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const dailyTotals = {};

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDate(year, month, d);
    dailyTotals[dateStr] = { sets: 0, tonnage: 0, calories: 0, muscleGroups: new Set(), isRest: false, splitType: null };
  }

  Object.entries(sessions).forEach(([date, session]) => {
    if (!date.startsWith(monthStr)) return;
    const day = dailyTotals[date];
    if (!day) return;

    if (session.isRest) {
      day.isRest = true;
    }

    day.splitType = session.splitType || null;

    if (session.cardio?.calories) day.calories += session.cardio.calories;

    (session.exercises || []).forEach(ex => {
      const setCount = ex.sets?.length || 0;
      let exerciseTonnage = 0;
      (ex.sets || []).forEach(set => {
        exerciseTonnage += (set.weight_kg || 0) * (set.reps || 0);
      });
      day.sets += setCount;
      day.tonnage += exerciseTonnage;
      if (ex.muscle_group) day.muscleGroups.add(ex.muscle_group);
    });
  });

  return dailyTotals;
}

// Get heatmap data (last N days)
export function getHeatmapData(sessions, days = 28) {
  const today = new Date();
  const result = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d.getFullYear(), d.getMonth(), d.getDate());
    const session = sessions[dateStr];

    let volume = 0;
    if (session && !session.isRest) {
      (session.exercises || []).forEach(ex => {
        (ex.sets || []).forEach(set => {
          volume += (set.weight_kg || 0) * (set.reps || 0);
        });
      });
    }
    result.push({ date: dateStr, volume });
  }

  return result;
}

// Get quartile thresholds for heatmap coloring
export function getHeatmapQuartiles(heatmapData) {
  const volumes = heatmapData.map(d => d.volume).filter(v => v > 0);
  if (volumes.length === 0) return [0, 0, 0];
  volumes.sort((a, b) => a - b);
  const q1 = volumes[Math.floor(volumes.length * 0.25)] || 0;
  const q2 = volumes[Math.floor(volumes.length * 0.5)] || 0;
  const q3 = volumes[Math.floor(volumes.length * 0.75)] || 0;
  return [q1, q2, q3];
}

// Get heatmap level (0-3) for a volume value
export function getHeatmapLevel(volume, quartiles) {
  if (volume === 0) return 0;
  if (volume < quartiles[0]) return 1;
  if (volume < quartiles[1]) return 2;
  if (volume < quartiles[2]) return 3;
  return 3;
}

// Get stats data for stats screen
export function getStatsData(sessions, year, month) {
  const monthStr = getMonthKey(year, month);

  // Category totals (sets)
  const categoryTotals = { back: 0, legs: 0, chest: 0, cardio: 0 };
  // Category tonnage
  const categoryTonnage = { back: 0, legs: 0, chest: 0, cardio: 0 };
  // Muscle group totals
  const muscleTotals = {};
  // Daily volume
  const dailyVolume = {};
  // Exercise-level stats
  const exerciseStats = {};

  const daysInMonth = getDaysInMonth(year, month);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDate(year, month, d);
    dailyVolume[dateStr] = 0;
  }

  Object.entries(sessions).forEach(([date, session]) => {
    if (!date.startsWith(monthStr) || session.isRest) return;

    // Cardio
    if (session.cardio) {
      const cardioMins = (session.cardio.walk_min || 0) + (session.cardio.cardio_min || 0) + (session.cardio.hiit_min || 0);
      categoryTotals.cardio += cardioMins;
      categoryTonnage.cardio += session.cardio.calories || 0;
    }

    (session.exercises || []).forEach(ex => {
      const setCount = ex.sets?.length || 0;
      let exTonnage = 0;
      let exReps = 0;
      (ex.sets || []).forEach(set => {
        exTonnage += (set.weight_kg || 0) * (set.reps || 0);
        exReps += set.reps || 0;
      });

      // Category classification
      let catKey = null;
      if (['back', 'biceps', 'lower_back', 'traps'].includes(ex.muscle_group)) catKey = 'back';
      else if (['legs', 'glutes', 'quads', 'hamstring', 'calf'].includes(ex.muscle_group)) catKey = 'legs';
      else if (['chest', 'shoulder', 'triceps', 'abs'].includes(ex.muscle_group)) catKey = 'chest';

      if (catKey) {
        categoryTotals[catKey] += setCount;
        categoryTonnage[catKey] += exTonnage;
      }

      // Muscle group totals
      if (!muscleTotals[ex.muscle_group]) {
        muscleTotals[ex.muscle_group] = { sets: 0, reps: 0, tonnage: 0, exercises: {} };
      }
      muscleTotals[ex.muscle_group].sets += setCount;
      muscleTotals[ex.muscle_group].reps += exReps;
      muscleTotals[ex.muscle_group].tonnage += exTonnage;

      // Exercise-level stats
      if (!exerciseStats[ex.name]) {
        exerciseStats[ex.name] = { sets: 0, reps: 0, tonnage: 0, muscle_group: ex.muscle_group };
      }
      exerciseStats[ex.name].sets += setCount;
      exerciseStats[ex.name].reps += exReps;
      exerciseStats[ex.name].tonnage += exTonnage;

      // Daily volume (tonnage)
      dailyVolume[date] = (dailyVolume[date] || 0) + exTonnage;
    });
  });

  return { categoryTotals, categoryTonnage, muscleTotals, exerciseStats, dailyVolume };
}

// Export data to CSV
export function toCSV(sessions) {
  const headers = 'date,split_type,exercise,muscle_group,set_num,weight_kg,reps';
  const rows = [];

  Object.entries(sessions)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([date, session]) => {
      (session.exercises || []).forEach((ex, ei) => {
        (ex.sets || []).forEach((set, si) => {
          rows.push(`${date},${session.splitType || ''},${ex.name},${ex.muscle_group},${si + 1},${set.weight_kg},${set.reps}`);
        });
      });
      if (session.cardio) {
        const c = session.cardio;
        if (c.walk_min) rows.push(`${date},${session.splitType || ''},Walk,cardio_walk,1,0,${c.walk_min}`);
        if (c.cardio_min) rows.push(`${date},${session.splitType || ''},Generic Cardio,cardio_generic,1,0,${c.cardio_min}`);
        if (c.hiit_min) rows.push(`${date},${session.splitType || ''},HIIT,hiit,1,0,${c.hiit_min}`);
        if (c.calories) rows.push(`${date},${session.splitType || ''},Calories,cardio,1,0,${c.calories}`);
      }
    });

  return [headers, ...rows].join('\n');
}

export function downloadCSV(csvText, filename = 'exercise_data.csv') {
  const blob = new Blob([csvText], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
