/**
 * Shared application constants.
 *
 * APP_BASE_URL resolves in priority order:
 *   1. NEXT_PUBLIC_APP_URL  — explicitly set (recommended for production)
 *   2. VERCEL_URL           — auto-injected by Vercel on preview deployments
 *   3. http://localhost:3100 — local development fallback
 */
export const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3100');
