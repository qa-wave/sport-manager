import { Hono } from 'hono';
import { requireAuth } from '../middleware/rbac.middleware';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/proxy — Server-side proxy for safe external fetches.
 * Currently supports fetching Google Sheets as CSV.
 */
const proxy = new Hono<HonoEnv>();

proxy.use('/*', requireAuth());

// ---------------------------------------------------------------------------
// GET /v1/proxy/sheets?url=<google-sheets-url>
// Fetches a public Google Sheet as CSV via server-side request.
// Only docs.google.com URLs are allowed (SSRF protection).
// ---------------------------------------------------------------------------
proxy.get('/sheets', async (c) => {
  const rawUrl = c.req.query('url');

  if (!rawUrl) {
    return c.json({ error: 'Bad Request', message: 'url query param required' }, 400);
  }

  // Security: only allow docs.google.com
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return c.json({ error: 'Bad Request', message: 'Invalid URL' }, 400);
  }

  if (parsed.hostname !== 'docs.google.com') {
    return c.json({ error: 'Forbidden', message: 'Only docs.google.com URLs are allowed' }, 403);
  }

  // Extract spreadsheet ID and build export URL
  // Input: https://docs.google.com/spreadsheets/d/{id}/edit#...
  // Output: https://docs.google.com/spreadsheets/d/{id}/export?format=csv
  const match = parsed.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) {
    return c.json({ error: 'Bad Request', message: 'Could not extract spreadsheet ID from URL' }, 400);
  }

  const sheetId = match[1];
  const gid = parsed.searchParams.get('gid') ?? parsed.hash.match(/gid=(\d+)/)?.[1] ?? '0';
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

  try {
    const response = await fetch(exportUrl, {
      headers: { 'User-Agent': 'Sport-Manager-Import/1.0' },
      redirect: 'follow',
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        return c.json(
          { error: 'Forbidden', message: 'Sheet is not publicly accessible. Share it as "Anyone with the link can view".' },
          403,
        );
      }
      return c.json({ error: 'Bad Gateway', message: `Google Sheets responded with ${response.status}` }, 502);
    }

    const csv = await response.text();
    return c.text(csv, 200, { 'content-type': 'text/csv; charset=utf-8' });
  } catch (err) {
    console.error('[proxy/sheets] fetch error:', err);
    return c.json({ error: 'Bad Gateway', message: 'Failed to fetch Google Sheet' }, 502);
  }
});

export { proxy as proxyRoutes };
