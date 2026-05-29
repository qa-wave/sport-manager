/**
 * push-service.test.ts
 *
 * Unit tests for push.service.ts — we mock both `web-push` and the prisma
 * singleton so no real DB or VAPID keys are needed.
 *
 * Tested behaviours:
 *  - sendPushToUser and sendPushToClub are exported functions
 *  - When VAPID is not configured, the service logs and returns gracefully
 *    (no exception thrown)
 *  - The service queries the DB with the correct filter arguments
 *  - Duplicate userIds in club fanout are deduplicated
 *  - DB errors propagate normally
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoist mocks — vi.hoisted() runs before any imports so the factory closures
// can reference the returned objects safely.
// ---------------------------------------------------------------------------
const mocks = vi.hoisted(() => {
  const mockSetVapidDetails = vi.fn();
  const mockSendNotification = vi.fn();
  const mockFindManySubscriptions = vi.fn();
  const mockDeleteSubscription = vi.fn();
  const mockFindManyMembers = vi.fn();
  return {
    mockSetVapidDetails,
    mockSendNotification,
    mockFindManySubscriptions,
    mockDeleteSubscription,
    mockFindManyMembers,
  };
});

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: mocks.mockSetVapidDetails,
    sendNotification: mocks.mockSendNotification,
  },
}));

vi.mock('../lib/api/prisma', () => {
  const client = {
    pushSubscription: {
      findMany: mocks.mockFindManySubscriptions,
      delete: mocks.mockDeleteSubscription,
    },
    member: {
      findMany: mocks.mockFindManyMembers,
    },
  };
  return {
    prisma: {
      ...client,
      withClub: (_clubId: string, fn: (tx: typeof client) => unknown) => fn(client),
      withPlatformAdmin: (fn: (tx: typeof client) => unknown) => fn(client),
    },
  };
});

// ---------------------------------------------------------------------------
// Import service AFTER mocks are registered
// ---------------------------------------------------------------------------
import { sendPushToUser, sendPushToClub, type PushPayload } from '../lib/api/services/push.service';

const SAMPLE_PAYLOAD: PushPayload = {
  title: 'Test notification',
  body: 'This is a test push',
  url: '/admin',
};

const SAMPLE_SUBSCRIPTION = {
  id: 'sub-1',
  userId: 'user-1',
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
  p256dh: 'p256dh-key',
  auth: 'auth-key',
};

// ---------------------------------------------------------------------------
// sendPushToUser
// ---------------------------------------------------------------------------
describe('sendPushToUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is exported as a function', () => {
    expect(typeof sendPushToUser).toBe('function');
  });

  it('does not throw when there are no subscriptions', async () => {
    mocks.mockFindManySubscriptions.mockResolvedValue([]);
    await expect(sendPushToUser('user-xyz', SAMPLE_PAYLOAD)).resolves.not.toThrow();
  });

  it('does not throw when subscriptions exist (VAPID not configured in test env)', async () => {
    mocks.mockFindManySubscriptions.mockResolvedValue([SAMPLE_SUBSCRIPTION]);
    await expect(sendPushToUser('user-1', SAMPLE_PAYLOAD)).resolves.not.toThrow();
  });

  it('queries pushSubscription with the correct userId', async () => {
    mocks.mockFindManySubscriptions.mockResolvedValue([]);
    await sendPushToUser('user-42', SAMPLE_PAYLOAD);
    expect(mocks.mockFindManySubscriptions).toHaveBeenCalledWith({
      where: { userId: 'user-42' },
    });
  });

  it('queries subscriptions once per sendPushToUser call', async () => {
    mocks.mockFindManySubscriptions.mockResolvedValue([]);
    await sendPushToUser('user-1', SAMPLE_PAYLOAD);
    expect(mocks.mockFindManySubscriptions).toHaveBeenCalledTimes(1);
  });

  it('propagates DB errors (rejects the promise)', async () => {
    mocks.mockFindManySubscriptions.mockRejectedValue(new Error('DB connection failed'));
    await expect(sendPushToUser('user-err', SAMPLE_PAYLOAD)).rejects.toThrow('DB connection failed');
  });
});

// ---------------------------------------------------------------------------
// sendPushToClub
// ---------------------------------------------------------------------------
describe('sendPushToClub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is exported as a function', () => {
    expect(typeof sendPushToClub).toBe('function');
  });

  it('does not throw when club has no active members', async () => {
    mocks.mockFindManyMembers.mockResolvedValue([]);
    await expect(sendPushToClub('club-empty', SAMPLE_PAYLOAD)).resolves.not.toThrow();
  });

  it('queries active members with the correct clubId and status filter', async () => {
    mocks.mockFindManyMembers.mockResolvedValue([]);
    await sendPushToClub('club-123', SAMPLE_PAYLOAD);
    expect(mocks.mockFindManyMembers).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ clubId: 'club-123', status: 'ACTIVE' }),
      }),
    );
  });

  it('de-duplicates userIds before fanning out push notifications', async () => {
    // Two members with the same userId (same person in two roles)
    mocks.mockFindManyMembers.mockResolvedValue([
      { userId: 'user-a' },
      { userId: 'user-a' }, // duplicate
      { userId: 'user-b' },
    ]);
    mocks.mockFindManySubscriptions.mockResolvedValue([]);

    await sendPushToClub('club-123', SAMPLE_PAYLOAD);

    // Must query subscriptions exactly 2 times (2 unique users, not 3)
    expect(mocks.mockFindManySubscriptions).toHaveBeenCalledTimes(2);
  });

  it('does not throw when VAPID is not configured and members have subscriptions', async () => {
    mocks.mockFindManyMembers.mockResolvedValue([{ userId: 'user-a' }]);
    mocks.mockFindManySubscriptions.mockResolvedValue([SAMPLE_SUBSCRIPTION]);
    await expect(sendPushToClub('club-x', SAMPLE_PAYLOAD)).resolves.not.toThrow();
  });

  it('does not query subscriptions when there are no members', async () => {
    mocks.mockFindManyMembers.mockResolvedValue([]);
    await sendPushToClub('club-empty', SAMPLE_PAYLOAD);
    expect(mocks.mockFindManySubscriptions).not.toHaveBeenCalled();
  });
});
