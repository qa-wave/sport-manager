/**
 * Shared contracts: Zod schemas + inferred TS types used by both API and clients.
 * Keep this layer thin — match the Prisma models, don't reinvent them.
 */
import { z } from 'zod';

// ---------- Per-tenant customization ----------
export * from './features';

// ---------- Auth ----------
export const LoginInput = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof LoginInput>;

export const RegisterInput = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});
export type RegisterInput = z.infer<typeof RegisterInput>;

export const AuthTokens = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthTokens = z.infer<typeof AuthTokens>;

// ---------- RBAC ----------
export const TeamRole = z.enum([
  'PLAYER',
  'HEAD_COACH',
  'ASSISTANT_COACH',
  'TEAM_MANAGER',
  'MEDIC',
]);
export type TeamRole = z.infer<typeof TeamRole>;

export const ClubRoleType = z.enum(['OWNER', 'ADMIN', 'FINANCE', 'COMMUNICATIONS', 'FACILITY']);
export type ClubRoleType = z.infer<typeof ClubRoleType>;

// ---------- Events / RSVP ----------
export const EventType = z.enum(['PRACTICE', 'MATCH', 'TOURNAMENT', 'MEETING', 'SOCIAL']);
export type EventType = z.infer<typeof EventType>;

export const HomeAway = z.enum(['HOME', 'AWAY', 'NEUTRAL']);
export type HomeAway = z.infer<typeof HomeAway>;

export const RSVPStatus = z.enum(['YES', 'NO', 'MAYBE', 'PENDING']);
export type RSVPStatus = z.infer<typeof RSVPStatus>;

export const RsvpInput = z.object({
  eventId: z.string().cuid(),
  memberId: z.string().cuid(),
  status: RSVPStatus,
  note: z.string().max(500).optional(),
});
export type RsvpInput = z.infer<typeof RsvpInput>;

export const CreateEventInput = z.object({
  teamId: z.string().cuid().nullable().optional(),
  type: EventType,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  location: z.string().max(300).optional(),
  locationUrl: z.string().url().optional(),
  opponent: z.string().max(100).optional(),
  homeAway: HomeAway.optional(),
  rsvpDeadline: z.string().datetime().optional(),
});
export type CreateEventInput = z.infer<typeof CreateEventInput>;

export const UpdateEventInput = CreateEventInput.partial();
export type UpdateEventInput = z.infer<typeof UpdateEventInput>;

export const MarkAttendanceInput = z.object({
  attendances: z.array(z.object({
    memberId: z.string().cuid(),
    attended: z.boolean(),
  })),
});
export type MarkAttendanceInput = z.infer<typeof MarkAttendanceInput>;

// ---------- Conversations / Messages ----------
export const ConversationType = z.enum([
  'TEAM',
  'COACHES',
  'PARENTS',
  'DM',
  'GROUP',
  'ANNOUNCEMENT',
]);
export type ConversationType = z.infer<typeof ConversationType>;

export const CreateConversationInput = z.object({
  type: ConversationType,
  title: z.string().min(1).max(200).optional(),
  teamId: z.string().cuid().nullable().optional(),
  participantIds: z.array(z.string().cuid()).min(1),
});
export type CreateConversationInput = z.infer<typeof CreateConversationInput>;

export const SendMessageInput = z.object({
  body: z.string().min(1).max(5000),
});
export type SendMessageInput = z.infer<typeof SendMessageInput>;

// ---------- Notifications ----------
export const NotificationType = z.enum([
  'EVENT_CREATED',
  'EVENT_UPDATED',
  'EVENT_CANCELLED',
  'RSVP_REMINDER',
  'MESSAGE',
  'PAYMENT_DUE',
  'PAYMENT_RECEIVED',
  'ANNOUNCEMENT',
  'WAIVER_PENDING',
  'GENERAL',
]);
export type NotificationType = z.infer<typeof NotificationType>;

// ---------- Guardian permissions ----------
export const GuardianPermissions = z.object({
  canViewSchedule: z.boolean(),
  canRsvp: z.boolean(),
  canViewPayments: z.boolean(),
  canMakePayments: z.boolean(),
  canViewMedical: z.boolean(),
  canSignWaivers: z.boolean(),
});
export type GuardianPermissions = z.infer<typeof GuardianPermissions>;

// ---------- Training Templates ----------
// 0=Sunday .. 6=Saturday (aligned with JS Date.getDay())
export const DayOfWeek = z.number().int().min(0).max(6);

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:mm (24h)');

// Base object (without refinements) so UpdateInput can use .partial().
export const CreateTrainingTemplateObject = z.object({
  teamId: z.string().cuid(),
  name: z.string().min(1).max(120),
  eventType: EventType.default('PRACTICE'),
  daysOfWeek: z.array(DayOfWeek).min(1).max(7),
  startTime: timeString,
  endTime: timeString,
  location: z.string().max(300).optional(),
  locationUrl: z.string().url().optional(),
  description: z.string().max(2000).optional(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  active: z.boolean().default(true),
});

export const CreateTrainingTemplateInput = CreateTrainingTemplateObject
  .refine((d) => d.startTime < d.endTime, {
    message: 'startTime must be before endTime',
    path: ['endTime'],
  })
  .refine((d) => new Date(d.validFrom) <= new Date(d.validUntil), {
    message: 'validFrom must be on or before validUntil',
    path: ['validUntil'],
  })
  .refine((d) => new Set(d.daysOfWeek).size === d.daysOfWeek.length, {
    message: 'daysOfWeek must not contain duplicates',
    path: ['daysOfWeek'],
  });
export type CreateTrainingTemplateInput = z.infer<typeof CreateTrainingTemplateInput>;

// Partial for PATCH — re-validate cross-field only if both fields present.
export const UpdateTrainingTemplateInput = CreateTrainingTemplateObject
  .partial()
  .refine(
    (d) => !d.startTime || !d.endTime || d.startTime < d.endTime,
    { message: 'startTime must be before endTime', path: ['endTime'] },
  )
  .refine(
    (d) =>
      !d.validFrom ||
      !d.validUntil ||
      new Date(d.validFrom) <= new Date(d.validUntil),
    { message: 'validFrom must be on or before validUntil', path: ['validUntil'] },
  )
  .refine(
    (d) => !d.daysOfWeek || new Set(d.daysOfWeek).size === d.daysOfWeek.length,
    { message: 'daysOfWeek must not contain duplicates', path: ['daysOfWeek'] },
  );
export type UpdateTrainingTemplateInput = z.infer<typeof UpdateTrainingTemplateInput>;

export const TrainingTemplateListItem = z.object({
  id: z.string().cuid(),
  name: z.string(),
  teamId: z.string().cuid(),
  teamName: z.string(),
  eventType: EventType,
  daysOfWeek: z.array(DayOfWeek),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().nullable(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  active: z.boolean(),
  generatedEventsCount: z.number().int(),
  upcomingEventsCount: z.number().int(),
});
export type TrainingTemplateListItem = z.infer<typeof TrainingTemplateListItem>;

export const TrainingTemplateDetail = TrainingTemplateListItem.extend({
  description: z.string().nullable(),
  locationUrl: z.string().nullable(),
  createdBy: z.string(), // "First Last"
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  stats: z.object({
    totalEvents: z.number().int(),
    detachedEvents: z.number().int(),
    pastEvents: z.number().int(),
    upcomingEvents: z.number().int(),
  }),
});
export type TrainingTemplateDetail = z.infer<typeof TrainingTemplateDetail>;
