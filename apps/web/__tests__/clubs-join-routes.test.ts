// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { SignJWT } from 'jose';
import type { HonoEnv, MemberContext } from '../lib/types/hono';

const mocks = vi.hoisted(() => ({
  clubFindUnique: vi.fn(),
  memberFindUnique: vi.fn(),
  memberCreate: vi.fn(),
  teamFindFirst: vi.fn(),
  teamMembershipUpsert: vi.fn(),
}));

vi.mock('../lib/api/prisma', () => ({
  prisma: {
    club: { findUnique: mocks.clubFindUnique },
    member: { findUnique: mocks.memberFindUnique, create: mocks.memberCreate },
    team: { findFirst: mocks.teamFindFirst },
    teamMembership: { upsert: mocks.teamMembershipUpsert },
  },
}));

vi.mock('../lib/api/services/email.service', () => ({
  sendEmail: vi.fn(),
}));

import { clubsRoutes } from '../lib/api/routes/clubs.routes';

const CLUB_ID = 'ck00000000000000000000000';
const USER_ID = 'ck00000000000000000000001';
const TEAM_ID = 'ck00000000000000000000002';
const MEMBER_ID = 'ck00000000000000000000003';

const ACCESS_SECRET = 'test-secret-for-clubs-join-routes';

beforeEach(() => {
  process.env.JWT_ACCESS_SECRET = ACCESS_SECRET;
  vi.clearAllMocks();
});

async function makeInviteToken(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(ACCESS_SECRET));
}

function makeMemberContext(): MemberContext {
  return {
    userId: USER_ID,
    memberId: MEMBER_ID,
    clubId: CLUB_ID,
    isMinor: false,
    clubRoles: [],
    teamRoles: [],
    guardianOf: [],
  };
}

function makeApp(authed = true) {
  const app = new Hono<HonoEnv>();
  if (authed) {
    app.use('*', async (c, next) => {
      c.set('user', { id: USER_ID, email: 'player@example.com' });
      c.set('clubId', CLUB_ID);
      c.set('member', makeMemberContext());
      await next();
    });
  }
  app.route('/clubs', clubsRoutes);
  return app;
}

describe('GET /clubs/public/invite-info', () => {
  it('returns 400 when token query param is missing', async () => {
    const res = await makeApp(false).request('/clubs/public/invite-info');
    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid token', async () => {
    const res = await makeApp(false).request('/clubs/public/invite-info?token=not-a-real-jwt');
    expect(res.status).toBe(400);
    const body = (await res.json()) as { message: string };
    expect(body.message).toMatch(/invalid|expired/i);
  });

  it('returns 400 for a token without invite purpose', async () => {
    const token = await makeInviteToken({ clubId: CLUB_ID, purpose: 'other' });
    const res = await makeApp(false).request(`/clubs/public/invite-info?token=${token}`);
    expect(res.status).toBe(400);
  });

  it('returns club info + teams for a valid invite token', async () => {
    mocks.clubFindUnique.mockResolvedValue({
      id: CLUB_ID,
      name: 'FC Test',
      slug: 'fc-test',
      teams: [
        { id: TEAM_ID, name: 'U13', sport: 'Fotbal', ageGroup: 'U13' },
      ],
    });

    const token = await makeInviteToken({ clubId: CLUB_ID, purpose: 'invite' });
    const res = await makeApp(false).request(`/clubs/public/invite-info?token=${token}`);

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      clubId: string; clubName: string; slug: string; teams: Array<{ id: string }>;
    };
    expect(body.clubId).toBe(CLUB_ID);
    expect(body.clubName).toBe('FC Test');
    expect(body.teams).toHaveLength(1);
    expect(body.teams[0]!.id).toBe(TEAM_ID);
  });

  it('does NOT match /public/:slug — invite-info route registered first', async () => {
    // Sanity: even if someone makes a club with slug "invite-info",
    // the invite-info route wins (regression test for the route ordering fix).
    const token = await makeInviteToken({ clubId: CLUB_ID, purpose: 'invite' });
    mocks.clubFindUnique.mockResolvedValue({
      id: CLUB_ID, name: 'X', slug: 'x', teams: [],
    });
    const res = await makeApp(false).request(`/clubs/public/invite-info?token=${token}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { teams: unknown[] };
    expect(Array.isArray(body.teams)).toBe(true);
  });
});

describe('POST /clubs/join with team role', () => {
  it('creates a Member when none exists, without team role', async () => {
    mocks.memberFindUnique.mockResolvedValue(null);
    mocks.memberCreate.mockResolvedValue({ id: MEMBER_ID });

    const token = await makeInviteToken({ clubId: CLUB_ID, purpose: 'invite' });
    const res = await makeApp().request('/clubs/join', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    expect(res.status).toBe(201);
    expect(mocks.memberCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: USER_ID, clubId: CLUB_ID }) }),
    );
    expect(mocks.teamMembershipUpsert).not.toHaveBeenCalled();
  });

  it('attaches a TeamMembership when teamRole + teamId are provided', async () => {
    mocks.memberFindUnique.mockResolvedValue({ id: MEMBER_ID });
    mocks.teamFindFirst.mockResolvedValue({ id: TEAM_ID });
    mocks.teamMembershipUpsert.mockResolvedValue({});

    const token = await makeInviteToken({ clubId: CLUB_ID, purpose: 'invite' });
    const res = await makeApp().request('/clubs/join', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, teamRole: 'PLAYER', teamId: TEAM_ID }),
    });

    expect(res.status).toBe(201);
    expect(mocks.teamMembershipUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { memberId_teamId_role: { memberId: MEMBER_ID, teamId: TEAM_ID, role: 'PLAYER' } },
        create: { memberId: MEMBER_ID, teamId: TEAM_ID, role: 'PLAYER' },
        update: { leftAt: null },
      }),
    );
  });

  it('rejects a teamId that does not belong to the invited club', async () => {
    mocks.memberFindUnique.mockResolvedValue({ id: MEMBER_ID });
    mocks.teamFindFirst.mockResolvedValue(null); // team not found in this club

    const token = await makeInviteToken({ clubId: CLUB_ID, purpose: 'invite' });
    const res = await makeApp().request('/clubs/join', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, teamRole: 'PLAYER', teamId: 'foreign-team' }),
    });

    expect(res.status).toBe(404);
    expect(mocks.teamMembershipUpsert).not.toHaveBeenCalled();
  });

  it('rejects an unknown teamRole even with valid teamId', async () => {
    mocks.memberFindUnique.mockResolvedValue({ id: MEMBER_ID });

    const token = await makeInviteToken({ clubId: CLUB_ID, purpose: 'invite' });
    const res = await makeApp().request('/clubs/join', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, teamRole: 'BOGUS_ROLE', teamId: TEAM_ID }),
    });

    expect(res.status).toBe(400);
    expect(mocks.teamFindFirst).not.toHaveBeenCalled();
    expect(mocks.teamMembershipUpsert).not.toHaveBeenCalled();
  });
});
