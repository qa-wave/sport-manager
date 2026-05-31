/**
 * Sends RSVP reminders to team members of a single event who haven't responded
 * yet. Shared by the daily cron and the on-demand "remind now" endpoint (and the
 * AI assistant's sendEventReminder action).
 */
import { SignJWT } from 'jose';
import { prisma } from '../prisma';
import { sendEmail } from './email.service';
import { rsvpReminderEmail } from './email-templates';
import { APP_BASE_URL } from '../../constants';

export interface ReminderResult {
  sent: number;
  failed: number;
  skipped: number;
}

export async function sendRsvpRemindersForEvent(eventId: string): Promise<ReminderResult> {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) return { sent: 0, failed: 0, skipped: 0 };
  const key = new TextEncoder().encode(secret);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
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
  if (!event || !event.teamId) return { sent: 0, failed: 0, skipped: 0 };

  const memberships = await prisma.teamMembership.findMany({
    where: { teamId: event.teamId, leftAt: null },
    select: {
      member: {
        select: {
          id: true,
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

  const responded = await prisma.eventAttendance.findMany({
    where: { eventId: event.id, status: { not: 'PENDING' } },
    select: { memberId: true },
  });
  const respondedSet = new Set(responded.map((r) => r.memberId));

  const now = new Date();
  const eventDateLabel = event.startsAt.toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const eventTimeLabel = `${event.startsAt.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })} – ${event.endsAt.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`;

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
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const { member } of memberships) {
    if (member.status !== 'ACTIVE' || respondedSet.has(member.id)) {
      skipped++;
      continue;
    }
    const pref = member.user.notificationPreferences[0];
    if (pref && !pref.emailRsvpReminder) {
      skipped++;
      continue;
    }
    try {
      const [tokenYes, tokenNo] = await Promise.all([
        new SignJWT({ eventId: event.id, memberId: member.id, status: 'YES', purpose: 'rsvp' })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('2d')
          .sign(key),
        new SignJWT({ eventId: event.id, memberId: member.id, status: 'NO', purpose: 'rsvp' })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('2d')
          .sign(key),
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
      sent++;
    } catch {
      failed++;
    }
  }

  return { sent, failed, skipped };
}
