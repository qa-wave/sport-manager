/**
 * Professional HTML email templates for Sport Manager.
 *
 * All templates:
 *  - Max 600px width (email standard)
 *  - Inline CSS only (no external stylesheets)
 *  - Brand gradient header (#6B48F5 → #00A3FF)
 *  - Email-safe fonts: Arial, Helvetica, sans-serif
 *  - Dark CTA button (#6B48F5) with white text
 *  - Unsubscribe footer link
 */

import { APP_BASE_URL } from '../../constants';

// ---------------------------------------------------------------------------
// Shared layout helpers
// ---------------------------------------------------------------------------

function wrapEmail(content: string, previewText = ''): string {
  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Sport Manager</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <!-- Preview text (hidden) -->
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;</div>` : ''}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!-- Email container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Brand header -->
          ${brandHeader()}
          <!-- Content -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          ${emailFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function brandHeader(): string {
  return `<tr>
    <td style="background:linear-gradient(135deg,#6B48F5 0%,#00A3FF 100%);padding:28px 40px;text-align:left;">
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;padding-right:12px;">
            <!-- Inline SVG star logo -->
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="16,2 20,12 31,12 22,19 25,30 16,23 7,30 10,19 1,12 12,12" fill="rgba(255,255,255,0.9)" stroke="rgba(255,255,255,0.4)" stroke-width="0.5"/>
            </svg>
          </td>
          <td style="vertical-align:middle;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;font-family:Arial,Helvetica,sans-serif;">Sport Manager</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function emailFooter(notifSettingsUrl?: string): string {
  const settingsUrl = notifSettingsUrl ?? `${APP_BASE_URL}/admin/account#notifications`;
  return `<tr>
    <td style="background-color:#f9f9fb;border-top:1px solid #e8e8ed;padding:24px 40px;text-align:center;">
      <p style="margin:0 0 8px;font-size:13px;color:#8b8b9e;font-family:Arial,Helvetica,sans-serif;">
        Sport Manager &middot; Sportovní management pro moderní kluby
      </p>
      <p style="margin:0;font-size:12px;color:#a0a0b0;font-family:Arial,Helvetica,sans-serif;">
        Nechcete dostávat tyto e-maily?
        <a href="${settingsUrl}" style="color:#6B48F5;text-decoration:underline;">Upravit nastavení notifikací</a>
      </p>
    </td>
  </tr>`;
}

function ctaButton(text: string, url: string, color = '#6B48F5'): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="border-radius:8px;background-color:${color};">
        <a href="${url}" target="_blank" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;font-family:Arial,Helvetica,sans-serif;border-radius:8px;">${text}</a>
      </td>
    </tr>
  </table>`;
}

function divider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="border-top:1px solid #e8e8ed;"></td></tr>
  </table>`;
}

function metaRow(icon: string, label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:14px;color:#8b8b9e;width:24px;vertical-align:top;font-family:Arial,Helvetica,sans-serif;">${icon}</td>
    <td style="padding:6px 0 6px 8px;font-size:14px;color:#8b8b9e;width:80px;vertical-align:top;font-family:Arial,Helvetica,sans-serif;">${label}</td>
    <td style="padding:6px 0 6px 8px;font-size:14px;color:#1a1a2e;font-weight:500;vertical-align:top;font-family:Arial,Helvetica,sans-serif;">${value}</td>
  </tr>`;
}

// ---------------------------------------------------------------------------
// A) newEventEmail
// ---------------------------------------------------------------------------

export interface NewEventEmailParams {
  recipientName: string;
  clubName: string;
  eventTitle: string;
  eventType: string;
  eventDate: string;       // e.g. "sobota 10. května 2025"
  eventTime: string;       // e.g. "10:00 – 11:30"
  location?: string | null;
  teamName?: string | null;
  eventUrl: string;
  rsvpYesUrl: string;
  rsvpNoUrl: string;
  notifSettingsUrl?: string;
}

export function newEventEmail(params: NewEventEmailParams): { subject: string; html: string } {
  const eventTypeLabel = formatEventType(params.eventType);

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a2e;font-family:Arial,Helvetica,sans-serif;line-height:1.3;">
      Nová událost: ${escHtml(params.eventTitle)}
    </h1>
    <p style="margin:0 0 4px;font-size:15px;color:#6B48F5;font-weight:600;font-family:Arial,Helvetica,sans-serif;">
      ${eventTypeLabel}${params.teamName ? ` &middot; ${escHtml(params.teamName)}` : ''}
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#5a5a6e;font-family:Arial,Helvetica,sans-serif;">
      Ahoj ${escHtml(params.recipientName)}, v klubu <strong>${escHtml(params.clubName)}</strong> byla vytvořena nová událost.
    </p>

    <!-- Event meta card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f8ff;border:1px solid #e0daf7;border-radius:10px;margin:0 0 24px;">
      <tr>
        <td style="padding:20px 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            ${metaRow('📅', 'Datum', escHtml(params.eventDate))}
            ${metaRow('⏰', 'Čas', escHtml(params.eventTime))}
            ${params.location ? metaRow('📍', 'Místo', escHtml(params.location)) : ''}
            ${params.teamName ? metaRow('👥', 'Tým', escHtml(params.teamName)) : ''}
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton('Zobrazit detail', params.eventUrl)}

    ${divider()}

    <!-- RSVP section -->
    <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#1a1a2e;font-family:Arial,Helvetica,sans-serif;">
      Zúčastníte se?
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-right:12px;">
          <a href="${params.rsvpYesUrl}" target="_blank" style="display:inline-block;padding:12px 24px;background-color:#059669;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;font-family:Arial,Helvetica,sans-serif;">
            Zúčastním se
          </a>
        </td>
        <td>
          <a href="${params.rsvpNoUrl}" target="_blank" style="display:inline-block;padding:12px 24px;background-color:#ffffff;color:#dc2626;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;border:2px solid #dc2626;font-family:Arial,Helvetica,sans-serif;">
            Nemohu
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:12px 0 0;font-size:12px;color:#a0a0b0;font-family:Arial,Helvetica,sans-serif;">
      Nebo odpovězte přímo v aplikaci: <a href="${params.eventUrl}" style="color:#6B48F5;text-decoration:none;">${params.eventUrl}</a>
    </p>
  `;

  return {
    subject: `Nová událost: ${params.eventTitle} — ${params.eventDate}`,
    html: wrapEmail(content, `Nová událost ${params.eventTitle} v ${params.clubName}`),
  };
}

// ---------------------------------------------------------------------------
// B) rsvpReminderEmail
// ---------------------------------------------------------------------------

export interface RsvpReminderEmailParams {
  recipientName: string;
  playerName: string;
  clubName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location?: string | null;
  teamName?: string | null;
  rsvpDeadline?: string | null;   // e.g. "dnes ve 22:00"
  hoursUntilDeadline?: number | null;
  rsvpYesUrl: string;
  rsvpNoUrl: string;
  eventUrl: string;
  notifSettingsUrl?: string;
}

export function rsvpReminderEmail(params: RsvpReminderEmailParams): { subject: string; html: string } {
  const isSelf = params.recipientName === params.playerName;
  const playerLabel = isSelf ? 'Ještě jsi neodpověděl/a' : `${escHtml(params.playerName)} ještě neodpověděl/a`;

  const deadlineBanner = params.rsvpDeadline
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:14px 18px;">
            <p style="margin:0;font-size:14px;color:#92400e;font-weight:600;font-family:Arial,Helvetica,sans-serif;">
              ⏳ Uzávěrka: ${escHtml(params.rsvpDeadline)}${params.hoursUntilDeadline != null ? ` (zbývá ${params.hoursUntilDeadline} hod.)` : ''}
            </p>
          </td>
        </tr>
      </table>`
    : '';

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a2e;font-family:Arial,Helvetica,sans-serif;line-height:1.3;">
      Připomínka RSVP
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#5a5a6e;font-family:Arial,Helvetica,sans-serif;">
      Ahoj ${escHtml(params.recipientName)}, ${playerLabel} na nadcházející událost.
    </p>

    ${deadlineBanner}

    <!-- Event meta card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f8ff;border:1px solid #e0daf7;border-radius:10px;margin:0 0 24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1a1a2e;font-family:Arial,Helvetica,sans-serif;">${escHtml(params.eventTitle)}</p>
          <table role="presentation" cellpadding="0" cellspacing="0">
            ${metaRow('📅', 'Datum', escHtml(params.eventDate))}
            ${metaRow('⏰', 'Čas', escHtml(params.eventTime))}
            ${params.location ? metaRow('📍', 'Místo', escHtml(params.location)) : ''}
            ${params.teamName ? metaRow('👥', 'Tým', escHtml(params.teamName)) : ''}
          </table>
        </td>
      </tr>
    </table>

    <!-- RSVP buttons -->
    <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#1a1a2e;font-family:Arial,Helvetica,sans-serif;">
      Zúčastníte se?
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-right:12px;">
          <a href="${params.rsvpYesUrl}" target="_blank" style="display:inline-block;padding:14px 28px;background-color:#059669;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;font-family:Arial,Helvetica,sans-serif;">
            Zúčastním se
          </a>
        </td>
        <td>
          <a href="${params.rsvpNoUrl}" target="_blank" style="display:inline-block;padding:14px 28px;background-color:#ffffff;color:#dc2626;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;border:2px solid #dc2626;font-family:Arial,Helvetica,sans-serif;">
            Nemohu
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:12px 0 0;font-size:12px;color:#a0a0b0;font-family:Arial,Helvetica,sans-serif;">
      Nebo odpovězte v aplikaci: <a href="${params.eventUrl}" style="color:#6B48F5;text-decoration:none;">${params.eventUrl}</a>
    </p>
  `;

  return {
    subject: `Připomínka: ${params.eventTitle} — odpověz na RSVP`,
    html: wrapEmail(content, `Připomínka: ještě jsi neodpověděl/a na ${params.eventTitle}`),
  };
}

// ---------------------------------------------------------------------------
// C) newMessageEmail
// ---------------------------------------------------------------------------

export interface NewMessageEmailParams {
  recipientName: string;
  senderName: string;
  conversationTitle?: string | null;
  messagePreview: string;   // truncated to 200 chars by caller or here
  conversationUrl: string;
  notifSettingsUrl?: string;
}

export function newMessageEmail(params: NewMessageEmailParams): { subject: string; html: string } {
  const preview = params.messagePreview.length > 200
    ? `${params.messagePreview.slice(0, 197)}...`
    : params.messagePreview;

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a2e;font-family:Arial,Helvetica,sans-serif;line-height:1.3;">
      Nová zpráva
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#5a5a6e;font-family:Arial,Helvetica,sans-serif;">
      Ahoj ${escHtml(params.recipientName)}, máš novou zprávu od <strong>${escHtml(params.senderName)}</strong>${params.conversationTitle ? ` v konverzaci „${escHtml(params.conversationTitle)}"` : ''}.
    </p>

    <!-- Message preview -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background-color:#f4f4f7;border-left:4px solid #6B48F5;border-radius:0 8px 8px 0;padding:16px 20px;">
          <p style="margin:0 0 6px;font-size:13px;color:#8b8b9e;font-weight:600;font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;letter-spacing:0.5px;">
            ${escHtml(params.senderName)}
          </p>
          <p style="margin:0;font-size:15px;color:#1a1a2e;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">
            ${escHtml(preview)}
          </p>
        </td>
      </tr>
    </table>

    ${ctaButton('Odpovědět', params.conversationUrl)}

    <p style="margin:0;font-size:12px;color:#a0a0b0;font-family:Arial,Helvetica,sans-serif;">
      Nebo otevřte aplikaci: <a href="${params.conversationUrl}" style="color:#6B48F5;text-decoration:none;">${params.conversationUrl}</a>
    </p>
  `;

  return {
    subject: `Nová zpráva od ${params.senderName}`,
    html: wrapEmail(content, `${params.senderName}: ${preview.slice(0, 80)}`),
  };
}

// ---------------------------------------------------------------------------
// D) paymentReminderEmail
// ---------------------------------------------------------------------------

export interface PaymentReminderEmailParams {
  recipientName: string;
  clubName: string;
  amount: number;           // in smallest currency unit (e.g. haléře / cents)
  currency: string;         // e.g. "czk"
  description: string;      // e.g. "Registrační poplatek 2025"
  dueDate?: string | null;  // e.g. "31. května 2025"
  checkoutUrl: string;
  notifSettingsUrl?: string;
}

export function paymentReminderEmail(params: PaymentReminderEmailParams): { subject: string; html: string } {
  const formattedAmount = formatAmount(params.amount, params.currency);

  const dueBanner = params.dueDate
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:14px 18px;">
            <p style="margin:0;font-size:14px;color:#92400e;font-weight:600;font-family:Arial,Helvetica,sans-serif;">
              📅 Splatnost: ${escHtml(params.dueDate)}
            </p>
          </td>
        </tr>
      </table>`
    : '';

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a2e;font-family:Arial,Helvetica,sans-serif;line-height:1.3;">
      Platba čeká na vyřízení
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#5a5a6e;font-family:Arial,Helvetica,sans-serif;">
      Ahoj ${escHtml(params.recipientName)}, klub <strong>${escHtml(params.clubName)}</strong> tě žádá o platbu.
    </p>

    ${dueBanner}

    <!-- Payment card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f8ff;border:1px solid #e0daf7;border-radius:10px;margin:0 0 24px;">
      <tr>
        <td style="padding:24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:14px;color:#8b8b9e;font-family:Arial,Helvetica,sans-serif;padding-bottom:4px;">Účel platby</td>
            </tr>
            <tr>
              <td style="font-size:17px;font-weight:600;color:#1a1a2e;font-family:Arial,Helvetica,sans-serif;padding-bottom:16px;">${escHtml(params.description)}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#8b8b9e;font-family:Arial,Helvetica,sans-serif;padding-bottom:4px;">Částka</td>
            </tr>
            <tr>
              <td style="font-size:32px;font-weight:700;color:#6B48F5;font-family:Arial,Helvetica,sans-serif;">${formattedAmount}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton('Zaplatit nyní', params.checkoutUrl)}

    <p style="margin:0;font-size:12px;color:#a0a0b0;font-family:Arial,Helvetica,sans-serif;">
      Platba je bezpečně zpracována přes Stripe. <a href="${params.checkoutUrl}" style="color:#6B48F5;text-decoration:none;">Přímý odkaz</a>
    </p>
  `;

  return {
    subject: `Platba ${formattedAmount} — ${params.description}`,
    html: wrapEmail(content, `Platba ${formattedAmount} za ${params.description}`),
  };
}

// ---------------------------------------------------------------------------
// E) welcomeEmail
// ---------------------------------------------------------------------------

export interface WelcomeEmailParams {
  firstName: string;
  clubName?: string | null;
  adminUrl: string;
  notifSettingsUrl?: string;
}

export function welcomeEmail(params: WelcomeEmailParams): { subject: string; html: string } {
  const steps = [
    { icon: '👥', title: 'Přidejte členy', desc: 'Importujte hráče z CSV nebo pozvěte je e-mailem.' },
    { icon: '📅', title: 'Vytvořte událost', desc: 'Naplánujte trénink nebo zápas a sbírejte RSVP.' },
    { icon: '💬', title: 'Komunikujte', desc: 'Posílejte zprávy týmu nebo rodičům přímo v aplikaci.' },
    { icon: '💳', title: 'Spravujte platby', desc: 'Přijímejte online platby přes Stripe Connect.' },
  ];

  const stepsHtml = steps.map((s, i) => `
    <tr>
      <td style="padding:12px 0;${i < steps.length - 1 ? 'border-bottom:1px solid #f0f0f5;' : ''}">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:top;padding-right:16px;font-size:22px;width:36px;">${s.icon}</td>
            <td style="vertical-align:top;">
              <p style="margin:0 0 2px;font-size:15px;font-weight:600;color:#1a1a2e;font-family:Arial,Helvetica,sans-serif;">${s.title}</p>
              <p style="margin:0;font-size:13px;color:#8b8b9e;font-family:Arial,Helvetica,sans-serif;">${s.desc}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const content = `
    <!-- Hero -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;text-align:center;">
      <tr>
        <td>
          <div style="font-size:48px;margin-bottom:16px;">🏆</div>
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#1a1a2e;font-family:Arial,Helvetica,sans-serif;line-height:1.3;">
            Vítejte v Sport Manager${params.firstName ? `, ${escHtml(params.firstName)}` : ''}!
          </h1>
          <p style="margin:0;font-size:15px;color:#5a5a6e;font-family:Arial,Helvetica,sans-serif;line-height:1.6;">
            ${params.clubName ? `Klub <strong>${escHtml(params.clubName)}</strong> je připraven.` : 'Váš účet je připraven.'}<br/>
            Zvládněte správu klubu od A do Z na jednom místě.
          </p>
        </td>
      </tr>
    </table>

    <!-- Onboarding steps -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f8ff;border:1px solid #e0daf7;border-radius:10px;margin:0 0 24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#8b8b9e;text-transform:uppercase;letter-spacing:0.5px;font-family:Arial,Helvetica,sans-serif;">Začněte zde</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${stepsHtml}
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="text-align:center;">
      <tr>
        <td>
          ${ctaButton('Otevřít Sport Manager', params.adminUrl)}
        </td>
      </tr>
    </table>

    ${divider()}

    <p style="margin:0;font-size:13px;color:#8b8b9e;text-align:center;font-family:Arial,Helvetica,sans-serif;line-height:1.6;">
      Máte otázky? Napište nám na
      <a href="mailto:support@sport-manager.qawave.ai" style="color:#6B48F5;text-decoration:none;">support@sport-manager.qawave.ai</a>
    </p>
  `;

  return {
    subject: `Vítejte v Sport Manager${params.clubName ? ` — ${params.clubName} je připraven` : ''}!`,
    html: wrapEmail(content, `Sport Manager je připraven — přidejte první členy a naplánujte trénink`),
  };
}

// ---------------------------------------------------------------------------
// F) newsletterEmail
// ---------------------------------------------------------------------------

export interface NewsletterEmailParams {
  recipientName: string;
  clubName: string;
  clubSlug: string;
  title: string;
  bodyHtml: string;   // already-rendered HTML (simple markdown → HTML by caller)
  clubUrl?: string | null;
  unsubscribeUrl?: string | null;
}

export function newsletterEmail(params: NewsletterEmailParams): { subject: string; html: string } {
  const clubWebUrl = params.clubUrl ?? `${APP_BASE_URL}/k/${params.clubSlug}`;
  const unsubUrl = params.unsubscribeUrl ?? `${APP_BASE_URL}/admin/account#notifications`;

  const content = `
    <!-- Title -->
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#1a1a2e;font-family:Arial,Helvetica,sans-serif;line-height:1.3;">
      ${escHtml(params.title)}
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#8b8b9e;font-family:Arial,Helvetica,sans-serif;">
      Newsletter od <strong>${escHtml(params.clubName)}</strong>
    </p>

    ${divider()}

    <!-- Body -->
    <div style="font-size:15px;color:#1a1a2e;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">
      ${params.bodyHtml}
    </div>

    ${divider()}

    <!-- Footer links -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="text-align:center;">
          <p style="margin:0 0 8px;font-size:13px;color:#8b8b9e;font-family:Arial,Helvetica,sans-serif;">
            <a href="${clubWebUrl}" style="color:#6B48F5;text-decoration:none;">${escHtml(params.clubName)}</a>
          </p>
          <p style="margin:0;font-size:12px;color:#a0a0b0;font-family:Arial,Helvetica,sans-serif;">
            Nechcete dostávat newslettery? <a href="${unsubUrl}" style="color:#6B48F5;text-decoration:underline;">Odhlásit odběr</a>
          </p>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `${params.title} — ${params.clubName}`,
    html: wrapEmail(content, params.title),
  };
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/** Escape HTML special characters to prevent injection in email bodies. */
function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Format Stripe amount (smallest unit) to human-readable string. */
function formatAmount(amount: number, currency: string): string {
  const major = amount / 100;
  const currencyUpper = currency.toUpperCase();
  if (currencyUpper === 'CZK') {
    return `${major.toLocaleString('cs-CZ')} Kč`;
  }
  if (currencyUpper === 'EUR') {
    return `€${major.toFixed(2)}`;
  }
  if (currencyUpper === 'USD') {
    return `$${major.toFixed(2)}`;
  }
  return `${major} ${currencyUpper}`;
}

/** Map EventType enum to human-readable Czech label. */
function formatEventType(type: string): string {
  const map: Record<string, string> = {
    TRAINING: 'Trénink',
    MATCH: 'Zápas',
    TOURNAMENT: 'Turnaj',
    MEETING: 'Schůzka',
    OTHER: 'Jiná událost',
  };
  return map[type] ?? type;
}
