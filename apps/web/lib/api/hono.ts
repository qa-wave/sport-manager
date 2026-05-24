import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { ZodError } from 'zod';
import type { HonoEnv } from '../types/hono';
import { authMiddleware } from './middleware/auth.middleware';
import { clubContextMiddleware } from './middleware/club-context.middleware';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware';
import { healthRoutes } from './routes/health.routes';
import { authRoutes } from './routes/auth.routes';
import { meRoutes } from './routes/me.routes';
import { membersRoutes } from './routes/members.routes';
import { teamsRoutes } from './routes/teams.routes';
import { eventsRoutes } from './routes/events.routes';
import { conversationsRoutes } from './routes/conversations.routes';
import { notificationsRoutes } from './routes/notifications.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { trainingTemplatesRoutes } from './routes/training-templates.routes';
import { exercisesRoutes } from './routes/exercises.routes';
import { exerciseCategoriesRoutes } from './routes/exercise-categories.routes';
import { strategiesRoutes } from './routes/strategies.routes';
import { platformAdminRoutes } from './routes/platform-admin.routes';
import { clubsRoutes } from './routes/clubs.routes';
import { paymentsRoutes } from './routes/payments.routes';
import { rsvpRoutes } from './routes/rsvp.routes';
import { stripeRoutes } from './routes/stripe.routes';
import { attendRoutes } from './routes/attend.routes';
import { uploadRoutes } from './routes/upload.routes';
import { galleryRoutes } from './routes/gallery.routes';
import { pollsRoutes } from './routes/polls.routes';
import { documentsRoutes } from './routes/documents.routes';
import { waiversRoutes } from './routes/waivers.routes';
import { proxyRoutes } from './routes/proxy.routes';
import { federationRoutes } from './routes/federation.routes';
import { pushRoutes } from './routes/push.routes';
import { reportsRoutes } from './routes/reports.routes';
import { notificationPrefsRoutes } from './routes/notification-prefs.routes';
import { newsletterRoutes } from './routes/newsletter.routes';
import { feedbackRoutes } from './routes/feedback.routes';

/**
 * Map known error codes → HTTP status codes.
 */
const STATUS_MAP: Record<string, number> = {
  EMAIL_CONFLICT: 409,
  INVALID_CREDENTIALS: 401,
  INVALID_REFRESH_TOKEN: 401,
  SESSION_NOT_FOUND: 401,
  SESSION_EXPIRED: 401,
  REFRESH_REUSE: 401,
  USER_NOT_FOUND: 401,
  NOT_PARTICIPANT: 403,
  ANNOUNCEMENT_RESTRICTED: 403,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CLUB_NOT_FOUND: 404,
  TEAM_NOT_FOUND: 404,
  RSVP_DEADLINE_PASSED: 400,
  INVALID_TIME: 400,
  MEMBER_LIMIT_EXCEEDED: 402,
  TEAM_LIMIT_EXCEEDED: 402,
};

/**
 * Main Hono application.
 *
 * Base path: /api
 * All route groups mount under /api/v1/...
 */
const app = new Hono<HonoEnv>().basePath('/api');

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use(
  '*',
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3100',
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-club-id'],
    exposeHeaders: ['Set-Cookie'],
  }),
);

app.use('*', secureHeaders());
app.use('*', logger());
app.use('*', rateLimitMiddleware);
app.use('*', authMiddleware);
app.use('*', clubContextMiddleware);

// ---------------------------------------------------------------------------
// Route groups — all under /v1/
// ---------------------------------------------------------------------------
app.route('/v1/health', healthRoutes);
app.route('/v1/auth', authRoutes);
app.route('/v1/me', meRoutes);
app.route('/v1/members', membersRoutes);
app.route('/v1/teams', teamsRoutes);
app.route('/v1/events', eventsRoutes);
app.route('/v1/conversations', conversationsRoutes);
app.route('/v1/notifications', notificationsRoutes);
app.route('/v1/dashboard', dashboardRoutes);
app.route('/v1/training-templates', trainingTemplatesRoutes);
app.route('/v1/exercises', exercisesRoutes);
app.route('/v1/exercise-categories', exerciseCategoriesRoutes);
app.route('/v1/strategies', strategiesRoutes);
app.route('/v1/platform-admin/clubs', platformAdminRoutes);
app.route('/v1/clubs', clubsRoutes);
app.route('/v1/payments', paymentsRoutes);
app.route('/v1/rsvp', rsvpRoutes);
app.route('/v1/stripe', stripeRoutes);
app.route('/v1/attend', attendRoutes);
app.route('/v1/upload', uploadRoutes);
app.route('/v1/gallery', galleryRoutes);
app.route('/v1/polls', pollsRoutes);
app.route('/v1/clubs/documents', documentsRoutes);
app.route('/v1/waivers', waiversRoutes);
app.route('/v1/proxy', proxyRoutes);
app.route('/v1/federation', federationRoutes);
app.route('/v1/push', pushRoutes);
app.route('/v1/reports', reportsRoutes);
app.route('/v1/notification-preferences', notificationPrefsRoutes);
app.route('/v1/newsletter', newsletterRoutes);
app.route('/v1/feedback', feedbackRoutes);

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
app.onError((err, c) => {
  // Zod validation errors → 400
  if (err instanceof ZodError) {
    const zodErr = err as ZodError;
    return c.json(
      {
        error: 'Bad Request',
        message: 'Validation failed',
        issues: zodErr.issues.map((i: { path: (string | number)[]; message: string }) => ({
          path: i.path,
          message: i.message,
        })),
      },
      400,
    );
  }

  // Known application errors with statusCode and code
  const appError = err as { statusCode?: number; code?: string; message?: string };
  if (appError.statusCode || appError.code) {
    const status =
      appError.statusCode ??
      (appError.code ? STATUS_MAP[appError.code] : undefined) ??
      500;
    return c.json(
      {
        error:
          status === 400
            ? 'Bad Request'
            : status === 401
              ? 'Unauthorized'
              : status === 402
                ? 'Payment Required'
                : status === 403
                  ? 'Forbidden'
                  : status === 404
                    ? 'Not Found'
                    : status === 409
                      ? 'Conflict'
                      : 'Internal Server Error',
        message: appError.message ?? 'An error occurred',
        code: appError.code,
      },
      status as any,
    );
  }

  // Unknown errors → 500 (never expose internals)
  console.error('[api] Unhandled error:', err);
  return c.json(
    { error: 'Internal Server Error', message: 'An unexpected error occurred' },
    500,
  );
});

// 404 for unknown routes
app.notFound((c) => {
  return c.json({ error: 'Not Found', message: `Route ${c.req.path} not found` }, 404);
});

export { app };
