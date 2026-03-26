// Data utility functions for exercise tracker V2
// Storage key: exerciseTrackerDataV2
// Each entry: { id, date: "YYYY-MM-DD", muscle_group, sets, reps, walk_min, cardio_min, hiit_min, calories }

export const STORAGE_KEY = 'exerciseTrackerDataV2';

export const MUSCLE_GROUP_ORDER = [
  'back', 'biceps', 'lower_back', 'traps', 'legs', 'glutes',
  'quads', 'hamstring', 'calf', 'chest', 'shoulder', 'triceps', 'abs',
  'cardio_walk', 'cardio_generic', 'hiit',
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

// Load data from localStorage
export function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

// Save data to localStorage
export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save data:', e);
  }
}

// Generate unique ID
export function generateId() {
  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Get entries for a specific date
export function getEntriesForDate(data, date) {
  return data.filter(e => e.date === date);
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

// Calculate streak (consecutive days with >=1 workout, ignoring rest days)
export function calculateStreak(data) {
  if (!data || data.length === 0) return 0;
  
  // Get unique workout dates (exclude rest days)
  const workoutDates = [...new Set(
    data
      .filter(e => e.muscle_group !== 'rest')
      .map(e => e.date)
  )].sort().reverse();

  if (workoutDates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if most recent workout is today or yesterday
  const mostRecent = new Date(workoutDates[0]);
  const diffDays = Math.round((today - mostRecent) / (1000 * 60 * 60 * 24));
  
  if (diffDays > 1) return 0; // streak broken

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
      // continue streak
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
export function getCategoryMonthlyTotals(data, year, month) {
  const monthStr = getMonthKey(year, month);
  const monthData = data.filter(e => e.date.startsWith(monthStr) && e.muscle_group !== 'rest');

  const totals = { back: 0, legs: 0, chest: 0, cardio: 0 };

  for (const entry of monthData) {
    const mg = entry.muscle_group;
    if (['back', 'biceps', 'lower_back', 'traps'].includes(mg)) {
      totals.back += entry.sets || 0;
    } else if (['legs', 'glutes', 'quads', 'hamstring', 'calf'].includes(mg)) {
      totals.legs += entry.sets || 0;
    } else if (['chest', 'shoulder', 'triceps', 'abs'].includes(mg)) {
      totals.chest += entry.sets || 0;
    } else if (['cardio_walk', 'cardio_generic', 'hiit'].includes(mg)) {
      totals.cardio += (entry.walk_min || 0) + (entry.cardio_min || 0) + (entry.hiit_min || 0);
    }
  }

  return totals;
}

// Get total volume for month (sum of sets * reps for non-rest, non-cardio)
export function getMonthlyVolume(data, year, month) {
  const monthStr = getMonthKey(year, month);
  return data
    .filter(e => e.date.startsWith(monthStr) && e.muscle_group !== 'rest' && !CARDIO_MUSCLE_GROUPS.includes(e.muscle_group))
    .reduce((sum, e) => sum + (e.sets || 0) * (e.reps || 0), 0);
}

// Get total calories for month
export function getMonthlyCalories(data, year, month) {
  const monthStr = getMonthKey(year, month);
  return data
    .filter(e => e.date.startsWith(monthStr))
    .reduce((sum, e) => sum + (e.calories || 0), 0);
}

// Get daily totals for a month (for calendar/heatmap)
export function getDailyTotalsForMonth(data, year, month) {
  const monthStr = getMonthKey(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const dailyTotals = {}; // date -> { sets, volume, calories, muscleGroups }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDate(year, month, d);
    dailyTotals[dateStr] = { sets: 0, volume: 0, calories: 0, muscleGroups: new Set(), isRest: false };
  }

  for (const entry of data) {
    if (!entry.date.startsWith(monthStr)) continue;
    const day = dailyTotals[entry.date];
    if (!day) continue;

    if (entry.muscle_group === 'rest') {
      day.isRest = true;
    } else if (CARDIO_MUSCLE_GROUPS.includes(entry.muscle_group)) {
      day.sets += 0;
      day.volume += 0;
      day.calories += entry.calories || 0;
      day.muscleGroups.add(entry.muscle_group);
    } else {
      day.sets += entry.sets || 0;
      day.volume += (entry.sets || 0) * (entry.reps || 0);
      day.calories += entry.calories || 0;
      if (entry.muscle_group) day.muscleGroups.add(entry.muscle_group);
    }
  }

  return dailyTotals;
}

// Get heatmap data (last N days)
export function getHeatmapData(data, days = 28) {
  const today = new Date();
  const result = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d.getFullYear(), d.getMonth(), d.getDate());
    const entries = data.filter(e => e.date === dateStr && e.muscle_group !== 'rest');
    const volume = entries.reduce((sum, e) => {
      if (CARDIO_MUSCLE_GROUPS.includes(e.muscle_group)) return sum;
      return sum + (e.sets || 0) * (e.reps || 0);
    }, 0);
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
export function getStatsData(data, year, month) {
  const monthStr = getMonthKey(year, month);
  const monthData = data.filter(e => e.date.startsWith(monthStr));

  // Category totals
  const categoryTotals = { back: 0, legs: 0, chest: 0, cardio: 0 };
  // Muscle group totals
  const muscleTotals = {};
  // Daily volume
  const dailyVolume = {};
  const daysInMonth = getDaysInMonth(year, month);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDate(year, month, d);
    dailyVolume[dateStr] = 0;
  }

  for (const entry of monthData) {
    if (entry.muscle_group === 'rest') continue;

    const isCardio = CARDIO_MUSCLE_GROUPS.includes(entry.muscle_group);
    const sets = entry.sets || 0;
    const reps = entry.reps || 0;
    const volume = sets * reps;
    const cardioMins = (entry.walk_min || 0) + (entry.cardio_min || 0) + (entry.hiit_min || 0);

    // Category totals
    if (['back', 'biceps', 'lower_back', 'traps'].includes(entry.muscle_group)) {
      categoryTotals.back += sets;
    } else if (['legs', 'glutes', 'quads', 'hamstring', 'calf'].includes(entry.muscle_group)) {
      categoryTotals.legs += sets;
    } else if (['chest', 'shoulder', 'triceps', 'abs'].includes(entry.muscle_group)) {
      categoryTotals.chest += sets;
    } else if (isCardio) {
      categoryTotals.cardio += cardioMins;
    }

    // Muscle group totals
    if (!muscleTotals[entry.muscle_group]) {
      muscleTotals[entry.muscle_group] = { sets: 0, reps: 0, volume: 0, calories: 0, walk_min: 0, cardio_min: 0, hiit_min: 0 };
    }
    muscleTotals[entry.muscle_group].sets += sets;
    muscleTotals[entry.muscle_group].reps += reps;
    muscleTotals[entry.muscle_group].volume += volume;
    muscleTotals[entry.muscle_group].calories += entry.calories || 0;
    if (isCardio) {
      muscleTotals[entry.muscle_group].walk_min += entry.walk_min || 0;
      muscleTotals[entry.muscle_group].cardio_min += entry.cardio_min || 0;
      muscleTotals[entry.muscle_group].hiit_min += entry.hiit_min || 0;
    }

    // Daily volume (only non-cardio)
    if (!isCardio && entry.date) {
      dailyVolume[entry.date] = (dailyVolume[entry.date] || 0) + volume;
    }
  }

  return { categoryTotals, muscleTotals, dailyVolume };
}

// Export data to CSV
export function toCSV(data) {
  const headers = 'date,muscle_group,sets,reps,walk_min,cardio_min,hiit_min,calories';
  const rows = data.map(e => `${e.date},${e.muscle_group},${e.sets},${e.reps},${e.walk_min},${e.cardio_min},${e.hiit_min},${e.calories}`);
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
