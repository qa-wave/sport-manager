/**
 * Email service — Resend when RESEND_API_KEY is set, console fallback otherwise.
 */
import { Resend } from 'resend';

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

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

export function rsvpReminderEmail(opts: {
  playerName: string;
  eventTitle: string;
  eventDate: string;
  rsvpUrl: string;
}): EmailPayload {
  return {
    to: '', // filled by caller
    subject: `RSVP: ${opts.eventTitle} — ${opts.eventDate}`,
    html: `
      <h2>Dobrý den,</h2>
      <p>${opts.playerName} má nadcházející událost:</p>
      <h3>${opts.eventTitle}</h3>
      <p>📅 ${opts.eventDate}</p>
      <p><a href="${opts.rsvpUrl}" style="background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">Potvrdit účast</a></p>
      <p style="color:#666;font-size:12px">Nebo klikněte na odkaz: ${opts.rsvpUrl}</p>
    `,
  };
}

export function newEventEmail(opts: {
  clubName: string;
  eventTitle: string;
  eventDate: string;
  eventUrl: string;
}): EmailPayload {
  return {
    to: '',
    subject: `Nová událost: ${opts.eventTitle}`,
    html: `
      <h2>${opts.clubName}</h2>
      <p>Byla vytvořena nová událost:</p>
      <h3>${opts.eventTitle}</h3>
      <p>📅 ${opts.eventDate}</p>
      <p><a href="${opts.eventUrl}" style="background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">Zobrazit detail</a></p>
    `,
  };
}
