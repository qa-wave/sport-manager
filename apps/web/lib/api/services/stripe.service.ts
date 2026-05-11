/**
 * Stripe service — wraps Stripe SDK calls for Connect onboarding and Checkout.
 *
 * Guard: all functions check STRIPE_SECRET_KEY at runtime. If it's missing,
 * they throw a structured error so the route can return a 503 instead of
 * crashing the process.
 */

// Dynamic import so the module doesn't crash on boot when stripe is not yet
// installed or the key is missing.
let _stripe: import('stripe').default | null = null;

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw Object.assign(
      new Error('Stripe is not configured. Set STRIPE_SECRET_KEY to enable payments.'),
      { statusCode: 503, code: 'STRIPE_NOT_CONFIGURED' },
    );
  }

  if (!_stripe) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe') as typeof import('stripe').default;
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia' as any,
    });
  }

  return _stripe;
}

/**
 * Create an Express connected account for a club.
 * Returns the Stripe account ID (e.g. "acct_1Qxxx").
 */
export async function createConnectedAccount(
  clubName: string,
  email: string,
): Promise<string> {
  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'CZ',
    email,
    business_type: 'non_profit',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_profile: {
      name: clubName,
      product_description: 'Sports club membership fees',
    },
  });
  return account.id;
}

/**
 * Generate an Account Link URL for Stripe Express onboarding.
 */
export async function createOnboardingLink(
  accountId: string,
  returnUrl: string,
): Promise<string> {
  const stripe = getStripe();
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${returnUrl}?refresh=true`,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
  return link.url;
}

/**
 * Create a Stripe Checkout session for a payment.
 * Returns the hosted Checkout URL.
 *
 * Platform collects application_fee_amount (default 5 %).
 * Funds are transferred to the connected account.
 */
export async function createCheckoutSession(opts: {
  connectedAccountId: string;
  amountCents: number;
  currency: string;
  feeName: string;
  paymentId: string;
  successUrl: string;
  cancelUrl: string;
  platformFeeCents?: number;
}): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: opts.currency.toLowerCase(),
          product_data: { name: opts.feeName },
          unit_amount: opts.amountCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    metadata: { paymentId: opts.paymentId },
    payment_intent_data: {
      application_fee_amount:
        opts.platformFeeCents ?? Math.round(opts.amountCents * 0.05),
      transfer_data: { destination: opts.connectedAccountId },
    },
  });
  return session.url!;
}

/**
 * Verify a Stripe webhook signature and return the parsed event.
 * Throws if the signature is invalid.
 */
export function constructWebhookEvent(
  body: string,
  sig: string,
): import('stripe').default.Event {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw Object.assign(
      new Error('STRIPE_WEBHOOK_SECRET is not set.'),
      { statusCode: 503, code: 'STRIPE_NOT_CONFIGURED' },
    );
  }
  return stripe.webhooks.constructEvent(body, sig, webhookSecret);
}
