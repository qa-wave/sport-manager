import { Hono } from 'hono';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/rbac.middleware';
import { sendNewsletterEmail } from '../services/email.service';
import { NewsletterCreateSchema, NewsletterUpdateSchema } from '@sport-manager/contracts';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/newsletter — Newsletter management (club-wide email campaigns).
 *
 * Write access: ADMIN | OWNER | COMMUNICATIONS only.
 * Read access: any authenticated club member.
 */
const newsletter = new Hono<HonoEnv>();

newsletter.use('/*', requireAuth());

// ---------------------------------------------------------------------------
// Simple markdown-to-HTML converter (no external deps)
// Handles: headers, bold, italic, lists, paragraphs, line breaks.
// ---------------------------------------------------------------------------
function markdownToHtml(md: string): string {
  return md
    .split('\n\n')
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';

      // Unordered list
      if (trimmed.match(/^[-*] /m)) {
        const items = trimmed
          .split('\n')
          .filter((l) => l.match(/^[-*] /))
          .map((l) => `<li style="margin-bottom:6px;">${inlineFormat(l.replace(/^[-*] /, ''))}</li>`)
          .join('');
        return `<ul style="margin:0 0 12px;padding-left:20px;">${items}</ul>`;
      }

      // Ordered list
      if (trimmed.match(/^\d+\. /m)) {
        const items = trimmed
          .split('\n')
          .filter((l) => l.match(/^\d+\. /))
          .map((l) => `<li style="margin-bottom:6px;">${inlineFormat(l.replace(/^\d+\. /, ''))}</li>`)
          .join('');
        return `<ol style="margin:0 0 12px;padding-left:20px;">${items}</ol>`;
      }

      // Headings
      if (trimmed.startsWith('### ')) {
        return `<h3 style="margin:16px 0 8px;font-size:18px;font-weight:700;color:#1a1a2e;">${inlineFormat(trimmed.slice(4))}</h3>`;
      }
      if (trimmed.startsWith('## ')) {
        return `<h2 style="margin:20px 0 10px;font-size:22px;font-weight:700;color:#1a1a2e;">${inlineFormat(trimmed.slice(3))}</h2>`;
      }
      if (trimmed.startsWith('# ')) {
        return `<h2 style="margin:20px 0 10px;font-size:24px;font-weight:700;color:#1a1a2e;">${inlineFormat(trimmed.slice(2))}</h2>`;
      }

      // Paragraph with line breaks
      return `<p style="margin:0 0 12px;line-height:1.7;">${inlineFormat(trimmed.replace(/\n/g, '<br/>'))}</p>`;
    })
    .join('');
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:#f4f4f7;padding:2px 6px;border-radius:4px;font-size:13px;">$1</code>');
}

// ---------------------------------------------------------------------------
// GET /newsletter — list (paginated, filter by status)
// ---------------------------------------------------------------------------
newsletter.get('/', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) return c.json({ error: 'Bad Request', message: 'x-club-id required' }, 400);

  const { status, page, limit } = c.req.query();
  const take = Math.min(parseInt(limit ?? '20'), 100);
  const skip = (parseInt(page ?? '1') - 1) * take;

  const where = {
    clubId,
    ...(status ? { status: status as 'DRAFT' | 'SCHEDULED' | 'SENT' } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.newsletter.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        title: true,
        status: true,
        scheduledFor: true,
        sentAt: true,
        recipientCount: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    }),
    prisma.newsletter.count({ where }),
  ]);

  return c.json({
    items: items.map((n) => ({
      ...n,
      createdByName: n.createdBy
        ? `${n.createdBy.user.firstName} ${n.createdBy.user.lastName}`
        : null,
      createdBy: undefined,
      scheduledFor: n.scheduledFor?.toISOString() ?? null,
      sentAt: n.sentAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    })),
    total,
    page: parseInt(page ?? '1'),
    limit: take,
    hasMore: skip + take < total,
  });
});

// ---------------------------------------------------------------------------
// GET /newsletter/:id — detail
// ---------------------------------------------------------------------------
newsletter.get('/:id', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) return c.json({ error: 'Bad Request', message: 'x-club-id required' }, 400);

  const row = await prisma.newsletter.findFirst({
    where: { id: c.req.param('id'), clubId },
    include: {
      createdBy: { select: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  if (!row) return c.json({ error: 'Not Found', message: 'Newsletter not found' }, 404);

  return c.json({
    ...row,
    createdByName: row.createdBy
      ? `${row.createdBy.user.firstName} ${row.createdBy.user.lastName}`
      : null,
    createdBy: undefined,
    scheduledFor: row.scheduledFor?.toISOString() ?? null,
    sentAt: row.sentAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
});

// ---------------------------------------------------------------------------
// POST /newsletter — create draft (ADMIN | OWNER | COMMUNICATIONS)
// ---------------------------------------------------------------------------
newsletter.post(
  '/',
  requireRole('ADMIN', 'OWNER', 'COMMUNICATIONS'),
  async (c) => {
    const clubId = c.get('clubId');
    if (!clubId) return c.json({ error: 'Bad Request', message: 'x-club-id required' }, 400);

    const member = c.get('member');
    const body = await c.req.json();
    const parsed = NewsletterCreateSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Bad Request', message: 'Validation failed', issues: parsed.error.issues }, 400);
    }

    const { title, body: bodyContent, scheduledFor } = parsed.data;
    const status = scheduledFor ? 'SCHEDULED' : 'DRAFT';

    const row = await prisma.newsletter.create({
      data: {
        clubId,
        title,
        body: bodyContent,
        status,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        createdById: member?.memberId ?? null,
      },
    });

    return c.json({
      id: row.id,
      title: row.title,
      status: row.status,
      scheduledFor: row.scheduledFor?.toISOString() ?? null,
      sentAt: null,
      recipientCount: 0,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }, 201);
  },
);

// ---------------------------------------------------------------------------
// PATCH /newsletter/:id — update (ADMIN | OWNER | COMMUNICATIONS, DRAFT/SCHEDULED only)
// ---------------------------------------------------------------------------
newsletter.patch(
  '/:id',
  requireRole('ADMIN', 'OWNER', 'COMMUNICATIONS'),
  async (c) => {
    const clubId = c.get('clubId');
    if (!clubId) return c.json({ error: 'Bad Request', message: 'x-club-id required' }, 400);

    const existing = await prisma.newsletter.findFirst({
      where: { id: c.req.param('id'), clubId },
    });
    if (!existing) return c.json({ error: 'Not Found', message: 'Newsletter not found' }, 404);
    if (existing.status === 'SENT') {
      return c.json({ error: 'Conflict', message: 'Cannot edit a sent newsletter' }, 409);
    }

    const body = await c.req.json();
    const parsed = NewsletterUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Bad Request', message: 'Validation failed', issues: parsed.error.issues }, 400);
    }

    const { title, body: bodyContent, scheduledFor, status } = parsed.data;
    const newStatus = status ?? (scheduledFor !== undefined ? (scheduledFor ? 'SCHEDULED' : 'DRAFT') : existing.status);

    const updated = await prisma.newsletter.update({
      where: { id: existing.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(bodyContent !== undefined ? { body: bodyContent } : {}),
        ...(scheduledFor !== undefined ? { scheduledFor: scheduledFor ? new Date(scheduledFor) : null } : {}),
        status: newStatus,
      },
    });

    return c.json({
      id: updated.id,
      title: updated.title,
      status: updated.status,
      scheduledFor: updated.scheduledFor?.toISOString() ?? null,
      sentAt: updated.sentAt?.toISOString() ?? null,
      recipientCount: updated.recipientCount,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  },
);

// ---------------------------------------------------------------------------
// DELETE /newsletter/:id — delete (ADMIN | OWNER | COMMUNICATIONS, DRAFT only)
// ---------------------------------------------------------------------------
newsletter.delete(
  '/:id',
  requireRole('ADMIN', 'OWNER', 'COMMUNICATIONS'),
  async (c) => {
    const clubId = c.get('clubId');
    if (!clubId) return c.json({ error: 'Bad Request', message: 'x-club-id required' }, 400);

    const existing = await prisma.newsletter.findFirst({
      where: { id: c.req.param('id'), clubId },
    });
    if (!existing) return c.json({ error: 'Not Found', message: 'Newsletter not found' }, 404);
    if (existing.status !== 'DRAFT') {
      return c.json({ error: 'Conflict', message: 'Only DRAFT newsletters can be deleted' }, 409);
    }

    await prisma.newsletter.delete({ where: { id: existing.id } });
    return c.json({ ok: true });
  },
);

// ---------------------------------------------------------------------------
// POST /newsletter/:id/send — send now (ADMIN | OWNER | COMMUNICATIONS)
// Gets all ACTIVE members of the club, sends email via email.service.ts,
// updates status=SENT, sentAt=now, recipientCount=N.
// ---------------------------------------------------------------------------
newsletter.post(
  '/:id/send',
  requireRole('ADMIN', 'OWNER', 'COMMUNICATIONS'),
  async (c) => {
    const clubId = c.get('clubId');
    if (!clubId) return c.json({ error: 'Bad Request', message: 'x-club-id required' }, 400);

    const existing = await prisma.newsletter.findFirst({
      where: { id: c.req.param('id'), clubId },
    });
    if (!existing) return c.json({ error: 'Not Found', message: 'Newsletter not found' }, 404);
    if (existing.status === 'SENT') {
      return c.json({ error: 'Conflict', message: 'Newsletter already sent' }, 409);
    }

    // Get the club info for email template
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { name: true, slug: true },
    });
    if (!club) return c.json({ error: 'Not Found', message: 'Club not found' }, 404);

    // Get all active members of the club
    const members = await prisma.member.findMany({
      where: { clubId, status: 'ACTIVE' },
      select: {
        user: { select: { email: true, firstName: true, lastName: true } },
      },
    });

    if (members.length === 0) {
      return c.json(
        { error: 'Unprocessable Entity', message: 'No active members in club to send newsletter to' },
        422,
      );
    }

    const bodyHtml = markdownToHtml(existing.body);

    // Send emails (fire-and-forget per recipient — no bulk abort on single fail)
    let sent = 0;
    for (const m of members) {
      try {
        await sendNewsletterEmail({
          to: m.user.email,
          recipientName: `${m.user.firstName} ${m.user.lastName}`,
          clubName: club.name,
          clubSlug: club.slug,
          title: existing.title,
          bodyHtml,
        });
        sent++;
      } catch (err) {
        console.error(`[newsletter] Failed to send to ${m.user.email}:`, err);
      }
    }

    const updated = await prisma.newsletter.update({
      where: { id: existing.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        recipientCount: sent,
      },
    });

    return c.json({
      id: updated.id,
      status: updated.status,
      sentAt: updated.sentAt?.toISOString() ?? null,
      recipientCount: updated.recipientCount,
    });
  },
);

// ---------------------------------------------------------------------------
// POST /newsletter/:id/preview — send test email to requestor
// ---------------------------------------------------------------------------
newsletter.post(
  '/:id/preview',
  requireRole('ADMIN', 'OWNER', 'COMMUNICATIONS'),
  async (c) => {
    const clubId = c.get('clubId');
    if (!clubId) return c.json({ error: 'Bad Request', message: 'x-club-id required' }, 400);

    const user = c.get('user');
    if (!user) return c.json({ error: 'Unauthorized', message: 'Authentication required' }, 401);

    const existing = await prisma.newsletter.findFirst({
      where: { id: c.req.param('id'), clubId },
    });
    if (!existing) return c.json({ error: 'Not Found', message: 'Newsletter not found' }, 404);

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { name: true, slug: true },
    });
    if (!club) return c.json({ error: 'Not Found', message: 'Club not found' }, 404);

    // Optional: custom preview email from body
    const bodyData = await c.req.json().catch(() => ({})) as { previewEmail?: string };
    const toEmail = bodyData.previewEmail ?? user.email;
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { firstName: true, lastName: true },
    });
    const recipientName = dbUser ? `${dbUser.firstName} ${dbUser.lastName}` : 'Preview';

    await sendNewsletterEmail({
      to: toEmail,
      recipientName,
      clubName: club.name,
      clubSlug: club.slug,
      title: `[PREVIEW] ${existing.title}`,
      bodyHtml: markdownToHtml(existing.body),
    });

    return c.json({ ok: true, sentTo: toEmail });
  },
);

export { newsletter as newsletterRoutes };
