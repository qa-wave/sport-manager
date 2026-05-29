import { Hono } from 'hono';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/rbac.middleware';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/payments — payment overview (read-only, no Stripe yet).
 *
 * Data comes from seeded Fee + Payment rows.
 */
const payments = new Hono<HonoEnv>();

payments.use('/*', requireAuth());

/**
 * GET /v1/payments
 *
 * Returns all payments for the club. ADMIN/OWNER/FINANCE see everything,
 * other members see only their own payments.
 */
payments.get(
  '/',
  async (c) => {
    const clubId = c.get('clubId');
    if (!clubId) return c.json({ error: 'Bad Request', message: 'x-club-id required' }, 400);

    const member = c.get('member');
    const isAdmin = member && (
      member.clubRoles.includes('OWNER') ||
      member.clubRoles.includes('ADMIN') ||
      member.clubRoles.includes('FINANCE')
    );

    const rows = await prisma.withClub(clubId, (tx) =>
      tx.payment.findMany({
        where: {
          clubId,
          ...(!isAdmin && member ? { payerId: member.memberId } : {}),
        },
        include: {
          fee: { select: { name: true } },
          payer: { select: { user: { select: { firstName: true, lastName: true } } } },
          onBehalfOf: { select: { user: { select: { firstName: true, lastName: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    );

    const items = rows.map(p => ({
      id: p.id,
      feeName: p.fee.name,
      payerName: `${p.payer.user.firstName} ${p.payer.user.lastName}`,
      onBehalfOfName: p.onBehalfOf
        ? `${p.onBehalfOf.user.firstName} ${p.onBehalfOf.user.lastName}`
        : null,
      amountCents: p.amountCents,
      currency: p.currency,
      status: p.status,
      paidAt: p.paidAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    }));

    return c.json({ items });
  },
);

/**
 * GET /v1/payments/summary
 *
 * Quick stats for the dashboard.
 */
payments.get(
  '/summary',
  requireRole('OWNER', 'ADMIN', 'FINANCE'),
  async (c) => {
    const clubId = c.get('clubId')!;

    const [total, paid, pending] = await prisma.withClub(clubId, (tx) =>
      Promise.all([
        tx.payment.count({ where: { clubId } }),
        tx.payment.count({ where: { clubId, status: 'PAID' } }),
        tx.payment.count({ where: { clubId, status: 'PENDING' } }),
      ]),
    );

    return c.json({ total, paid, pending, failed: total - paid - pending });
  },
);

export { payments as paymentsRoutes };
