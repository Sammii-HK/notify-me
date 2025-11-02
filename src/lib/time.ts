import { DateTime } from 'luxon';

/**
 * Get the next Monday's ISO date for a given timezone
 * If today is Monday, returns next Monday
 * @param tz - Timezone string
 * @param weeksAhead - Number of additional weeks ahead (default 0)
 */
export function nextMondayISODate(tz: string, weeksAhead: number = 0): string {
  const now = DateTime.now().setZone(tz);
  const mondayThisWeek = now.startOf('week'); // Monday for ISO week
  const isMonToday = now.weekday === 1;
  const nextMonday = isMonToday ? mondayThisWeek.plus({ weeks: 1 }) : mondayThisWeek;
  const targetMonday = nextMonday.plus({ weeks: weeksAhead });
  return targetMonday.toISODate()!; // YYYY-MM-DD
}

/**
 * Create an ISO datetime string for a given date, hour, and timezone
 */
export function createISOWithTime(
  dateISO: string, 
  hour: number, 
  minute = 0, 
  tz = 'Europe/London'
): string {
  const dt = DateTime.fromISO(dateISO, { zone: tz })
    .set({ hour, minute, second: 0, millisecond: 0 });
  return dt.toISO()!; // includes offset
}

/**
 * Format a date for display in a specific timezone
 */
export function formatDateForDisplay(date: Date | string, tz: string): string {
  const dt = typeof date === 'string' ? DateTime.fromISO(date) : DateTime.fromJSDate(date);
  return dt.setZone(tz).toFormat('EEE, MMM d, yyyy \'at\' HH:mm');
}
