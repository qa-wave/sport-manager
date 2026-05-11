/**
 * Email service — currently logs to console.
 * Replace sendEmail() body with Resend/Postmark when ready.
 */

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(payload: EmailPayload): Promise<void> {
  // TODO: Replace with real email provider (Resend / Postmark)
  console.log(`[email] To: ${payload.to}`);
  console.log(`[email] Subject: ${payload.subject}`);
  console.log(`[email] Body: ${payload.html.slice(0, 200)}...`);
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
