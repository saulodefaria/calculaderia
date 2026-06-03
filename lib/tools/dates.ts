const millisecondsPerDay = 24 * 60 * 60 * 1000;

export interface DayCountResult {
  days: number;
  absoluteDays: number;
  weeks: number;
  monthsApprox: number;
}

function parseIsoDateAsUtc(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }

  return date.getTime();
}

export function countDaysBetween(startDate: string, endDate: string, inclusive = false): DayCountResult | null {
  const start = parseIsoDateAsUtc(startDate);
  const end = parseIsoDateAsUtc(endDate);

  if (start === null || end === null) {
    return null;
  }

  const direction = end >= start ? 1 : -1;
  const baseDays = Math.round((end - start) / millisecondsPerDay);
  const days = inclusive ? baseDays + direction : baseDays;
  const absoluteDays = Math.abs(days);

  return {
    days,
    absoluteDays,
    weeks: absoluteDays / 7,
    monthsApprox: absoluteDays / 30.4375,
  };
}
