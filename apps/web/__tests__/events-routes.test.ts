import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import type { HonoEnv, MemberContext } from '../lib/types/hono';

const mocks = vi.hoisted(() => ({
  withClub: vi.fn(),
}));

vi.mock('../lib/api/prisma', () => ({
  prisma: {
    withClub: mocks.withClub,
  },
}));

vi.mock('../lib/api/services/email.service', () => ({
  sendEmail: vi.fn(),
  rsvpReminderEmail: vi.fn(),
  getNotifiableMembers: vi.fn(),
}));

vi.mock('../lib/api/services/push.service', () => ({
  sendPushToUser: vi.fn(),
}));

import { eventsRoutes } from '../lib/api/routes/events.routes';

const CLUB_ID = 'ck00000000000000000000000';
const EVENT_ID = 'ck00000000000000000000001';
const TEAM_ID = 'ck00000000000000000000002';
const OTHER_TEAM_ID = 'ck00000000000000000000003';
const COACH_MEMBER_ID = 'ck00000000000000000000004';
const PLAYER_MEMBER_ID = 'ck00000000000000000000005';

function makeCoachContext(overrides: Partial<MemberContext> = {}): MemberContext {
  return {
    userId: 'ck00000000000000000000006',
    memberId: COACH_MEMBER_ID,
    clubId: CLUB_ID,
    isMinor: false,
    clubRoles: [],
    teamRoles: [{ teamId: TEAM_ID, role: 'HEAD_COACH' }],
    guardianOf: [],
    ...overrides,
  };
}

function makeApp(member: MemberContext) {
  const app = new Hono<HonoEnv>();
  app.use('*', async (c, next) => {
    c.set('user', { id: member.userId, email: 'coach@example.com' });
    c.set('clubId', member.clubId);
    c.set('member', member);
    await next();
  });
  app.route('/events', eventsRoutes);
  return app;
}

describe('events routes authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows a team coach to RSVP on behalf of a player in the same team event', async () => {
    const upsert = vi.fn().mockResolvedValue({});
    mocks.withClub.mockImplementation(async (_clubId, fn) =>
      fn({
        event: { findUnique: vi.fn().mockResolvedValue({ id: EVENT_ID, teamId: TEAM_ID, rsvpDeadline: null }) },
        eventAttendance: { upsert },
      }),
    );

    const res = await makeApp(makeCoachContext()).request(`/events/${EVENT_ID}/rsvp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ memberId: PLAYER_MEMBER_ID, status: 'YES' }),
    });

    expect(res.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { eventId_memberId: { eventId: EVENT_ID, memberId: PLAYER_MEMBER_ID } },
        create: expect.objectContaining({
          eventId: EVENT_ID,
          memberId: PLAYER_MEMBER_ID,
          respondedById: COACH_MEMBER_ID,
          status: 'YES',
        }),
      }),
    );
  });

  it('rejects coach RSVP on behalf of a player for a different team event', async () => {
    const upsert = vi.fn().mockResolvedValue({});
    mocks.withClub.mockImplementation(async (_clubId, fn) =>
      fn({
        event: { findUnique: vi.fn().mockResolvedValue({ id: EVENT_ID, teamId: OTHER_TEAM_ID, rsvpDeadline: null }) },
        eventAttendance: { upsert },
      }),
    );

    const res = await makeApp(makeCoachContext()).request(`/events/${EVENT_ID}/rsvp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ memberId: PLAYER_MEMBER_ID, status: 'NO' }),
    });

    expect(res.status).toBe(403);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('stores the acting coach as respondedById when marking attendance', async () => {
    const upsert = vi.fn().mockResolvedValue({});
    mocks.withClub.mockImplementation(async (_clubId, fn) =>
      fn({
        event: { findUnique: vi.fn().mockResolvedValue({ id: EVENT_ID, teamId: TEAM_ID }) },
        eventAttendance: { upsert },
      }),
    );

    const res = await makeApp(makeCoachContext()).request(`/events/${EVENT_ID}/attendance`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ attendances: [{ memberId: PLAYER_MEMBER_ID, attended: true }] }),
    });

    expect(res.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          memberId: PLAYER_MEMBER_ID,
          respondedById: COACH_MEMBER_ID,
          attended: true,
        }),
        update: { attended: true },
      }),
    );
  });
});
