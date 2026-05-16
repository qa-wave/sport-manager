import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { prisma } from '@/lib/api/prisma';
import { sendEmail } from '@/lib/api/services/email.service';
import { rsvpReminderEmail } from '@/lib/api/services/email-templates';
import { APP_BASE_URL } from '@/lib/constants';

/**
 * Vercel Cron — RSVP reminder
 * Schedule: 0 8 * * * (every day at 08:00 UTC)
 *
 * Finds events starting in the next 24 hours that have team members without
 * an RSVP response, and sends them a reminder email (respects
 * emailRsvpReminder notification preference).
 *
 * Vercel Cron sends the CRON_SECRET in the Authorization header:
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('[cron/rsvp-reminder] CRON_SECRET env var not set — rejecting request');
    return NextResponse.json({ error: 'Cron not configured' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sendRsvpReminders();
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[cron/rsvp-reminder] Unexpected error:', err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Core logic — exported for unit testing
// ---------------------------------------------------------------------------

export interface RsvpReminderSummary {
  eventsProcessed: number;
  emailsSent: number;
  emailsFailed: number;
}

export async function sendRsvpReminders(): Promise<RsvpReminderSummary> {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    console.warn('[cron/rsvp-reminder] JWT_ACCESS_SECRET not set — skipping');
    return { eventsProcessed: 0, emailsSent: 0, emailsFailed: 0 };
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Find events starting in the next 24 hours that have a team assigned
  const upcomingEvents = await prisma.event.findMany({
    where: {
      startsAt: { gte: now, lte: in24h },
      teamId: { not: null },
    },
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      location: true,
      rsvpDeadline: true,
      teamId: true,
      clubId: true,
      team: { select: { name: true } },
      club: { select: { name: true } },
    },
  });

  let emailsSent = 0;
  let emailsFailed = 0;

  for (const event of upcomingEvents) {
    if (!event.teamId) continue;

    // Fetch members who:
    //  1. Are active in the team (leftAt = null)
    //  2. Have NOT yet responded (no EventAttendance row, or status = PENDING)
    //  3. Have emailRsvpReminder = true (or no preference row — default true)
    const memberships = await prisma.teamMembership.findMany({
      where: { teamId: event.teamId, leftAt: null },
      select: {
        member: {
          select: {
            id: true,
            userId: true,
            status: true,
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
                notificationPreferences: {
                  where: { clubId: event.clubId },
                  select: { emailRsvpReminder: true },
                },
              },
            },
          },
        },
      },
    });

    // Build set of memberIds who have already responded (non-PENDING)
    const responded = await prisma.eventAttendance.findMany({
      where: {
        eventId: event.id,
        status: { not: 'PENDING' },
      },
      select: { memberId: true },
    });
    const respondedSet = new Set(responded.map((r) => r.memberId));

    const eventDateLabel = event.startsAt.toLocaleDateString('cs-CZ', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const eventTimeLabel = `${event.startsAt.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })} – ${event.endsAt.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`;

    // Compute deadline info
    let rsvpDeadlineLabel: string | null = null;
    let hoursUntilDeadline: number | null = null;
    if (event.rsvpDeadline) {
      const msUntil = event.rsvpDeadline.getTime() - now.getTime();
      if (msUntil > 0) {
        hoursUntilDeadline = Math.floor(msUntil / (1000 * 60 * 60));
        rsvpDeadlineLabel = event.rsvpDeadline.toLocaleString('cs-CZ', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    }

    const eventUrl = `${APP_BASE_URL}/admin/events/${event.id}`;

    for (const { member } of memberships) {
      if (member.status !== 'ACTIVE') continue;
      if (respondedSet.has(member.id)) continue;

      // Check notification preference (default: true)
      const pref = member.user.notificationPreferences[0];
      const enabled = pref ? pref.emailRsvpReminder : true;
      if (!enabled) continue;

      try {
        // Generate YES and NO magic RSVP tokens
        const [tokenYes, tokenNo] = await Promise.all([
          new SignJWT({ eventId: event.id, memberId: member.id, status: 'YES', purpose: 'rsvp' })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('2d')
            .sign(new TextEncoder().encode(secret)),
          new SignJWT({ eventId: event.id, memberId: member.id, status: 'NO', purpose: 'rsvp' })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('2d')
            .sign(new TextEncoder().encode(secret)),
        ]);

        const { subject, html } = rsvpReminderEmail({
          recipientName: member.user.firstName,
          playerName: `${member.user.firstName} ${member.user.lastName}`,
          clubName: event.club.name,
          eventTitle: event.title,
          eventDate: eventDateLabel,
          eventTime: eventTimeLabel,
          location: event.location,
          teamName: event.team?.name ?? null,
          rsvpDeadline: rsvpDeadlineLabel,
          hoursUntilDeadline,
          rsvpYesUrl: `${APP_BASE_URL}/rsvp/${tokenYes}`,
          rsvpNoUrl: `${APP_BASE_URL}/rsvp/${tokenNo}`,
          eventUrl,
        });

        await sendEmail({ to: member.user.email, subject, html });
        emailsSent++;

        console.log(`[cron/rsvp-reminder] Sent to ${member.user.email} for event ${event.id}`);
      } catch (err) {
        emailsFailed++;
        console.error(
          `[cron/rsvp-reminder] Failed for member ${member.id} / event ${event.id}:`,
          err,
        );
      }
    }
  }

  return {
    eventsProcessed: upcomingEvents.length,
    emailsSent,
    emailsFailed,
  };
}
