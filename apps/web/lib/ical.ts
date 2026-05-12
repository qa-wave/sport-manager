/**
 * Client-side iCal (.ics) generation from EventSummary data.
 *
 * Generates a standard VCALENDAR with VEVENT entries.
 * No server round-trip needed — runs entirely in the browser.
 */
import type { EventSummary } from './api';

const EVENT_TYPE_LABEL: Record<string, string> = {
  PRACTICE: 'Trénink',
  MATCH: 'Zápas',
  TOURNAMENT: 'Turnaj',
  MEETING: 'Schůzka',
  SOCIAL: 'Akce',
};

/**
 * Escapes special characters in iCal text values.
 * RFC 5545 requires escaping: \, ; and newlines.
 */
function escapeIcal(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/**
 * Converts an ISO date string to iCal DTSTART/DTEND format.
 * Example: "2026-05-09T10:00:00.000Z" → "20260509T100000Z"
 */
function toIcalDate(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace('.000Z', 'Z');
}

export function generateICal(events: EventSummary[], calendarName = 'Sport Manager'): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sport Manager//CZ',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcal(calendarName)}`,
    'X-WR-TIMEZONE:UTC',
  ];

  const now = toIcalDate(new Date().toISOString());

  for (const event of events) {
    const start = toIcalDate(event.startsAt);
    const end = event.endsAt ? toIcalDate(event.endsAt) : start;
    const typeLabel = EVENT_TYPE_LABEL[event.type] ?? event.type;

    const summaryParts = [event.title];
    if (event.type === 'MATCH' || event.type === 'TOURNAMENT') {
      if (event.opponent) summaryParts.push(`vs ${event.opponent}`);
      if (event.homeAway === 'HOME') summaryParts.push('(domácí)');
      if (event.homeAway === 'AWAY') summaryParts.push('(hosté)');
    } else {
      summaryParts[0] = `${typeLabel}: ${event.title}`;
    }

    const descParts: string[] = [];
    if (event.teamName) descParts.push(`Tým: ${event.teamName}`);
    descParts.push(
      `Přítomnost: ${event.rsvpSummary.yes} ano / ${event.rsvpSummary.maybe} možná / ${event.rsvpSummary.no} ne`,
    );

    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@sport-manager`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escapeIcal(summaryParts.join(' '))}`,
      `LOCATION:${escapeIcal(event.location ?? '')}`,
      `DESCRIPTION:${escapeIcal(descParts.join('\\n'))}`,
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICal(events: EventSummary[], filename = 'sport-manager.ics'): void {
  const content = generateICal(events);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
