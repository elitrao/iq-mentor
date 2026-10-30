export function reportScoreMetrics(rows) {
  const scores = rows.map(row => row.score).filter(score => Number.isFinite(score) && score >= 0 && score <= 100);
  return {
    count: rows.length,
    average: scores.length ? scores.reduce((total, score) => total + score, 0) / scores.length : null,
    belowTarget: scores.filter(score => score < 60).length,
    highScore: scores.filter(score => score >= 80).length,
  };
}

export function reportScoreDistribution(rows) {
  const groups = [
    { id: 'low', label: 'Ниже 60%', count: 0 },
    { id: 'middle', label: '60–79%', count: 0 },
    { id: 'high', label: '80% и выше', count: 0 },
    { id: 'unscored', label: 'Без оценки', count: 0 },
  ];
  for (const { score } of rows) {
    const index = !Number.isFinite(score) || score < 0 || score > 100 ? 3 : score < 60 ? 0 : score < 80 ? 1 : 2;
    groups[index].count += 1;
  }
  return groups;
}

export function reportCallMetrics(rows) {
  const employees = rows.filter(row => Number.isInteger(row.calls) && row.calls >= 0)
    .map(row => ({
      id: row.id || row.name,
      name: row.name,
      calls: row.calls,
      seconds: row.calls > 0 && Number.isFinite(row.callDurationSeconds) && row.callDurationSeconds >= 0 ? row.callDurationSeconds : null,
    }))
    .sort((a, b) => String(a.id).localeCompare(String(b.id), 'ru', { numeric: true }));
  const timed = employees.filter(row => row.seconds !== null);
  const timedCalls = timed.reduce((total, row) => total + row.calls, 0);
  const totalSeconds = timed.reduce((total, row) => total + row.seconds, 0);
  return {
    calls: employees.reduce((total, row) => total + row.calls, 0),
    totalSeconds,
    timedCalls,
    averageSeconds: timedCalls ? totalSeconds / timedCalls : null,
    employees: employees.map(row => ({ ...row, averageSeconds: row.seconds === null ? null : row.seconds / row.calls })),
  };
}

export function reportDurationParts(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  const rounded = Math.round(seconds);
  return { minutes: Math.floor(rounded / 60), seconds: rounded % 60 };
}

const employeePlural = new Intl.PluralRules('ru');
export function reportEmployeeCount(count) {
  return `${count} ${{ one: 'сотрудник', few: 'сотрудника', many: 'сотрудников', other: 'сотрудника' }[employeePlural.select(count)]}`;
}

export function reportDepartmentCalls(rows) {
  const totals = new Map();
  for (const row of rows) {
    if (!Number.isInteger(row.calls) || row.calls < 0) continue;
    const name = row.department?.trim() || 'Без отдела';
    totals.set(name, (totals.get(name) || 0) + row.calls);
  }
  const departments = [...totals].map(([name, calls]) => ({ name, calls }))
    .sort((a, b) => b.calls - a.calls || a.name.localeCompare(b.name, 'ru'));
  return departments.length > 4 ? [...departments.slice(0, 3), { name: 'Остальные отделы', calls: departments.slice(3).reduce((sum, row) => sum + row.calls, 0) }] : departments;
}
