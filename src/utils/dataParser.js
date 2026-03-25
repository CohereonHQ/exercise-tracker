export function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  const rows = lines.slice(1);
  
  return rows.map(row => {
    const values = row.split(',');
    const obj = {};
    headers.forEach((h, i) => {
      const val = values[i];
      obj[h.trim()] = isNaN(val) || val === '' ? val : Number(val);
    });
    return obj;
  });
}

export function getDailySummary(data) {
  const days = {};
  data.forEach(entry => {
    const day = entry.day;
    if (!days[day]) {
      days[day] = {
        day,
        totalSets: 0,
        totalReps: 0,
        calories: 0,
        walkMin: 0,
        cardioMin: 0,
        hiitMin: 0,
        muscleGroups: [],
        isRest: entry.muscle_group === 'rest',
        isCardio: entry.muscle_group === 'cardio',
      };
    }
    days[day].totalSets += entry.sets || 0;
    days[day].totalReps += (entry.sets || 0) * (entry.reps || 0);
    days[day].calories += entry.calories || 0;
    days[day].walkMin += entry.walk_min || 0;
    days[day].cardioMin += entry.cardio_min || 0;
    days[day].hiitMin += entry.hiit_min || 0;
    if (entry.muscle_group && entry.muscle_group !== 'rest' && entry.muscle_group !== 'cardio') {
      if (!days[day].muscleGroups.includes(entry.muscle_group)) {
        days[day].muscleGroups.push(entry.muscle_group);
      }
    }
  });
  return Object.values(days).sort((a, b) => a.day - b.day);
}

export function getMuscleGroupData(data) {
  const groups = {};
  data.forEach(entry => {
    const mg = entry.muscle_group;
    if (mg !== 'rest' && mg !== 'cardio') {
      if (!groups[mg]) groups[mg] = { name: mg, totalSets: 0, totalReps: 0, days: new Set() };
      groups[mg].totalSets += entry.sets || 0;
      groups[mg].totalReps += (entry.sets || 0) * (entry.reps || 0);
      groups[mg].days.add(entry.day);
    }
  });
  return Object.values(groups).map(g => ({ ...g, activeDays: g.days.size })).sort((a, b) => b.totalSets - a.totalSets);
}

export function getWeeklyData(data) {
  const daily = getDailySummary(data);
  const weeks = [];
  for (let i = 0; i < daily.length; i += 7) {
    weeks.push(daily.slice(i, i + 7));
  }
  return weeks;
}

export function getChartData(data) {
  const daily = getDailySummary(data);
  return {
    calories: daily.map(d => ({ day: d.day, calories: d.calories })),
    cardio: daily.map(d => ({ day: d.day, walk: d.walkMin, cardio: d.cardioMin, hiit: d.hiitMin })),
    sets: daily.map(d => ({ day: d.day, sets: d.totalSets })),
    volume: daily.map(d => ({ day: d.day, volume: d.totalReps })),
  };
}
