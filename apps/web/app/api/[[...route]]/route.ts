/**
 * Next.js App Router catch-all handler for the Hono API.
 *
 * All requests to /api/... are handled here and forwarded to the Hono app.
 * The Hono app is mounted at basePath('/api'), so routes are /api/v1/...
 */
import { handle } from 'hono/vercel';
import { app } from '../../../lib/api/hono';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
