import { format, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime, format as formatTz } from 'date-fns-tz';

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

/**
 * Converts a UTC ISO string or Date to Asia/Kolkata zoned Date
 */
export function toKolkataTime(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(d, DEFAULT_TIMEZONE);
}

/**
 * Converts a local Asia/Kolkata date and time string (YYYY-MM-DDTHH:mm) to a UTC ISO string
 */
export function kolkataToUtcIso(kolkataDateTimeString: string): string {
  // kolkataDateTimeString is like '2026-11-15T14:30'
  const zonedDate = fromZonedTime(kolkataDateTimeString, DEFAULT_TIMEZONE);
  return zonedDate.toISOString();
}

/**
 * Formats a Date or UTC ISO string into Asia/Kolkata human-readable string
 * Example: '15 Nov 2026, 02:30 PM IST'
 */
export function formatInKolkata(date: Date | string, formatPattern: string = 'dd MMM yyyy, hh:mm a'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return `${formatTz(d, formatPattern, { timeZone: DEFAULT_TIMEZONE })} IST`;
}

/**
 * Formats a date into a clean date key for calendar views (YYYY-MM-DD in Asia/Kolkata)
 */
export function formatKolkataDateKey(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatTz(d, 'yyyy-MM-dd', { timeZone: DEFAULT_TIMEZONE });
}

/**
 * Returns current timestamp in ISO UTC
 */
export function currentUtcIso(): string {
  return new Date().toISOString();
}

/**
 * Returns whether a scheduled date is in the future
 */
export function isFutureSchedule(scheduledAtIso: string, minMinutesAhead: number = 2): boolean {
  const scheduledTime = new Date(scheduledAtIso).getTime();
  const now = Date.now();
  const minAllowed = now + minMinutesAhead * 60 * 1000;
  return scheduledTime >= minAllowed;
}
