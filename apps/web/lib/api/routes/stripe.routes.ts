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
  createSubscriptionCheckoutSession,
  createCustomerPortalSession,
  constructWebhookEvent,
} from '../services/stripe.service';
import type { HonoEnv } from '../../types/hono';
import { APP_BASE_URL } from '../../constants';

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

    const newAccountId = await createConnectedAccount(
      club.name,
      user?.email ?? '',
    );

    // Atomic conditional update — only sets stripeAccountId if still empty.
    // Prevents two concurrent requests from each persisting their own account
    // and orphaning the other on Stripe.
    const updated = await prisma.$executeRaw`
      UPDATE "Club"
      SET config = jsonb_set(coalesce(config, '{}')::jsonb, '{stripeAccountId}', to_jsonb(${newAccountId}::text), true)
      WHERE id = ${clubId}
        AND (config->>'stripeAccountId') IS NULL
    `;

    if (updated === 0) {
      // Someone else won the race. Use their accountId; log orphan for cleanup.
      const fresh = await prisma.club.findUnique({
        where: { id: clubId },
        select: { config: true },
      });
      const freshCfg = (fresh?.config as Record<string, unknown>) ?? {};
      stripeAccountId = freshCfg.stripeAccountId as string | undefined;
      console.warn(
        `[stripe] Race on connect: orphan Stripe account ${newAccountId} for club ${clubId} (using ${stripeAccountId} instead)`,
      );
    } else {
      stripeAccountId = newAccountId;
    }
  }

  // Build return URL — defaults to the account page.
  const returnUrl = `${APP_BASE_URL}/admin/account?stripe=connected`;

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

  const url = await createCheckoutSession({
    connectedAccountId: stripeAccountId,
    amountCents: payment.amountCents,
    currency: payment.currency,
    feeName: payment.fee.name,
    paymentId: payment.id,
    successUrl: `${APP_BASE_URL}/admin/payments?success=1`,
    cancelUrl: `${APP_BASE_URL}/admin/payments?cancelled=1`,
  });

  return c.json({ url });
});

// ---------------------------------------------------------------------------
// POST /v1/stripe/create-subscription
//
// Authenticated user starts a Stripe Checkout session for a subscription plan.
// Body: { plan: 'pro' | 'club' }
// Returns: { url: string }
// ---------------------------------------------------------------------------
stripe.post('/create-subscription', requireAuth(), async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'x-club-id required' }, 400);
  }

  const body = await c.req.json<{ plan?: string }>();
  const plan = body.plan;

  if (plan !== 'pro' && plan !== 'club') {
    return c.json({ error: 'Bad Request', message: 'plan must be "pro" or "club"' }, 400);
  }

  const member = c.get('member')!;
  const user = await prisma.user.findUnique({
    where: { id: member.userId },
    select: { email: true },
  });

  // Load existing Stripe customer ID if stored in club config
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { config: true },
  });
  const config = (club?.config as Record<string, unknown>) ?? {};
  const stripeCustomerId = config.stripeCustomerId as string | undefined;

  const url = await createSubscriptionCheckoutSession({
    plan,
    customerId: stripeCustomerId,
    customerEmail: stripeCustomerId ? undefined : (user?.email ?? undefined),
    clubId,
    successUrl: `${APP_BASE_URL}/admin/account?stripe=subscribed`,
    cancelUrl: `${APP_BASE_URL}/pricing`,
  });

  return c.json({ url });
});

// ---------------------------------------------------------------------------
// POST /v1/stripe/customer-portal
//
// Authenticated OWNER opens Stripe Customer Portal to manage their subscription.
// Returns: { url: string }
// ---------------------------------------------------------------------------
stripe.post('/customer-portal', requireRole('OWNER'), async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'x-club-id required' }, 400);
  }

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { config: true },
  });
  const config = (club?.config as Record<string, unknown>) ?? {};
  const stripeCustomerId = config.stripeCustomerId as string | undefined;

  if (!stripeCustomerId) {
    return c.json(
      {
        error: 'Bad Request',
        message: 'Tento klub nemá aktivní předplatné Stripe. Nejdříve si předplaťte plán.',
      },
      400,
    );
  }

  const url = await createCustomerPortalSession({
    customerId: stripeCustomerId,
    returnUrl: `${APP_BASE_URL}/admin/account`,
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
    const clubId = session.metadata?.clubId;
    const plan = session.metadata?.plan as 'pro' | 'club' | undefined;

    // One-time payment → mark as PAID
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
        console.error(`[stripe/webhook] Failed to update payment ${paymentId}:`, err);
        return c.json({ error: 'Internal Server Error' }, 500);
      }
    }

    // Subscription checkout → store customer ID in club config
    if (clubId && plan && session.mode === 'subscription' && session.customer) {
      try {
        const club = await prisma.club.findUnique({ where: { id: clubId }, select: { config: true } });
        const config = (club?.config as Record<string, unknown>) ?? {};
        await prisma.club.update({
          where: { id: clubId },
          data: {
            config: JSON.parse(JSON.stringify({ ...config, stripeCustomerId: session.customer })),
          },
        });
        console.info(`[stripe/webhook] Club ${clubId} customer ${session.customer} stored`);
      } catch (err) {
        console.error(`[stripe/webhook] Failed to store customer for club ${clubId}:`, err);
        // Return 500 so Stripe retries — silently dropping leaves the subscription
        // unlinked and the club permanently broken.
        return c.json({ error: 'Internal Server Error' }, 500);
      }
    }
  }

  // Subscription lifecycle events → update club tier
  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated'
  ) {
    const subscription = event.data.object as import('stripe').default.Subscription;
    const clubId = subscription.metadata?.clubId;
    const plan = subscription.metadata?.plan as 'pro' | 'club' | undefined;

    if (clubId && plan && subscription.status === 'active') {
      try {
        const club = await prisma.club.findUnique({ where: { id: clubId }, select: { config: true } });
        const config = (club?.config as Record<string, unknown>) ?? {};
        await prisma.club.update({
          where: { id: clubId },
          data: {
            config: JSON.parse(JSON.stringify({ ...config, tier: plan, stripeSubscriptionId: subscription.id })),
          },
        });
        console.info(`[stripe/webhook] Club ${clubId} upgraded to tier "${plan}"`);
      } catch (err) {
        console.error(`[stripe/webhook] Failed to update tier for club ${clubId}:`, err);
        return c.json({ error: 'Internal Server Error' }, 500);
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as import('stripe').default.Subscription;
    const clubId = subscription.metadata?.clubId;

    if (clubId) {
      try {
        const club = await prisma.club.findUnique({ where: { id: clubId }, select: { config: true } });
        const config = (club?.config as Record<string, unknown>) ?? {};
        await prisma.club.update({
          where: { id: clubId },
          data: {
            config: JSON.parse(JSON.stringify({ ...config, tier: 'free', stripeSubscriptionId: null })),
          },
        });
        console.info(`[stripe/webhook] Club ${clubId} downgraded to free (subscription cancelled)`);
      } catch (err) {
        console.error(`[stripe/webhook] Failed to downgrade club ${clubId}:`, err);
        return c.json({ error: 'Internal Server Error' }, 500);
      }
    }
  }

  return c.json({ received: true });
});

export { stripe as stripeRoutes };
