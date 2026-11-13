import { describe, it, expect } from 'vitest';
import { kolkataToUtcIso, formatInKolkata, formatKolkataDateKey, toKolkataTime } from '../src/lib/date-utils';

describe('Asia/Kolkata Timezone & Scheduling Engine', () => {
  it('should correctly convert Asia/Kolkata local time string to UTC ISO', () => {
    // 2026-11-15 at 14:30:00 IST is 09:00:00 UTC (IST is UTC+05:30)
    const kolkataString = '2026-11-15T14:30:00';
    const utcIso = kolkataToUtcIso(kolkataString);

    expect(utcIso).toBe('2026-11-15T09:00:00.000Z');
  });

  it('should format UTC ISO timestamp into human-readable IST string', () => {
    const utcIso = '2026-11-15T09:00:00.000Z';
    const formatted = formatInKolkata(utcIso, 'dd MMM yyyy, hh:mm a');

    expect(formatted).toBe('15 Nov 2026, 02:30 PM IST');
  });

  it('should generate correct YYYY-MM-DD calendar date key in Asia/Kolkata', () => {
    // Late evening in UTC is next day in IST
    const lateUtcIso = '2026-11-15T22:30:00.000Z'; // +05:30 makes it 2026-11-16 04:00 AM IST
    const dateKey = formatKolkataDateKey(lateUtcIso);

    expect(dateKey).toBe('2026-11-16');
  });

  it('should convert Date object accurately to Asia/Kolkata zoned time', () => {
    const date = new Date('2026-11-13T10:00:00.000Z');
    const zoned = toKolkataTime(date);
    expect(zoned).toBeInstanceOf(Date);
  });
});
