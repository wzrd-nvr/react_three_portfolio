const UNHEALTHY_STATUSES = new Set(['rh_unavailable', 'error']);

const isWeekday = (date) => date.getDay() !== 0 && date.getDay() !== 6;

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// A run is stale once a whole weekday has passed with no newer run. Market
// holidays are not modelled, so the badge can show after a long weekend.
const missedTradingDay = (lastRunAt, now) => {
  const day = startOfDay(lastRunAt);
  day.setDate(day.getDate() + 1);
  const today = startOfDay(now);
  while (day < today) {
    if (isWeekday(day)) return true;
    day.setDate(day.getDate() + 1);
  }
  return false;
};

export function isAgentOffline(lastRun, now = new Date()) {
  if (!lastRun || !lastRun.started_at) return true;
  if (UNHEALTHY_STATUSES.has(lastRun.status)) return true;
  return missedTradingDay(lastRun.started_at, now);
}
