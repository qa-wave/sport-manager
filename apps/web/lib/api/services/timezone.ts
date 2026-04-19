/**
 * Timezone helpers for materializing training events.
 * Ported verbatim from apps/api/src/training-templates/timezone.ts.
 *
 * Why not `date-fns-tz`? We rely on native `Intl.DateTimeFormat` which ships
 * with Node 20+, handles IANA zones and DST transitions correctly, and avoids
 * adding a new dependency.
 */

/**
 * Convert a wall-clock date/time in `tz` to the corresponding UTC Date.
 *
 * Inputs:
 *   date: Date representing a calendar day (only y/m/d are used)
 *   hh:   hour 0-23 (local to tz)
 *   mm:   minute 0-59
 *   tz:   IANA timezone (e.g. "Europe/Prague")
 */
export function zonedWallTimeToUtc(
  date: Date,
  hh: number,
  mm: number,
  tz: string,
): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();

  // Treat (y,m,d,hh,mm) as if it were UTC — gives us a starting guess.
  const naiveUtc = Date.UTC(y, m, d, hh, mm, 0, 0);

  // First probe: offset at that UTC instant in tz.
  let offset = tzOffsetMs(naiveUtc, tz);
  let utc = naiveUtc - offset;

  // Second probe at the corrected instant — catches DST boundaries.
  const offset2 = tzOffsetMs(utc, tz);
  if (offset2 !== offset) {
    offset = offset2;
    utc = naiveUtc - offset;
  }

  return new Date(utc);
}

/**
 * Return the tz offset (ms ahead of UTC) at the given UTC instant.
 * Positive for zones east of UTC (e.g. Europe/Prague +01:00 = 3_600_000).
 */
function tzOffsetMs(utcMs: number, tz: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(new Date(utcMs));
  const lookup: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') lookup[p.type] = p.value;
  }
  // Intl can produce "24" for hour when representing midnight-next-day
  // in some locales; normalize to 0.
  const hour = lookup.hour === '24' ? 0 : Number(lookup.hour);
  const local = Date.UTC(
    Number(lookup.year),
    Number(lookup.month) - 1,
    Number(lookup.day),
    hour,
    Number(lookup.minute),
    Number(lookup.second),
  );
  return local - utcMs;
}

/**
 * Iterate days between two DateTime instants (inclusive on both ends).
 * Yields the UTC midnight of each calendar day in the local zone `tz`.
 * The returned Date is a carrier for year/month/day; time-of-day is
 * recomputed per entry by `zonedWallTimeToUtc`.
 */
export function* eachLocalDay(
  fromUtc: Date,
  toUtc: Date,
  tz: string,
): Generator<Date> {
  const fromLocal = toLocalParts(fromUtc, tz);
  const toLocal = toLocalParts(toUtc, tz);

  let y = fromLocal.y;
  let m = fromLocal.m;
  let d = fromLocal.d;

  let currentUtc = Date.UTC(y, m, d);
  const endUtc = Date.UTC(toLocal.y, toLocal.m, toLocal.d);

  while (currentUtc <= endUtc) {
    yield new Date(currentUtc);
    currentUtc += 24 * 3600 * 1000;
    const nextLocal = toLocalParts(new Date(currentUtc), tz);
    y = nextLocal.y;
    m = nextLocal.m;
    d = nextLocal.d;
    currentUtc = Date.UTC(y, m, d);
  }
}

function toLocalParts(utc: Date, tz: string): { y: number; m: number; d: number } {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = dtf.formatToParts(utc);
  const lookup: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') lookup[p.type] = p.value;
  }
  return {
    y: Number(lookup.year),
    m: Number(lookup.month) - 1,
    d: Number(lookup.day),
  };
}

/**
 * Return the local day-of-week (0=Sun..6=Sat) for a UTC Date in tz.
 */
export function localDayOfWeek(utc: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
  });
  const short = dtf.format(utc); // "Sun", "Mon", ...
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const v = map[short];
  if (v === undefined) throw new Error(`Unexpected weekday "${short}" for tz ${tz}`);
  return v;
}
