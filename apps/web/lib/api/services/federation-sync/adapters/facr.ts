import * as cheerio from 'cheerio';
import type { FederationAdapter, FederationTeam, FederationFixture } from '../types';

// ---------------------------------------------------------------------------
// Source selection
// ---------------------------------------------------------------------------

type FacrSource = 'api-football' | 'direct-scrape';

function getSource(): FacrSource {
  return process.env.API_FOOTBALL_KEY ? 'api-football' : 'direct-scrape';
}

// ---------------------------------------------------------------------------
// API-Football helpers
// ---------------------------------------------------------------------------

const API_BASE = 'https://v3.football.api-sports.io';

async function apiFetch(endpoint: string, params: Record<string, string>) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    return null; // triggers demo mode
  }

  const url = new URL(endpoint, API_BASE);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { 'x-apisports-key': key },
  });

  if (!res.ok) throw new Error(`API-Football error: ${res.status}`);
  return res.json() as Promise<{ response: unknown[] }>;
}

// ---------------------------------------------------------------------------
// Direct scraper — is.fotbal.cz
// ---------------------------------------------------------------------------

const FOTBAL_BASE = 'https://is.fotbal.cz';
const SCRAPE_USER_AGENT = 'Mozilla/5.0 (compatible; SportManager/1.0)';

// UUID regex for GUID detection
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isGuid(s: string): boolean {
  return UUID_RE.test(s.trim());
}

// In-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const fixtureCache = new Map<string, CacheEntry<FederationFixture[]>>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Rate-limit: max 1 req / 5s
let lastScrapeAt = 0;
const SCRAPE_MIN_INTERVAL_MS = 5000;

async function rateLimitedFetch(url: string): Promise<string | null> {
  const now = Date.now();
  const wait = SCRAPE_MIN_INTERVAL_MS - (now - lastScrapeAt);
  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait));
  }
  lastScrapeAt = Date.now();

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': SCRAPE_USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'cs-CZ,cs;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.warn(`[facr-scraper] HTTP ${res.status} for ${url}`);
      return null;
    }
    return res.text();
  } catch (err) {
    console.error('[facr-scraper] Fetch error:', err);
    return null;
  }
}

/**
 * Parse Czech date/time strings from is.fotbal.cz tables.
 * Formats observed: "15.05.2026 10:30", "15.05.2026"
 */
function parseCzDate(raw: string): string | null {
  const cleaned = raw.trim();
  // "dd.mm.yyyy hh:mm"
  const full = /(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})/.exec(cleaned);
  if (full) {
    const d = full[1]!;
    const m = full[2]!;
    const y = full[3]!;
    const hh = full[4]!;
    const mm = full[5]!;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${hh.padStart(2, '0')}:${mm}:00`;
  }
  // "dd.mm.yyyy"
  const dateOnly = /(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(cleaned);
  if (dateOnly) {
    const d = dateOnly[1]!;
    const m = dateOnly[2]!;
    const y = dateOnly[3]!;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`;
  }
  return null;
}

/**
 * Scrape fixtures from is.fotbal.cz competition page.
 * URL: https://is.fotbal.cz/public/souteze/detail-souteze.aspx?req={guid}&sport=fotbal
 */
export async function scrapeCompetitionFixtures(
  competitionGuid: string,
): Promise<FederationFixture[]> {
  const cacheKey = `fixtures:${competitionGuid}`;
  const cached = fixtureCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const url = `${FOTBAL_BASE}/public/souteze/detail-souteze.aspx?req=${encodeURIComponent(competitionGuid)}&sport=fotbal`;

  const html = await rateLimitedFetch(url);
  if (!html) {
    console.warn('[facr-scraper] No HTML returned, using demo data');
    return DEMO_FIXTURES;
  }

  const $ = cheerio.load(html);
  const fixtures: FederationFixture[] = [];

  // Detect competition name from page heading
  const competitionName =
    $('h1, h2, .competition-title, .nazev-souteze').first().text().trim() ||
    'FAČR soutěž';

  // is.fotbal.cz typically renders fixtures in a table with class "tabulka" or "rozpis"
  // The rows usually contain: kolo, datum, čas, domácí, hosté, skóre, hřiště
  const tableSelectors = [
    'table.tabulka',
    'table.grid',
    'table.rozpis',
    '#tblRozpis',
    '.tbl-rozpis',
    'table',
  ];

  let $table = $();
  for (const sel of tableSelectors) {
    const found = $(sel).first();
    if (found.length) {
      $table = found;
      break;
    }
  }

  if (!$table.length) {
    console.warn('[facr-scraper] No fixture table found in HTML');
    return DEMO_FIXTURES;
  }

  $table.find('tr').each((rowIndex, row) => {
    // Skip header rows
    if ($(row).find('th').length > 0) return;

    const cells: string[] = $(row)
      .find('td')
      .map((_, td) => $(td).text().trim())
      .get() as string[];
    if (cells.length < 4) return;

    // Heuristic parsing — column order varies; try to detect by content
    // Look for date pattern and team names
    let round = '';
    let dateStr = '';
    let homeTeam = '';
    let awayTeam = '';
    let location = '';
    let homeScore: number | undefined;
    let awayScore: number | undefined;

    for (const cell of cells) {
      // Round: number like "1." or "15."
      if (/^\d+\.?$/.test(cell) && !round) {
        round = `${cell.replace('.', '')}. kolo`;
        continue;
      }
      // Date detection
      if (/\d{1,2}\.\d{1,2}\.\d{4}/.test(cell) && !dateStr) {
        dateStr = cell;
        continue;
      }
      // Score detection: "2:1", "0:0"
      if (/^\d+:\d+$/.test(cell)) {
        const parts = cell.split(':');
        homeScore = Number(parts[0]);
        awayScore = Number(parts[1]);
        continue;
      }
      // First substantial text after round/date → home team
      if (cell.length > 3 && !homeTeam && !dateStr) continue;
      if (cell.length > 3 && !homeTeam) {
        homeTeam = cell;
        continue;
      }
      if (cell.length > 3 && homeTeam && !awayTeam) {
        // Skip "vs", "-", ":"
        if (['-', 'vs', ':'].includes(cell.toLowerCase())) continue;
        awayTeam = cell;
        continue;
      }
      // Remaining substantial text → location
      if (cell.length > 3 && homeTeam && awayTeam && !location) {
        location = cell;
      }
    }

    if (!homeTeam || !awayTeam || !dateStr) return;

    const isoDate = parseCzDate(dateStr);
    if (!isoDate) return;

    const status: FederationFixture['status'] =
      homeScore !== undefined ? 'completed' : 'scheduled';
    const externalId = `facr-${competitionGuid}-${rowIndex}`;

    fixtures.push({
      externalId,
      homeTeam,
      awayTeam,
      date: isoDate,
      location: location || undefined,
      competition: competitionName,
      round: round || undefined,
      status,
      homeScore,
      awayScore,
    });
  });

  if (fixtures.length === 0) {
    console.warn('[facr-scraper] Parsed 0 fixtures from table, falling back to demo');
    return DEMO_FIXTURES;
  }

  fixtureCache.set(cacheKey, { data: fixtures, expiresAt: Date.now() + CACHE_TTL_MS });
  return fixtures;
}

/** Extract unique team names from cached fixtures for a competition. */
function extractTeamsFromFixtures(
  fixtures: FederationFixture[],
  query: string,
): FederationTeam[] {
  const teamNames = new Set<string>();
  for (const f of fixtures) {
    teamNames.add(f.homeTeam);
    teamNames.add(f.awayTeam);
  }

  const competition = fixtures[0]?.competition ?? '';
  const lq = query.toLowerCase();

  return Array.from(teamNames)
    .filter((name) => name.toLowerCase().includes(lq))
    .map((name) => ({
      externalId: `direct-${encodeURIComponent(name)}`,
      name,
      competition,
    }));
}

// ---------------------------------------------------------------------------
// Demo data (fallback when no API key and scraping fails)
// ---------------------------------------------------------------------------

const DEMO_FIXTURES: FederationFixture[] = [
  {
    externalId: 'demo-1',
    homeTeam: 'FC Hvězda Strašnice',
    awayTeam: 'SK Slavia Praha B',
    date: new Date(Date.now() + 7 * 86400000).toISOString(),
    location: 'UMT Strahov',
    competition: 'Pražský přebor U13',
    round: '15. kolo',
    status: 'scheduled',
  },
  {
    externalId: 'demo-2',
    homeTeam: 'TJ Sokol Vršovice',
    awayTeam: 'FC Hvězda Strašnice',
    date: new Date(Date.now() + 14 * 86400000).toISOString(),
    location: 'Hřiště Vršovice',
    competition: 'Pražský přebor U13',
    round: '16. kolo',
    status: 'scheduled',
  },
  {
    externalId: 'demo-3',
    homeTeam: 'FC Hvězda Strašnice',
    awayTeam: 'FK Meteor Praha',
    date: new Date(Date.now() + 21 * 86400000).toISOString(),
    location: 'UMT Strahov',
    competition: 'Pražský přebor U13',
    round: '17. kolo',
    status: 'scheduled',
  },
  {
    externalId: 'demo-4',
    homeTeam: 'FC Admira Praha',
    awayTeam: 'FC Hvězda Strašnice',
    date: new Date(Date.now() + 28 * 86400000).toISOString(),
    location: 'Stadion Admira',
    competition: 'Pražský přebor U13',
    round: '18. kolo',
    status: 'scheduled',
  },
  {
    externalId: 'demo-5',
    homeTeam: 'FC Hvězda Strašnice',
    awayTeam: 'SK Motorlet Praha',
    date: new Date(Date.now() + 35 * 86400000).toISOString(),
    location: 'UMT Strahov',
    competition: 'Pražský přebor U13',
    round: '19. kolo',
    status: 'scheduled',
  },
];

const DEMO_TEAMS: FederationTeam[] = [
  {
    externalId: 'demo-hvezda',
    name: 'FC Hvězda Strašnice',
    competition: 'Pražský přebor',
    ageGroup: 'U13',
  },
  {
    externalId: 'demo-hvezda-u15',
    name: 'FC Hvězda Strašnice',
    competition: 'Pražský přebor',
    ageGroup: 'U15',
  },
];

// ---------------------------------------------------------------------------
// Adapter export
// ---------------------------------------------------------------------------

export const facrAdapter: FederationAdapter & { source: FacrSource } = {
  id: 'facr',
  name: 'FAČR (Česko)',
  country: 'CZ',
  sport: 'Fotbal',
  flag: '🇨🇿',

  get source(): FacrSource {
    return getSource();
  },

  async searchTeams(query: string): Promise<FederationTeam[]> {
    const source = getSource();

    // If query looks like a GUID → treat as competition ID, scrape and extract teams
    if (isGuid(query)) {
      const fixtures = await scrapeCompetitionFixtures(query);
      return extractTeamsFromFixtures(fixtures, '');
    }

    if (source === 'direct-scrape') {
      // Check if we have any cached competitions to search in
      const allCached: FederationFixture[] = [];
      for (const [, entry] of fixtureCache) {
        if (entry.expiresAt > Date.now()) {
          allCached.push(...entry.data);
        }
      }

      if (allCached.length > 0) {
        const results = extractTeamsFromFixtures(allCached, query);
        if (results.length > 0) return results;
      }

      // No cached data — fall back to demo teams filtered by query
      return DEMO_TEAMS.filter((t) =>
        t.name.toLowerCase().includes(query.toLowerCase()),
      );
    }

    // api-football source
    const data = await apiFetch('/teams', { search: query, country: 'Czech Republic' });
    if (!data) {
      return DEMO_TEAMS.filter((t) =>
        t.name.toLowerCase().includes(query.toLowerCase()),
      );
    }

    return (data.response ?? []).map((item: unknown) => {
      const i = item as {
        team: { id: number; name: string; logo?: string };
      };
      return {
        externalId: String(i.team.id),
        name: i.team.name,
        logo: i.team.logo,
      };
    });
  },

  async getFixtures(teamId: string): Promise<FederationFixture[]> {
    // GUID → direct scrape as competition ID
    if (isGuid(teamId)) {
      return scrapeCompetitionFixtures(teamId);
    }

    if (teamId.startsWith('demo-')) {
      return DEMO_FIXTURES;
    }

    // direct-encoded team name from our scraper
    if (teamId.startsWith('direct-')) {
      const teamName = decodeURIComponent(teamId.replace('direct-', ''));
      const allCached: FederationFixture[] = [];
      for (const [, entry] of fixtureCache) {
        if (entry.expiresAt > Date.now()) {
          allCached.push(...entry.data);
        }
      }
      return allCached.filter(
        (f) =>
          f.homeTeam.toLowerCase().includes(teamName.toLowerCase()) ||
          f.awayTeam.toLowerCase().includes(teamName.toLowerCase()),
      );
    }

    const source = getSource();
    if (source === 'direct-scrape') {
      // Cannot scrape without a competition GUID — return demo
      return DEMO_FIXTURES;
    }

    // api-football
    const data = await apiFetch('/fixtures', { team: teamId, next: '20' });
    if (!data) return DEMO_FIXTURES;

    return (data.response ?? []).map((item: unknown) => {
      const i = item as {
        fixture: {
          id: number;
          date: string;
          venue?: { name?: string };
          status: { short: string };
        };
        teams: {
          home: { name: string };
          away: { name: string };
        };
        league: { name: string; round: string };
        goals: { home: number | null; away: number | null };
      };
      return {
        externalId: String(i.fixture.id),
        homeTeam: i.teams.home.name,
        awayTeam: i.teams.away.name,
        date: i.fixture.date,
        location: i.fixture.venue?.name ?? '',
        competition: i.league.name,
        round: i.league.round,
        status:
          i.fixture.status.short === 'NS'
            ? 'scheduled'
            : i.fixture.status.short === 'FT'
              ? 'completed'
              : 'scheduled',
        homeScore: i.goals.home ?? undefined,
        awayScore: i.goals.away ?? undefined,
      };
    });
  },
};
