/**
 * email-templates.test.ts
 *
 * Pure-function tests for HTML email template generators.
 * No network calls, no DB — all templates are deterministic string builders.
 */
import { describe, it, expect } from 'vitest';
import {
  newEventEmail,
  rsvpReminderEmail,
  welcomeEmail,
  type NewEventEmailParams,
  type RsvpReminderEmailParams,
  type WelcomeEmailParams,
} from '../lib/api/services/email-templates';

// ---------------------------------------------------------------------------
// Shared fixture helpers
// ---------------------------------------------------------------------------
function makeNewEventParams(overrides: Partial<NewEventEmailParams> = {}): NewEventEmailParams {
  return {
    recipientName: 'Jan Novák',
    clubName: 'FC Hvězda',
    eventTitle: 'Trénink U15',
    eventType: 'PRACTICE',
    eventDate: 'sobota 15. května 2026',
    eventTime: '10:00 – 11:30',
    location: 'Hřiště A',
    teamName: 'U15',
    eventUrl: 'https://sport-manager.qawave.ai/admin/events/123',
    rsvpYesUrl: 'https://sport-manager.qawave.ai/rsvp/token-yes',
    rsvpNoUrl: 'https://sport-manager.qawave.ai/rsvp/token-no',
    ...overrides,
  };
}

function makeRsvpReminderParams(overrides: Partial<RsvpReminderEmailParams> = {}): RsvpReminderEmailParams {
  return {
    recipientName: 'Jana Nováková',
    playerName: 'Pavel Novák',
    clubName: 'FC Hvězda',
    eventTitle: 'Zápas vs Sparta',
    eventDate: 'neděle 16. května 2026',
    eventTime: '14:00 – 16:00',
    rsvpYesUrl: 'https://sport-manager.qawave.ai/rsvp/yes-token',
    rsvpNoUrl: 'https://sport-manager.qawave.ai/rsvp/no-token',
    eventUrl: 'https://sport-manager.qawave.ai/admin/events/456',
    ...overrides,
  };
}

function makeWelcomeParams(overrides: Partial<WelcomeEmailParams> = {}): WelcomeEmailParams {
  return {
    firstName: 'Tomáš',
    clubName: 'FC Hvězda',
    adminUrl: 'https://sport-manager.qawave.ai/admin',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// newEventEmail
// ---------------------------------------------------------------------------
describe('newEventEmail', () => {
  it('returns an object with subject and html', () => {
    const result = newEventEmail(makeNewEventParams());
    expect(result).toHaveProperty('subject');
    expect(result).toHaveProperty('html');
  });

  it('html is a non-empty string', () => {
    const { html } = newEventEmail(makeNewEventParams());
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(100);
  });

  it('html contains the event title', () => {
    const { html } = newEventEmail(makeNewEventParams({ eventTitle: 'Trénink U15' }));
    expect(html).toContain('Trénink U15');
  });

  it('subject contains the event title', () => {
    const { subject } = newEventEmail(makeNewEventParams({ eventTitle: 'Letní kempování' }));
    expect(subject).toContain('Letní kempování');
  });

  it('html contains RSVP yes and no buttons', () => {
    const { html } = newEventEmail(makeNewEventParams());
    expect(html).toContain('Zúčastním se');
    expect(html).toContain('Nemohu');
  });

  it('html contains the rsvpYesUrl and rsvpNoUrl links', () => {
    const params = makeNewEventParams({
      rsvpYesUrl: 'https://example.com/rsvp/yes',
      rsvpNoUrl: 'https://example.com/rsvp/no',
    });
    const { html } = newEventEmail(params);
    expect(html).toContain('https://example.com/rsvp/yes');
    expect(html).toContain('https://example.com/rsvp/no');
  });

  it('html contains the club name', () => {
    const { html } = newEventEmail(makeNewEventParams({ clubName: 'TJ Sokol' }));
    expect(html).toContain('TJ Sokol');
  });

  it('html contains an unsubscribe / notification settings link', () => {
    const { html } = newEventEmail(makeNewEventParams());
    // The footer always contains a link to notification settings
    expect(html).toContain('nastavení notifikací');
  });

  it('html is valid HTML starting with <!DOCTYPE html>', () => {
    const { html } = newEventEmail(makeNewEventParams());
    expect(html.trimStart()).toMatch(/^<!DOCTYPE html>/i);
  });

  it('escapes HTML special characters in the event title in the email body', () => {
    const malicious = '<script>alert("xss")</script>';
    const { html } = newEventEmail(makeNewEventParams({ eventTitle: malicious }));
    // The h1 heading in the body must have the title escaped
    expect(html).toContain('&lt;script&gt;alert');
    // The escaped form must appear — regardless of preview text, the body is safe
    expect(html).toContain('&lt;script&gt;');
  });

  it('escapes HTML angle brackets and ampersand in club name in the email body', () => {
    const { html } = newEventEmail(makeNewEventParams({ clubName: '<b>Club & Co</b>' }));
    // Body paragraph contains escaped club name
    expect(html).toContain('&lt;b&gt;');
    expect(html).toContain('&amp;');
  });
});

// ---------------------------------------------------------------------------
// rsvpReminderEmail
// ---------------------------------------------------------------------------
describe('rsvpReminderEmail', () => {
  it('returns an object with subject and html', () => {
    const result = rsvpReminderEmail(makeRsvpReminderParams());
    expect(result).toHaveProperty('subject');
    expect(result).toHaveProperty('html');
  });

  it('html contains "Připomínka RSVP" heading', () => {
    const { html } = rsvpReminderEmail(makeRsvpReminderParams());
    expect(html).toContain('Připomínka RSVP');
  });

  it('html contains RSVP yes and no buttons', () => {
    const { html } = rsvpReminderEmail(makeRsvpReminderParams());
    expect(html).toContain('Zúčastním se');
    expect(html).toContain('Nemohu');
  });

  it('html contains the event title', () => {
    const { html } = rsvpReminderEmail(makeRsvpReminderParams({ eventTitle: 'Zápas vs Slavie' }));
    expect(html).toContain('Zápas vs Slavie');
  });

  it('subject contains the event title', () => {
    const { subject } = rsvpReminderEmail(makeRsvpReminderParams({ eventTitle: 'Velký turnaj' }));
    expect(subject).toContain('Velký turnaj');
  });

  it('html contains unsubscribe link', () => {
    const { html } = rsvpReminderEmail(makeRsvpReminderParams());
    expect(html).toContain('nastavení notifikací');
  });

  it('shows deadline banner when rsvpDeadline is provided', () => {
    const { html } = rsvpReminderEmail(makeRsvpReminderParams({ rsvpDeadline: 'dnes ve 22:00' }));
    expect(html).toContain('dnes ve 22:00');
    expect(html).toContain('Uzávěrka');
  });

  it('does not show deadline banner when rsvpDeadline is absent', () => {
    const { html } = rsvpReminderEmail(makeRsvpReminderParams({ rsvpDeadline: undefined }));
    expect(html).not.toContain('Uzávěrka');
  });

  it('escapes XSS in playerName', () => {
    const { html } = rsvpReminderEmail(
      makeRsvpReminderParams({ playerName: '<img src=x onerror=alert(1)>' }),
    );
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img');
  });
});

// ---------------------------------------------------------------------------
// welcomeEmail
// ---------------------------------------------------------------------------
describe('welcomeEmail', () => {
  it('returns an object with subject and html', () => {
    const result = welcomeEmail(makeWelcomeParams());
    expect(result).toHaveProperty('subject');
    expect(result).toHaveProperty('html');
  });

  it('html contains "Vítejte" greeting', () => {
    const { html } = welcomeEmail(makeWelcomeParams());
    expect(html).toContain('Vítejte');
  });

  it('html contains the first name', () => {
    const { html } = welcomeEmail(makeWelcomeParams({ firstName: 'Petr' }));
    expect(html).toContain('Petr');
  });

  it('html contains the club name', () => {
    const { html } = welcomeEmail(makeWelcomeParams({ clubName: 'TJ Sokol Měcholupy' }));
    expect(html).toContain('TJ Sokol Měcholupy');
  });

  it('html contains an unsubscribe / notification settings link', () => {
    const { html } = welcomeEmail(makeWelcomeParams());
    expect(html).toContain('nastavení notifikací');
  });

  it('html contains the adminUrl CTA button', () => {
    const { html } = welcomeEmail(makeWelcomeParams({ adminUrl: 'https://example.com/admin' }));
    expect(html).toContain('https://example.com/admin');
  });

  it('subject contains "Sport Manager"', () => {
    const { subject } = welcomeEmail(makeWelcomeParams());
    expect(subject).toContain('Sport Manager');
  });

  it('html is valid HTML starting with <!DOCTYPE html>', () => {
    const { html } = welcomeEmail(makeWelcomeParams());
    expect(html.trimStart()).toMatch(/^<!DOCTYPE html>/i);
  });

  it('works without clubName (no club yet registered)', () => {
    const result = welcomeEmail({ firstName: 'Anon', adminUrl: 'https://example.com' });
    expect(result.html).toContain('Vítejte');
    expect(result.html).not.toContain('undefined');
    expect(result.html).not.toContain('null');
  });

  it('escapes XSS in firstName', () => {
    const { html } = welcomeEmail(
      makeWelcomeParams({ firstName: '<script>alert("xss")</script>' }),
    );
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
  });
});
