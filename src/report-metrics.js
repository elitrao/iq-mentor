export function reportScoreMetrics(rows) {
  const scores = rows.map(row => row.score).filter(score => Number.isFinite(score) && score >= 0 && score <= 100);
  return {
    count: rows.length,
    average: scores.length ? scores.reduce((total, score) => total + score, 0) / scores.length : null,
    belowTarget: scores.filter(score => score < 60).length,
    highScore: scores.filter(score => score >= 80).length,
  };
}
