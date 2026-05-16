/**
 * Email service — Resend when RESEND_API_KEY is set, console fallback otherwise.
 */
import { Resend } from 'resend';
import { prisma } from '../prisma';
import {
  rsvpReminderEmail as buildRsvpReminderEmail,
  newEventEmail as buildNewEventEmail,
} from './email-templates';

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

/** Keys that exist on the NotificationPreference model. */
export type NotifPrefKey = 'emailEvents' | 'emailRsvpReminder' | 'emailMessages';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!resend) {
    // Dev fallback: log to console
    console.log(`[email] To: ${payload.to}`);
    console.log(`[email] Subject: ${payload.subject}`);
    console.log(`[email] Body preview: ${payload.html.slice(0, 100)}...`);
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'Sport Manager <noreply@sport-manager.qawave.ai>',
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
  } catch (err) {
    console.error('[email] Failed to send:', err);
    // Don't throw — email failure shouldn't break the flow
  }
}

// ---------------------------------------------------------------------------
// getNotifiableMembers
// Returns active team members whose notification preference for `prefKey` is
// enabled. Also includes the user's email and name for sending.
// ---------------------------------------------------------------------------

export interface NotifiableMember {
  memberId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export async function getNotifiableMembers(
  clubId: string,
  teamId: string,
  prefKey: NotifPrefKey,
): Promise<NotifiableMember[]> {
  const memberships = await prisma.teamMembership.findMany({
    where: { teamId, leftAt: null },
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
                where: { clubId },
                select: { [prefKey]: true },
              },
            },
          },
        },
      },
    },
  });

  const result: NotifiableMember[] = [];

  for (const { member } of memberships) {
    if (member.status !== 'ACTIVE') continue;

    const pref = member.user.notificationPreferences[0];
    // If no pref row exists yet, default is true (matches DB @default(true))
    const enabled = pref ? (pref as Record<string, boolean>)[prefKey] : true;
    if (!enabled) continue;

    result.push({
      memberId: member.id,
      userId: member.userId,
      email: member.user.email,
      firstName: member.user.firstName,
      lastName: member.user.lastName,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Legacy compat wrappers (kept for existing call-sites in events.routes.ts)
// These delegate to the new HTML templates.
// ---------------------------------------------------------------------------

export function rsvpReminderEmail(opts: {
  playerName: string;
  eventTitle: string;
  eventDate: string;
  rsvpUrl: string;
}): EmailPayload {
  const { subject, html } = buildRsvpReminderEmail({
    recipientName: opts.playerName,
    playerName: opts.playerName,
    clubName: '',
    eventTitle: opts.eventTitle,
    eventDate: opts.eventDate,
    eventTime: '',
    rsvpYesUrl: opts.rsvpUrl,
    rsvpNoUrl: opts.rsvpUrl,
    eventUrl: opts.rsvpUrl,
  });
  return { to: '', subject, html };
}

export function newEventEmail(opts: {
  clubName: string;
  eventTitle: string;
  eventDate: string;
  eventUrl: string;
}): EmailPayload {
  const { subject, html } = buildNewEventEmail({
    recipientName: '',
    clubName: opts.clubName,
    eventTitle: opts.eventTitle,
    eventType: 'OTHER',
    eventDate: opts.eventDate,
    eventTime: '',
    eventUrl: opts.eventUrl,
    rsvpYesUrl: opts.eventUrl,
    rsvpNoUrl: opts.eventUrl,
  });
  return { to: '', subject, html };
}
