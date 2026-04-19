/**
 * Thin typed fetch wrapper.
 *
 * - Always sends `credentials: 'include'` so the httpOnly refresh cookie
 *   (`club_rt`) rides along.
 * - Automatically attaches `Authorization: Bearer <access>` + `x-club-id`
 *   from the auth store when they're present.
 * - `clubId` can be overridden per-call (e.g. admin tooling that operates
 *   across clubs).
 *
 * TODO: 401 refresh flow — on 401, POST /auth/refresh, retry once. Left as
 * a follow-up so the login smoke test can land first.
 */
import { authStore } from './auth-store';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

type FetchOpts = RequestInit & { clubId?: string | null };

export async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { clubId: clubIdOverride, headers, ...rest } = opts;

  const token = authStore.getAccessToken();
  const clubId =
    clubIdOverride === undefined ? authStore.getClubId() : clubIdOverride;

  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(clubId ? { 'x-club-id': clubId } : {}),
      ...headers,
    },
    ...rest,
  });

  if (!res.ok) {
    throw new ApiError(res.status, `${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type HealthResponse = {
  status: string;
  db: string;
  ts: string;
};

export type MeClubFeatures = {
  messages: boolean;
  trainingTemplates: boolean;
  payments: boolean;
  notifications: boolean;
  waivers: boolean;
  calendar: boolean;
  gallery: boolean;
  springCup: boolean;
  // Passthrough lets the API add new flags without blocking the FE build.
  [key: string]: boolean | unknown;
};

export type MeClubConfig = {
  tier: 'basic' | 'pro' | 'enterprise';
  limits: { maxMembers: number; maxTeams: number };
  [key: string]: unknown;
};

export type MeResponse = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  locale: string;
  isPlatformAdmin: boolean;
  members: Array<{
    id: string;
    clubId: string;
    club: {
      id: string;
      slug: string;
      name: string;
      timezone: string;
      features: MeClubFeatures;
      config: MeClubConfig;
    };
  }>;
};

export type TeamSummary = {
  id: string;
  name: string;
  sport: string;
  ageGroup: string | null;
  season: string;
  memberCount: number;
  coaches: Array<{
    memberId: string;
    role: 'HEAD_COACH' | 'ASSISTANT_COACH';
    name: string;
  }>;
};

export type MemberSummary = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  isMinor: boolean;
  status: string;
  jerseyNumber: number | null;
  position: string | null;
  joinedAt: string;
  teamRoles: Array<{
    teamId: string;
    teamName: string;
    ageGroup: string | null;
    role: string;
  }>;
  clubRoles: string[];
  guardianOf: Array<{ memberId: string; name: string }>;
  guardians: Array<{
    memberId: string;
    name: string;
    canViewPayments: boolean;
    canViewMedical: boolean;
    canSignWaivers: boolean;
  }>;
};

// ---------- Notifications ----------
export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export type NotificationsResponse = {
  items: NotificationItem[];
  hasMore: boolean;
  nextCursor: string | null;
};

export type UnreadCountResponse = {
  count: number;
};

// ---------- Events ----------
export type RsvpSummary = {
  yes: number;
  no: number;
  maybe: number;
  pending: number;
  total: number;
};

export type EventSummary = {
  id: string;
  type: 'PRACTICE' | 'MATCH' | 'TOURNAMENT' | 'MEETING' | 'SOCIAL';
  title: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  teamId: string | null;
  teamName: string | null;
  opponent: string | null;
  homeAway: 'HOME' | 'AWAY' | 'NEUTRAL' | null;
  rsvpSummary: RsvpSummary;
};

export type EventDetail = EventSummary & {
  description: string | null;
  locationUrl: string | null;
  rsvpDeadline: string | null;
  createdBy: string;
  attendees: Array<{
    memberId: string;
    name: string;
    status: 'YES' | 'NO' | 'MAYBE' | 'PENDING';
    note: string | null;
    respondedAt: string | null;
    attended: boolean | null;
  }>;
};

export type DashboardFeed = {
  thisWeek: EventSummary[];
  needsAttention: Array<{
    type: string;
    title: string;
    description: string;
    link: string;
    severity: 'warning' | 'critical';
  }>;
  recentActivity: Array<{
    type: string;
    message: string;
    timestamp: string;
    link?: string;
  }>;
  stats: { members: number; teams: number; upcomingEvents: number };
};

// ---------- Conversations / Messages ----------
export type ConversationParticipant = {
  memberId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

export type ConversationSummary = {
  id: string;
  type: 'TEAM' | 'COACHES' | 'PARENTS' | 'DM' | 'GROUP' | 'ANNOUNCEMENT';
  title: string | null;
  teamId: string | null;
  teamName: string | null;
  participantCount: number;
  participants: ConversationParticipant[];
  lastMessage: {
    id: string;
    body: string;
    senderName: string;
    createdAt: string;
  } | null;
  hasUnread: boolean;
  muted: boolean;
};

export type MessageResponse = {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  body: string;
  createdAt: string;
  editedAt: string | null;
};

export type ConversationDetail = {
  id: string;
  type: string;
  title: string | null;
  teamId: string | null;
  teamName: string | null;
  participants: Array<ConversationParticipant & { muted: boolean }>;
  messages: MessageResponse[];
  hasMore: boolean;
  nextCursor: string | null;
};

// ---------- Members ----------
export type MemberDetail = MemberSummary & {
  phone: string | null;
  locale: string;
  medicalNotes: string | null;
  teamRoles: Array<{
    teamId: string;
    teamName: string;
    ageGroup: string | null;
    sport: string;
    season: string;
    role: string;
    joinedAt: string;
  }>;
  guardianOf: Array<{
    memberId: string;
    name: string;
    jerseyNumber: number | null;
    teams: string[];
    canViewPayments: boolean;
    canViewMedical: boolean;
    canSignWaivers: boolean;
  }>;
  guardians: Array<{
    memberId: string;
    name: string;
    email: string;
    phone: string | null;
    relationship: string;
    isPrimary: boolean;
    canViewPayments: boolean;
    canMakePayments: boolean;
    canViewMedical: boolean;
    canSignWaivers: boolean;
  }>;
  recentAttendance: Array<{
    eventTitle: string;
    eventType: string;
    eventDate: string;
    status: string;
    attended: boolean | null;
  }>;
  paymentsMade: Array<{
    feeName: string;
    amountCents: number;
    currency: string;
    status: string;
    paidAt: string | null;
  }>;
  paymentsFor: Array<{
    feeName: string;
    amountCents: number;
    currency: string;
    status: string;
    paidAt: string | null;
    paidBy: string;
  }>;
  waivers: Array<{
    title: string;
    type: string;
    signedAt: string;
    signedBy: string;
  }>;
};
