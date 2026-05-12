import type { FederationAdapter, FederationTeam, FederationFixture } from '../types';

const API_BASE = 'https://v3.football.api-sports.io';

async function apiFetch(endpoint: string, params: Record<string, string>) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    console.log('[facr] API_FOOTBALL_KEY not set, returning demo data');
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

// Demo fixtures when API key not available
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

export const facrAdapter: FederationAdapter = {
  id: 'facr',
  name: 'FAČR (Česko)',
  country: 'CZ',
  sport: 'Fotbal',
  flag: '🇨🇿',

  async searchTeams(query: string): Promise<FederationTeam[]> {
    const data = await apiFetch('/teams', { search: query, country: 'Czech Republic' });

    if (!data) {
      // Demo mode
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
    if (teamId.startsWith('demo-')) {
      return DEMO_FIXTURES;
    }

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
