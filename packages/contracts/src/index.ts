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

// ---------- Club onboarding ----------
export const CreateClubInput = z.object({
  name: z.string().min(2).max(120),
  sport: z.string().min(1).max(60).default('Fotbal'),
  country: z.string().length(2).default('CZ'),
  timezone: z.string().default('Europe/Prague'),
});
export type CreateClubInput = z.infer<typeof CreateClubInput>;

export const UpdateClubSettingsInput = z.object({
  name: z.string().min(2).max(120).optional(),
  timezone: z.string().min(1).max(80).optional(),
});
export type UpdateClubSettingsInput = z.infer<typeof UpdateClubSettingsInput>;

// ---------- Events / RSVP ----------
export const EventType = z.enum(['PRACTICE', 'MATCH', 'TOURNAMENT', 'MEETING', 'SOCIAL']);
export type EventType = z.infer<typeof EventType>;

export const HomeAway = z.enum(['HOME', 'AWAY', 'NEUTRAL']);
export type HomeAway = z.infer<typeof HomeAway>;

export const RSVPStatus = z.enum(['YES', 'NO', 'MAYBE', 'PENDING']);
export type RSVPStatus = z.infer<typeof RSVPStatus>;

export const AbsenceReason = z.enum(['ILLNESS', 'SCHOOL', 'FAMILY', 'OTHER']);
export type AbsenceReason = z.infer<typeof AbsenceReason>;

export const RsvpInput = z.object({
  eventId: z.string().cuid(),
  memberId: z.string().cuid(),
  status: RSVPStatus,
  note: z.string().max(500).optional(),
  reason: AbsenceReason.optional(),
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

// ---------- Exercises (training drills + physio) ----------
export const ExerciseType = z.enum(['TRAINING', 'PHYSIO']);
export type ExerciseType = z.infer<typeof ExerciseType>;

export const ExerciseSource = z.enum(['BUILTIN', 'CUSTOM']);
export type ExerciseSource = z.infer<typeof ExerciseSource>;

export const ExerciseCategoryDto = z.object({
  id: z.string(),
  type: ExerciseType,
  slug: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  colorKey: z.string().nullable(),
  clubId: z.string().nullable(),
  isBuiltin: z.boolean(),
  sortOrder: z.number().int(),
});
export type ExerciseCategoryDto = z.infer<typeof ExerciseCategoryDto>;

export const CreateExerciseCategoryInput = z.object({
  type: ExerciseType,
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'Slug může obsahovat jen malá písmena, čísla a pomlčky'),
  name: z.string().min(1).max(80),
  icon: z.string().max(8).optional(),
  colorKey: z.string().max(80).optional(),
  sortOrder: z.number().int().optional(),
});
export type CreateExerciseCategoryInput = z.infer<typeof CreateExerciseCategoryInput>;

export const ExerciseDto = z.object({
  id: z.string(),
  source: ExerciseSource,
  type: ExerciseType,
  clubId: z.string().nullable(),
  categoryId: z.string().nullable(),
  categorySlug: z.string().nullable(), // included for built-in/library convenience
  categoryName: z.string().nullable(),

  name: z.string(),
  description: z.string().nullable(),
  instructions: z.array(z.string()),
  coachingPoints: z.array(z.string()),
  equipment: z.array(z.string()),
  difficulty: z.string().nullable(),
  ageGroups: z.array(z.string()),
  sports: z.array(z.string()),
  bodyAreas: z.array(z.string()),
  physioType: z.string().nullable(),
  durationMinutes: z.number().int().nullable(),
  playersMin: z.number().int().nullable(),
  playersMax: z.number().int().nullable(),
  fieldSize: z.string().nullable(),

  imageUrls: z.array(z.string()),
  youtubeId: z.string().nullable(),
  videoUrl: z.string().nullable(),
  diagramKey: z.string().nullable(),

  icon: z.string().nullable(),
  tags: z.array(z.string()),

  createdById: z.string().nullable(),
  createdByName: z.string().nullable(),
  createdAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime().nullable(),
  usageCount: z.number().int(),
});
export type ExerciseDto = z.infer<typeof ExerciseDto>;

const exerciseBaseFields = {
  type: ExerciseType,
  name: z.string().min(1, 'Název je povinný').max(120),
  description: z.string().max(2000).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  instructions: z.array(z.string().min(1).max(500)).max(30).default([]),
  coachingPoints: z.array(z.string().min(1).max(300)).max(20).default([]),
  equipment: z.array(z.string().min(1).max(60)).max(20).default([]),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().nullable(),
  ageGroups: z.array(z.string().min(1).max(20)).max(10).default([]),
  sports: z.array(z.string().min(1).max(20)).max(5).default([]),
  bodyAreas: z.array(z.string().min(1).max(40)).max(10).default([]),
  physioType: z.string().max(40).optional().nullable(),
  durationMinutes: z.number().int().min(1).max(240).optional().nullable(),
  playersMin: z.number().int().min(1).max(60).optional().nullable(),
  playersMax: z.number().int().min(1).max(60).optional().nullable(),
  fieldSize: z.string().max(60).optional().nullable(),
  imageUrls: z.array(z.string().min(1)).max(6).default([]),
  youtubeId: z.string().max(40).optional().nullable(),
  videoUrl: z.string().max(2000).optional().nullable(),
  icon: z.string().max(8).optional().nullable(),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
};

export const CreateExerciseInput = z.object(exerciseBaseFields);
export type CreateExerciseInput = z.infer<typeof CreateExerciseInput>;

export const UpdateExerciseInput = z
  .object({
    ...exerciseBaseFields,
    type: ExerciseType.optional(),
    name: z.string().min(1).max(120).optional(),
  })
  .partial();
export type UpdateExerciseInput = z.infer<typeof UpdateExerciseInput>;

export const ExerciseListQuery = z.object({
  type: ExerciseType.optional(),
  source: ExerciseSource.optional(),
  categoryId: z.string().optional(),
  search: z.string().max(120).optional(),
});
export type ExerciseListQuery = z.infer<typeof ExerciseListQuery>;

// ---------- Strategies (taktické strategie / herní systémy) ----------
export const StrategyCategory = z.enum([
  'OFFENSE',
  'DEFENSE',
  'TRANSITION',
  'SET_PIECE',
  'SPECIAL',
]);
export type StrategyCategory = z.infer<typeof StrategyCategory>;

export const StrategyRole = z.object({
  name: z.string().min(1).max(60),
  description: z.string().min(1).max(1000),
});
export type StrategyRole = z.infer<typeof StrategyRole>;

export const StrategyDto = z.object({
  id: z.string(),
  source: ExerciseSource,
  clubId: z.string().nullable(),
  category: StrategyCategory,

  name: z.string(),
  description: z.string().nullable(),
  whenToUse: z.string().nullable(),
  counterTo: z.string().nullable(),
  reasoning: z.string().nullable(),
  roles: z.array(StrategyRole),
  keyPoints: z.array(z.string()),
  formation: z.string().nullable(),
  sports: z.array(z.string()),
  difficulty: z.string().nullable(),
  ageGroups: z.array(z.string()),

  videoUrl: z.string().nullable(),
  posterUrl: z.string().nullable(),
  imageUrls: z.array(z.string()),

  icon: z.string().nullable(),
  tags: z.array(z.string()),

  createdById: z.string().nullable(),
  createdByName: z.string().nullable(),
  createdAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime().nullable(),
  usageCount: z.number().int(),
});
export type StrategyDto = z.infer<typeof StrategyDto>;

const strategyBaseFields = {
  category: StrategyCategory,
  name: z.string().min(1, 'Název je povinný').max(160),
  description: z.string().max(4000).optional().nullable(),
  whenToUse: z.string().max(4000).optional().nullable(),
  counterTo: z.string().max(4000).optional().nullable(),
  reasoning: z.string().max(4000).optional().nullable(),
  roles: z.array(StrategyRole).max(20).default([]),
  keyPoints: z.array(z.string().min(1).max(300)).max(15).default([]),
  formation: z.string().max(60).optional().nullable(),
  sports: z.array(z.string().min(1).max(20)).max(5).default([]),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().nullable(),
  ageGroups: z.array(z.string().min(1).max(20)).max(10).default([]),
  videoUrl: z.string().max(2000).optional().nullable(),
  posterUrl: z.string().max(2000).optional().nullable(),
  imageUrls: z.array(z.string().min(1)).max(6).default([]),
  icon: z.string().max(8).optional().nullable(),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
};

export const CreateStrategyInput = z.object(strategyBaseFields);
export type CreateStrategyInput = z.infer<typeof CreateStrategyInput>;

export const UpdateStrategyInput = z
  .object({
    ...strategyBaseFields,
    category: StrategyCategory.optional(),
    name: z.string().min(1).max(160).optional(),
  })
  .partial();
export type UpdateStrategyInput = z.infer<typeof UpdateStrategyInput>;

export const StrategyListQuery = z.object({
  category: StrategyCategory.optional(),
  source: ExerciseSource.optional(),
  sport: z.string().max(40).optional(),
  search: z.string().max(120).optional(),
});
export type StrategyListQuery = z.infer<typeof StrategyListQuery>;

// ---------- Newsletter ----------
export const NewsletterStatus = z.enum(['DRAFT', 'SCHEDULED', 'SENT']);
export type NewsletterStatus = z.infer<typeof NewsletterStatus>;

export const NewsletterSchema = z.object({
  id: z.string(),
  clubId: z.string(),
  title: z.string(),
  body: z.string(),
  status: NewsletterStatus,
  scheduledFor: z.string().datetime().nullable(),
  sentAt: z.string().datetime().nullable(),
  recipientCount: z.number().int(),
  createdById: z.string().nullable(),
  createdByName: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type NewsletterSchema = z.infer<typeof NewsletterSchema>;

export const NewsletterCreateSchema = z.object({
  title: z.string().min(1, 'Název je povinný').max(200),
  body: z.string().min(1, 'Obsah je povinný').max(50000),
  scheduledFor: z.string().datetime().optional().nullable(),
});
export type NewsletterCreateSchema = z.infer<typeof NewsletterCreateSchema>;

export const NewsletterUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(50000).optional(),
  scheduledFor: z.string().datetime().optional().nullable(),
  status: z.enum(['DRAFT', 'SCHEDULED']).optional(),
});
export type NewsletterUpdateSchema = z.infer<typeof NewsletterUpdateSchema>;

export const NewsletterSendSchema = z.object({
  previewEmail: z.string().email().optional(),
});
export type NewsletterSendSchema = z.infer<typeof NewsletterSendSchema>;

