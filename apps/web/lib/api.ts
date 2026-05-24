/**
 * Thin typed fetch wrapper with automatic 401 refresh.
 *
 * - Always sends `credentials: 'include'` so the httpOnly refresh cookie
 *   (`club_rt`) rides along.
 * - Automatically attaches `Authorization: Bearer <access>` + `x-club-id`
 *   from the auth store when they're present.
 * - On 401, attempts POST /auth/refresh once. If successful, retries the
 *   original request with the new token. If refresh fails, clears session.
 */
import { authStore } from './auth-store';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

type FetchOpts = RequestInit & { clubId?: string | null; _retried?: boolean };

async function rawFetch(path: string, token: string | null, clubId: string | null, opts: RequestInit): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...opts,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(clubId ? { 'x-club-id': clubId } : {}),
      ...opts.headers,
    },
  });
}

export async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { clubId: clubIdOverride, _retried, headers, ...rest } = opts;

  const token = authStore.getAccessToken();
  const clubId =
    clubIdOverride === undefined ? authStore.getClubId() : clubIdOverride;

  const res = await rawFetch(path, token, clubId, { headers, ...rest });

  // Auto-refresh on 401 (once)
  if (res.status === 401 && !_retried && token) {
    try {
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        const { accessToken } = (await refreshRes.json()) as { accessToken: string };
        authStore.setSession(accessToken, clubId);
        return apiFetch<T>(path, { ...opts, _retried: true });
      }
    } catch {
      // refresh failed — fall through to error
    }
    authStore.clear();
  }

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

export type MeClubTheme = {
  primary: string;
  secondary: string;
  tertiary: string;
  styleId: number;
};

export type MeClubConfig = {
  tier: 'free' | 'basic' | 'pro' | 'club' | 'enterprise';
  limits: { maxMembers: number; maxTeams: number };
  theme: MeClubTheme;
  [key: string]: unknown;
};

export type ClubUsageResponse = {
  tier: 'free' | 'basic' | 'pro' | 'club' | 'enterprise';
  members: { current: number; max: number };
  teams: { current: number; max: number };
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

export type TeamRosterEntry = {
  membershipId: string;
  memberId: string;
  role: 'PLAYER' | 'HEAD_COACH' | 'ASSISTANT_COACH' | 'TEAM_MANAGER' | 'MEDIC';
  joinedAt: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  jerseyNumber: number | null;
  position: string | null;
  status: string;
};

export type TeamDetail = {
  id: string;
  name: string;
  sport: string;
  ageGroup: string | null;
  season: string;
  memberCount: number;
  roster: TeamRosterEntry[];
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

// ---------- AI Event Summary ----------
export type AiEventSummaryStats = {
  totalMembers: number;
  attended: number;
  absent: number;
  absentWithoutExcuse: number;
  attendanceRate: number;
  rsvpYes: number;
  rsvpNo: number;
  rsvpMaybe: number;
  rsvpPending: number;
  topStreak?: { name: string; count: number };
  scorers?: Array<{ name: string; goals: number; assists: number }>;
  score?: { home: number; away: number; status: string };
};

export type AiEventSummary = {
  summary: string;
  highlights: string[];
  stats: AiEventSummaryStats;
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

export type ChildDashboardEntry = {
  childMemberId: string;
  name: string;
  teamName: string | null;
  nextEvent: { id: string; title: string; startsAt: string; type: string } | null;
  rsvpStatus: string | null;
  pendingPaymentsCount: number;
  attendanceRate: number;
  streak: number;
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
  children: ChildDashboardEntry[];
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
  unreadCount: number;
  muted: boolean;
};

export type MessageReaction = {
  emoji: string;
  memberId: string;
};

export type MessageResponse = {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  body: string;
  reactions: MessageReaction[];
  createdAt: string;
  editedAt: string | null;
  readBy: string[]; // memberIds who have read this message
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

// ---------- Training Templates ----------
export type TrainingTemplateListItem = {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  eventType: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  location: string | null;
  validFrom: string;
  validUntil: string;
  active: boolean;
  generatedEventsCount: number;
  upcomingEventsCount: number;
};

export type TrainingTemplateDetail = TrainingTemplateListItem & {
  description: string | null;
  locationUrl: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalEvents: number;
    detachedEvents: number;
    pastEvents: number;
    upcomingEvents: number;
  };
};

// ---------- Team Stats ----------
export type TeamStats = {
  totalEvents: number;
  totalPractices: number;
  totalMatches: number;
  avgAttendance: number;
  rsvpReliability: number;
  topAttenders: Array<{ name: string; rate: number }>;
  worstAttenders: Array<{ name: string; rate: number }>;
  monthlyTrend: Array<{ month: string; attendance: number }>;
};

// ---------- Attendance Stats ----------
export type AttendanceStatsMember = {
  memberId: string;
  name: string;
  events: Array<{
    eventId: string;
    date: string;
    attended: boolean | null;
  }>;
  attendanceRate: number;
};

export type AttendanceStatsResponse = {
  members: AttendanceStatsMember[];
  events: Array<{
    id: string;
    title: string;
    date: string;
  }>;
};

// ---------- Member Stats ----------
export type MemberStats = {
  attendance: {
    total: number;
    attended: number;
    rate: number;
    trend: 'up' | 'down' | 'stable';
    teamAverage: number;
  };
  rsvp: {
    total: number;
    onTime: number;
    reliability: number;
  };
  recentForm: Array<{
    eventTitle: string;
    date: string;
    rsvpStatus: string;
    attended: boolean | null;
  }>;
  streak: number;
};

// ---------- Member Badges ----------
export type MemberBadge = {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
  earnedAt: string | null;
};

export type MemberBadgesResponse = {
  currentStreak: number;
  longestStreak: number;
  totalAttended: number;
  attendanceRate: number;
  badges: MemberBadge[];
};

// ---------- Activity Feed ----------
export type ActivityItem = {
  id: string;
  type: 'event_created' | 'rsvp' | 'member_joined' | 'message';
  message: string;
  timestamp: string;
  link: string | null;
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

// ---------- Exercises (training drills + physio) ----------
export type ExerciseType = 'TRAINING' | 'PHYSIO';
export type ExerciseSource = 'BUILTIN' | 'CUSTOM';

export type ExerciseDto = {
  id: string;
  source: ExerciseSource;
  type: ExerciseType;
  clubId: string | null;
  categoryId: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  name: string;
  description: string | null;
  instructions: string[];
  coachingPoints: string[];
  equipment: string[];
  difficulty: string | null;
  ageGroups: string[];
  sports: string[];
  bodyAreas: string[];
  physioType: string | null;
  durationMinutes: number | null;
  playersMin: number | null;
  playersMax: number | null;
  fieldSize: string | null;
  imageUrls: string[];
  youtubeId: string | null;
  videoUrl: string | null;
  diagramKey: string | null;
  icon: string | null;
  tags: string[];
  createdById: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
};

export type ExerciseListResponse = {
  exercises: ExerciseDto[];
};

export type ExerciseCategoryDto = {
  id: string;
  type: ExerciseType;
  slug: string;
  name: string;
  icon: string | null;
  colorKey: string | null;
  clubId: string | null;
  isBuiltin: boolean;
  sortOrder: number;
};

export type ExerciseCategoryListResponse = {
  categories: ExerciseCategoryDto[];
};

export type CreateExerciseBody = {
  type: ExerciseType;
  name: string;
  description?: string | null;
  categoryId?: string | null;
  instructions?: string[];
  coachingPoints?: string[];
  equipment?: string[];
  difficulty?: 'easy' | 'medium' | 'hard' | null;
  ageGroups?: string[];
  sports?: string[];
  bodyAreas?: string[];
  physioType?: string | null;
  durationMinutes?: number | null;
  playersMin?: number | null;
  playersMax?: number | null;
  fieldSize?: string | null;
  imageUrls?: string[];
  youtubeId?: string | null;
  videoUrl?: string | null;
  icon?: string | null;
  tags?: string[];
};

export type UpdateExerciseBody = Partial<CreateExerciseBody>;

// ---------- Strategies (taktické strategie) ----------
export type StrategyCategory =
  | 'OFFENSE'
  | 'DEFENSE'
  | 'TRANSITION'
  | 'SET_PIECE'
  | 'SPECIAL';

export type StrategyRole = {
  name: string;
  description: string;
};

export type StrategyDto = {
  id: string;
  source: ExerciseSource;
  clubId: string | null;
  category: StrategyCategory;
  name: string;
  description: string | null;
  whenToUse: string | null;
  counterTo: string | null;
  reasoning: string | null;
  roles: StrategyRole[];
  keyPoints: string[];
  formation: string | null;
  sports: string[];
  difficulty: string | null;
  ageGroups: string[];
  videoUrl: string | null;
  posterUrl: string | null;
  imageUrls: string[];
  icon: string | null;
  tags: string[];
  createdById: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
};

export type StrategyListResponse = { strategies: StrategyDto[] };

export type CreateStrategyBody = {
  category: StrategyCategory;
  name: string;
  description?: string | null;
  whenToUse?: string | null;
  counterTo?: string | null;
  reasoning?: string | null;
  roles?: StrategyRole[];
  keyPoints?: string[];
  formation?: string | null;
  sports?: string[];
  difficulty?: 'easy' | 'medium' | 'hard' | null;
  ageGroups?: string[];
  videoUrl?: string | null;
  posterUrl?: string | null;
  imageUrls?: string[];
  icon?: string | null;
  tags?: string[];
};

export type UpdateStrategyBody = Partial<CreateStrategyBody>;

export type UploadResponse = { url: string };

// ---------- Newsletter ----------
export type NewsletterStatus = 'DRAFT' | 'SCHEDULED' | 'SENT';

export type NewsletterItem = {
  id: string;
  title: string;
  status: NewsletterStatus;
  scheduledFor: string | null;
  sentAt: string | null;
  recipientCount: number;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewsletterDetail = NewsletterItem & {
  clubId: string;
  body: string;
  createdById: string | null;
};

export type NewsletterListResponse = {
  items: NewsletterItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export type NewsletterCreateBody = {
  title: string;
  body: string;
  scheduledFor?: string | null;
};

export type NewsletterUpdateBody = {
  title?: string;
  body?: string;
  scheduledFor?: string | null;
  status?: 'DRAFT' | 'SCHEDULED';
};

export type NewsletterSendResult = {
  id: string;
  status: 'SENT';
  sentAt: string;
  recipientCount: number;
};

// ---------- Teammates ----------
export type TeammateItem = {
  memberId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  teams: Array<{ id: string; name: string; role: string }>;
};

export const teammatesApi = {
  list: () => apiFetch<{ items: TeammateItem[] }>('/me/teammates'),
};

// ---------- Player feedback ----------
export type FeedbackItem = {
  id: string;
  rating: number | null;
  text: string;
  category: string | null;
  createdAt: string;
  playerId: string;
  authorId: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
  playerName: string | null;
  playerAvatarUrl: string | null;
};

export type CoachablePlayer = {
  memberId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  teams: Array<{ id: string; name: string }>;
};

export type CreateFeedbackBody = {
  playerId: string;
  text: string;
  rating?: number;
  category?: string;
};

export const feedbackApi = {
  mine: () => apiFetch<{ items: FeedbackItem[] }>('/feedback/me'),
  forPlayer: (playerId: string) =>
    apiFetch<{ items: FeedbackItem[] }>(`/feedback/player/${playerId}`),
  coachablePlayers: () =>
    apiFetch<{ items: CoachablePlayer[] }>('/feedback/coachable-players'),
  create: (body: CreateFeedbackBody) =>
    apiFetch<{ ok: true; feedback: FeedbackItem }>('/feedback', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  delete: (id: string) =>
    apiFetch<{ ok: true }>(`/feedback/${id}`, { method: 'DELETE' }),
};

// Newsletter API helpers
export const newsletterApi = {
  list: (params?: { status?: NewsletterStatus; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return apiFetch<NewsletterListResponse>(`/newsletter${query ? `?${query}` : ''}`);
  },
  get: (id: string) => apiFetch<NewsletterDetail>(`/newsletter/${id}`),
  create: (body: NewsletterCreateBody) =>
    apiFetch<NewsletterItem>('/newsletter', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  update: (id: string, body: NewsletterUpdateBody) =>
    apiFetch<NewsletterItem>(`/newsletter/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/newsletter/${id}`, { method: 'DELETE' }),
  send: (id: string) =>
    apiFetch<NewsletterSendResult>(`/newsletter/${id}/send`, { method: 'POST' }),
  preview: (id: string, previewEmail?: string) =>
    apiFetch<{ ok: boolean; sentTo: string }>(`/newsletter/${id}/preview`, {
      method: 'POST',
      body: JSON.stringify({ previewEmail }),
    }),
};

