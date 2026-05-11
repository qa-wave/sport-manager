/**
 * /v1/stripe — Stripe Connect + Checkout + Webhook
 *
 * POST /v1/stripe/connect   — OWNER initiates Connect onboarding
 * POST /v1/stripe/checkout  — authenticated user initiates Checkout for a payment
 * POST /v1/stripe/webhook   — PUBLIC Stripe webhook (no JWT)
 */
import { Hono } from 'hono';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/rbac.middleware';
import {
  createConnectedAccount,
  createOnboardingLink,
  createCheckoutSession,
  constructWebhookEvent,
} from '../services/stripe.service';
import type { HonoEnv } from '../../types/hono';

const stripe = new Hono<HonoEnv>();

// ---------------------------------------------------------------------------
// POST /v1/stripe/connect
//
// OWNER initiates Stripe Express Connect onboarding.
// Creates a connected account if one doesn't exist yet, saves its ID in
// Club.config.stripeAccountId, and returns the onboarding URL.
// ---------------------------------------------------------------------------
stripe.post('/connect', requireRole('OWNER'), async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'x-club-id required' }, 400);
  }

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { name: true, config: true },
  });

  if (!club) {
    throw Object.assign(new Error('Club not found'), {
      statusCode: 404,
      code: 'CLUB_NOT_FOUND',
    });
  }

  const config = (club.config as Record<string, unknown>) ?? {};

  // If already connected, just generate a fresh onboarding link (re-entry).
  let stripeAccountId = config.stripeAccountId as string | undefined;

  if (!stripeAccountId) {
    // Fetch the owner's email to pre-fill Stripe Express.
    const member = c.get('member')!;
    const user = await prisma.user.findUnique({
      where: { id: member.userId },
      select: { email: true },
    });

    stripeAccountId = await createConnectedAccount(
      club.name,
      user?.email ?? '',
    );

    // Persist account ID in Club.config
    await prisma.club.update({
      where: { id: clubId },
      data: {
        config: JSON.parse(
          JSON.stringify({ ...config, stripeAccountId }),
        ),
      },
    });
  }

  // Build return URL — defaults to the account page.
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://sport-manager.qawave.ai';
  const returnUrl = `${baseUrl}/admin/account?stripe=connected`;

  const onboardingUrl = await createOnboardingLink(stripeAccountId, returnUrl);

  return c.json({ url: onboardingUrl });
});

// ---------------------------------------------------------------------------
// POST /v1/stripe/checkout
//
// Authenticated user starts a Stripe Checkout session for a pending payment.
// Body: { paymentId: string }
// Returns: { url: string }
// ---------------------------------------------------------------------------
stripe.post('/checkout', requireAuth(), async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'x-club-id required' }, 400);
  }

  const body = await c.req.json<{ paymentId?: string }>();
  const paymentId = body.paymentId;

  if (!paymentId || typeof paymentId !== 'string') {
    return c.json({ error: 'Bad Request', message: 'paymentId is required' }, 400);
  }

  // Load payment — ensure it belongs to this club and is still PENDING.
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      fee: { select: { name: true } },
      club: { select: { config: true } },
    },
  });

  if (!payment || payment.clubId !== clubId) {
    throw Object.assign(new Error('Payment not found'), {
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  }

  if (payment.status !== 'PENDING') {
    return c.json(
      {
        error: 'Bad Request',
        message: `Payment is already ${payment.status.toLowerCase()}.`,
      },
      400,
    );
  }

  const config = (payment.club.config as Record<string, unknown>) ?? {};
  const stripeAccountId = config.stripeAccountId as string | undefined;

  if (!stripeAccountId) {
    return c.json(
      {
        error: 'Bad Request',
        message:
          'Tento klub nemá propojený Stripe účet. Požádejte správce klubu o nastavení plateb.',
      },
      400,
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://sport-manager.qawave.ai';

  const url = await createCheckoutSession({
    connectedAccountId: stripeAccountId,
    amountCents: payment.amountCents,
    currency: payment.currency,
    feeName: payment.fee.name,
    paymentId: payment.id,
    successUrl: `${baseUrl}/admin/payments?success=1`,
    cancelUrl: `${baseUrl}/admin/payments?cancelled=1`,
  });

  return c.json({ url });
});

// ---------------------------------------------------------------------------
// POST /v1/stripe/webhook
//
// PUBLIC — no JWT. Stripe calls this after successful payments.
// Verifies signature and handles checkout.session.completed.
// ---------------------------------------------------------------------------
stripe.post('/webhook', async (c) => {
  // Read raw body — must be a string for Stripe signature verification.
  const rawBody = await c.req.text();
  const sig = c.req.header('stripe-signature');

  if (!sig) {
    return c.json({ error: 'Bad Request', message: 'Missing stripe-signature' }, 400);
  }

  let event: import('stripe').default.Event;
  try {
    event = constructWebhookEvent(rawBody, sig);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed';
    console.error('[stripe/webhook] Invalid signature:', message);
    return c.json({ error: 'Bad Request', message }, 400);
  }

  // Handle relevant events.
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as import('stripe').default.Checkout.Session;
    const paymentId = session.metadata?.paymentId;

    if (paymentId) {
      try {
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            stripePaymentIntentId: session.payment_intent as string | null ?? session.id,
          },
        });
        console.info(`[stripe/webhook] Payment ${paymentId} marked as PAID`);
      } catch (err) {
        // Log but don't fail — Stripe retries on non-2xx.
        console.error(`[stripe/webhook] Failed to update payment ${paymentId}:`, err);
        return c.json({ error: 'Internal Server Error' }, 500);
      }
    }
  }

  return c.json({ received: true });
});

export { stripe as stripeRoutes };
