import { NextRequest, NextResponse } from 'next/server';
import { runAutoSync } from '@/lib/api/routes/federation.routes';

/**
 * Vercel Cron — federation auto-sync
 * Schedule: 0 6 * * * (every day at 06:00 UTC)
 *
 * Vercel Cron sends the CRON_SECRET in the Authorization header:
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('[cron/federation-sync] CRON_SECRET env var not set — rejecting request');
    return NextResponse.json({ error: 'Cron not configured' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await runAutoSync();

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      ...summary,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[cron/federation-sync] Unexpected error:', err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
