/** Streaks and activity aggregation over local calendar days (YYYY-MM-DD). */

export function localDate(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function addDays(isoDay: string, n: number): string {
  const d = new Date(`${isoDay}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Current streak: consecutive active days ending today, or ending yesterday if
 * today has no activity yet (the streak is not broken until the day is over).
 */
export function computeStreaks(activeDays: string[], today: string): { current: number; best: number } {
  const set = new Set(activeDays);
  let best = 0;
  const sorted = [...set].sort();
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  let cursor = set.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (set.has(cursor)) { current++; cursor = addDays(cursor, -1); }
  return { current, best };
}

/**
 * Meaningful activity: a day counts only if the learner completed at least
 * `minItems` graded items or `minSeconds` of active time — an open tab does not count.
 */
export function isActiveDay(d: { items: number; activeSeconds: number }, minItems = 3, minSeconds = 120): boolean {
  return d.items >= minItems || d.activeSeconds >= minSeconds;
}
